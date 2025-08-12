import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Share2, ExternalLink } from "lucide-react";
import { LogoBubble } from "@/components/ui/logo-spinner";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/navigation/bottom-nav";
import type { SmartList, ListItem } from "@shared/schema";
import gabaiLogo from "@assets/gabai_logo_1754292316913.png";

export function SharedListPage() {
  const [, params] = useRoute("/shared/:shareCode");
  const shareCode = params?.shareCode;
  const [newItemName, setNewItemName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get shared list
  const { data: sharedList, isLoading, error } = useQuery<SmartList & { items: ListItem[] }>({
    queryKey: ["/api/shared", shareCode],
    enabled: !!shareCode,
    queryFn: () => api.getSharedList(shareCode!),
  });

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: (name: string) => api.createListItem({
      listId: sharedList!.id,
      name: name.trim(),
      category: "Other",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shared", shareCode] });
      setNewItemName("");
      toast({
        title: "Item Added",
        description: "Item has been added to the shared list.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Item",
        description: error.message || "Could not add item to the list.",
        variant: "destructive",
      });
    },
  });

  // Toggle item mutation
  const toggleItemMutation = useMutation({
    mutationFn: (item: ListItem) => api.updateListItem(item.id, {
      completed: !item.completed,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shared", shareCode] });
    },
  });

  const handleAddItem = () => {
    if (newItemName.trim()) {
      addItemMutation.mutate(newItemName);
    }
  };

  const handleToggleItem = (item: ListItem) => {
    toggleItemMutation.mutate(item);
  };

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
      <div className="container mx-auto p-4 max-w-2xl">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !sharedList) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">List Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The shared list you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => window.location.href = "/"}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const groupedItems = groupItemsByCategory(sharedList.items);
  const completedCount = sharedList.items.filter(item => item.completed).length;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <LogoBubble size="sm" />
          <span className="text-sm font-medium text-blue-500">Shared List</span>
        </div>
        <h1 className="text-2xl font-bold">{sharedList.name}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {completedCount} of {sharedList.items.length} completed
        </p>
      </div>

      {/* Add Item */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Add item to shared list..."
              className="smart-list-input"
              style={{ 
                fontSize: '16px',
                minHeight: '44px',
                direction: 'ltr',
                unicodeBidi: 'normal',
                textAlign: 'left'
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddItem();
                }
              }}
            />
            <Button
              onClick={handleAddItem}
              disabled={!newItemName.trim() || addItemMutation.isPending}
              size="sm"
              className="w-10 h-10 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Items by Category */}
      <div className="space-y-4">
        {Object.entries(groupedItems).map(([category, items]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base capitalize">{category}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Checkbox
                    checked={item.completed || false}
                    onCheckedChange={() => handleToggleItem(item)}
                  />
                  <span
                    className={`flex-1 shared-list-item ${
                      item.completed
                        ? "line-through text-gray-500 dark:text-gray-400"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {item.name}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {sharedList.items.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                This list is empty. Add the first item above!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Powered by GabAi
        </p>
        <div className="flex items-center gap-2 justify-center mb-3">
          <img 
            src={gabaiLogo} 
            alt="GabAi" 
            className="w-6 h-6 object-contain"
          />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Powered by GabAi
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.href = "/"}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Get Your Own Smart Lists
        </Button>
      </div>
      
      {/* Bottom Navigation */}
      <div className="h-20" />
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
    </div>
  );
}