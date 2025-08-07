import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Mic, Check, Edit, Trash2 } from "lucide-react";
import { useVoice } from "@/hooks/use-voice";
import type { ListItem } from "@shared/schema";

interface EditableListItemProps {
  item: ListItem;
  onToggleComplete: (item: ListItem) => void;
  onUpdateItem: (id: string, updates: { name: string; category?: string }) => void;
  onDeleteItem: (id: string) => void;
  getCategoryIcon: (category: string) => React.ComponentType;
  getCategoryColor: (category: string) => string;
}

export function EditableListItem({
  item,
  onToggleComplete,
  onUpdateItem,
  onDeleteItem,
  getCategoryIcon,
  getCategoryColor,
}: EditableListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.name);
  const [isVoiceEditing, setIsVoiceEditing] = useState(false);

  const { isRecording, isTranscribing, toggleRecording } = useVoice({
    onTranscriptionComplete: (text) => {
      setEditValue(text.trim());
      setIsVoiceEditing(false);
    },
    onError: () => {
      setIsVoiceEditing(false);
    }
  });

  const handleSaveEdit = () => {
    if (editValue.trim() && editValue !== item.name) {
      onUpdateItem(item.id, { name: editValue.trim() });
    }
    setIsEditing(false);
    setEditValue(item.name);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue(item.name);
    setIsVoiceEditing(false);
  };

  const handleVoiceEdit = () => {
    setIsVoiceEditing(true);
    toggleRecording();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const CategoryIcon = getCategoryIcon(item.category);

  return (
    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 group">
      {/* Completion checkbox */}
      <Checkbox
        checked={item.completed}
        onCheckedChange={() => onToggleComplete(item)}
        className="flex-shrink-0"
      />

      {/* Category icon */}
      <CategoryIcon className={`h-4 w-4 flex-shrink-0 ${getCategoryColor(item.category)}`} />

      {/* Item name - editable */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center space-x-2">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleSaveEdit}
              className="flex-1 h-8 text-sm"
              autoFocus
            />
            {/* Voice edit button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleVoiceEdit}
              disabled={isRecording || isTranscribing}
              className={`h-8 w-8 p-0 ${
                isVoiceEditing && isRecording
                  ? "bg-red-100 text-red-600 animate-pulse"
                  : ""
              }`}
            >
              <Mic className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSaveEdit}
              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
            >
              <Check className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <span
            className={`text-sm cursor-pointer hover:text-blue-600 ${
              item.completed
                ? "line-through text-gray-500 dark:text-gray-400"
                : "text-gray-900 dark:text-gray-100"
            }`}
            onClick={() => setIsEditing(true)}
          >
            {item.name}
          </span>
        )}
      </div>

      {/* Action buttons - show on hover or when editing */}
      <div className={`flex items-center space-x-1 ${isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
        {!isEditing && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-3 w-3" />
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDeleteItem(item.id)}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}