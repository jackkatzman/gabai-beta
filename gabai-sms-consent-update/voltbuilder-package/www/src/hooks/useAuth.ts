import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { isNativeMobileApp } from "@/utils/device";
import { triggerAPKAuthentication, shouldAutoAuth } from "@/utils/apk-auto-auth";
import { authenticateWithGoogle, isNativeFirebaseAvailable } from "@/lib/firebase-native-auth";
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
      // Add overall timeout to guarantee settlement
      const overallTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Overall auth timeout')), 8000)
      );
      
      try {
        return await Promise.race([
          overallTimeout,
          (async () => {
            console.log('🔐 Fetching user authentication...');

            // CRITICAL FIX: Handle APK loading from Replit dev URL
            const isAndroidWebView = navigator.userAgent.includes('wv') && navigator.userAgent.includes('Android');
            const isReplitDev = window.location.hostname.includes('replit');
            const isCordova = typeof (window as any).cordova !== 'undefined';
            const isCapacitor = typeof (window as any).Capacitor !== 'undefined';
            const isAPK = isAndroidWebView || isCordova || isCapacitor;
            
            // Check for stored authentication (check multiple keys for compatibility)
            const storedToken = localStorage.getItem('gabai_token') || 
                              localStorage.getItem('token') || 
                              sessionStorage.getItem('gabai_token') ||
                              sessionStorage.getItem('token');
            const storedUser = localStorage.getItem('gabai_user') || sessionStorage.getItem('gabai_user');
            
            // Special check for SMS authentication in cross-domain scenario
            const smsAuthenticated = localStorage.getItem('gabai_sms_authenticated') === 'true';
            
            console.log('🔍 Auth check:', {
              isAPK,
              isReplitDev,
              hasToken: !!storedToken,
              hasUser: !!storedUser,
              smsAuth: smsAuthenticated,
              origin: window.location.origin
            });
            
            // If APK and we have cached data OR SMS authenticated, return immediately
            if (isAPK && (storedToken && storedUser || smsAuthenticated && storedUser)) {
              try {
                const userData = storedUser ? JSON.parse(storedUser) : null;
                
                if (userData) {
                  console.log('⚡ APK: Using cached user data:', userData?.name);
                  return userData;
                } else if (smsAuthenticated) {
                  // SMS authenticated but no user data - create minimal user object
                  console.log('📱 APK: SMS authenticated, creating user object');
                  return {
                    id: 'sms-user',
                    name: 'SMS User',
                    phone: localStorage.getItem('gabai_phone') || 'Unknown',
                    authenticated: true
                  };
                }
              } catch (e) {
                console.error('Failed to parse stored user:', e);
              }
            }
            
            // Special handling for APK on Replit dev URL with SMS auth
            if (isAPK && isReplitDev && smsAuthenticated) {
              console.log('🔧 APK on Replit dev with SMS auth - returning cached state');
              // Don't make API call that will fail due to cross-domain
              const userData = storedUser ? JSON.parse(storedUser) : {
                id: 'sms-user',
                name: 'SMS User',
                authenticated: true
              };
              return userData;
            }

            // Check for native user data (with timeout)
            const nativeUser = localStorage.getItem('gabai_native_user');
            if (nativeUser) {
              // Don't block on native check - use timeout
              const nativeCheckPromise = isNativeFirebaseAvailable();
              const nativeTimeout = new Promise(resolve => setTimeout(() => resolve(false), 1000));
              const nativeAvailable = await Promise.race([nativeCheckPromise, nativeTimeout]);
              
              if (nativeAvailable) {
                console.log('🔥 Found native Firebase user data');
                try {
                  const userData = JSON.parse(nativeUser);
                  console.log('✅ Using cached native user');
                  return userData;
                } catch (e) {
                  console.log('🧹 Cleaning up invalid native user data');
                  localStorage.removeItem('gabai_native_user');
                }
              }
            }

            // Regular authentication flow for all platforms
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

            // Check for valid authentication token in BOTH localStorage and sessionStorage
            console.log('🔍 Checking storage for authentication...');
            console.log('  - localStorage keys:', Object.keys(localStorage));
            console.log('  - sessionStorage keys:', Object.keys(sessionStorage));
            
            // Try multiple storage locations for VoltBuilder compatibility
            let authToken = localStorage.getItem('gabai_token') || 
                           sessionStorage.getItem('gabai_token') ||
                           localStorage.getItem('token') || 
                           sessionStorage.getItem('token');
                           
            // Also check cookies as a fallback
            if (!authToken) {
              const cookieMatch = document.cookie.match(/gabai_token=([^;]+)/);
              if (cookieMatch) {
                authToken = cookieMatch[1];
                console.log('🍪 Token found in cookie!');
              }
            }
            
            console.log('  - Token found:', !!authToken);
            console.log('  - User found:', !!storedUser);
            console.log('  - Token source:', 
              localStorage.getItem('gabai_token') ? 'localStorage:gabai_token' :
              sessionStorage.getItem('gabai_token') ? 'sessionStorage:gabai_token' :
              localStorage.getItem('token') ? 'localStorage:token' :
              sessionStorage.getItem('token') ? 'sessionStorage:token' : 'none'
            );
            console.log('  - Token preview:', authToken ? authToken.substring(0, 20) + '...' : 'null');
            
            const headers: HeadersInit = {};

            // Check for authentication token
            if (authToken) {
              console.log('🔑 Using authentication token for API call');
              headers['Authorization'] = `Bearer ${authToken}`;
            } else {
              console.log('❌ No authentication token found in localStorage');
              console.log('  - Current origin:', window.location.origin);
              console.log('  - Current href:', window.location.href);
            }

            // Prepare for authentication check with timeout

            // Re-check APK detection (already done above but needed for API URL)
            const apiUrl = isAPK ? 'https://gabai.ai/api/auth/user' : '/api/auth/user';
            
            if (isAPK) {
              console.log('📱 APK detected - using production API for auth check');
              console.log('🔑 Token being sent:', authToken ? 'Yes' : 'No');
              
              // If APK and no token, skip auth check entirely
              if (!authToken) {
                console.log('⚡ APK with no token - skipping auth check, showing login');
                return null;
              }
            }
            
            // Configure fetch options based on environment
            const fetchOptions: RequestInit = {
              headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
              credentials: isAPK ? 'omit' : 'include', // Never use credentials for APK
            };
            
            // For APK with token, ensure we're sending it
            if (isAPK && authToken) {
              console.log('📤 Sending token in Authorization header for APK');
            }
            
            // Create fetch promise
            const fetchPromise = fetch(apiUrl, fetchOptions);
            
            // Create timeout promise as fallback (WebView may not support AbortController)
            const timeoutPromise = new Promise<Response>((_, reject) => {
              setTimeout(() => reject(new Error('Auth check timeout')), 8000);
            });
            
            // Race between fetch and timeout
            try {
              const response = await Promise.race([fetchPromise, timeoutPromise]);
              
              if (!response.ok) {
                if (response.status === 401) {
                  console.log('❌ No authenticated user');
                  // Clear invalid token
                  localStorage.removeItem('gabai_token');
                  localStorage.removeItem('gabai_user');
                  sessionStorage.removeItem('gabai_token');
                  sessionStorage.removeItem('gabai_user');
                  return null; // Not authenticated
                }
                throw new Error(`Failed to fetch user: ${response.status}`);
              }
              
              const userData = await response.json();
              console.log('✅ Authenticated user:', userData?.name);
              return userData as User;
            } catch (raceError) {
              // Handle timeout or network errors
              if (raceError instanceof Error && raceError.message === 'Auth check timeout') {
                console.log('⏱️ Auth check timed out - APK network issue');
                // For APK, if we have stored user data, use it as fallback
                if (isAPK && storedUser) {
                  try {
                    const userData = JSON.parse(storedUser);
                    console.log('📱 Using cached user data for APK after timeout');
                    return userData as User;
                  } catch (e) {
                    console.error('Failed to parse stored user data');
                  }
                }
              }
              throw raceError;
            }
          })() // Close the async IIFE
        ]);
      } catch (error) {
        console.error('❌ Auth fetch error:', error);
            
        // Log detailed error information
        if (error instanceof Error) {
          console.error('❌ Error message:', error.message);
          console.error('❌ Error name:', error.name);
          
          if (error.message === 'Auth check timeout' || error.message === 'Overall auth timeout') {
            console.error('⏱️ Request timed out');
            
            // If timeout and we have cached data, use it
            const cachedUser = localStorage.getItem('gabai_user') || sessionStorage.getItem('gabai_user');
            if (cachedUser) {
              try {
                const userData = JSON.parse(cachedUser);
                console.log('📦 Using cached user after timeout');
                return userData;
              } catch (e) {
                console.error('Failed to parse cached user');
              }
            }
          }
        }
        
        // Clear invalid tokens only on unauthorized errors
        if (error instanceof Error && (error.message?.includes('401') || error.message?.includes('Unauthorized'))) {
          localStorage.removeItem('gabai_token');
          localStorage.removeItem('gabai_user');
          sessionStorage.removeItem('gabai_token');
          sessionStorage.removeItem('gabai_user');
        }
        
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

    // Listen for auth state changes (especially from APK)
    const handleAuthStateChange = (event: any) => {
      console.log('🔄 Auth state changed event received:', event.detail);
      if (event.detail?.authenticated) {
        // Refetch user data after auth state change
        setTimeout(() => refetch(), 100);
      }
    };

    window.addEventListener('authStateChanged', handleAuthStateChange);
    checkOAuthCallback();

    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChange);
    };
  }, [refetch]);

  const loginMutation = useMutation({
    mutationFn: async () => {
      console.log('🔐 Starting login...');

      // Check for native Firebase first (VoltBuilder/Capacitor with FirebaseX)
      console.log('🔍 Checking for native Firebase availability...');
      const nativeAvailable = await isNativeFirebaseAvailable();
      
      if (nativeAvailable) {
        console.log('🔥 Using native Firebase authentication');
        
        const result = await authenticateWithGoogle();
        if (result.success && result.user) {
          console.log('✅ Native authentication successful, creating session...');
          
          // Send user data to backend to create session
          const response = await fetch('/api/auth/native-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(result.user)
          });
          
          if (!response.ok) {
            throw new Error('Failed to create session');
          }
          
          console.log('🎉 Authentication complete!');
          return result.user;
        } else {
          console.error('❌ Native authentication failed:', result.error);
          throw new Error(result.error || 'Native authentication failed');
        }
      } else {
        console.log('❌ Native Firebase not available, falling back to web auth');
      }

      if (isNativeMobileApp()) {
        // For mobile app without native Firebase, use external browser OAuth flow
        console.log('📱 Mobile app: Using external browser OAuth flow');

        try {
          const { startMobileAuth } = await import('@/lib/mobile-oauth');
          startMobileAuth();
          return { success: true };
        } catch (error) {
          console.error('❌ Mobile OAuth failed:', error);
          throw error;
        }
      } else {
        // For web, use regular redirect
        console.log('🌐 Web app: Redirecting to OAuth');
        window.location.href = "https://gabai.ai/api/auth/google";
      }
    },
    onSuccess: () => {
      // Refresh user data after successful login
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
      window.location.href = "https://gabai.ai/api/auth/logout";
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