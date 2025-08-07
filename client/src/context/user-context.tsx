import React, { createContext, useContext, useState, useEffect } from "react";
import type { User } from "@shared/schema";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  // Simplified approach - avoid useAuth hook that needs QueryClient
  const [user, setUserState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    fetch('/api/auth/user')
      .then(res => res.ok ? res.json() : null)
      .then(userData => {
        setUserState(userData);
        setIsLoading(false);
      })
      .catch(() => {
        setUserState(null);
        setIsLoading(false);
      });
  }, []);

  const setUser = () => {
    console.warn("setUser is deprecated with OAuth - use login/logout instead");
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
