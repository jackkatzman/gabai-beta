import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Mic, Send, Trash2, Check, X, GripVertical } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useVoice } from "@/hooks/use-voice";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SmartListsProps {
  listId: string;
  listType: 'shopping' | 'todo' | 'punch-list';
  onBack: () => void;
}

export function VoiceEnabledSmartLists({ listId, listType, onBack }: SmartListsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newItem, setNewItem] = useState("");
  const [isAddingVoice, setIsAddingVoice] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");

  // Voice input for adding items
  const { isRecording, isTranscribing, toggleRecording } = useVoice({
    onTranscriptionComplete: (text) => {
      if (text.trim()) {
        console.log('🎤 Voice input for list item:', text);
        setNewItem(text.trim());
        setVoiceTranscript("");
        setIsAddingVoice(false);
        // Auto-add the item
        addItemMutation.mutate({ 
          text: text.trim(), 
          listId, 
          priority: 'medium',
          category: listType === 'shopping' ? 'grocery' : 'task'
        });
      }
    },
    onTranscriptUpdate: (text) => {
      setVoiceTranscript(text);
    },
    onError: (error) => {
      console.error("🎤 Shopping list voice error:", error);
      setIsAddingVoice(false);
      setVoiceTranscript("");
      toast({
        title: "Voice Input Error",
        description: "Could not process voice input. Please try typing instead.",
        variant: "destructive"
      });
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get list items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["/api/lists", listId, "items"],
    enabled: !!listId,
    queryFn: () => api.getListItems(listId),
  });

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: (data: { text: string; listId: string; priority: string; category: string }) => 
      api.addListItem(data.listId, {
        text: data.text,
        priority: data.priority,
        category: data.category,
        completed: false,
        quantity: 1
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists", listId, "items"] });
      setNewItem("");
      toast({
        title: "Item Added",
        description: "Item has been added to your list.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add item.",
        variant: "destructive",
      });
    },
  });

  // Toggle completion mutation
  const toggleCompletionMutation = useMutation({
    mutationFn: (itemId: string) => api.toggleListItemCompletion(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists", listId, "items"] });
    }
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => api.deleteListItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists", listId, "items"] });
      toast({
        title: "Item Deleted",
        description: "Item has been removed from your list.",
      });
    }
  });

  // Reorder items mutation
  const reorderItemsMutation = useMutation({
    mutationFn: (newOrder: string[]) => api.reorderListItems(listId, newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists", listId, "items"] });
    }
  });

  const handleAddItem = () => {
    if (newItem.trim()) {
      addItemMutation.mutate({ 
        text: newItem.trim(), 
        listId, 
        priority: 'medium',
        category: listType === 'shopping' ? 'grocery' : 'task'
      });
    }
  };

  const handleVoiceToggle = async () => {
    if (!isAddingVoice) {
      setIsAddingVoice(true);
      console.log('🎤 Starting voice input for shopping list');
    }
    try {
      await toggleRecording();
    } catch (error) {
      console.error('🎤 Voice toggle error:', error);
      setIsAddingVoice(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      
      const newOrder = arrayMove(items, oldIndex, newIndex).map(item => item.id);
      reorderItemsMutation.mutate(newOrder);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading list items...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← Back to Lists
        </Button>
        <h2 className="text-xl font-bold capitalize">{listType.replace('-', ' ')} List</h2>
      </div>

      {/* Voice-enabled Add Item Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add New Item</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Voice Input Controls */}
            {isAddingVoice && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    🎤 Voice Input Active
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setIsAddingVoice(false);
                      setVoiceTranscript("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {voiceTranscript && (
                  <div className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                    Hearing: "{voiceTranscript}"
                  </div>
                )}
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  {isRecording ? "🔴 Recording... speak now" : 
                   isTranscribing ? "🔄 Processing..." : 
                   "Click the microphone to start recording"}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder={`Add ${listType === 'shopping' ? 'item to buy' : listType === 'todo' ? 'task to do' : 'item to fix'}...`}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                  disabled={isAddingVoice}
                  data-testid="add-item-input"
                />
              </div>
              
              {/* Voice Input Button */}
              <Button
                onClick={handleVoiceToggle}
                disabled={isTranscribing}
                className={`
                  h-10 w-10 rounded-full transition-all duration-200
                  ${isRecording || isAddingVoice
                    ? "animate-pulse bg-red-500 hover:bg-red-600 text-white" 
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                  }
                `}
                data-testid="voice-add-button"
              >
                <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
              </Button>

              {/* Add Button */}
              <Button
                onClick={handleAddItem}
                disabled={!newItem.trim() || addItemMutation.isPending || isAddingVoice}
                className="h-10 w-10 rounded-full bg-green-500 hover:bg-green-600 text-white"
                data-testid="add-item-button"
              >
                {addItemMutation.isPending ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items List with Drag & Drop */}
      <Card>
        <CardHeader>
          <CardTitle>Items ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No items yet. Add some {listType === 'shopping' ? 'items to buy' : 'tasks'} to get started!</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {items.map((item) => (
                    <SortableListItem
                      key={item.id}
                      item={item}
                      onToggleCompletion={() => toggleCompletionMutation.mutate(item.id)}
                      onDelete={() => deleteItemMutation.mutate(item.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Sortable list item component
function SortableListItem({ item, onToggleCompletion, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center space-x-3 p-3 rounded-lg border
        ${item.completed 
          ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
        }
      `}
      data-testid={`list-item-${item.id}`}
    >
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* Completion Checkbox */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleCompletion}
        className={`
          h-6 w-6 rounded-full p-0
          ${item.completed 
            ? 'bg-green-500 text-white hover:bg-green-600' 
            : 'border-2 border-gray-300 hover:border-green-500'
          }
        `}
        data-testid={`toggle-completion-${item.id}`}
      >
        {item.completed && <Check className="h-3 w-3" />}
      </Button>

      {/* Item Text */}
      <div className="flex-1">
        <span className={`${item.completed ? 'line-through text-gray-500' : ''}`}>
          {item.text}
        </span>
        <div className="flex items-center space-x-2 mt-1">
          {item.category && (
            <Badge variant="secondary" className="text-xs">
              {item.category}
            </Badge>
          )}
          {item.priority && item.priority !== 'medium' && (
            <Badge 
              variant={item.priority === 'high' ? 'destructive' : 'outline'}
              className="text-xs"
            >
              {item.priority}
            </Badge>
          )}
          {item.quantity && item.quantity > 1 && (
            <Badge variant="outline" className="text-xs">
              {item.quantity}x
            </Badge>
          )}
        </div>
      </div>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
        data-testid={`delete-item-${item.id}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}