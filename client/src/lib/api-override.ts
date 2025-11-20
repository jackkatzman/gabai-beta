// APK/Mobile API Override - Ensures proper network calls in Cordova/WebView environment
export function initializeAPKNetworkOverride() {
  // Prevent duplicate overrides
  if ((window as any).__gabaiFetchPatched) {
    console.log('🔄 Fetch already patched, skipping duplicate override');
    return;
  }

  // Debug detailed APK detection  
  const protocolCheck = window.location.protocol === 'file:';
  const cordovaCheck = typeof (window as any).cordova !== 'undefined';
  const capacitorCheck = typeof (window as any).Capacitor !== 'undefined';
  const androidWebViewCheck = navigator.userAgent.includes('wv') && navigator.userAgent.includes('Android');
  
  // CRITICAL FIX: Exclude web browsers even if Capacitor is loaded
  const isWebBrowser = window.location.protocol.startsWith('http') && 
                       !navigator.userAgent.includes('wv') && 
                       !navigator.userAgent.includes('Android');
  
  const isAPK = (protocolCheck || cordovaCheck || capacitorCheck || androidWebViewCheck) && !isWebBrowser;
  
  console.log('🔍 APK Detection:', { isAPK, protocol: window.location.protocol });

  if (!isAPK) {
    console.log('🌐 Web environment - using default fetch (no override needed)');
    return;
  }

  console.log('📱 APK environment detected - initializing network overrides');

  // Mark as patched to prevent conflicts with any other overrides
  (window as any).__gabaiFetchPatched = true;

  // Store original fetch
  const originalFetch = window.fetch;

  // Override fetch for APK environment
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let url: string;
    let finalInit = init ? { ...init } : {};

    // DEBUG: Log what we received
    console.log('🔍 Fetch override called with:', {
      inputType: typeof input,
      isRequest: input instanceof Request,
      url: input instanceof Request ? input.url : input.toString(),
      hasBody: !!finalInit.body,
      body: finalInit.body,
      method: finalInit.method
    });

    // Handle Request object or URL
    if (input instanceof Request) {
      url = input.url;
      // Copy ALL properties from Request if not overridden
      if (!finalInit.headers && input.headers) {
        // Use new Headers to properly copy headers
        const headers = new Headers();
        input.headers.forEach((value, key) => {
          headers.set(key, value);
        });
        finalInit.headers = headers;
      }
      // CRITICAL: Copy body from Request object
      if (!finalInit.body && input.body) {
        finalInit.body = input.body;
      }
      // Copy method if not specified
      if (!finalInit.method && input.method) {
        finalInit.method = input.method;
      }
    } else {
      url = input.toString();
    }

    // Convert relative API calls to production URLs for APK
    if (url.startsWith('/api/') || url.startsWith('api/')) {
      url = `https://gabai.ai${url.startsWith('/') ? url : '/' + url}`;
      console.log(`🔗 APK API call: ${url}`);
    }

    // Set proper credentials and auth for APK
    if (url.includes('gabai.ai/api/')) {
      // Use credentials: 'omit' for APK to avoid CORS issues
      finalInit.credentials = 'omit';

      // List of public endpoints that don't need authentication
      const publicEndpoints = [
        '/api/sms/send-verification',
        '/api/sms/verify-code',
        '/api/auth/magic-link',
        '/api/auth/sms-code',
        '/api/auth/google',
        '/api/auth/simple-login'
      ];
      
      const needsAuth = !publicEndpoints.some(endpoint => url.includes(endpoint));

      if (needsAuth) {
        // Add Bearer token from storage if available - check ALL known keys for compatibility
        const token = localStorage.getItem('authToken') || 
                     localStorage.getItem('gabai_token') ||
                     localStorage.getItem('gabai_jwt') ||
                     localStorage.getItem('token') ||
                     sessionStorage.getItem('authToken') ||
                     sessionStorage.getItem('gabai_token') ||
                     sessionStorage.getItem('token');
        
        if (token) {
          // Use new Headers to properly normalize and set headers
          const headers = new Headers(finalInit.headers || {});
          headers.set('Authorization', `Bearer ${token}`);
          finalInit.headers = headers;
          console.log('🔑 Bearer token auth applied for:', url);
        } else {
          console.log('⚠️ No auth token found for authenticated endpoint:', url);
        }
      } else {
        console.log('🌐 Public endpoint, no auth required:', url);
      }

      // CRITICAL: Ensure Content-Type for POST/PUT/PATCH so server can parse JSON
      // BUT: Never add Content-Type for FormData - browser must set multipart/form-data with boundary
      if (['POST', 'PUT', 'PATCH'].includes(finalInit.method?.toUpperCase() || 'GET')) {
        // Check if body is FormData - if so, don't touch Content-Type
        const isFormData = finalInit.body instanceof FormData;
        
        if (!isFormData) {
          // Use new Headers to properly normalize and set headers
          const headers = new Headers(finalInit.headers || {});
          // Only set Content-Type if not already set
          if (!headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
            console.log('📦 Added Content-Type: application/json for method:', finalInit.method);
          }
          finalInit.headers = headers;
        } else {
          console.log('📤 FormData detected - letting browser set Content-Type with boundary');
        }
      }
    }

    // Final debug: Log what we're sending to original fetch
    console.log('🚀 Final fetch call:', {
      url,
      method: finalInit.method,
      hasBody: !!finalInit.body,
      body: finalInit.body,
      headers: finalInit.headers,
      credentials: finalInit.credentials
    });

    // Call original fetch with modified parameters
    return originalFetch(url, finalInit);
  };

  console.log('✅ APK network override initialized (unified, conflict-free)');
}