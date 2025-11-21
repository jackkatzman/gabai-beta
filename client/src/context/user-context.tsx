import React, { createContext, useContext, useState, useEffect } from "react";
import type { User } from "@shared/schema";
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api-bulletproof';

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authTrigger, setAuthTrigger] = useState(0); // Force refetch when auth changes

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
      
      // Check for mobile token first
      const token = getToken();
      if (token) {
        console.log("🔑 Found mobile token, will use for authentication");
      }
      
      // Mobile environments use the same authentication as web
      if (isMobileEnvironment()) {
        console.log("📱 Mobile environment detected - using standard Google authentication");
      }
      
      // Use bulletproof API to handle both web (session) and APK (token) auth
      const userData = await api('/api/auth/user');
      
      if (userData) {
        console.log("✅ User authenticated:", userData);
        setUserState(userData);
      } else {
        console.log("❌ No authenticated user");
        setUserState(null);
      }
    } catch (error) {
      // Log all errors for debugging - the api function already handles expected 401s by returning null
      console.error("🔥 Authentication error:", {
        message: (error as Error).message,
        error: error,
        stack: (error as Error).stack
      });
      setUserState(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("🔐 Initializing authentication...");
    
    // Always try to fetch user - could be logged in via session cookie OR token
    fetchUser();
  }, [authTrigger]); // Re-fetch when authTrigger changes
  
  // Listen for storage events (when token is set from another component)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'gabai_token' && e.newValue) {
        console.log('🔑 Token changed - refetching user');
        setAuthTrigger(prev => prev + 1); // Trigger re-fetch
      }
    };
    
    // Listen for custom auth token event (from OAuth completion)
    const handleAuthToken = (e: Event) => {
      console.log('🔔 Received gabai-auth-token event - refetching user immediately');
      setAuthTrigger(prev => prev + 1); // Trigger re-fetch
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('gabai-auth-token', handleAuthToken);
    
    // Also check periodically if we don't have a user but have a token
    const interval = setInterval(() => {
      const token = getToken();
      if (token && !user && !isLoading) {
        console.log('🔄 Found token without user - refetching');
        setIsLoading(true);
        fetchUser();
      }
    }, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('gabai-auth-token', handleAuthToken);
      clearInterval(interval);
    };
  }, [user, isLoading]);

  const setUser = (newUser: User | null) => {
    console.log('👤 Setting user:', newUser?.id || 'null');
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
