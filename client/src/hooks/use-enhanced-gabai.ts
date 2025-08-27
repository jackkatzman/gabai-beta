import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface GabAiListAction {
  action: 'add' | 'remove' | 'create_list' | 'move_item';
  listName?: string;
  listType?: 'shopping' | 'todo' | 'punch-list';
  itemText?: string;
  itemId?: string;
  category?: string;
}

export function useEnhancedGabAi() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create new list mutation
  const createListMutation = useMutation({
    mutationFn: async (data: { name: string; type: 'shopping' | 'todo' | 'punch-list' }) => {
      const response = await fetch('/api/smart-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
    }
  });

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async (data: { listId: string; text: string; category?: string }) => {
      const response = await fetch(`/api/smart-lists/${data.listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.text,
          category: data.category || 'general',
          priority: 1,
          completed: false,
          quantity: 1
        })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
    }
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`/api/smart-lists/items/${itemId}`, {
        method: 'DELETE'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
    }
  });

  const analyzeUserRequest = useCallback((input: string, existingLists: any[]): GabAiListAction => {
    const lowerInput = input.toLowerCase();
    
    // Remove/delete patterns
    const removePatterns = [
      'remove', 'delete', 'take off', 'cross out', 'done with', 
      'finished', 'completed', 'got it', 'bought', 'no longer need'
    ];
    
    // Add patterns
    const addPatterns = [
      'add', 'put', 'include', 'need', 'buy', 'get', 'pick up',
      'remember to', 'don\'t forget', 'also need'
    ];

    // List type detection
    const shoppingWords = ['buy', 'grocery', 'store', 'market', 'food', 'milk', 'bread', 'eggs'];
    const todoWords = ['task', 'do', 'call', 'email', 'meeting', 'appointment', 'work'];
    const punchWords = ['fix', 'repair', 'broken', 'maintenance', 'install', 'clean'];

    // Check for remove action
    if (removePatterns.some(pattern => lowerInput.includes(pattern))) {
      // Try to find item to remove by matching text
      const itemText = lowerInput.replace(/(remove|delete|take off|cross out|done with|finished|completed|got it|bought|no longer need)\s+/gi, '').trim();
      
      return {
        action: 'remove',
        itemText: itemText
      };
    }

    // Check for add action or implicit add
    const isExplicitAdd = addPatterns.some(pattern => lowerInput.includes(pattern));
    
    // Determine list type based on content
    const shoppingScore = shoppingWords.filter(word => lowerInput.includes(word)).length;
    const todoScore = todoWords.filter(word => lowerInput.includes(word)).length;
    const punchScore = punchWords.filter(word => lowerInput.includes(word)).length;

    let suggestedType: 'shopping' | 'todo' | 'punch-list' = 'shopping'; // default
    
    if (punchScore > shoppingScore && punchScore > todoScore) {
      suggestedType = 'punch-list';
    } else if (todoScore > shoppingScore) {
      suggestedType = 'todo';
    }

    // Find existing list of the right type
    const existingList = existingLists.find(list => list.type === suggestedType);
    
    // Extract item text (remove command words)
    let itemText = input;
    addPatterns.forEach(pattern => {
      itemText = itemText.replace(new RegExp(`\\b${pattern}\\s+`, 'gi'), '');
    });
    itemText = itemText.trim();

    // If no existing list, suggest creating one
    if (!existingList) {
      const listNames = {
        'shopping': 'Groceries & Errands',
        'todo': 'Tasks & Reminders', 
        'punch-list': 'Home Repairs'
      };

      return {
        action: 'create_list',
        listName: listNames[suggestedType],
        listType: suggestedType,
        itemText: itemText
      };
    }

    // Add to existing list
    return {
      action: 'add',
      listName: existingList.name,
      listType: suggestedType,
      itemText: itemText,
      category: suggestedType === 'shopping' ? 'grocery' : 'general'
    };
  }, []);

  const executeGabAiAction = useCallback(async (
    action: GabAiListAction, 
    existingLists: any[],
    allItems: any[]
  ) => {
    try {
      switch (action.action) {
        case 'remove':
          // Find item by text match
          const itemToRemove = allItems.find(item => 
            item.text.toLowerCase().includes(action.itemText?.toLowerCase() || '')
          );
          
          if (itemToRemove) {
            await removeItemMutation.mutateAsync(itemToRemove.id);
            toast({
              title: "Item Removed",
              description: `Removed "${itemToRemove.text}" from your list`,
            });
          } else {
            toast({
              title: "Item Not Found", 
              description: `Couldn't find "${action.itemText}" in your lists`,
              variant: "destructive"
            });
          }
          break;

        case 'create_list':
          // Create new list first
          const newList = await createListMutation.mutateAsync({
            name: action.listName!,
            type: action.listType!
          });
          
          // Then add the item
          if (action.itemText) {
            await addItemMutation.mutateAsync({
              listId: newList.id,
              text: action.itemText,
              category: action.category
            });
          }
          
          toast({
            title: "List Created",
            description: `Created "${action.listName}" and added "${action.itemText}"`,
          });
          break;

        case 'add':
          // Find the target list
          const targetList = existingLists.find(list => list.name === action.listName);
          
          if (targetList && action.itemText) {
            await addItemMutation.mutateAsync({
              listId: targetList.id,
              text: action.itemText,
              category: action.category
            });
            
            toast({
              title: "Item Added",
              description: `Added "${action.itemText}" to ${action.listName}`,
            });
          }
          break;
      }
    } catch (error) {
      console.error('GabAi action error:', error);
      toast({
        title: "Error",
        description: "Failed to complete that action. Please try again.",
        variant: "destructive"
      });
    }
  }, [createListMutation, addItemMutation, removeItemMutation, toast]);

  return {
    analyzeUserRequest,
    executeGabAiAction,
    isProcessing: createListMutation.isPending || addItemMutation.isPending || removeItemMutation.isPending
  };
}