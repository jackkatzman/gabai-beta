import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Mic, Share2, Apple, Milk, Wheat } from "lucide-react";
import { EditableListItem } from "./editable-list-item";
import { useVoice } from "@/hooks/use-voice";
import { useToast } from "@/hooks/use-toast";
import type { SmartList, ListItem, User } from "@shared/schema";

interface SimpleListCardProps {
  list: SmartList & { items: ListItem[] };
  user: User;
  onAddItem: (listId: string, name: string, category?: string) => void;
  onUpdateItem: (id: string, updates: { name: string; category?: string }) => void;
  onToggleItem: (item: ListItem) => void;
  onDeleteItem: (id: string) => void;
  onShare: () => void;
}

const categoryIcons = {
  produce: Apple,
  dairy: Milk,
  grains: Wheat,
};

const getCategoryIcon = (category: string) => {
  const Icon = categoryIcons[category?.toLowerCase() as keyof typeof categoryIcons];
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
  return colors[category?.toLowerCase() as keyof typeof colors] || "text-gray-500";
};

export function SimpleListCard({
  list,
  user,
  onAddItem,
  onUpdateItem,
  onToggleItem,
  onDeleteItem,
  onShare,
}: SimpleListCardProps) {
  const [newItemName, setNewItemName] = useState("");
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const { toast } = useToast();

  const { isRecording, isTranscribing, toggleRecording } = useVoice({
    onTranscriptionComplete: (text) => {
      if (text.trim()) {
        // Simple categorization based on item name
        const category = categorizeItem(text, user);
        onAddItem(list.id, text.trim(), category);
        toast({
          title: "Item Added",
          description: `Added "${text}" to your list`,
        });
      }
      setIsVoiceMode(false);
    },
    onError: (error) => {
      console.error("Voice input error:", error);
      setIsVoiceMode(false);
      toast({
        title: "Voice Error", 
        description: "Failed to record voice input. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAddItem = () => {
    if (newItemName.trim()) {
      const category = categorizeItem(newItemName, user);
      onAddItem(list.id, newItemName.trim(), category);
      setNewItemName("");
    }
  };

  const handleVoiceAdd = () => {
    setIsVoiceMode(true);
    toggleRecording();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddItem();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{list.name}</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Item Section */}
        <div className="flex items-center space-x-2">
          <div className="flex-1 flex space-x-2">
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add new item..."
              disabled={isVoiceMode}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={handleAddItem}
              disabled={!newItemName.trim() || isVoiceMode}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleVoiceAdd}
            disabled={isRecording || isTranscribing}
            className={`${
              isVoiceMode && isRecording
                ? "bg-red-100 text-red-600 animate-pulse"
                : ""
            }`}
          >
            <Mic className="h-4 w-4" />
          </Button>
        </div>

        {/* Items List */}
        <div className="space-y-1">
          {list.items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No items yet. Add your first item!
            </p>
          ) : (
            list.items.map((item) => (
              <EditableListItem
                key={item.id}
                item={item}
                onToggleComplete={onToggleItem}
                onUpdateItem={onUpdateItem}
                onDeleteItem={onDeleteItem}
                getCategoryIcon={getCategoryIcon}
                getCategoryColor={getCategoryColor}
              />
            ))
          )}
        </div>

        {/* Progress indicator */}
        {list.items.length > 0 && (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {list.items.filter(item => item.completed).length} of {list.items.length} completed
            </span>
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{
                  width: `${(list.items.filter(item => item.completed).length / list.items.length) * 100}%`
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Simple categorization function
function categorizeItem(itemName: string, user: User): string {
  const name = itemName.toLowerCase();
  
  // Produce
  if (name.includes('apple') || name.includes('banana') || name.includes('orange') || 
      name.includes('lettuce') || name.includes('tomato') || name.includes('carrot')) {
    return 'produce';
  }
  
  // Dairy
  if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') || 
      name.includes('butter') || name.includes('cream')) {
    return 'dairy';
  }
  
  // Meat
  if (name.includes('chicken') || name.includes('beef') || name.includes('pork') ||
      name.includes('fish') || name.includes('meat')) {
    return 'meat';
  }
  
  // Default to pantry
  return 'pantry';
}