import React from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { api, getToken, setToken } from '@/lib/auth';
import { clearAllAuthData } from '@/lib/secure-storage';

interface AuthContextValue {
  user: User | undefined;
  isLoading: boolean;
  error: Error | null;
  authReady: boolean;
  loginWithGoogle: {
    mutate: () => void;
    isLoading: boolean;
  };
  logout: {
    mutate: () => void;
    isLoading: boolean;
  };
  refetch: () => void;
  recheckToken: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

// Global unauthorized handler that can be called from anywhere (including api())
let globalHandleUnauthorized: (() => Promise<void>) | null = null;

export function getGlobalUnauthorizedHandler() {
  return globalHandleUnauthorized;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [tokenChecked, setTokenChecked] = React.useState(false);
  const [hasToken, setHasToken] = React.useState(false);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  // Centralized unauthorized handler - clears all auth state
  const handleUnauthorized = React.useCallback(async () => {
    console.log('🔓 Handling unauthorized - clearing all auth state');
    await clearAllAuthData();
    setHasToken(false);
    queryClient.setQueryData(["/api/auth/user"], undefined);
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  }, [queryClient]);

  // Register global handler so api() can call it
  React.useEffect(() => {
    globalHandleUnauthorized = handleUnauthorized;
    return () => {
      globalHandleUnauthorized = null;
    };
  }, [handleUnauthorized]);

  // Expose a function to trigger token re-check (called after login/logout)
  const recheckToken = React.useCallback(() => {
    console.log('🔄 Triggering token re-check...');
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Check if token exists (async for native storage compatibility)
  // Re-runs whenever refreshTrigger changes (after login/logout)
  React.useEffect(() => {
    async function checkToken() {
      const token = await getToken();
      setHasToken(Boolean(token));
      setTokenChecked(true);
      console.log('🔐 Token check complete:', token ? 'has token' : 'no token');
    }
    checkToken();
  }, [refreshTrigger]);

  // ChatGPT fix: Only call /api/auth/user if we have a token AND token check is complete
  const { data: user, isLoading, refetch, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: tokenChecked && hasToken,
    queryFn: async () => {
      const token = await getToken();
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
          await clearAllAuthData();
          setHasToken(false);
          // CRITICAL: Clear cached user data to prevent stale auth state
          queryClient.setQueryData(["/api/auth/user"], undefined);
        }
        throw authError;
      }
    }
  });

  // AuthReady state: true when auth resolution is complete
  // - If no token: authReady = true (user is definitely not authenticated)
  // - If token exists: authReady = true only when query has resolved (success or error)
  const authReady = React.useMemo(() => {
    // Wait for token check to complete first
    if (!tokenChecked) {
      console.log('⏳ AuthReady: false (waiting for token check)');
      return false;
    }
    
    if (!hasToken) {
      // No token = definitely not authenticated = ready to show public routes
      console.log('🔓 AuthReady: true (no token, show public routes)');
      return true;
    }
    
    // Token exists: wait for query to resolve (not just loading state)
    const isQueryResolved = !isLoading && (user !== undefined || error !== null);
    console.log('🔐 AuthReady check:', { tokenChecked, hasToken, isLoading, hasUser: !!user, hasError: !!error, isQueryResolved });
    
    if (isQueryResolved) {
      console.log('✅ AuthReady: true (query resolved, safe to show protected routes)');
    } else {
      console.log('⏳ AuthReady: false (query still resolving, blocking protected routes)');
    }
    
    return isQueryResolved;
  }, [tokenChecked, hasToken, isLoading, user, error]);

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
      await clearAllAuthData();
      setHasToken(false);
      // Clear any cached user data
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  // CRITICAL SAFETY: Only expose user if we have a token
  // This prevents stale cached user data from showing when token is invalid
  const effectiveUser = hasToken ? user : undefined;

  const value: AuthContextValue = {
    user: effectiveUser,
    isLoading,
    error,
    authReady,
    loginWithGoogle: {
      mutate: loginWithGoogle.mutate,
      isLoading: loginWithGoogle.isPending
    },
    logout: {
      mutate: logout.mutate,
      isLoading: logout.isPending
    },
    refetch,
    recheckToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
