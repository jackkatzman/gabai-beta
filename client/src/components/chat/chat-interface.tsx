import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageBubble } from "./message-bubble";
import { VoiceInput } from "./voice-input";
import { TypingIndicator } from "./typing-indicator";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { Message, User } from "@shared/schema";

interface ChatInterfaceProps {
  user: User;
}

export function ChatInterface({ user }: ChatInterfaceProps) {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    // Restore conversation ID from localStorage
    return localStorage.getItem(`gabai_conversation_${user.id}`) || null;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Load the most recent conversation for this user
  const { data: conversations = [] } = useQuery({
    queryKey: [`/api/conversations/${user.id}`],
  });

  // Set current conversation to the most recent one if none is set
  useEffect(() => {
    if (!currentConversationId && Array.isArray(conversations) && conversations.length > 0) {
      const mostRecent = conversations[0]; // Conversations are ordered by updatedAt desc
      setCurrentConversationId(mostRecent.id);
      localStorage.setItem(`gabai_conversation_${user.id}`, mostRecent.id);
    }
  }, [conversations, currentConversationId, user.id]);

  // Get messages for current conversation
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: [`/api/messages/${currentConversationId}`],
    enabled: !!currentConversationId,
    queryFn: async () => {
      if (!currentConversationId) return [];
      return api.getMessages(currentConversationId);
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => 
      api.sendMessage(message, user.id, currentConversationId || undefined),
    onSuccess: (response) => {
      setCurrentConversationId(response.conversationId);
      // Save conversation ID to localStorage
      localStorage.setItem(`gabai_conversation_${user.id}`, response.conversationId);
      
      // Update messages cache with both user and assistant messages
      queryClient.setQueryData(
        [`/api/messages/${response.conversationId}`],
        (oldMessages: Message[] = []) => [...oldMessages, response.message]
      );

      // Invalidate lists and reminders cache if AI performed actions
      if (response.actions && response.actions.length > 0) {
        queryClient.invalidateQueries({ queryKey: [`/api/smart-lists/${user.id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/reminders/${user.id}`] });
      }

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
          <MessageBubble
            message={{
              id: 'welcome',
              content: `Hi ${user.name || 'there'}! I'm GabAi, your personal assistant. I remember your preferences and help with your daily tasks. How can I help you today?`,
              role: 'assistant',
              createdAt: new Date(),
              conversationId: '',
              audioUrl: null
            }}
            isUser={false}
          />
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

        {sendMessageMutation.isPending && <TypingIndicator />}

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
