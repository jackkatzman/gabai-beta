// ChatGPT's simplified auth system - surgical fix for race conditions
const TOKEN_KEY = 'gabai_token';

export const setToken = (t: string | null) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export async function api(path: string, init: RequestInit = {}) {
  const h = new Headers(init.headers || {});
  const t = getToken();
  if (t) h.set('Authorization', `Bearer ${t}`);
  
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
  
  const res = await fetch(url, { 
    ...init, 
    headers: h,
    credentials: 'include' // CRUCIAL for cookie-based sessions
  });
  if (res.status === 401) { 
    setToken(null); 
    location.hash = '#/login'; 
    throw new Error('401'); 
  }
  return res.headers.get('content-type')?.includes('json') ? res.json() : res.text();
}