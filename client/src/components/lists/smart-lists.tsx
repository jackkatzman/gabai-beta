import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Mic, 
  Trash2, 
  Share2, 
  Copy, 
  Users,
  ListOrdered,
  Apple,
  Milk,
  Wheat,
  Hammer,
  Paintbrush,
  Wrench,
  Clock,
  CheckCircle2,
  GripVertical,
  BookOpen,
  Film,
  MapPin,
  Gift,
  Link,
  MessageCircle,
  MessageSquare,
  Mail,
  X,
  Circle
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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
import { api } from "@/lib/api";
import { useVoice } from "@/hooks/use-voice";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { User, SmartList, ListItem } from "@shared/schema";

interface SmartListsProps {
  user: User;
}

const listTypeTemplates = {
  shopping: {
    name: "Shopping List",
    categories: ["Produce", "Dairy", "Meat", "Pantry", "Frozen", "Beverages", "Household"],
    icon: Apple,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  },
  punch_list: {
    name: "Contractor Punch List",
    categories: ["Plumber", "Electrician", "Painter", "Flooring", "HVAC", "General"],
    icon: Hammer,
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
  },
  waiting_list: {
    name: "Waiting List",
    categories: ["VIP", "Regular", "Walk-in", "Reservation"],
    icon: Clock,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
  },
  todo: {
    name: "To-Do List",
    categories: ["Work", "Personal", "Urgent", "Later"],
    icon: CheckCircle2,
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
  },
  books: {
    name: "Reading List",
    categories: ["Fiction", "Non-Fiction", "Biographies", "Technical", "Self-Help", "To Read"],
    icon: BookOpen,
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
  },
  movies: {
    name: "Movie Watchlist",
    categories: ["Action", "Comedy", "Drama", "Sci-Fi", "Documentary", "To Watch"],
    icon: Film,
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  },
  travel: {
    name: "Travel Plans",
    categories: ["Destinations", "Hotels", "Activities", "Restaurants", "Packing", "Bookings"],
    icon: MapPin,
    color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200"
  },
  gifts: {
    name: "Gift Ideas",
    categories: ["Birthday", "Holiday", "Anniversary", "Wedding", "Baby Shower", "Graduation"],
    icon: Gift,
    color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
  }
};

const categoryIcons = {
  produce: Apple,
  dairy: Milk,
  grains: Wheat,
  plumber: Wrench,
  painter: Paintbrush,
  electrician: Hammer,
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
    plumber: "text-blue-600",
    electrician: "text-yellow-600",
    painter: "text-purple-600",
    flooring: "text-brown-600",
  };
  return colors[category.toLowerCase() as keyof typeof colors] || "text-gray-500";
};

// Sortable Item Component
interface SortableItemProps {
  item: ListItem;
  onToggle: () => void;
  onDelete: () => void;
}

