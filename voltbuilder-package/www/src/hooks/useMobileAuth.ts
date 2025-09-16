import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { startCapacitorLogin, createAuthFetch } from '@/lib/capacitor-auth';
import { setupDeepLinks } from '@/lib/deepLinks';

export function useMobileAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authFetch = createAuthFetch();

  // Verify mobile token with server
  const verifyMobileToken = async (token: string) => {
    try {
      const response = await fetch('/api/auth/mobile/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsLoading(false);
        console.log('✅ Mobile auth verified:', data.user.name);
        return data.user;
      } else {
        // Token invalid, clear it
        localStorage.removeItem('gabai_token');
        setError('Authentication expired');
        setIsLoading(false);
        return null;
      }
    } catch (error) {
      console.error('❌ Mobile token verification failed:', error);
      setError('Verification failed');
      setIsLoading(false);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      // Fall back to regular auth for web
      setIsLoading(false);
      return;
    }

    console.log('📱 Initializing mobile auth...');

    // Set up safe deep link handler
    setupDeepLinks();

    // Check for existing token
    const existingToken = localStorage.getItem('gabai_token');
    if (existingToken) {
      verifyMobileToken(existingToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async () => {
    if (Capacitor.isNativePlatform()) {
      setIsLoading(true);
      setError(null);
      await startCapacitorLogin();
    } else {
      // Web OAuth fallback
      window.location.href = '/api/auth/google';
    }
  };

  const logout = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await fetch('/api/auth/mobile/logout', { method: 'POST' });
        localStorage.removeItem('gabai_token');
      } else {
        await fetch('/api/auth/logout', { method: 'POST' });
      }
      setUser(null);
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    authFetch
  };
}