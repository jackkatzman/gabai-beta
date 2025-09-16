import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bell, Volume2, Calendar, Monitor, MessageSquare, BellOff } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface NotificationSettingsProps {
  user: User;
}

const notificationMethods = [
  {
    value: "browser",
    label: "Browser Notifications",
    description: "Get desktop notifications with sound",
    icon: Monitor,
    badge: "Recommended"
  },
  {
    value: "toast",
    label: "In-App Messages",
    description: "Show notification messages within the app",
    icon: MessageSquare,
    badge: null
  },
  {
    value: "calendar",
    label: "Calendar Only",
    description: "Rely on your device's calendar app for notifications",
    icon: Calendar,
    badge: "Syncs to Device"
  },
  {
    value: "none",
    label: "No Notifications",
    description: "Disable all reminder notifications",
    icon: BellOff,
    badge: null
  }
];

export function NotificationSettings({ user }: NotificationSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasPermission, setHasPermission] = useState<boolean>(
    "Notification" in window && Notification.permission === "granted"
  );

  const [settings, setSettings] = useState({
    notificationMethod: user.preferences?.notificationMethod || "browser",
    notificationSound: user.preferences?.notificationSound ?? true,
    notificationAdvance: user.preferences?.notificationAdvance || 5,
  });

  const updateUserMutation = useMutation({
    mutationFn: (preferences: any) => 
      api.updateUser(user.id, { 
        preferences: { ...user.preferences, ...preferences } 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    updateUserMutation.mutate(settings);
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setHasPermission(permission === "granted");
      
      if (permission === "granted") {
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive browser notifications for reminders.",
        });
      } else {
        toast({
          title: "Notifications Denied",
          description: "Please enable notifications in your browser settings to use this feature.",
          variant: "destructive",
        });
      }
    }
  };

  const testNotification = () => {
    if (settings.notificationMethod === "browser" && hasPermission) {
      new Notification("Test Reminder", {
        body: "This is how your reminders will appear!",
        icon: "/favicon.ico",
      });
    } else if (settings.notificationMethod === "toast") {
      toast({
        title: "⏰ Test Reminder",
        description: "This is how your reminders will appear!",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Method Selection */}
        <div className="space-y-4">
          <Label className="text-base font-medium">How would you like to receive reminder notifications?</Label>
          <div className="grid gap-3">
            {notificationMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = settings.notificationMethod === method.value;
              
              return (
                <div
                  key={method.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950" 
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                  }`}
                  onClick={() => setSettings(prev => ({ ...prev, notificationMethod: method.value as any }))}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? "text-blue-600" : "text-gray-500"}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isSelected ? "text-blue-900 dark:text-blue-100" : ""}`}>
                          {method.label}
                        </span>
                        {method.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {method.badge}
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-600 dark:text-gray-400"}`}>
                        {method.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Browser Permission Check */}
        {settings.notificationMethod === "browser" && !hasPermission && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-800 dark:text-yellow-200">Permission Required</span>
            </div>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-3">
              Browser notifications need permission to work. Click below to enable them.
            </p>
            <Button size="sm" onClick={requestNotificationPermission}>
              Enable Browser Notifications
            </Button>
          </div>
        )}

        {/* Additional Settings */}
        {settings.notificationMethod !== "none" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sound-toggle" className="text-base font-medium">
                  Notification Sound
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Play a sound when reminders are due
                </p>
              </div>
              <Switch
                id="sound-toggle"
                checked={settings.notificationSound}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, notificationSound: checked }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="advance-time" className="text-base font-medium">
                Advance Notice
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                How many minutes before the due time should we notify you?
              </p>
              <div className="flex items-center gap-2 max-w-xs">
                <Input
                  id="advance-time"
                  type="number"
                  min="0"
                  max="60"
                  value={settings.notificationAdvance}
                  onChange={(e) => 
                    setSettings(prev => ({ 
                      ...prev, 
                      notificationAdvance: parseInt(e.target.value) || 0 
                    }))
                  }
                />
                <span className="text-sm text-gray-500">minutes</span>
              </div>
            </div>
          </div>
        )}

        {/* Test & Save */}
        <div className="flex gap-3 pt-4">
          <Button onClick={handleSaveSettings} disabled={updateUserMutation.isPending}>
            {updateUserMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
          
          {settings.notificationMethod !== "none" && settings.notificationMethod !== "calendar" && (
            <Button variant="outline" onClick={testNotification}>
              Test Notification
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}