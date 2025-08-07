import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    queryFn: async () => {
      const response = await fetch("/api/auth/user");
      if (!response.ok) {
        if (response.status === 401) {
          return null; // Not authenticated
        }
        throw new Error("Failed to fetch user");
      }
      return response.json() as Promise<User>;
    },
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      // Add detailed logging to trace redirect issue
      console.log('🔍 Login mutation starting...');
      console.log('🔍 Current location:', window.location.href);
      console.log('🔍 About to redirect to:', "/api/auth/google");
      
      // Try using absolute URL to bypass any potential routing issues
      const fullUrl = `${window.location.origin}/api/auth/google`;
      console.log('🔍 Full OAuth URL:', fullUrl);
      
      // Redirect to Google OAuth endpoint
      window.location.href = fullUrl;
    },
  });

  // Development fallback login
  const devLoginMutation = useMutation({
    mutationFn: async (credentials: { name: string; email: string }) => {
      const response = await fetch("/api/simple-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        throw new Error("Login failed");
      }
      return response.json();
    },
    onSuccess: () => {
      // Refresh user data after successful login
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST"
      });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      window.location.href = "/";
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    devLogin: devLoginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isDevLoggingIn: devLoginMutation.isPending,
  };
}