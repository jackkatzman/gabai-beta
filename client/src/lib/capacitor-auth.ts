// Capacitor Browser-based OAuth Authentication
// Safe Capacitor import with fallback
let Capacitor: any = { isNativePlatform: () => false };

// Try to import Capacitor safely
try {
  if (typeof window !== 'undefined') {
    const { Capacitor: CapacitorCore } = require('@capacitor/core');
    Capacitor = CapacitorCore;
  }
} catch (error) {
  console.log('⚠️ Capacitor not available, using web fallback');
}

// 1) Start login - opens Google OAuth in device browser
export async function startCapacitorLogin() {
  // Check if we're in a VoltBuilder APK (mobile app) or native platform
  const isVoltBuilderAPK = window.location.protocol === 'https:' && 
    navigator.userAgent.includes('wv') && 
    navigator.userAgent.includes('Mobile');
  
  if (!Capacitor.isNativePlatform() && !isVoltBuilderAPK) {
    // Fallback to normal web OAuth for development
    window.location.href = '/api/auth/google';
    return;
  }

  console.log('📱 Mobile platform detected! Using device browser auth');
  console.log('🔍 Platform info:', {
    isNativePlatform: Capacitor.isNativePlatform(),
    isVoltBuilderAPK,
    userAgent: navigator.userAgent.substring(0, 100)
  });

  // Use the current domain for mobile auth (APK connects to development server)
  const authDomain = window.location.origin;
  const url = `${authDomain}/api/auth/google?state=mobile`;
  
  console.log('📱 Mobile app: Opening OAuth in device browser');
  console.log('🔗 Auth URL:', url);
  
  // Set flag to indicate we're in mobile authentication flow
  localStorage.setItem('gabai_mobile_auth_in_progress', 'true');
  localStorage.setItem('gabai_mobile_auth_timestamp', Date.now().toString());
  
  try {
    // CRITICAL: Must use external browser to avoid Google's "embedded webview" policy
    console.log('🚀 Opening OAuth in external browser (Google policy compliant)');
    
    // Try multiple methods to force external browser
    const opened = window.open(url, '_system') || 
                   window.open(url, '_blank') ||
                   window.open(url, 'system_browser');
    
    if (!opened) {
      console.log('⚠️ External browser open failed, using location redirect');
      // This should still work for VoltBuilder APKs
      window.location.href = url;
    } else {
      console.log('✅ External browser OAuth initiated - avoiding embedded webview');
    }
  } catch (error) {
    console.error('❌ Browser open failed:', error);
    // Last resort: navigate the current window
    window.location.href = url;
  }
}

// 2) Handle deep link when browser redirects back to app
let deepLinkHandlerBound = false;
export function bindDeepLinkHandler(onSuccess: (token: string) => void, onError?: (error: string) => void) {
  if (deepLinkHandlerBound) return;
  deepLinkHandlerBound = true;

  console.log('🔗 Binding deep link handler for OAuth callback');

  // Check if we're in a VoltBuilder APK or native platform
  const isVoltBuilderAPK = window.location.protocol === 'https:' && 
    navigator.userAgent.includes('wv') && 
    navigator.userAgent.includes('Mobile');

  try {
    if (Capacitor.isNativePlatform() || isVoltBuilderAPK) {
      // Listen for app state changes (when app comes back from browser)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          console.log('📱 App became visible - checking for auth token in URL');
          checkForAuthTokenInUrl(onSuccess, onError);
        }
      });
      
      // Also check immediately for deep link data
      checkForAuthTokenInUrl(onSuccess, onError);
    }
  } catch (error) {
    console.log('⚠️ Capacitor not available, using web fallback');
    // Fallback for web environments
    checkForAuthTokenInUrl(onSuccess, onError);
  }
}

// Helper to check for auth token in URL or localStorage
function checkForAuthTokenInUrl(onSuccess: (token: string) => void, onError?: (error: string) => void) {
  try {
    // Check localStorage for mobile auth token (set by the callback page)
    const mobileToken = localStorage.getItem('gabai_mobile_token');
    const mobileAuthSuccess = localStorage.getItem('gabai_mobile_auth_success');
    
    if (mobileToken && mobileAuthSuccess === 'true') {
      console.log('✅ Found mobile auth token in localStorage');
      localStorage.removeItem('gabai_mobile_token');
      localStorage.removeItem('gabai_mobile_auth_success');
      localStorage.setItem('gabai_token', mobileToken);
      onSuccess(mobileToken);
      return;
    }
    
    // Also check URL params as fallback
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const success = urlParams.get('success');
    
    if (token && success === 'true') {
      console.log('✅ Found auth token in URL');
      localStorage.setItem('gabai_token', token);
      onSuccess(token);
      
      // Clean up URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      return;
    }
    
    // Check localStorage for existing token
    const storedToken = localStorage.getItem('gabai_token');
    if (storedToken) {
      console.log('✅ Found stored auth token');
      onSuccess(storedToken);
      return;
    }
    
    console.log('❌ No auth token found');
  } catch (error) {
    console.error('❌ Auth token check failed:', error);
    onError?.(error instanceof Error ? error.message : 'Auth check failed');
  }
}

// 3) Token-based auth fetch wrapper
export function createAuthFetch() {
  return (path: string, init: RequestInit = {}) => {
    const token = localStorage.getItem('gabai_token');
    const base = import.meta.env.VITE_API_BASE || window.location.origin;
    
    return fetch(`${base}${path}`, {
      ...init,
      headers: { 
        ...(init.headers || {}), 
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
  };
}

// 4) Clear auth state
export function logout() {
  localStorage.removeItem('gabai_token');
  // Navigate to login or refresh app
  window.location.href = '/';
}