import { useUser } from "@/context/user-context";
import { ChatInterface } from "@/components/chat/chat-interface";
import { SmartLists } from "@/components/lists/smart-lists";
import { RemindersPage } from "@/components/reminders/reminders-page";
import { CalendarPage } from "@/components/calendar/calendar-page";
import { ContactsPage } from "@/components/contacts/contacts-page";
import { NotificationService } from "@/components/notifications/notification-service";
import { OCRPage } from "@/pages/ocr";
import SettingsPage from "@/pages/settings";
import { NativeScheduler } from "@/components/scheduling/native-scheduler";
import { ScheduledAlarms } from "@/components/scheduling/scheduled-alarms";

import { BottomNav } from "@/components/navigation/bottom-nav";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Mic, User, Settings, Moon, Sun } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCapacitorDetection } from "@/hooks/use-capacitor-detection";
const gabaiLogo = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMzQjgyRjYiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4IiB5PSI4Ij4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMSA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDMgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+Cjwvc3ZnPgo=";

export default function HomePage() {
  const { user } = useUser();
  const [location, setLocation] = useLocation();
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Enable Capacitor-specific mobile fixes
  useCapacitorDetection();
  
  // Add debugging and timeout detection
  useEffect(() => {
    console.log("🏠 HomePage mount", { 
      hasUser: !!user, 
      userId: user?.id,
      userName: user?.name,
      location,
      timestamp: new Date().toISOString() 
    });
    
    // Timeout detection - if no user after 8 seconds, something's wrong
    const timeout = setTimeout(() => {
      if (!user) {
        console.error("❌ HomePage: User still not loaded after 8s");
        setLoadError("Authentication timeout - please refresh the page");
      }
    }, 8000);
    
    return () => clearTimeout(timeout);
  }, [user, location]);
  
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            {loadError || "Loading..."}
          </p>
          {loadError && (
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          )}
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
          <div className="h-full flex flex-col overflow-y-auto">
            <div className="flex-1 p-4 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <NativeScheduler onScheduled={(id) => console.log(`Alarm ${id} scheduled`)} />
                </div>
                <ScheduledAlarms />
              </div>
            </div>
          </div>
        );
      case "/settings":
        return <SettingsPage />;
      case "/ocr":
      case "/text-extractor":
        return <OCRPage />;

      default:
        return <ChatInterface />;
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
        return "AI Voice Alarms";
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
    <div className="app-container bg-gray-50 dark:bg-gray-900">
      {/* Notification Service - runs in background */}
      <NotificationService user={user} />
      
      {/* Fixed Header - Always visible */}
      <header className="mobile-header bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <img 
            src={gabaiLogo} 
            alt="GabAi" 
            className="w-8 h-8 object-contain"
          />
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

      {/* Main Content - Account for mobile keyboard */}
      <main className="mobile-main-content">
        {getCurrentPageComponent()}
        
        {/* Copyright Notice */}
        <footer className="text-center py-4 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          © 2025 GabAi — Owned and operated by Booah LLC
        </footer>
        
        {/* Fixed Bottom Navigation - Mobile positioned */}
        <div className="mobile-bottom-nav">
          <BottomNav />
        </div>
      </main>
    </div>
  );
}
