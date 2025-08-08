import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { MessageCircle, ShoppingCart, Calendar, Users, FileText } from "lucide-react";

const navItems = [
  { path: "/", icon: MessageCircle, label: "Chat" },
  { path: "/lists", icon: ShoppingCart, label: "Lists" },
  { path: "/calendar", icon: Calendar, label: "Calendar" },
  { path: "/contacts", icon: Users, label: "Contacts" },
  { path: "/ocr", icon: FileText, label: "Text Scanner" },
];

export function BottomNav() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              onClick={() => {
                console.log("BottomNav - Clicking", item.path);
                setLocation(item.path);
              }}
              className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors h-auto ${
                isActive 
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20" 
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
