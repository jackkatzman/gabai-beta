import { NotificationSettings } from "@/components/settings/notification-settings";
import { TestNotification } from "@/components/notifications/test-notification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Settings as SettingsIcon, User, Bell, Camera, Edit } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const [editAge, setEditAge] = useState(user?.age?.toString() || "");
  const [editLocation, setEditLocation] = useState(user?.location || "");
  const [editProfession, setEditProfession] = useState(user?.profession || "");
  const [editInterests, setEditInterests] = useState(user?.interests?.join(", ") || "");
  const [editDietaryRestrictions, setEditDietaryRestrictions] = useState(user?.dietary?.join(", ") || "");
  const [editFamilyDetails, setEditFamilyDetails] = useState(user?.familyDetails || "");
  const [editCommunicationStyle, setEditCommunicationStyle] = useState(user?.communicationStyle || "");
  const [isSaving, setIsSaving] = useState(false);

  // Mutation for updating user profile
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest(`/api/users/${user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditingProfile(false);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSaveProfile = async () => {
    if (!user) return;
    
    console.log('💾 Attempting to save profile for user:', user.id);
    setIsSaving(true);
    try {
      const updates: any = {
        name: editName.trim() || undefined,
        email: editEmail.trim() || undefined,
        age: editAge ? parseInt(editAge) : undefined,
        location: editLocation.trim() || undefined,
        profession: editProfession.trim() || undefined,
        interests: editInterests ? editInterests.split(',').map(i => i.trim()).filter(Boolean) : [],
        dietary: editDietaryRestrictions ? editDietaryRestrictions.split(',').map(d => d.trim()).filter(Boolean) : [],
        familyDetails: editFamilyDetails.trim() || undefined,
        communicationStyle: editCommunicationStyle || undefined,
      };

      // Remove undefined values
      Object.keys(updates).forEach(key => {
        if (updates[key] === undefined) {
          delete updates[key];
        }
      });

      await updateProfileMutation.mutateAsync(updates);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Please sign in to access settings.</p>
          <Link href="/login">
            <Button className="mt-4">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chat
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <SettingsIcon className="h-6 w-6" />
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Customize your GabAi experience
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* User Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditingProfile ? "Cancel" : "Edit"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditingProfile ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full p-0"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              toast({
                                title: "Profile picture feature",
                                description: "Profile picture upload is coming soon! This will let you set your avatar.",
                              });
                            }
                          };
                          input.click();
                        }}
                      >
                        <Camera className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Click camera icon to upload profile picture
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="edit-name">Name</Label>
                      <Input 
                        id="edit-name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-email">Email</Label>
                      <Input 
                        id="edit-email"
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="your.email@example.com"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="edit-age">Age</Label>
                        <Input 
                          id="edit-age"
                          type="number"
                          value={editAge}
                          onChange={(e) => setEditAge(e.target.value)}
                          placeholder="Your age"
                          min="13"
                          max="120"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-location">Location</Label>
                        <Input 
                          id="edit-location"
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                          placeholder="City, Country"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-profession">Profession</Label>
                      <Input 
                        id="edit-profession"
                        value={editProfession}
                        onChange={(e) => setEditProfession(e.target.value)}
                        placeholder="Your job title or profession"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Help GabAi create profession-specific lists and provide relevant suggestions
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-interests">Interests & Hobbies</Label>
                      <Textarea 
                        id="edit-interests"
                        value={editInterests}
                        onChange={(e) => setEditInterests(e.target.value)}
                        placeholder="Cooking, travel, technology, sports, music, etc. (separate with commas)"
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-dietary">Dietary Restrictions</Label>
                      <Textarea 
                        id="edit-dietary"
                        value={editDietaryRestrictions}
                        onChange={(e) => setEditDietaryRestrictions(e.target.value)}
                        placeholder="Vegetarian, gluten-free, dairy-free, etc. (separate with commas)"
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-communication">Communication Style</Label>
                      <Select value={editCommunicationStyle} onValueChange={setEditCommunicationStyle}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your preferred style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="casual">Casual & Friendly</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="concise">Brief & Concise</SelectItem>
                          <SelectItem value="detailed">Detailed & Thorough</SelectItem>
                          <SelectItem value="encouraging">Encouraging & Supportive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-family">Family Details (Optional)</Label>
                      <Textarea 
                        id="edit-family"
                        value={editFamilyDetails}
                        onChange={(e) => setEditFamilyDetails(e.target.value)}
                        placeholder="Family members, relationships, pets, etc."
                        rows={2}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This helps GabAi personalize suggestions and reminders
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={handleSaveProfile} 
                      disabled={isSaving || updateProfileMutation.isPending}
                      className="flex-1"
                    >
                      {isSaving || updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user.email || "No email set"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {user.age && (
                      <div>
                        <Label className="text-xs text-gray-500">Age</Label>
                        <p className="text-sm">{user.age}</p>
                      </div>
                    )}
                    {user.location && (
                      <div>
                        <Label className="text-xs text-gray-500">Location</Label>
                        <p className="text-sm">{user.location}</p>
                      </div>
                    )}
                    {user.profession && (
                      <div className="md:col-span-2">
                        <Label className="text-xs text-gray-500">Profession</Label>
                        <p className="text-sm">{user.profession}</p>
                      </div>
                    )}
                    {user.interests && user.interests.length > 0 && (
                      <div className="md:col-span-2">
                        <Label className="text-xs text-gray-500">Interests</Label>
                        <p className="text-sm">{user.interests.join(", ")}</p>
                      </div>
                    )}
                    {user.dietary && user.dietary.length > 0 && (
                      <div className="md:col-span-2">
                        <Label className="text-xs text-gray-500">Dietary Restrictions</Label>
                        <p className="text-sm">{user.dietary.join(", ")}</p>
                      </div>
                    )}
                    {user.communicationStyle && (
                      <div>
                        <Label className="text-xs text-gray-500">Communication Style</Label>
                        <p className="text-sm">{user.communicationStyle}</p>
                      </div>
                    )}
                    {user.familyDetails && (
                      <div className="md:col-span-2">
                        <Label className="text-xs text-gray-500">Family Details</Label>
                        <p className="text-sm">{user.familyDetails}</p>
                      </div>
                    )}
                  </div>
                  
                  {(!user.profession && !user.interests?.length && !user.dietary?.length) && (
                    <div className="text-center py-4 text-sm text-gray-500">
                      <p>Click "Edit" to add your profession and interests.</p>
                      <p>This helps GabAi provide more personalized suggestions!</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <NotificationSettings user={user} />

          {/* Test Notifications */}
          <TestNotification user={user} />

          {/* Additional Settings Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>More Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Additional settings and preferences will be available here in future updates.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <div className="h-20" /> {/* Spacer for bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
    </div>
  );
}