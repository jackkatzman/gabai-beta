// Global fetch interceptor for APK/Cordova apps
// This ensures ALL API calls go to production server when running as APK

export function setupAPKFetchInterceptor() {
  // Only intercept if running as APK (file:// protocol)
  if (window.location.protocol !== 'file:') {
    console.log('📱 Not running as APK, skipping fetch interceptor');
    return;
  }

  console.log('📱 APK detected - installing global fetch interceptor');
  
  // Store original fetch
  const originalFetch = window.fetch;
  
  // Override global fetch
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
    let url = input.toString();
    
    // If it's a relative API URL, prepend production server
    if (url.startsWith('/api/') || url.startsWith('api/')) {
      const newUrl = `https://gabai.ai${url.startsWith('/') ? '' : '/'}${url}`;
      console.log(`📱 APK API redirect: ${url} → ${newUrl}`);
      return originalFetch(newUrl, init);
    }
    
    // If it's file:// with API path, replace with production
    if (url.startsWith('file:///api/') || url.includes('file://') && url.includes('/api/')) {
      const apiPath = url.substring(url.indexOf('/api/'));
      const newUrl = `https://gabai.ai${apiPath}`;
      console.log(`📱 APK file:// redirect: ${url} → ${newUrl}`);
      return originalFetch(newUrl, init);
    }
    
    // Otherwise use original URL
    return originalFetch(input, init);
  };
  
  console.log('✅ APK fetch interceptor installed');
}