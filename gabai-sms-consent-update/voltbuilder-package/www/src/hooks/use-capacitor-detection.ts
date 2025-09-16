import { useEffect } from 'react';
import { isNativeApp } from '@/utils/capacitor';

export function useCapacitorDetection() {
  useEffect(() => {
    // Add Capacitor-specific CSS class to body
    if (isNativeApp()) {
      document.body.classList.add('capacitor-native');
      
      // Add viewport meta for mobile apps
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
        );
      }
      
      // Prevent pull-to-refresh and other mobile gestures
      document.body.style.overscrollBehavior = 'none';
      document.body.style.touchAction = 'pan-x pan-y';
    }
  }, []);
}