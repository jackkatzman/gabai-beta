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
import React, { useState } from "react";
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
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editProfession, setEditProfession] = useState("");
  const [editInterests, setEditInterests] = useState("");
  const [editDietaryRestrictions, setEditDietaryRestrictions] = useState("");
  const [editFamilyDetails, setEditFamilyDetails] = useState("");
  const [editCommunicationStyle, setEditCommunicationStyle] = useState("");
  
  // Update states when user data loads
  React.useEffect(() => {
    if (user) {
      setEditName(user.name || "");
      setEditEmail(user.email || "");
      setEditAge(user.age?.toString() || "");
      setEditLocation(user.location || "");
      setEditProfession(user.profession || "");
      setEditInterests(user.preferences?.interests?.join(", ") || "");
      setEditDietaryRestrictions(user.preferences?.dietary?.join(", ") || "");
      setEditFamilyDetails(user.preferences?.familyDetails || "");
      setEditCommunicationStyle(user.preferences?.communicationStyle || "");
    }
  }, [user]);
  const [isSaving, setIsSaving] = useState(false);

  // Mutation for updating user profile
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest(`/api/users/${user?.id}`, 'PATCH', updates);
      return response.json();
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
        preferences: {
          ...user?.preferences,
          interests: editInterests ? editInterests.split(',').map((i: string) => i.trim()).filter(Boolean) : [],
          dietary: editDietaryRestrictions ? editDietaryRestrictions.split(',').map((d: string) => d.trim()).filter(Boolean) : [],
          familyDetails: editFamilyDetails.trim() || undefined,
          communicationStyle: editCommunicationStyle || undefined,
        },
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
                    {user.preferences?.interests && user.preferences.interests.length > 0 && (
                      <div className="md:col-span-2">
                        <Label className="text-xs text-gray-500">Interests</Label>
                        <p className="text-sm">{user.preferences.interests.join(", ")}</p>
                      </div>
                    )}
                    {user.preferences?.dietary && user.preferences.dietary.length > 0 && (
                      <div className="md:col-span-2">
                        <Label className="text-xs text-gray-500">Dietary Restrictions</Label>
                        <p className="text-sm">{user.preferences.dietary.join(", ")}</p>
                      </div>
                    )}
                    {user.preferences?.communicationStyle && (
                      <div>
                        <Label className="text-xs text-gray-500">Communication Style</Label>
                        <p className="text-sm">{user.preferences.communicationStyle}</p>
                      </div>
                    )}
                    {user.preferences?.familyDetails && (
                      <div className="md:col-span-2">
                        <Label className="text-xs text-gray-500">Family Details</Label>
                        <p className="text-sm">{user.preferences.familyDetails}</p>
                      </div>
                    )}
                  </div>
                  
                  {(!user.profession && !user.preferences?.interests?.length && !user.preferences?.dietary?.length) && (
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

          {/* SMS/Voice Reminder Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                SMS & Voice Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="sms-consent-toggle" className="text-base font-medium">
                      Enable SMS & Voice Reminders
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.phone ? `Send reminders to ${user.phone}` : "Set up your phone number to receive SMS and voice call reminders"}
                    </p>
                    {user.preferences?.smsConsent && user.preferences?.smsConsentDate && (
                      <p className="text-xs text-gray-500">
                        Consent provided on {new Date(user.preferences.smsConsentDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Switch
                    id="sms-consent-toggle"
                    checked={user.preferences?.smsConsent || false}
                    disabled={!user.phone}
                    onCheckedChange={async (checked) => {
                      if (checked && !user.phone) {
                        toast({
                          title: "Phone number required",
                          description: "Please set up your phone number in SMS Reminders page first",
                        });
                        return;
                      }
                      
                      try {
                        await updateProfileMutation.mutateAsync({
                          preferences: {
                            ...user.preferences,
                            smsConsent: checked,
                            smsConsentDate: checked ? new Date().toISOString() : undefined,
                            smsConsentPhone: checked ? user.phone : undefined
                          }
                        });
                        
                        toast({
                          title: checked ? "SMS reminders enabled" : "SMS reminders disabled",
                          description: checked 
                            ? "You'll now receive SMS and voice call reminders" 
                            : "SMS and voice reminders have been turned off",
                        });
                      } catch (error) {
                        toast({
                          title: "Failed to update consent",
                          description: "Please try again",
                          variant: "destructive"
                        });
                      }
                    }}
                  />
                </div>
                
                {!user.phone && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      To enable SMS and voice reminders, you need to verify your phone number first.
                    </p>
                    <Link href="/sms-reminders">
                      <Button size="sm" variant="link" className="p-0 h-auto mt-1">
                        Set up phone number →
                      </Button>
                    </Link>
                  </div>
                )}
                
                {user.phone && !user.preferences?.smsConsent && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Enable SMS reminders to receive text messages and voice calls for your important reminders.
                    </p>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 space-y-1">
                  <p>By enabling SMS reminders, you consent to receive automated text messages and voice calls.</p>
                  <p>Message and data rates may apply. Reply STOP to opt out at any time.</p>
                </div>
              </div>
            </CardContent>
          </Card>

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