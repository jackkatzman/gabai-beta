import React from "react";
import type { User } from "@shared/schema";

export function useSimpleAuth() {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const checkAuth = React.useCallback(async () => {
    try {
      console.log('🔐 Simple auth: Checking authentication...');
      setIsLoading(true);
      setError(null);

      // Check for auth token
      const authToken = localStorage.getItem('gabai_token');
      const headers: HeadersInit = {};

      if (authToken) {
        console.log('🔑 Simple auth: Using stored token');
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch("/api/auth/user", {
        headers,
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Simple auth: User authenticated:', userData?.name);
        setUser(userData);
      } else if (response.status === 401) {
        console.log('❌ Simple auth: Not authenticated');
        localStorage.removeItem('gabai_token');
        setUser(null);
      } else {
        throw new Error(`Auth check failed: ${response.status}`);
      }
    } catch (err) {
      console.error('❌ Simple auth error:', err);
      setError(err instanceof Error ? err.message : 'Auth check failed');
      setUser(null);
      localStorage.removeItem('gabai_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    isLoading,
    error,
    refetch: checkAuth
  };
}