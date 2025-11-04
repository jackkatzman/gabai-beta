import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'gabai_token';

// Detect if we're running in a native environment (APK)
function isNativeEnvironment(): boolean {
  const isCordova = typeof (window as any).cordova !== 'undefined';
  const isCapacitor = typeof (window as any).Capacitor !== 'undefined';
  const isWebView = navigator.userAgent.includes('wv') && navigator.userAgent.includes('Android');
  const isVoltBuilder = (window as any).IS_VOLTBUILDER_APK;
  
  return isCordova || isCapacitor || isWebView || isVoltBuilder;
}

/**
 * Platform-aware secure token storage
 * Uses Capacitor Preferences for APK (persists across restarts)
 * Uses localStorage for web (standard browser storage)
 */
export async function setToken(token: string | null): Promise<void> {
  if (isNativeEnvironment()) {
    // APK: Use Capacitor Preferences (persists across app restarts)
    if (token) {
      await Preferences.set({ key: TOKEN_KEY, value: token });
      console.log('🔐 Token saved to native storage (Capacitor Preferences)');
    } else {
      await Preferences.remove({ key: TOKEN_KEY });
      console.log('🗑️ Token removed from native storage');
    }
  } else {
    // Web: Use localStorage
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      console.log('🔐 Token saved to localStorage (web)');
    } else {
      localStorage.removeItem(TOKEN_KEY);
      console.log('🗑️ Token removed from localStorage');
    }
  }
}

/**
 * Platform-aware secure token retrieval
 * Reads from Capacitor Preferences for APK
 * Reads from localStorage for web
 */
export async function getToken(): Promise<string | null> {
  if (isNativeEnvironment()) {
    // APK: Read from Capacitor Preferences
    const result = await Preferences.get({ key: TOKEN_KEY });
    const token = result.value;
    console.log('🔍 Token retrieved from native storage:', token ? 'present' : 'absent');
    return token;
  } else {
    // Web: Read from localStorage
    const token = localStorage.getItem(TOKEN_KEY);
    console.log('🔍 Token retrieved from localStorage:', token ? 'present' : 'absent');
    return token;
  }
}

/**
 * Check if a token exists (synchronous for web, async for native)
 */
export async function hasToken(): Promise<boolean> {
  const token = await getToken();
  return Boolean(token);
}

/**
 * Clear all authentication data
 */
export async function clearAllAuthData(): Promise<void> {
  await setToken(null);
  
  // Also clear any legacy storage locations
  localStorage.removeItem('gabai_token');
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('gabai_token');
  sessionStorage.removeItem('token');
  
  console.log('🧹 All auth data cleared');
}
