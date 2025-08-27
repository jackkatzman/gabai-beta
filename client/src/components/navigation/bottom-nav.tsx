import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { MessageCircle, ShoppingCart, Calendar, Users, FileText, Bell } from "lucide-react";

const navItems = [
  { path: "/", icon: MessageCircle, label: "Chat" },
  { path: "/lists", icon: ShoppingCart, label: "Lists" },
  { path: "/calendar", icon: Calendar, label: "Calendar" },
  { path: "/alarms", icon: Bell, label: "Alarms" },
  { path: "/contacts", icon: Users, label: "Contacts" },
  { path: "/ocr", icon: FileText, label: "Scanner" },
];

export function BottomNav() {
  const [location, setLocation] = useLocation();

  const handleNavigation = (path: string, label: string) => {
    console.log(`🧭 Navigation triggered: ${label} -> ${path}`);
    console.log(`🧭 Current location: ${location}`);
    
    // Force immediate navigation
    try {
      setLocation(path);
      console.log(`✅ Navigation completed to: ${path}`);
    } catch (error) {
      console.error(`❌ Navigation failed:`, error);
    }
  };

  return (
    <nav className="bottom-nav-fixed bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto px-3 py-3 gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNavigation(item.path, item.label);
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNavigation(item.path, item.label);
              }}
              className={`nav-button-touch flex flex-col items-center space-y-1 py-3 px-3 rounded-xl transition-all duration-200 h-auto min-w-0 shadow-sm border ${
                isActive 
                  ? "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 shadow-md scale-105" 
                  : "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md hover:scale-102 active:scale-95"
              }`}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''} transition-transform duration-200`} />
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
