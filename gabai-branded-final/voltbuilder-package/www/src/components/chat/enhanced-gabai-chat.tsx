import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEnhancedGabAi } from "@/hooks/use-enhanced-gabai";
import { api } from "@/lib/api";
import { ChatInterface } from "./chat-interface";

export function EnhancedGabAiChat() {
  const { user } = useAuth();
  const { analyzeUserRequest, executeGabAiAction, isProcessing } = useEnhancedGabAi();
  
  // Get user's lists and items
  const { data: lists = [] } = useQuery({
    queryKey: ["/api/smart-lists", user?.id],
    enabled: !!user,
    queryFn: () => api.getSmartLists(user!.id),
  });

  const { data: allItems = [] } = useQuery({
    queryKey: ["/api/all-list-items", user?.id],
    enabled: !!user && lists.length > 0,
    queryFn: async () => {
      if (!user) return [];
      const itemPromises = lists.map(list => api.getListItems(list.id));
      const itemArrays = await Promise.all(itemPromises);
      return itemArrays.flat();
    },
  });

  // Enhanced message handler that processes list actions
  const handleMessage = async (message: string) => {
    if (!user) return;

    // Check if this is a list-related command
    const listKeywords = ['add', 'remove', 'delete', 'buy', 'get', 'need', 'list', 'todo', 'task', 'fix', 'repair'];
    const isListCommand = listKeywords.some(keyword => message.toLowerCase().includes(keyword));

    if (isListCommand) {
      const action = analyzeUserRequest(message, lists);
      await executeGabAiAction(action, lists, allItems);
      
      // Return a response based on the action
      switch (action.action) {
        case 'add':
          return `I added "${action.itemText}" to your ${action.listName} list.`;
        case 'remove':
          return `I'm looking for "${action.itemText}" to remove from your lists.`;
        case 'create_list':
          return `I created a new ${action.listType?.replace('-', ' ')} list called "${action.listName}" and added "${action.itemText}".`;
        default:
          return "I processed your list request.";
      }
    }

    // For non-list commands, use regular chat
    return null; // Let the regular chat interface handle it
  };

  return (
    <ChatInterface 
      onMessage={handleMessage}
      isProcessingListAction={isProcessing}
    />
  );
}