import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Bell, TestTube } from "lucide-react";
import type { User } from "@shared/schema";

interface TestNotificationProps {
  user: User;
}

export function TestNotification({ user }: TestNotificationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testTime, setTestTime] = useState(() => {
    // Default to 1 minute from now
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    return now.toISOString().slice(0, 16);
  });

  const createTestReminderMutation = useMutation({
    mutationFn: (reminderData: any) => api.createReminder(reminderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/reminders/${user.id}`] });
      toast({
        title: "Test Reminder Created",
        description: "Browser notification will appear when due!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create test reminder",
        variant: "destructive",
      });
    },
  });

  const handleCreateTestReminder = () => {
    createTestReminderMutation.mutate({
      userId: user.id,
      title: "🔔 Test Browser Notification",
      description: "This is a test to verify your notification preferences are working correctly.",
      dueDate: new Date(testTime),
      category: "test",
    });
  };

  const handleTestImmediateNotification = () => {
    // Test browser notification permission and functionality
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("🔔 GabAi Test Notification", {
          body: "Your browser notifications are working perfectly!",
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: "test-notification",
        });
        toast({
          title: "Test Sent",
          description: "Check for the browser notification popup!",
        });
      } else if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("🔔 GabAi Test Notification", {
              body: "Permission granted! Your browser notifications are now working.",
              icon: "/favicon.ico",
            });
          } else {
            toast({
              title: "Permission Denied",
              description: "Please enable notifications in your browser settings.",
              variant: "destructive",
            });
          }
        });
      } else {
        toast({
          title: "Notifications Blocked",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Not Supported",
        description: "Browser notifications are not supported.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Test Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div>
            <Button onClick={handleTestImmediateNotification} className="w-full">
              <Bell className="h-4 w-4 mr-2" />
              Test Browser Notification Now
            </Button>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Click to test if browser notifications are working immediately.
            </p>
          </div>

          <div className="border-t pt-4">
            <Label htmlFor="test-time">Schedule Test Reminder</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Create a reminder that will trigger a notification at the specified time.
            </p>
            <div className="flex gap-2">
              <Input
                id="test-time"
                type="datetime-local"
                value={testTime}
                onChange={(e) => setTestTime(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleCreateTestReminder}
                disabled={createTestReminderMutation.isPending}
              >
                {createTestReminderMutation.isPending ? "Creating..." : "Create Test"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}