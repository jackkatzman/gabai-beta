import { useUser } from "@/context/user-context";
import { ChatInterface } from "@/components/chat/chat-interface";
import { SmartLists } from "@/components/lists/smart-lists";
import { RemindersPage } from "@/components/reminders/reminders-page";
import { CalendarPage } from "@/components/calendar/calendar-page";
import { ContactsPage } from "@/components/contacts/contacts-page";
import { NotificationService } from "@/components/notifications/notification-service";
import { OCRPage } from "@/pages/ocr";
import SettingsPage from "@/pages/settings";
import { NativeScheduler, QuickScheduleButtons } from "@/components/scheduling/native-scheduler";
import { ScheduledAlarms } from "@/components/scheduling/scheduled-alarms";

import { BottomNav } from "@/components/navigation/bottom-nav";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState } from "react";
import { Mic, User, Settings, Moon, Sun } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import gabaiLogo from "@assets/gabai_logo_1754292316913.png";

export default function HomePage() {
  const { user } = useUser();
  const [location, setLocation] = useLocation();
  
  // Simple theme state without context
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark") || "light";
    }
    return "light";
  });

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", newTheme);
      const root = document.documentElement;
      if (newTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-6">
          <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <img 
              src={gabaiLogo} 
              alt="GabAi" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to GabAi
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Please complete the setup to get started.
          </p>
        </div>
      </div>
    );
  }

  const getCurrentPageComponent = () => {
    switch (location) {
      case "/lists":
        return <SmartLists user={user} />;
      case "/calendar":
        return <CalendarPage user={user} />;
      case "/contacts":
        return <ContactsPage />;
      case "/reminders":
        return <RemindersPage user={user} />;
      case "/scheduler":
        return (
          <div className="p-4 space-y-6">
            <h1 className="text-2xl font-bold">Native Scheduler</h1>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <NativeScheduler onScheduled={(id) => console.log(`Alarm ${id} scheduled`)} />
                <div>
                  <h3 className="font-medium mb-2">Quick Timers</h3>
                  <QuickScheduleButtons onScheduled={(id) => console.log(`Timer ${id} set`)} />
                </div>
              </div>
              <ScheduledAlarms />
            </div>
          </div>
        );
      case "/settings":
        return <SettingsPage />;
      case "/ocr":
      case "/text-extractor":
        return <OCRPage />;

      default:
        return <ChatInterface user={user} />;
    }
  };

  const getPageTitle = () => {
    switch (location) {
      case "/lists":
        return "Smart Lists";
      case "/calendar":
        return "Calendar";
      case "/contacts":
        return "Contacts";
      case "/reminders":
        return "Reminders";
      case "/scheduler":
        return "Scheduler";
      case "/settings":
        return "Settings";
      case "/ocr":
      case "/text-extractor":
        return "Text Extractor";

      default:
        return "GabAi";
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Notification Service - runs in background */}
      <NotificationService user={user} />
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img 
            src={gabaiLogo} 
            alt="GabAi" 
            className="w-8 h-8 object-contain"
          />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {getPageTitle()}
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Settings Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/settings")}
            className="w-9 h-9 p-0"
          >
            <Settings className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </Button>
          
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-9 h-9 p-0"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            ) : (
              <Moon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            )}
          </Button>
          
          {/* User Avatar */}
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-gray-300 dark:bg-gray-600 text-xs">
              {user.name?.charAt(0)?.toUpperCase() || <User className="h-3 w-3" />}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {getCurrentPageComponent()}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
