// ChatGPT's bulletproof API client - single source of truth
// Detect the correct API base URL based on current environment
function getAPIBase() {
  // APK always uses production
  if (window.location.protocol === 'file:') {
    return 'https://gabai.ai';
  }
  
  // If on localhost or replit dev, use relative URLs
  if (window.location.hostname === 'localhost' || 
      window.location.hostname.includes('replit.dev')) {
    return '';  // Relative URL - same origin
  }
  
  // Production domain
  if (window.location.hostname === 'gabai.ai') {
    return 'https://gabai.ai';
  }
  
  // Replit deployment (like gabai-beta.jack741.replit.app)
  if (window.location.hostname.includes('replit.app')) {
    return '';  // Relative URL - same origin
  }
  
  // Default: use current origin
  return window.location.origin;
}

const API = getAPIBase();

let _token: string | null = null;

export function setToken(t: string) {
  _token = t;
  localStorage.setItem('gabai_token', t);
  console.log('🔑 Token set:', t.substring(0, 20) + '...');
}

export function getToken() {
  return _token ?? (_token = localStorage.getItem('gabai_token'));
}

export function clearToken() {
  _token = null;
  localStorage.removeItem('gabai_token');
  console.log('🔑 Token cleared');
}

export async function api(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  const t = getToken();
  
  if (t) {
    headers.set('Authorization', `Bearer ${t}`);
    console.log('🔑 Bearer token added to:', path);
  }
  
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  console.log('🌐 API call:', `${API}${path}`);
  
  // Use session cookies for web, omit for APK/Cordova
  const isAPK = window.location.protocol === 'file:';
  const credentials = isAPK ? 'omit' : 'include';
  
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers,
    credentials,
  });
  
  if (res.status === 401) {
    // For auth check endpoint, return null instead of throwing
    // This prevents false error logs when user is simply not logged in
    if (path === '/api/auth/user') {
      console.log('ℹ️ No authenticated user - returning null');
      return null;
    }
    
    // For all other endpoints, clear token and redirect
    console.log('❌ 401 - clearing token and redirecting to login');
    clearToken();
    window.location.hash = '#/login';
    throw new Error('401 Unauthorized');
  }
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${errorText}`);
  }
  
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}