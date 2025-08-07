import { createContext, useContext } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  // Temporarily provide null user until QueryClient is properly set up
  const user = null;
  const isLoading = false;

  // setUser is now handled by the auth system, but we provide a compatible interface
  const setUser = () => {
    // Auth mutations handle user state changes
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
