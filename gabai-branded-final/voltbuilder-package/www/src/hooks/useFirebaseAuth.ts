import { useState, useEffect } from 'react';
import { auth, onAuthChange } from '@/lib/firebase';
import { apiRequest } from '@/lib/queryClient';

interface FirebaseUser {
  id: string;
  name: string;
  email: string;
  preferences: any;
  onboardingCompleted: boolean;
}

export function useFirebaseAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip Firebase for mobile webviews to avoid storage issues
    const isMobileWebView = /wv/.test(navigator.userAgent);
    
    if (isMobileWebView) {
      console.log('📱 Mobile webview detected - skipping Firebase auth');
      setIsLoading(false);
      return;
    }
    
    console.log('🔥 Firebase auth hook initializing for web');
    
    // Note: redirect result handling removed with Google OAuth cleanup

    // Listen for auth state changes
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      console.log('🔥 Firebase auth state changed:', firebaseUser ? firebaseUser.email : 'No user');
      
      if (firebaseUser) {
        await syncWithBackend(firebaseUser);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const syncWithBackend = async (firebaseUser: any) => {
    try {
      console.log('🔄 Syncing Firebase user with backend:', firebaseUser.email);
      
      // Send Firebase user data to backend for user creation/login
      const baseURL = "https://gabai.ai";
      const response = await fetch(`${baseURL}/api/auth/firebase-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || 'User',
          photoURL: firebaseUser.photoURL
        })
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Backend sync successful:', userData.user.email);
        setUser(userData.user);
      } else {
        throw new Error('Backend sync failed');
      }
    } catch (error: any) {
      console.error('❌ Backend sync error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { user, isLoading, error };
}