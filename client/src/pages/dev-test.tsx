import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useVoice } from "@/hooks/use-voice";
import { api } from "@/lib/api";
import { Mic, Plus, List, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DevTestPage() {
  const [testText, setTestText] = useState("");
  const [listName, setListName] = useState("");
  const [itemName, setItemName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Test voice input
  const { isRecording, isTranscribing, toggleRecording } = useVoice({
    onTranscriptionComplete: (text) => {
      setTestText(text);
      toast({
        title: "Voice transcription complete",
        description: `Recognized: "${text}"`,
      });
    },
    onError: (error) => {
      toast({
        title: "Voice error",
        description: error,
        variant: "destructive",
      });
    },
  });

  // Test authentication
  const testLogin = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/test-login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Login failed');
      return response.json();
    },
    onSuccess: (user) => {
      toast({
        title: "Test login successful",
        description: `Logged in as ${user.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get current user
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  // Get lists
  const { data: lists = [], isLoading: listsLoading } = useQuery({
    queryKey: ['/api/smart-lists', user?.id],
    enabled: !!user?.id,
  });

  // Create test list
  const createList = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      return api.createSmartList({
        userId: user.id,
        name: listName || 'Test Shopping List',
        type: 'shopping',
        categories: ['Produce', 'Dairy', 'Meat']
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/smart-lists'] });
      setListName("");
      toast({
        title: "List created",
        description: "Test list created successfully",
      });
    },
  });

  // Create test item
  const createItem = useMutation({
    mutationFn: async () => {
      if (!lists.length) throw new Error('No lists available');
      const firstList = lists[0];
      return api.createListItem({
        listId: firstList.id,
        name: itemName || 'Test Item',
        category: 'Produce'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/smart-lists'] });
      setItemName("");
      toast({
        title: "Item added",
        description: "Test item added to list",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Development Test Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Authentication Test */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Authentication Test</h3>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => testLogin.mutate()}
                  disabled={testLogin.isPending || !!user}
                >
                  {testLogin.isPending ? 'Logging in...' : 'Test Login'}
                </Button>
                {userLoading && <span>Loading user...</span>}
                {user && (
                  <span className="text-green-600">
                    ✓ Logged in as {user.name} ({user.email})
                  </span>
                )}
                {!user && !userLoading && (
                  <span className="text-red-600">Not authenticated</span>
                )}
              </div>
            </div>

            {/* Voice Input Test */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Voice Input Test</h3>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={toggleRecording}
                  disabled={isTranscribing}
                  variant={isRecording ? "destructive" : "default"}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  {isRecording ? 'Recording...' : isTranscribing ? 'Processing...' : 'Start Recording'}
                </Button>
                {testText && (
                  <div className="p-2 bg-blue-50 rounded">
                    Transcribed: "{testText}"
                  </div>
                )}
              </div>
            </div>

            {/* Lists Test */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Lists Test</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="List name"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                  />
                  <Button 
                    onClick={() => createList.mutate()}
                    disabled={createList.isPending || !user}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create List
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Item name"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                  />
                  <Button 
                    onClick={() => createItem.mutate()}
                    disabled={createItem.isPending || !lists.length}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Current Lists ({lists.length})</h4>
                  {listsLoading && <div>Loading lists...</div>}
                  {lists.length === 0 && !listsLoading && (
                    <div className="text-gray-500">No lists found</div>
                  )}
                  {lists.map((list: any) => (
                    <div key={list.id} className="p-3 border rounded mb-2">
                      <div className="font-medium">{list.name}</div>
                      <div className="text-sm text-gray-500">
                        {list.items?.length || 0} items
                      </div>
                      {list.items?.map((item: any) => (
                        <div key={item.id} className="ml-4 text-sm">
                          • {item.name} ({item.category})
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Debug Info */}
            <div className="space-y-2 text-sm">
              <h4 className="font-medium">Debug Info</h4>
              <div>User ID: {user?.id || 'Not set'}</div>
              <div>Lists count: {lists.length}</div>
              <div>Voice recording: {isRecording ? 'Active' : 'Inactive'}</div>
              <div>Voice processing: {isTranscribing ? 'Active' : 'Inactive'}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}