import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { MessageCircle, ShoppingCart, Calendar, Users, Bell, UserCircle } from "lucide-react";

const navItems = [
  { path: "/", icon: MessageCircle, label: "Chat" },
  { path: "/lists", icon: ShoppingCart, label: "Lists" },
  { path: "/reminders", icon: Bell, label: "Reminders" },
  { path: "/calendar", icon: Calendar, label: "Calendar" },
  { path: "/contacts", icon: UserCircle, label: "Contacts" },
  { path: "/groups", icon: Users, label: "Groups" },
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
    <nav className="bottom-nav-fixed bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-around max-w-md mx-auto px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              onTouchStart={(e) => {
                // Provide immediate visual feedback
                e.currentTarget.style.transform = 'scale(0.95)';
                e.currentTarget.style.opacity = '0.7';
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Reset visual state
                e.currentTarget.style.transform = '';
                e.currentTarget.style.opacity = '';
                // Immediate navigation with haptic feedback
                if (navigator.vibrate) {
                  navigator.vibrate(50);
                }
                handleNavigation(item.path, item.label);
              }}
              onTouchCancel={(e) => {
                // Reset visual state if touch is cancelled
                e.currentTarget.style.transform = '';
                e.currentTarget.style.opacity = '';
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNavigation(item.path, item.label);
              }}
              className={`nav-button-touch flex flex-col items-center space-y-1 py-3 px-3 rounded-lg transition-all duration-150 h-auto min-w-0 touch-manipulation select-none ${
                isActive 
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <Icon className="h-5 w-5 transition-transform duration-150" />
              <span className={`text-xs ${isActive ? 'font-medium' : 'font-normal'}`}>{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
