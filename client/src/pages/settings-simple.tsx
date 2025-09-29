import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Settings as SettingsIcon, User, Bell, Phone } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { BottomNav } from "@/components/navigation/bottom-nav";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notificationMethod, setNotificationMethod] = useState("browser");
  const [smsEnabled, setSmsEnabled] = useState(false);
  
  // Update states when user data loads
  React.useEffect(() => {
    if (user) {
      setEditName(user.name || "");
      setEditEmail(user.email || "");
      setNotificationMethod(user.preferences?.notificationMethod || "browser");
      setSmsEnabled(user.preferences?.smsConsent || false);
    }
  }, [user]);

  // Mutation for updating user profile
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest(`/api/users/${user?.id}`, 'PATCH', updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated.",
      });
      setIsEditingProfile(false);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const updates: any = {
        name: editName.trim() || undefined,
        email: editEmail.trim() || undefined,
        preferences: {
          ...user?.preferences,
          notificationMethod,
          smsConsent: smsEnabled,
          smsConsentDate: smsEnabled ? new Date().toISOString() : undefined,
        },
      };

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
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>

        <div className="space-y-4">
          {/* Profile Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notifications Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notification-method">How to notify you</Label>
                <Select value={notificationMethod} onValueChange={setNotificationMethod}>
                  <SelectTrigger id="notification-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="browser">Browser Notifications</SelectItem>
                    <SelectItem value="toast">In-App Only</SelectItem>
                    <SelectItem value="none">No Notifications</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {notificationMethod === "browser" && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Browser notifications will appear on your device when reminders are due.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SMS Reminders Card */}
          {user.phone && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="h-5 w-5" />
                  SMS Reminders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable SMS</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive text messages for important reminders
                    </p>
                  </div>
                  <Switch
                    checked={smsEnabled}
                    onCheckedChange={setSmsEnabled}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* About Section */}
          <Card>
            <CardContent className="py-6">
              <div className="text-center space-y-2">
                <h3 className="font-semibold">GabAi Assistant</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your AI-powered personal assistant
                </p>
                <div className="flex justify-center gap-4 mt-4">
                  <Link href="/about">
                    <Button variant="link" size="sm">About</Button>
                  </Link>
                  <Link href="/privacy">
                    <Button variant="link" size="sm">Privacy</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button 
            onClick={handleSaveProfile}
            disabled={isSaving || updateProfileMutation.isPending}
            className="w-full"
            size="lg"
          >
            {isSaving || updateProfileMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <div className="h-20" />
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
    </div>
  );
}