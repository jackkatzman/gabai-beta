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
        }
        // Route off callback
        window.location.replace('/');
      }
    });
  } else {
    console.log('🔗 Deep links: skipped (web build / no App plugin)');
  }
}