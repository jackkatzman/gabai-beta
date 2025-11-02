import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { api, getToken, setToken } from '@/lib/auth';

export function useAuth() {
  const queryClient = useQueryClient();

  // Check if token exists in localStorage (reactive to changes)
  const hasToken = Boolean(getToken());

  // ChatGPT fix: Only call /api/auth/user if we have a token
  const { data: user, isLoading, refetch, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: hasToken,
    queryFn: async () => {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token');
      }
      
      try {
        const userData = await api('/api/auth/user');
        return userData;
      } catch (authError: any) {
        // If token is invalid or expired, clear it and force re-authentication
        if (authError.status === 401) {
          console.log('🔓 Token invalid/expired, clearing and requiring SMS auth');
          setToken(null);
          // Clear all possible token storage locations
          localStorage.removeItem('gabai_token');
          localStorage.removeItem('token');
          localStorage.removeItem('authToken');
          sessionStorage.removeItem('gabai_token');
          sessionStorage.removeItem('token');
        }
        throw authError;
      }
    }
  });

  // AuthReady state: true when auth resolution is complete
  // - If no token: authReady = true (user is definitely not authenticated)
  // - If token exists: authReady = true only when query has resolved (success or error)
  const authReady = React.useMemo(() => {
    if (!hasToken) {
      // No token = definitely not authenticated = ready to show public routes
      console.log('🔓 AuthReady: true (no token, show public routes)');
      return true;
    }
    
    // Token exists: wait for query to resolve (not just loading state)
    const isQueryResolved = !isLoading && (user !== undefined || error !== null);
    console.log('🔐 AuthReady check:', { hasToken, isLoading, hasUser: !!user, hasError: !!error, isQueryResolved });
    
    if (isQueryResolved) {
      console.log('✅ AuthReady: true (query resolved, safe to show protected routes)');
    } else {
      console.log('⏳ AuthReady: false (query still resolving, blocking protected routes)');
    }
    
    return isQueryResolved;
  }, [hasToken, isLoading, user, error]);

  // Google login mutation
  const loginWithGoogle = useMutation({
    mutationFn: async () => {
      window.location.href = "https://gabai.ai/api/auth/google";
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  // Simple logout function
  const logout = useMutation({
    mutationFn: async () => {
      setToken(null);
      // Clear any cached user data
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  return {
    user,
    isLoading,
    error,
    authReady,
    loginWithGoogle,
    logout,
    refetch
  };
}