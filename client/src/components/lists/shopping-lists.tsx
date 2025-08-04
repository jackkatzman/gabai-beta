import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Mic, Trash2, Apple, Milk, Wheat, Share2, Copy, MessageCircle, UserPlus, Mail } from "lucide-react";
import { api } from "@/lib/api";
import { useVoice } from "@/hooks/use-voice";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { User, SmartList, ListItem } from "@shared/schema";

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
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedListForShare, setSelectedListForShare] = useState<SmartList | null>(null);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [searchingUser, setSearchingUser] = useState(false);
  const [foundUser, setFoundUser] = useState<{id: string, email: string, firstName?: string, lastName?: string} | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get shopping lists
  const { data: lists = [], isLoading } = useQuery<(SmartList & { items: ListItem[] })[]>({
    queryKey: ["/api/smart-lists", user.id],
  });

  // Create list mutation
  const createListMutation = useMutation({
    mutationFn: (name: string) => api.createSmartList({
      userId: user.id,
      name,
      type: "shopping",
      categories: ["Produce", "Dairy", "Meat", "Pantry", "Frozen", "Beverages", "Household"]
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
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
      api.createListItem({ listId, name, category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
      setNewItemName("");
      setNewItemCategory("");
      toast({
        title: "Item Added",
        description: "Item has been added to your list.",
      });
    },
    onError: (error: any) => {
      console.error("Create item error:", error);
      toast({
        title: "Error Adding Item",
        description: error.message || "Failed to add item to list",
        variant: "destructive",
      });
    },
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ListItem> }) =>
      api.updateListItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => api.deleteListItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
      toast({
        title: "Item Removed",
        description: "Item has been removed from your list.",
      });
    },
  });

  // Share list mutation
  const shareListMutation = useMutation({
    mutationFn: (listId: string) => api.shareList(listId),
    onSuccess: (shareCode) => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
      toast({
        title: "List Shared!",
        description: "Your list is now shareable via the link below.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sharing Failed",
        description: error.message || "Failed to share list",
        variant: "destructive",
      });
    },
  });

  // Add collaborator mutation
  const addCollaboratorMutation = useMutation({
    mutationFn: ({ listId, email }: { listId: string; email: string }) => 
      api.addCollaborator(listId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user.id] });
      setCollaboratorEmail("");
      setFoundUser(null);
      toast({
        title: "Collaborator Added!",
        description: "User has been invited to collaborate on your list.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Collaborator",
        description: error.message || "Could not add collaborator to the list.",
        variant: "destructive",
      });
    },
  });

  // Voice input for adding items
  const { isRecording, isTranscribing, toggleRecording, stopRecording } = useVoice({
    onTranscriptionComplete: (text) => {
      setNewItemName(text);
      setIsVoiceAddingItem(false);
    },
    onError: (error) => {
      setIsVoiceAddingItem(false);
      console.error("Voice input error:", error);
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

  const handleToggleItem = (item: ListItem) => {
    updateItemMutation.mutate({
      id: item.id,
      updates: { completed: !item.completed },
    });
  };

  const handleVoiceAddItem = async (listId: string) => {
    try {
      // Force stop any existing recording with cleanup
      if (isRecording || isTranscribing) {
        stopRecording();
        // Wait for cleanup to complete
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      setSelectedListId(listId);
      setIsVoiceAddingItem(true);
      
      // Start new recording
      toggleRecording();
    } catch (error) {
      console.error("Voice input error:", error);
      setIsVoiceAddingItem(false);
    }
  };

  const handleShareList = (list: SmartList & { items: ListItem[] }) => {
    setSelectedListForShare(list);
    setShareDialogOpen(true);
    if (!list.shareCode) {
      shareListMutation.mutate(list.id);
    }
  };

  const getShareUrl = (shareCode: string) => {
    return `${window.location.origin}/shared/${shareCode}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Share link copied to clipboard.",
    });
  };

  const shareViaWhatsApp = (shareCode: string, listName: string) => {
    const url = getShareUrl(shareCode);
    const message = `Hey! I'm sharing my "${listName}" list with you via GabAi. You can view and collaborate here: ${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaSMS = (shareCode: string, listName: string) => {
    const url = getShareUrl(shareCode);
    const message = `Hey! I'm sharing my "${listName}" list with you via GabAi: ${url}`;
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    window.open(smsUrl);
  };

  const searchUser = async () => {
    if (!collaboratorEmail.trim()) return;
    
    setSearchingUser(true);
    setFoundUser(null);
    
    try {
      const user = await api.searchUserByEmail(collaboratorEmail.trim());
      setFoundUser(user);
    } catch (error: any) {
      if (error.message.includes('404')) {
        toast({
          title: "User Not Found",
          description: "No registered user found with this email address.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Search Failed",
          description: "Failed to search for user.",
          variant: "destructive",
        });
      }
    } finally {
      setSearchingUser(false);
    }
  };

  const handleAddCollaborator = () => {
    if (foundUser && selectedListForShare) {
      addCollaboratorMutation.mutate({
        listId: selectedListForShare.id,
        email: foundUser.email,
      });
    }
  };

  // Group items by category
  const groupItemsByCategory = (items: ListItem[]) => {
    const grouped = items.reduce((acc, item) => {
      const category = item.category || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, ListItem[]>);

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
          lists.map((list: SmartList & { items: ListItem[] }) => (
            <ShoppingListCard
              key={list.id}
              list={list}
              user={user}
              onAddItem={handleAddItem}
              onToggleItem={handleToggleItem}
              onDeleteItem={(id) => deleteItemMutation.mutate(id)}
              onVoiceAdd={handleVoiceAddItem}
              onShare={() => handleShareList(list)}
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

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share "{selectedListForShare?.name}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Invite App Users */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <label className="text-sm font-medium">Invite App Users</label>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Input
                    value={collaboratorEmail}
                    onChange={(e) => {
                      setCollaboratorEmail(e.target.value);
                      setFoundUser(null);
                    }}
                    placeholder="Enter email address"
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        searchUser();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={searchUser}
                    disabled={!collaboratorEmail.trim() || searchingUser}
                    variant="outline"
                  >
                    {searchingUser ? "..." : "Search"}
                  </Button>
                </div>

                {foundUser && (
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <UserPlus className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                          {foundUser.firstName && foundUser.lastName 
                            ? `${foundUser.firstName} ${foundUser.lastName}`
                            : foundUser.email
                          }
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {foundUser.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleAddCollaborator}
                      disabled={addCollaboratorMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {addCollaboratorMutation.isPending ? "Adding..." : "Add"}
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Registered users will get instant access to collaborate
              </p>
            </div>

            {/* Show collaborators */}
            {selectedListForShare?.collaborators && selectedListForShare.collaborators.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Collaborators</label>
                <div className="space-y-1">
                  {selectedListForShare.collaborators.map((collaboratorId, index) => (
                    <div key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <UserPlus className="h-3 w-3" />
                      {collaboratorId}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Public Link Sharing */}
            {selectedListForShare?.shareCode && (
              <>
                <hr className="border-gray-200 dark:border-gray-700" />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    <label className="text-sm font-medium">Public Link</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={getShareUrl(selectedListForShare.shareCode)}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(getShareUrl(selectedListForShare.shareCode))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => shareViaWhatsApp(selectedListForShare.shareCode, selectedListForShare.name)}
                      className="w-full"
                      variant="outline"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Share via WhatsApp
                    </Button>
                    <Button
                      onClick={() => shareViaSMS(selectedListForShare.shareCode, selectedListForShare.name)}
                      className="w-full"
                      variant="outline"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Share via Text Message
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Anyone with this link can view and add items (no account required)
                  </div>
                </div>
              </>
            )}

            {shareListMutation.isPending && (
              <div className="text-center py-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Generating share link...
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ShoppingListCardProps {
  list: SmartList & { items: ListItem[] };
  user: User;
  onAddItem: (listId: string) => void;
  onToggleItem: (item: ListItem) => void;
  onDeleteItem: (id: string) => void;
  onVoiceAdd: (listId: string) => void;
  onShare: () => void;
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
  onShare,
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
            <CardTitle className="text-lg flex items-center gap-2">
              {list.name}
              {list.userId !== user.id && (
                <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-full">
                  Shared with me
                </span>
              )}
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {completedCount} of {list.items.length} completed
              {list.isShared && (
                <span className="ml-2 text-blue-500">• Public</span>
              )}
              {list.collaborators && list.collaborators.length > 0 && (
                <span className="ml-2 text-green-500">• {list.collaborators.length} collaborator{list.collaborators.length === 1 ? '' : 's'}</span>
              )}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onShare}
            className="w-10 h-10 p-0"
          >
            <Share2 className="h-4 w-4" />
          </Button>
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
                    checked={item.completed || false}
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

function groupItemsByCategory(items: ListItem[]): Record<string, ListItem[]> {
  const grouped = items.reduce((acc, item) => {
    const category = item.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ListItem[]>);

  return grouped;
}
