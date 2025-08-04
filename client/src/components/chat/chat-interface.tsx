import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageBubble } from "./message-bubble";
import { VoiceInput } from "./voice-input";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { Message, User } from "@shared/schema";

interface ChatInterfaceProps {
  user: User;
}

export function ChatInterface({ user }: ChatInterfaceProps) {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get messages for current conversation
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages", currentConversationId],
    enabled: !!currentConversationId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => 
      api.sendMessage(message, user.id, currentConversationId || undefined),
    onSuccess: (response) => {
      setCurrentConversationId(response.conversationId);
      
      // Update messages cache
      queryClient.setQueryData(
        ["/api/messages", response.conversationId],
        (oldMessages: Message[] = []) => [...oldMessages, response.message]
      );

      // Show suggestions if any
      if (response.suggestions && response.suggestions.length > 0) {
        toast({
          title: "Suggestions",
          description: response.suggestions.join(", "),
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (message: string) => {
    sendMessageMutation.mutate(message);
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Welcome message for new users
  const showWelcome = !currentConversationId && messages.length === 0;

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {showWelcome && (
          <div className="flex items-start space-x-3 animate-fadeIn">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs">AI</span>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-md px-4 py-3 max-w-xs shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-gray-900 dark:text-white text-sm leading-relaxed">
                Hi {user.name}! I'm GabAi, your personal assistant. I remember your preferences and help with your daily tasks. How can I help you today?
              </p>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                Just now
              </span>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))}
          </div>
        )}

        {messages.map((message: Message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isUser={message.role === "user"}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice Input */}
      <VoiceInput
        onSendMessage={handleSendMessage}
        disabled={sendMessageMutation.isPending}
      />
    </div>
  );
}
