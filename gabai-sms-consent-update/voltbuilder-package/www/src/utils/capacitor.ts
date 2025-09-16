// Utility to detect if app is running in Capacitor native environment
export function isNativeApp(): boolean {
  // Check for Capacitor platform first
  if ((window as any).Capacitor?.isNativePlatform?.()) {
    return true;
  }
  
  // Check URL protocols
  if (window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:') {
    return true;
  }
  
  // Check for APK WebView indicators
  const userAgent = navigator.userAgent;
  const isWebView = userAgent.includes('wv') || // Android WebView
                    userAgent.includes('Version/') && userAgent.includes('Mobile Safari') || // APK WebView
                    (window as any).AndroidInterface; // Custom Android interface
  
  // Check for file:// protocol (often used in APK)
  const isFileProtocol = window.location.protocol === 'file:';
  
  console.log('🔍 Native app detection:', {
    capacitor: !!(window as any).Capacitor?.isNativePlatform?.(),
    protocol: window.location.protocol,
    userAgent: userAgent.substring(0, 50),
    webView: isWebView,
    fileProtocol: isFileProtocol
  });
  
  return isWebView || isFileProtocol;
}

export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Check if running in native mobile app
export function isNativeMobileApp(): boolean {
  return isNativeApp() && isMobileDevice();
}