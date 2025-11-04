// Platform-aware auth system - uses native storage for APK, localStorage for web
import { setToken as secureSetToken, getToken as secureGetToken } from './secure-storage';
import { getGlobalUnauthorizedHandler } from '@/contexts/AuthContext';

export const setToken = secureSetToken;
export const getToken = secureGetToken;

export async function api(path: string, init: RequestInit = {}) {
  const h = new Headers(init.headers || {});
  const t = await getToken();
  if (t) h.set('Authorization', `Bearer ${t}`);
  
  // CRITICAL FIX: Set Content-Type for JSON body
  if (init.body && typeof init.body === 'string' && !h.has('Content-Type')) {
    h.set('Content-Type', 'application/json');
  }
  
  // Detect environment
  const isDevelopment = 
    window.location.hostname.includes('localhost') ||
    window.location.hostname.includes('replit') ||
    window.location.hostname.includes('127.0.0.1') ||
    window.location.hostname.includes('0.0.0.0');
  
  // Detect if running as APK (Cordova/Capacitor or WebView)
  const isCordova = typeof (window as any).cordova !== 'undefined';
  const isCapacitor = typeof (window as any).Capacitor !== 'undefined';
  const isWebView = navigator.userAgent.includes('wv') && navigator.userAgent.includes('Android');
  const isVoltBuilder = (window as any).IS_VOLTBUILDER_APK;
  const isAPK = isCordova || isCapacitor || isWebView || isVoltBuilder;
  
  // Build URL based on environment
  let url: string;
  if (isDevelopment && !isAPK) {
    // Local development - use relative URLs
    url = path.startsWith('/') ? path : `/${path}`;
    console.log('🔧 Development API request:', url);
  } else {
    // Production or APK - use absolute URL with domain
    url = `https://gabai.ai${path.startsWith('/') ? path : `/${path}`}`;
    console.log('🌐 Production/APK API request:', url);
  }
  
  // Add timeout handling for APK requests
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 30000); // 30 second timeout for APK requests

  try {
    const res = await fetch(url, { 
      ...init, 
      headers: h,
      credentials: 'include', // CRUCIAL for cookie-based sessions
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (res.status === 401) { 
      // Use centralized unauthorized handler if available
      const handleUnauthorized = getGlobalUnauthorizedHandler();
      if (handleUnauthorized) {
        await handleUnauthorized();
      } else {
        // Fallback if context not yet initialized
        await setToken(null);
      }
      location.hash = '#/login'; 
      throw new Error('401'); 
    }
    
    if (!res.ok && res.status !== 401) {
      const errorText = await res.text();
      console.error('❌ API error response:', res.status, errorText);
      throw new Error(`API error: ${res.status} - ${errorText || res.statusText}`);
    }
    
    return res.headers.get('content-type')?.includes('json') ? res.json() : res.text();
  } catch (error: any) {
    clearTimeout(timeout);
    
    if (error.name === 'AbortError') {
      console.error('❌ Request timeout after 30s:', url);
      throw new Error('Request timed out. Please check your internet connection and try again.');
    }
    
    console.error('❌ Fetch error:', error);
    throw error;
  }
}