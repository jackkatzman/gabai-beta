import { useUser } from "@/context/user-context";
import { ChatInterface } from "@/components/chat/chat-interface";
import { ShoppingLists } from "@/components/lists/shopping-lists";
import { RemindersPage } from "@/components/reminders/reminders-page";
import { CalendarPage } from "@/components/calendar/calendar-page";
import { SettingsPage } from "@/components/settings/settings-page";
import { OCRPage } from "@/pages/ocr";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useLocation } from "wouter";
import { Mic, Moon, Sun, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import gabaiLogo from "@assets/gabai_logo_1754292316913.png";

export default function HomePage() {
  const { user } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();

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
        return <ShoppingLists user={user} />;
      case "/calendar":
        return <CalendarPage user={user} />;
      case "/reminders":
        return <RemindersPage user={user} />;
      case "/settings":
        return <SettingsPage user={user} />;
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
        return "Shopping Lists";
      case "/calendar":
        return "Calendar";
      case "/reminders":
        return "Reminders";
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
