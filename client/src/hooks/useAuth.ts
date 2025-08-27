import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { isNativeMobileApp } from "@/utils/device";
import { triggerAPKAuthentication, shouldAutoAuth } from "@/utils/apk-auto-auth";
// Skip Capacitor Browser import to fix build errors
let Browser: any = null;

export function useAuth() {
  const queryClient = useQueryClient();
  const [apkAuthAttempted, setApkAuthAttempted] = React.useState(false);

  // Clean up problematic localStorage items on initialization
  React.useEffect(() => {
    const problematicKeys = [
      'gabai_mobile_token', 
      'gabai_mobile_auth_completed', 
      'gabai_mobile_auth_success',
      'gabai_mobile_redirect',
      'gabai_auth_state'
    ];
    
    problematicKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log(`🧹 Removing problematic localStorage key: ${key}`);
        localStorage.removeItem(key);
      }
    });
  }, []);

  const { data: user, isLoading, refetch, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 0, // Always fresh check
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    queryFn: async () => {
      try {
        console.log('🔐 Fetching user authentication...');

        // Clean up old mobile auth tokens first
        const oldMobileTokens = [
          'gabai_mobile_token', 
          'gabai_mobile_auth_completed', 
          'gabai_mobile_auth_success'
        ];
        oldMobileTokens.forEach(token => {
          if (localStorage.getItem(token)) {
            console.log(`🧹 Cleaning up old token: ${token}`);
            localStorage.removeItem(token);
          }
        });

        // Check for valid authentication token
        const authToken = localStorage.getItem('gabai_token');
        const headers: HeadersInit = {};

        if (authToken) {
          console.log('🔑 Using authentication token');
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        // Create a fetch with timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch("/api/auth/user", {
          headers,
          credentials: 'include', // Important for session cookies
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 401) {
            console.log('❌ No authenticated user');
            // Clear invalid token
            localStorage.removeItem('gabai_token');
            return null; // Not authenticated
          }
          throw new Error(`Failed to fetch user: ${response.status}`);
        }
        
        const userData = await response.json();
        console.log('✅ Authenticated user:', userData?.name);
        return userData as User;
      } catch (error) {
        console.error('❌ Auth fetch error:', error);
        
        // Log detailed error information
        if (error instanceof Error) {
          console.error('❌ Error message:', error.message);
          console.error('❌ Error name:', error.name);
        }
        
        // Clear any invalid tokens on error
        localStorage.removeItem('gabai_token');
        
        // Always return null for auth errors (don't throw)
        return null;
      }
    },
  });

  // Check for OAuth callback authentication
  React.useEffect(() => {
    const checkOAuthCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenParam = urlParams.get('token');
      const okParam = urlParams.get('ok');

      // Handle OAuth callback with token
      if (tokenParam && okParam === '1') {
        console.log('🔐 OAuth callback detected, storing token');
        localStorage.setItem('gabai_token', tokenParam);

        // Clean up URL parameters
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        // Refresh user data
        setTimeout(() => refetch(), 100);
      }
    };

    checkOAuthCallback();
  }, [refetch]);

  const loginMutation = useMutation({
    mutationFn: async () => {
      console.log('🔐 Starting login...');

      if (isNativeMobileApp()) {
        // For mobile app, use Capacitor browser auth flow
        console.log('📱 Mobile app: Using Capacitor OAuth flow');

        // Import and use safe deep links
        const { setupDeepLinks } = await import('@/lib/deepLinks');
        const { startCapacitorLogin } = await import('@/lib/capacitor-auth');

        // Set up safe deep link handling
        setupDeepLinks();

        return new Promise((resolve, reject) => {
          // Start the OAuth flow
          startCapacitorLogin();
          
          // Simple promise resolution after starting
          setTimeout(() => {
            resolve({ success: true });
          }, 1000);
        });
      } else {
        // For web, use regular redirect
        console.log('🌐 Web app: Redirecting to OAuth');
        window.location.href = "/api/auth/google";
      }
    },
    onSuccess: () => {
      // Refresh user data after successful mobile login
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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
      // Use the correct logout endpoint from auth.ts
      window.location.href = "/api/auth/logout";
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