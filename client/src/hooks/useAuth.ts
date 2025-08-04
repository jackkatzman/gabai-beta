import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/auth/user"],
    retry: false,
    queryFn: async () => {
      const response = await fetch("/auth/user");
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
      // Redirect to Google OAuth
      window.location.href = "/auth/google";
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/auth/logout");
      if (!response.ok) {
        throw new Error("Logout failed");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/auth/user"], null);
      window.location.href = "/";
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}