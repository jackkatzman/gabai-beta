import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, 
  Edit, 
  Volume2, 
  Bell, 
  Calendar, 
  History, 
  Download, 
  Trash2, 
  HelpCircle,
  Shield,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { api } from "@/lib/api";
import { useUser } from "@/context/user-context";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { User as UserType } from "@/types";

interface SettingsPageProps {
  user: UserType;
}

export function SettingsPage({ user }: SettingsPageProps) {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [voiceResponsesEnabled, setVoiceResponsesEnabled] = useState(true);
  const [smartNotificationsEnabled, setSmartNotificationsEnabled] = useState(true);
  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState(false);
  
  const { setUser } = useUser();
  const { logout, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateUserMutation = useMutation({
    mutationFn: (updates: Partial<UserType>) => api.updateUser(user.id, updates),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ["/api/users", user.id] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditProfileOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  const handleEditProfile = (updates: Partial<UserType>) => {
    updateUserMutation.mutate(updates);
  };

  const handleDeleteAllData = () => {
    // This would need to be implemented on the backend
    toast({
      title: "Feature Coming Soon",
      description: "Data deletion will be available in a future update.",
    });
  };

  const handleExportData = () => {
    // This would need to be implemented on the backend
    toast({
      title: "Feature Coming Soon",
      description: "Data export will be available in a future update.",
    });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Your Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white text-lg">
                  {user.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.profession && user.location 
                    ? `${user.profession} in ${user.location}`
                    : user.profession || user.location || "Personal Assistant User"
                  }
                </p>
                {user.age && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user.age} years old
                  </p>
                )}
              </div>
            </div>

            {/* User Preferences Display */}
            <div className="space-y-3 mb-4">
              {user.preferences?.religious && (
                <div>
                  <Label className="text-sm font-medium">Religious Beliefs</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user.preferences.religious}
                  </p>
                </div>
              )}
              
              {user.preferences?.dietary && user.preferences.dietary.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Dietary Preferences</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.preferences.dietary.map((diet) => (
                      <Badge key={diet} variant="secondary" className="text-xs">
                        {diet}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {user.preferences?.interests && user.preferences.interests.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Interests</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.preferences.interests.map((interest) => (
                      <Badge key={interest} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <EditProfileForm
                  user={user}
                  onSave={handleEditProfile}
                  isLoading={updateUserMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Volume2 className="h-4 w-4 text-gray-500" />
                <div>
                  <Label className="font-medium">Voice Responses</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Hear AI responses aloud
                  </p>
                </div>
              </div>
              <Switch
                checked={voiceResponsesEnabled}
                onCheckedChange={setVoiceResponsesEnabled}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-4 w-4 text-gray-500" />
                <div>
                  <Label className="font-medium">Smart Notifications</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Context-aware reminders
                  </p>
                </div>
              </div>
              <Switch
                checked={smartNotificationsEnabled}
                onCheckedChange={setSmartNotificationsEnabled}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <Label className="font-medium">Calendar Sync</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Integrate with your calendar
                  </p>
                </div>
              </div>
              <Switch
                checked={calendarSyncEnabled}
                onCheckedChange={setCalendarSyncEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Account</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Connected Account</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.email || "No email available"}
                </p>
              </div>
              <Badge variant="secondary">Google</Badge>
            </div>
            
            <Separator />
            
            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-3 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              onClick={() => logout()}
              disabled={isLoggingOut}
            >
              <div className="flex items-center space-x-3">
                {isLoggingOut ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Privacy & Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Privacy & Data</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto p-3"
              onClick={() => {
                toast({
                  title: "Feature Coming Soon",
                  description: "Conversation history management will be available soon.",
                });
              }}
            >
              <div className="flex items-center space-x-3">
                <History className="h-4 w-4" />
                <span>Conversation History</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-between h-auto p-3"
              onClick={handleExportData}
            >
              <div className="flex items-center space-x-3">
                <Download className="h-4 w-4" />
                <span>Data Export</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-3 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              onClick={handleDeleteAllData}
            >
              <Trash2 className="h-4 w-4 mr-3" />
              <span>Delete All Data</span>
            </Button>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Version</span>
              <span className="text-gray-500 dark:text-gray-400">1.0.0</span>
            </div>

            <Separator />

            <Button
              variant="ghost"
              className="w-full justify-between h-auto p-3"
              onClick={() => {
                toast({
                  title: "Feature Coming Soon",
                  description: "Help & Support will be available soon.",
                });
              }}
            >
              <div className="flex items-center space-x-3">
                <HelpCircle className="h-4 w-4" />
                <span>Help & Support</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-between h-auto p-3"
              onClick={() => {
                toast({
                  title: "Feature Coming Soon",
                  description: "Privacy Policy will be available soon.",
                });
              }}
            >
              <div className="flex items-center space-x-3">
                <ExternalLink className="h-4 w-4" />
                <span>Privacy Policy</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface EditProfileFormProps {
  user: UserType;
  onSave: (updates: Partial<UserType>) => void;
  isLoading: boolean;
}

function EditProfileForm({ user, onSave, isLoading }: EditProfileFormProps) {
  const [formData, setFormData] = useState({
    name: user.name || "",
    age: user.age || "",
    location: user.location || "",
    profession: user.profession || "",
    familyDetails: user.preferences?.familyDetails || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updates: Partial<UserType> = {
      name: formData.name.trim(),
      age: formData.age ? parseInt(formData.age.toString()) : undefined,
      location: formData.location.trim() || undefined,
      profession: formData.profession.trim() || undefined,
      preferences: {
        ...user.preferences,
        familyDetails: formData.familyDetails.trim() || undefined,
      },
    };

    onSave(updates);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Your name"
        />
      </div>

      <div>
        <Label htmlFor="age">Age</Label>
        <Input
          id="age"
          type="number"
          value={formData.age}
          onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
          placeholder="25"
        />
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          placeholder="City, Country"
        />
      </div>

      <div>
        <Label htmlFor="profession">Profession</Label>
        <Input
          id="profession"
          value={formData.profession}
          onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
          placeholder="Software Engineer"
        />
      </div>

      <div>
        <Label htmlFor="family">Family Details</Label>
        <Textarea
          id="family"
          value={formData.familyDetails}
          onChange={(e) => setFormData(prev => ({ ...prev, familyDetails: e.target.value }))}
          placeholder="Family information..."
          rows={3}
        />
      </div>

      <Button type="submit" disabled={isLoading || !formData.name.trim()} className="w-full">
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
