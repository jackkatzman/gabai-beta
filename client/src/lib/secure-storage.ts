// Token storage for GabAI
// CRITICAL: Always use localStorage because the fetch() patch in index.html
// looks for tokens ONLY in localStorage (see index.html lines 248-252)
// The APK WebView supports localStorage and it persists properly when loading from https://gabai.ai

const TOKEN_KEY = 'gabai_token';

/**
 * Save authentication token to localStorage
 * Works in both web and APK (APK loads from https://gabai.ai, so localStorage persists)
 */
export async function setToken(token: string | null): Promise<void> {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    console.log('🔐 Token saved to localStorage');
  } else {
    localStorage.removeItem(TOKEN_KEY);
    console.log('🗑️ Token removed from localStorage');
  }
}

/**
 * Get authentication token from localStorage
 * The fetch() patch in index.html will find it here
 */
export async function getToken(): Promise<string | null> {
  const token = localStorage.getItem(TOKEN_KEY);
  console.log('🔍 Token retrieved from localStorage:', token ? 'present' : 'absent');
  return token;
}

/**
 * Check if a token exists
 */
export async function hasToken(): Promise<boolean> {
  const token = await getToken();
  return Boolean(token);
}

/**
 * Clear all authentication data
 */
export async function clearAllAuthData(): Promise<void> {
  localStorage.removeItem('gabai_token');
  localStorage.removeItem('gabai_jwt');
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('gabai_token');
  sessionStorage.removeItem('token');
  
  console.log('🧹 All auth data cleared from localStorage');
}