function SortableItem({ item, onToggle, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center space-x-3 p-2 rounded-lg border ${
        item.completed 
          ? "bg-gray-50 dark:bg-gray-800 opacity-60" 
          : "bg-white dark:bg-gray-900"
      } ${isDragging ? "shadow-lg z-10" : ""}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-none"
        style={{ touchAction: 'none' }}
        onTouchStart={(e) => {
          // Prevent body scroll during drag
          document.body.style.overflow = 'hidden';
        }}
        onTouchEnd={(e) => {
          // Restore body scroll after drag
          document.body.style.overflow = '';
        }}
        onMouseDown={(e) => {
          // Prevent text selection during drag
          e.preventDefault();
        }}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <Checkbox
        checked={item.completed ?? false}
        onCheckedChange={onToggle}
      />
      
      <div className="flex-1">
        <p className={`text-sm ${item.completed ? "line-through" : ""}`}>
          {item.name}
        </p>
        {item.assignedTo && (
          <p className="text-xs text-gray-500">
            Assigned to: {item.assignedTo}
          </p>
        )}
        {item.notes && (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {item.notes}
          </p>
        )}
      </div>
      
      {(item.priority || 1) > 1 && (
        <Badge variant="outline" className="text-xs">
          Priority {item.priority || 1}
        </Badge>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export function SmartLists({ user }: SmartListsProps) {
  const [newListName, setNewListName] = useState("");
  const [newListType, setNewListType] = useState<keyof typeof listTypeTemplates>("shopping");
  const [newListDescription, setNewListDescription] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [newItemPriority, setNewItemPriority] = useState(1);
  const [newItemAssignedTo, setNewItemAssignedTo] = useState("");
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [isVoiceAddingItem, setIsVoiceAddingItem] = useState(false);
  const [shareCode, setShareCode] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isRecording, startRecording, stopRecording, isTranscribing } = useVoice({
    onTranscriptionComplete: (text) => {
      if (selectedListId && text.trim()) {
        setNewItemName(text);
        handleAddItem(selectedListId);
      }
      setIsVoiceAddingItem(false);
    },
    onError: (error) => {
      toast({
        title: "Voice Error", 
        description: error,
        variant: "destructive",
      });
      setIsVoiceAddingItem(false);
    },
  });

  // Get smart lists
  const { data: lists = [], isLoading, error } = useQuery<(SmartList & { items: ListItem[] })[]>({
    queryKey: ["/api/smart-lists", user.id],
    enabled: !!user?.id, // Only fetch when user exists
  });



  // Create list mutation
  const createListMutation = useMutation({
    mutationFn: () => api.createSmartList({
      userId: user.id,
      name: newListName,
      type: newListType,
      description: newListDescription,
      isShared,
      categories: listTypeTemplates[newListType].categories,
      sortBy: "category"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
      setNewListName("");
      setNewListDescription("");
      setIsShared(false);
      toast({
        title: "List created!",
        description: `Your ${listTypeTemplates[newListType].name.toLowerCase()} has been created.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create list",
        variant: "destructive",
      });
    },
  });

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: ({ listId, name, category, assignedTo }: {
      listId: string;
      name: string;
      category: string;
      assignedTo?: string;
    }) => {
      return api.createListItem({
        listId,
        name,
        category,
        priority: 1,
        assignedTo: assignedTo || undefined,
        addedBy: user.name || user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
      setNewItemName("");
      setNewItemCategory("");
      setNewItemAssignedTo("");
      setSelectedListId(null);
      toast({
        title: "Item added!",
        description: "Item has been added to your list.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding item",
        description: error.message || "Failed to add item to list",
        variant: "destructive",
      });
    },
  });

  // Reorder items mutation
  const reorderItemsMutation = useMutation({
    mutationFn: async ({ items }: { items: { id: string; position: number }[] }) => {
      // Update positions for multiple items at once
      const updates = items.map(item => 
        api.updateListItem(item.id, { position: item.position })
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
    },
    onError: (error) => {
      toast({
        title: "Error reordering items",
        description: error.message || "Failed to reorder items",
        variant: "destructive",
      });
    },
  });

  // Drag sensors for touch and mouse with improved touch handling
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before starting drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Always restore body scroll when drag ends
    document.body.style.overflow = '';

    if (!over || active.id === over.id) {
      return;
    }

    // Find the list containing the dragged item
    const sourceList = lists.find(list => 
      list.items.some(item => item.id === active.id)
    );

    if (!sourceList) return;

    const sourceItems = [...sourceList.items].sort((a, b) => (a.position || 0) - (b.position || 0));
    const oldIndex = sourceItems.findIndex(item => item.id === active.id);
    const newIndex = sourceItems.findIndex(item => item.id === over.id);

    if (oldIndex !== newIndex) {
      const newOrder = arrayMove(sourceItems, oldIndex, newIndex);
      
      // Update positions
      const updatedItems = newOrder.map((item, index) => ({
        id: item.id,
        position: index
      }));

      reorderItemsMutation.mutate({ items: updatedItems });
    }
  };

  // Share list mutation
  const shareListMutation = useMutation({
    mutationFn: (listId: string) => api.shareList(listId),
    onSuccess: (data) => {
      setShareCode(data.shareCode);
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
      toast({
        title: "List shared!",
        description: "Your list is now shareable. Copy the link to invite collaborators.",
      });
    },
  });

  // Join shared list mutation
  const joinListMutation = useMutation({
    mutationFn: () => api.joinSharedList(shareCode, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
      setShareCode("");
      toast({
        title: "Joined list!",
        description: "You've successfully joined the shared list.",
      });
    },
  });

  // Toggle item completion mutation
  const toggleItemMutation = useMutation({
    mutationFn: (itemId: string) => api.toggleListItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => api.deleteListItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
    },
  });

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    createListMutation.mutate();
  };

  const handleAddItem = (listId: string) => {
    if (!newItemName.trim()) return;
    if (createItemMutation.isPending) return; // Prevent duplicate submissions
    
    const selectedList = lists.find(list => list.id === listId);
    if (!selectedList) return;

    // Determine category based on item name and list type
    let category = "Other";
    const itemName = newItemName.toLowerCase();
    
    if (selectedList.type === "shopping") {
      const foodCategories = {
        "Produce": ["apple", "banana", "orange", "lettuce", "tomato", "potato", "onion", "carrot", "spinach", "broccoli", "cucumber", "bell pepper", "mushroom", "avocado", "strawberry", "grape", "lemon", "lime", "garlic", "ginger"],
        "Dairy": ["milk", "cheese", "yogurt", "butter", "cream", "egg", "sour cream", "cottage cheese"],
        "Meat": ["chicken", "beef", "pork", "turkey", "fish", "salmon", "ground beef", "bacon", "sausage", "pastrami"],
        "Pantry": ["bread", "pasta", "rice", "flour", "sugar", "oil", "salt", "pepper", "sauce", "cereal"],
        "Snacks": ["chocolate", "twizzlers", "chips", "crackers", "nuts", "candy", "cookies"]
      };
      
      for (const [cat, items] of Object.entries(foodCategories)) {
        if (items.some(food => itemName.includes(food))) {
          category = cat;
          break;
        }
      }
    } else if (selectedList.type === "punch_list") {
      const punchCategories = {
        "Plumbing": ["plumb", "pipe", "drain", "faucet", "toilet", "shower", "sink"],
        "Electrical": ["electric", "wire", "outlet", "switch", "light", "circuit"],
        "Painting": ["paint", "brush", "roller", "primer", "wall"],
        "General": ["fix", "repair", "install", "replace"]
      };
      
      for (const [cat, items] of Object.entries(punchCategories)) {
        if (items.some(work => itemName.includes(work))) {
          category = cat;
          break;
        }
      }
    }

    setSelectedListId(listId);
    
    createItemMutation.mutate({
      listId,
      name: newItemName,
      category,
      assignedTo: selectedList.type === "punch_list" ? newItemAssignedTo : undefined
    });
  };

  const handleVoiceAddItem = async (listId: string) => {
    if (isVoiceAddingItem || createItemMutation.isPending) return; // Prevent duplicate voice operations
    
    setIsVoiceAddingItem(true);
    setSelectedListId(listId);
    
    try {
      if (isRecording) {
        // Stop recording if already recording
        stopRecording();
      } else {
        // Start recording
        startRecording();
      }
    } catch (error) {
      toast({
        title: "Voice Error",
        description: "Failed to record voice input",
        variant: "destructive",
      });
      setIsVoiceAddingItem(false);
    }
  };

  const copyShareLink = (code: string) => {
    const url = `${window.location.origin}/shared/${code}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Share this link with collaborators",
    });
  };

  const shareViaWhatsApp = (shareCode: string, listName: string) => {
    const url = `${window.location.origin}/shared/${shareCode}`;
    const message = `Hey! I'm sharing my "${listName}" list with you via GabAi. You can view and collaborate here: ${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaSMS = (shareCode: string, listName: string) => {
    const url = `${window.location.origin}/shared/${shareCode}`;
    const message = `Hey! I'm sharing my "${listName}" list with you via GabAi: ${url}`;
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    window.open(smsUrl);
  };

  const shareViaEmail = (shareCode: string, listName: string) => {
    const url = `${window.location.origin}/shared/${shareCode}`;
    const subject = encodeURIComponent(`${listName} - Shared List`);
    const body = encodeURIComponent(`Hi there!\n\nI'm sharing my "${listName}" list with you through GabAi. You can view and collaborate on this list by clicking the link below:\n\n${url}\n\nBest regards!`);
    const emailUrl = `mailto:?subject=${subject}&body=${body}`;
    window.open(emailUrl, '_self');
  };

  const sortItemsByCategory = (items: ListItem[], categories: string[]) => {
    const categorized = categories.map(category => ({
      category,
      items: items.filter(item => item.category === category)
    })).filter(group => group.items.length > 0);
    
    const uncategorized = items.filter(item => !item.category || !categories.includes(item.category));
    if (uncategorized.length > 0) {
      categorized.push({ category: "Other", items: uncategorized });
    }
    
    return categorized;
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Lists</h1>
          <div className="flex items-center space-x-2">
            {/* Join Shared List */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Join List
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join Shared List</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="share-code">Share Code or Link</Label>
                    <Input
                      id="share-code"
                      value={shareCode}
                      onChange={(e) => setShareCode(e.target.value)}
                      placeholder="Enter share code or paste link"
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={() => joinListMutation.mutate()}
                    disabled={!shareCode.trim() || joinListMutation.isPending}
                    className="w-full"
                  >
                    Join List
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Create New List */}
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New List
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Smart List</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="list-type">List Type</Label>
                    <Select value={newListType} onValueChange={(value: keyof typeof listTypeTemplates) => setNewListType(value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(listTypeTemplates).map(([key, template]) => {
                          const Icon = template.icon;
                          return (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center space-x-2">
                                <Icon className="h-4 w-4" />
                                <span>{template.name}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="list-name">List Name</Label>
                    <Input
                      id="list-name"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder={`e.g., ${listTypeTemplates[newListType].name}`}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="list-description">Description (optional)</Label>
                    <Textarea
                      id="list-description"
                      value={newListDescription}
                      onChange={(e) => setNewListDescription(e.target.value)}
                      placeholder="Describe what this list is for..."
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-shared"
                      checked={isShared}
                      onCheckedChange={setIsShared}
                    />
                    <Label htmlFor="is-shared">Enable sharing and collaboration</Label>
                  </div>

                  <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                    <h4 className="font-medium mb-2">Categories for this list type:</h4>
                    <div className="flex flex-wrap gap-2">
                      {listTypeTemplates[newListType].categories.map((category) => (
                        <Badge key={category} variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={handleCreateList}
                    disabled={!newListName.trim() || createListMutation.isPending}
                    className="w-full"
                  >
                    Create {listTypeTemplates[newListType].name}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Lists */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {lists.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No lists yet. Create your first smart list!
            </p>
          </div>
        ) : (
          lists.map((list) => {
            const template = listTypeTemplates[list.type as keyof typeof listTypeTemplates] || listTypeTemplates.todo;
            const Icon = template.icon;
            const categorizedItems = sortItemsByCategory(list.items, list.categories || []);
            
            return (
              <Card key={list.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${template.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{list.name}</CardTitle>
                        {list.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {list.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {list.isShared ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Share2 className="h-4 w-4 mr-1" />
                              Share Options
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => copyShareLink(list.shareCode!)}>
                              <Link className="h-4 w-4 mr-2" />
                              Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => shareViaWhatsApp(list.shareCode!, list.name)}>
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Share via WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => shareViaSMS(list.shareCode!, list.name)}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Share via SMS
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => shareViaEmail(list.shareCode!, list.name)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Share via Email
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => shareListMutation.mutate(list.id)}
                          disabled={shareListMutation.isPending}
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          {shareListMutation.isPending ? "Sharing..." : "Share"}
                        </Button>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {list.items.length} items
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Add Item Section */}
                  <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center space-x-2 mb-2">
                      <Input
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Add new item..."
                        className="flex-1 text-base font-normal smart-list-input !text-base !min-h-[44px] !h-[44px] !py-3 !px-4"
                        style={{ 
                          fontSize: '16px !important', 
                          minHeight: '44px !important', 
                          height: '44px !important',
                          lineHeight: '1.4 !important',
                          padding: '12px 16px !important',
                          direction: 'ltr !important',
                          unicodeBidi: 'embed !important',
                          textAlign: 'left !important'
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newItemName.trim()) {
                            e.preventDefault();
                            handleAddItem(list.id);
                          }
                        }}
                      />
                      <Select 
                        value={newItemCategory} 
                        onValueChange={setNewItemCategory}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {(list.categories || []).map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVoiceAddItem(list.id)}
                        disabled={isRecording || isTranscribing}
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAddItem(list.id)}
                        disabled={!newItemName.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {list.type === "punch_list" && (
                      <Input
                        value={newItemAssignedTo}
                        onChange={(e) => setNewItemAssignedTo(e.target.value)}
                        placeholder="Assign to (e.g., John the Plumber)"
                        className="text-sm smart-list-input"
                        style={{ 
                          fontSize: '16px !important', 
                          minHeight: '44px !important', 
                          height: '44px !important',
                          direction: 'ltr !important',
                          unicodeBidi: 'embed !important',
                          textAlign: 'left !important'
                        }}
                      />
                    )}
                  </div>

                  {/* Items by Category with Drag and Drop */}
                  {categorizedItems.length > 0 ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                      onDragStart={() => {
                        // Disable body scroll during drag
                        document.body.style.overflow = 'hidden';
                      }}
                      onDragCancel={() => {
                        // Restore body scroll if drag is cancelled
                        document.body.style.overflow = '';
                      }}
                    >
                      <div className="space-y-4">
                        {categorizedItems.map(({ category, items }) => {
                          // Sort items by position for consistent ordering
                          const sortedItems = [...items].sort((a, b) => (a.position || 0) - (b.position || 0));
                          
                          return (
                            <div key={category}>
                              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                <span className="mr-2">{category}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {items.filter(item => !item.completed).length}
                                </Badge>
                              </h4>
                              
                              <SortableContext 
                                items={sortedItems.map(item => item.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="space-y-2">
                                  {sortedItems.map((item) => (
                                    <SortableItem
                                      key={item.id}
                                      item={item}
                                      onToggle={() => toggleItemMutation.mutate(item.id)}
                                      onDelete={() => deleteItemMutation.mutate(item.id)}
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </div>
                          );
                        })}
                      </div>
                    </DndContext>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                      No items yet. Add your first item above!
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}