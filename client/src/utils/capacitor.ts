// Utility to detect if app is running in Capacitor native environment
export function isNativeApp(): boolean {
  return window.location.protocol === 'capacitor:' || 
         window.location.protocol === 'ionic:' ||
         (window as any).Capacitor?.isNativePlatform() ||
         // Check for Android app user agent
         navigator.userAgent.includes('wv') || // WebView
         (window as any).AndroidInterface; // Custom Android interface
}

export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Check if running in native mobile app
export function isNativeMobileApp(): boolean {
  return isNativeApp() && isMobileDevice();
}