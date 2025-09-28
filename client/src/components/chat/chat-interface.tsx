import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { VoiceInput } from "./voice-input";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Message } from "@shared/schema";
import { api } from "@/lib/api";

export function ChatInterface() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    if (typeof window !== "undefined" && user) {
      return localStorage.getItem(`gabai_conversation_${user.id}`) || null;
    }
    return null;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get messages for current conversation
  const messagesQuery = useQuery({
    queryKey: ["/api/messages", currentConversationId],
    queryFn: async () => {
      if (!currentConversationId) return [];
      return api.getMessages(currentConversationId);
    },
    enabled: !!currentConversationId,
  });

  const messages = messagesQuery.data || [];
  const isLoading = messagesQuery.isLoading;

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, attachments }: { message: string; attachments?: File[] }) => {
      if (!user) throw new Error("User not authenticated");

      // Create conversation if needed
      if (!currentConversationId) {
        const newConversation = await api.createConversation({ userId: user.id });
        setCurrentConversationId(newConversation.id);
        localStorage.setItem(`gabai_conversation_${user.id}`, newConversation.id);
      }

      // Pass attachments directly to the API, which will handle them
      return api.sendMessage(message, user.id, currentConversationId!, undefined, attachments);
    },
    onSuccess: (response) => {
      setCurrentConversationId(response.conversationId);
      if (user) {
        localStorage.setItem(`gabai_conversation_${user.id}`, response.conversationId);

        // Update messages cache - add both user and assistant messages
        queryClient.setQueryData(
          ["/api/messages", response.conversationId],
          (oldMessages: Message[] = []) => {
            // Remove any temporary messages
            const filteredMessages = oldMessages.filter(msg => !msg.id.toString().startsWith('temp-'));
            
            // Add both the user message and assistant message from the response
            const newMessages = [...filteredMessages];
            
            // Only add userMessage if it's not already in the list (to prevent duplicates)
            if (response.userMessage && !filteredMessages.find(m => m.id === response.userMessage.id)) {
              newMessages.push(response.userMessage);
            }
            
            // Add the assistant message
            if (response.message) {
              newMessages.push(response.message);
            }
            
            return newMessages;
          }
        );

        // Invalidate caches if AI performed actions
        if (response.actions && response.actions.length > 0) {
          queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
        }
        queryClient.invalidateQueries({ queryKey: ["/api/reminders", user.id] });
      }

      // Show suggestions
      if (response.suggestions && response.suggestions.length > 0) {
        toast({
          title: "Suggestions",
          description: response.suggestions.join(", "),
        });
      }
    },
    onError: (error: any) => {
      console.error('❌ Chat error:', error);
      
      // Remove temporary message on error
      if (currentConversationId) {
        queryClient.setQueryData(
          ["/api/messages", currentConversationId],
          (oldMessages: Message[] = []) => oldMessages.filter(msg => !msg.id.toString().startsWith('temp-'))
        );
      }
      
      // Better error messages
      let errorMessage = "Failed to send message";
      if (error.message?.includes('timeout')) {
        errorMessage = "Request timed out. The AI service is slow right now. Please try again.";
      } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        errorMessage = "Your session has expired. Please sign in again.";
      } else if (error.message?.includes('OpenAI')) {
        errorMessage = "AI service is temporarily unavailable. Please try again in a moment.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Message Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (message: string, attachments?: File[]) => {
    if (sendMessageMutation.isPending || (!message.trim() && !attachments?.length)) return;

    // Always add temporary user message to show immediately
    const tempMessage: any = {
      id: `temp-${Date.now()}`,
      content: message,
      role: 'user' as const,
      createdAt: new Date(),
      conversationId: currentConversationId || 'temp',
      audioUrl: null,
      imageUrl: null,
      attachments: attachments?.map(f => f.name) || []
    };

    // Update messages immediately for better UX
    if (currentConversationId) {
      queryClient.setQueryData(
        ["/api/messages", currentConversationId],
        (oldMessages: Message[] = []) => [...oldMessages, tempMessage]
      );
    } else {
      // For new conversations, create temporary messages array
      queryClient.setQueryData(
        ["/api/messages", null],
        [tempMessage]
      );
    }

    sendMessageMutation.mutate({ message, attachments });
  };

  // Auto scroll to bottom - enhanced for mobile
  useEffect(() => {
    const scrollToBottom = () => {
      const container = document.getElementById('chat-messages-container');
      const scrollElement = messagesEndRef.current;

      if (container && scrollElement) {
        // Multiple scroll strategies for different mobile environments

        // Strategy 1: Scroll container to bottom
        container.scrollTop = container.scrollHeight;

        // Strategy 2: Use scrollIntoView
        scrollElement.scrollIntoView({ behavior: "smooth", block: "end" });

        // Strategy 3: Delayed scroll for mobile rendering
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
          scrollElement.scrollIntoView({ behavior: "auto", block: "end" });
        }, 100);

        // Strategy 4: Force scroll for mobile WebView
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 300);
      }
    };

    scrollToBottom();
  }, [messages, sendMessageMutation.isPending]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Please sign in to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Chat messages - simplified layout */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3" 
        id="chat-messages-container"
        style={{ paddingBottom: '40px' }}
      >
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Start a conversation with GabAi!</p>
            <p className="text-sm mt-2">Try asking about lists, reminders, or scheduling</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              isUser={message.role === 'user'} 
            />
          ))
        )}

        {sendMessageMutation.isPending && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice input - proper spacing for mobile bottom nav */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pb-20">
        <VoiceInput 
          onSendMessage={handleSendMessage}
          disabled={sendMessageMutation.isPending}
        />
      </div>
    </div>
  );
}