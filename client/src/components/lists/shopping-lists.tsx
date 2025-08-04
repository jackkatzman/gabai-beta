import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Mic, Trash2, Apple, Milk, Wheat } from "lucide-react";
import { api } from "@/lib/api";
import { useVoice } from "@/hooks/use-voice";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { User, ShoppingList, ShoppingItem } from "@shared/schema";

interface ShoppingListsProps {
  user: User;
}

const categoryIcons = {
  produce: Apple,
  dairy: Milk,
  grains: Wheat,
};

const getCategoryIcon = (category: string) => {
  const Icon = categoryIcons[category.toLowerCase() as keyof typeof categoryIcons];
  return Icon || Apple;
};

const getCategoryColor = (category: string) => {
  const colors = {
    produce: "text-green-500",
    dairy: "text-yellow-500",
    grains: "text-amber-500",
    meat: "text-red-500",
    pantry: "text-blue-500",
  };
  return colors[category.toLowerCase() as keyof typeof colors] || "text-gray-500";
};

export function ShoppingLists({ user }: ShoppingListsProps) {
  const [newListName, setNewListName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [isVoiceAddingItem, setIsVoiceAddingItem] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get shopping lists
  const { data: lists = [], isLoading } = useQuery<(ShoppingList & { items: ShoppingItem[] })[]>({
    queryKey: ["/api/shopping-lists", user.id],
  });

  // Create list mutation
  const createListMutation = useMutation({
    mutationFn: (name: string) => api.createShoppingList(user.id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-lists", user.id] });
      setNewListName("");
      toast({
        title: "List Created",
        description: "Your new shopping list has been created.",
      });
    },
  });

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: ({ listId, name, category }: { listId: string; name: string; category?: string }) =>
      api.createShoppingItem(listId, name, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-lists", user.id] });
      setNewItemName("");
      setNewItemCategory("");
      toast({
        title: "Item Added",
        description: "Item has been added to your list.",
      });
    },
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ShoppingItem> }) =>
      api.updateShoppingItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-lists", user.id] });
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => api.deleteShoppingItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-lists", user.id] });
      toast({
        title: "Item Removed",
        description: "Item has been removed from your list.",
      });
    },
  });

  // Voice input for adding items
  const { isRecording, isTranscribing, toggleRecording } = useVoice({
    onTranscriptionComplete: (text) => {
      setNewItemName(text);
      setIsVoiceAddingItem(false);
    },
  });

  const handleCreateList = () => {
    if (newListName.trim()) {
      createListMutation.mutate(newListName.trim());
    }
  };

  const handleAddItem = (listId: string) => {
    if (newItemName.trim()) {
      // Smart categorization based on user preferences
      const category = categorizeItem(newItemName, user);
      createItemMutation.mutate({
        listId,
        name: newItemName.trim(),
        category: newItemCategory || category,
      });
    }
  };

  const handleToggleItem = (item: ShoppingItem) => {
    updateItemMutation.mutate({
      id: item.id,
      updates: { completed: !item.completed },
    });
  };

  const handleVoiceAddItem = (listId: string) => {
    setSelectedListId(listId);
    setIsVoiceAddingItem(true);
    toggleRecording();
  };

  // Group items by category
  const groupItemsByCategory = (items: ShoppingItem[]) => {
    const grouped = items.reduce((acc, item) => {
      const category = item.category || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, ShoppingItem[]>);

    return grouped;
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Shopping Lists
          </h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="w-10 h-10 rounded-full p-0">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New List</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="list-name">List Name</Label>
                  <Input
                    id="list-name"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="e.g., Grocery List"
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={handleCreateList}
                  disabled={!newListName.trim() || createListMutation.isPending}
                  className="w-full"
                >
                  Create List
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lists */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {lists.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No shopping lists yet. Create your first list!
            </p>
          </div>
        ) : (
          lists.map((list: ShoppingList & { items: ShoppingItem[] }) => (
            <ShoppingListCard
              key={list.id}
              list={list}
              user={user}
              onAddItem={handleAddItem}
              onToggleItem={handleToggleItem}
              onDeleteItem={(id) => deleteItemMutation.mutate(id)}
              onVoiceAdd={handleVoiceAddItem}
              newItemName={selectedListId === list.id ? newItemName : ""}
              setNewItemName={setNewItemName}
              newItemCategory={newItemCategory}
              setNewItemCategory={setNewItemCategory}
              isVoiceMode={isVoiceAddingItem && selectedListId === list.id}
              isRecording={isRecording}
              isTranscribing={isTranscribing}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface ShoppingListCardProps {
  list: ShoppingList;
  user: User;
  onAddItem: (listId: string) => void;
  onToggleItem: (item: ShoppingItem) => void;
  onDeleteItem: (id: string) => void;
  onVoiceAdd: (listId: string) => void;
  newItemName: string;
  setNewItemName: (name: string) => void;
  newItemCategory: string;
  setNewItemCategory: (category: string) => void;
  isVoiceMode: boolean;
  isRecording: boolean;
  isTranscribing: boolean;
}

function ShoppingListCard({
  list,
  user,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onVoiceAdd,
  newItemName,
  setNewItemName,
  newItemCategory,
  setNewItemCategory,
  isVoiceMode,
  isRecording,
  isTranscribing,
}: ShoppingListCardProps) {
  const groupedItems = groupItemsByCategory(list.items);
  const completedCount = list.items.filter(item => item.completed).length;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{list.name}</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {completedCount} of {list.items.length} completed
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Add new item */}
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onVoiceAdd(list.id)}
            disabled={isRecording || isTranscribing}
            className="w-10 h-10 p-0"
          >
            <Mic className={`h-4 w-4 ${isRecording ? "text-red-500" : ""}`} />
          </Button>
          <div className="flex-1">
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Add item to list..."
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  onAddItem(list.id);
                }
              }}
            />
          </div>
          <Button
            size="sm"
            onClick={() => onAddItem(list.id)}
            disabled={!newItemName.trim()}
          >
            Add
          </Button>
        </div>

        {isVoiceMode && (isRecording || isTranscribing) && (
          <div className="flex items-center justify-center space-x-2 py-2">
            {isRecording && (
              <>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Recording...</span>
              </>
            )}
            {isTranscribing && (
              <>
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Processing...</span>
              </>
            )}
          </div>
        )}

        {/* Items grouped by category */}
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="space-y-2">
            <div className="flex items-center space-x-2">
              {React.createElement(getCategoryIcon(category), {
                className: `h-4 w-4 ${getCategoryColor(category)}`,
              })}
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {category}
                {category.toLowerCase().includes("dairy") && 
                 user.preferences?.dietary?.includes("Dairy-free") && (
                  <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                    Dairy-free options
                  </span>
                )}
              </h4>
            </div>
            
            <div className="space-y-1 ml-6">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-3 group">
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => onToggleItem(item)}
                  />
                  <span 
                    className={`flex-1 text-sm ${
                      item.completed 
                        ? "line-through text-gray-500 dark:text-gray-400" 
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {item.name}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {list.items.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            No items in this list yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Smart categorization function
function categorizeItem(itemName: string, user: User): string {
  const name = itemName.toLowerCase();
  
  // Produce
  if (name.match(/\b(apple|banana|orange|lettuce|spinach|carrot|tomato|potato|onion|garlic|pepper|cucumber|broccoli|avocado)\b/)) {
    return "Produce";
  }
  
  // Dairy (consider user preferences)
  if (name.match(/\b(milk|cheese|yogurt|butter|cream)\b/)) {
    if (user.preferences?.dietary?.includes("Dairy-free")) {
      return "Dairy Alternatives";
    }
    return "Dairy";
  }
  
  // Meat
  if (name.match(/\b(chicken|beef|pork|fish|salmon|turkey|ham|bacon)\b/)) {
    return "Meat";
  }
  
  // Grains
  if (name.match(/\b(bread|rice|pasta|cereal|oats|quinoa|flour)\b/)) {
    return "Grains";
  }
  
  return "Other";
}

function groupItemsByCategory(items: ShoppingItem[]): Record<string, ShoppingItem[]> {
  const grouped = items.reduce((acc, item) => {
    const category = item.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  return grouped;
}
