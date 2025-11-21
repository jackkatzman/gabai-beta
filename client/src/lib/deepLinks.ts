// deepLinks.ts - Safe deep link handling for Capacitor
import { Capacitor } from '@capacitor/core';

// Optional type import; do NOT hard-import '@capacitor/app' in pure web builds
type AppPlugin = { addListener: (ev: string, cb: (data: any) => void) => void };

export function setupDeepLinks() {
  // Only true inside the native shell
  const isNative =
    typeof window !== 'undefined' &&
    (window as any).Capacitor &&
    (Capacitor.isNativePlatform?.() || Capacitor.getPlatform?.() === 'android');

  // Safely grab the App plugin if present
  const App: { addListener?: Function } | undefined =
    isNative ? (window as any).Capacitor?.Plugins?.App : undefined;

  if (App?.addListener) {
    console.log('🔗 Deep links: enabling native handler');
    App.addListener('appUrlOpen', ({ url }: { url?: string }) => {
      if (!url) return;
      if (
        url.startsWith('https://gabai.ai/auth/callback') ||
        url.startsWith('gabai://auth/callback')
      ) {
        // Extract token from URL and store it
        const urlParams = new URLSearchParams(url.split('?')[1] || '');
        const token = urlParams.get('token');
        
        if (token) {
          console.log('✅ Deep link auth token received');
          localStorage.setItem('gabai_token', token);
          localStorage.setItem('authToken', token); // Also set authToken for compatibility
          
          // Dispatch custom event to trigger immediate auth refetch
          const authEvent = new CustomEvent('gabai-auth-token', { detail: { token } });
          window.dispatchEvent(authEvent);
          console.log('🔔 Dispatched gabai-auth-token event');
          
          // Wait a bit for auth refetch to complete before navigating
          setTimeout(() => {
            window.location.replace('/');
          }, 500);
        } else {
          // No token, just navigate
          window.location.replace('/');
        }
      }
    });
  } else {
    console.log('🔗 Deep links: skipped (web build / no App plugin)');
  }
}