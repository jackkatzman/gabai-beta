import React, { createContext, useContext, useState, useEffect } from "react";
import type { User } from "@shared/schema";
import { getToken } from '@/lib/auth';

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if this is a mobile environment (enhanced detection)
  const isMobileEnvironment = () => {
    const userAgent = navigator.userAgent || '';
    const isAndroidWebView = userAgent.includes('wv') || userAgent.includes('Android');
    const isMobileDevice = /Android|iPhone|iPad|Mobile/.test(userAgent);
    const isCapacitorApp = window.location.protocol === 'file:' || 
                          window.location.hostname.includes('capacitor') ||
                          window.location.href.includes('capacitor://');
    const isVoltBuilderAPK = userAgent.includes('Chrome') && userAgent.includes('Mobile') && isAndroidWebView;
    
    console.log('🔍 Mobile environment check:', {
      userAgent: userAgent.substring(0, 100),
      isAndroidWebView,
      isMobileDevice,
      isCapacitorApp,
      isVoltBuilderAPK,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      href: window.location.href.substring(0, 100)
    });
    
    return isVoltBuilderAPK || isMobileDevice || isCapacitorApp;
  };

  // Fetch user authentication for both web and mobile
  const fetchUser = async () => {
    try {
      console.log("🔐 Fetching user authentication...");
      
      // Mobile environments use the same authentication as web
      if (isMobileEnvironment()) {
        console.log("📱 Mobile environment detected - using standard Google authentication");
      }
      
      // Regular authentication check for web environments
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log("✅ User authenticated:", userData);
        setUserState(userData);
      } else {
        console.log("❌ No authenticated user");
        setUserState(null);
      }
    } catch (error) {
      console.error("🔥 Authentication error:", error);
      setUserState(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("🔐 Initializing authentication...");
    
    // ChatGPT fix: Only fetch user if we have a token (prevent early 401s)
    const token = getToken();
    if (!token) {
      console.log("❌ No token found - skipping user fetch");
      setIsLoading(false);
      return;
    }
    
    fetchUser();
  }, []);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
  };

  return (
    <UserContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
