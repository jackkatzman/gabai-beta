import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { User, Reminder } from "@shared/schema";

interface NotificationServiceProps {
  user: User;
}

export function NotificationService({ user }: NotificationServiceProps) {
  const { toast } = useToast();
  const checkedReminders = useRef(new Set<string>());
  const notificationPermission = useRef<NotificationPermission>("default");

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        notificationPermission.current = permission;
      });
    }
  }, []);

  // Get user's reminders
  const { data: reminders = [] } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders", user.id],
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Check for due reminders
  useEffect(() => {
    const now = new Date();
    
    reminders.forEach((reminder) => {
      const dueDate = new Date(reminder.dueDate);
      const timeDiff = dueDate.getTime() - now.getTime();
      const reminderKey = `${reminder.id}-${dueDate.getTime()}`;
      
      // Check if reminder is due (within 1 minute) and not already checked
      if (timeDiff <= 60000 && timeDiff >= -60000 && !checkedReminders.current.has(reminderKey)) {
        checkedReminders.current.add(reminderKey);
        sendNotification(reminder);
      }
    });
  }, [reminders]);

  const sendNotification = (reminder: Reminder) => {
    const notificationMethod = user.preferences?.notificationMethod || "browser";
    
    switch (notificationMethod) {
      case "browser":
        sendBrowserNotification(reminder);
        break;
      case "toast":
        sendToastNotification(reminder);
        break;
      case "calendar":
        // Already handled via ICS export
        sendToastNotification(reminder, "Reminder: Check your calendar app");
        break;
      case "none":
        // No notification
        break;
      default:
        sendToastNotification(reminder);
    }
  };

  const sendBrowserNotification = (reminder: Reminder) => {
    if (notificationPermission.current === "granted") {
      const notification = new Notification(`Reminder: ${reminder.title}`, {
        body: reminder.description || "Time for your scheduled reminder",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: reminder.id,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    } else {
      // Fallback to toast if browser notifications not available
      sendToastNotification(reminder);
    }
  };

  const sendToastNotification = (reminder: Reminder, customMessage?: string) => {
    toast({
      title: "⏰ Reminder",
      description: customMessage || `${reminder.title}${reminder.description ? `: ${reminder.description}` : ""}`,
      duration: 8000,
    });
  };

  return null; // This is a service component, no UI
}