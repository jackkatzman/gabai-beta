import { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@shared/schema";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(() => {
    return localStorage.getItem("gabai_user_id");
  });

  // Load user data if we have a stored user ID
  const { isLoading } = useQuery({
    queryKey: ["/api/users", userId],
    enabled: !!userId,
    retry: false,
    queryFn: async () => {
      if (!userId) return null;
      const userData = await api.getUser(userId);
      setUser(userData);
      return userData;
    },
  });

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem("gabai_user_id", user.id);
      setUserId(user.id);
    }
  }, [user?.id]);

  const updateUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser?.id) {
      localStorage.setItem("gabai_user_id", newUser.id);
      setUserId(newUser.id);
    } else {
      localStorage.removeItem("gabai_user_id");
      setUserId(null);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser: updateUser, isLoading }}>
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
