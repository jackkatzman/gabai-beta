import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Helper to ensure URLs have leading slash (fixes 404 after SMS verify)
function ensureLeadingSlash(url: string): string {
  // Skip if already absolute URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Add leading slash if missing
  return url.startsWith('/') ? url : '/' + url;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
): Promise<Response> {
  // CRITICAL FIX: Ensure URL has leading slash (fixes 404 after SMS verify)
  url = ensureLeadingSlash(url);
  console.log('📍 API request normalized:', url);
  
  // Detect if running as APK (Cordova/Capacitor or WebView)
  // Note: APK loads from https://gabai.ai, NOT file://
  const isCordova = typeof (window as any).cordova !== 'undefined';
  const isCapacitor = typeof (window as any).Capacitor !== 'undefined';
  const isWebView = navigator.userAgent.includes('wv') && navigator.userAgent.includes('Android');
  const isVoltBuilder = (window as any).IS_VOLTBUILDER_APK;
  const isAPK = isCordova || isCapacitor || isWebView || isVoltBuilder;
  
  if (isAPK) {
    console.log('📱 APK detected:', { isCordova, isCapacitor, isWebView, isVoltBuilder });
  }
  
  // If running as APK, prepend production API base
  if (isAPK && url.startsWith('/api/')) {
    url = `https://gabai.ai${url}`;
    console.log('📱 APK API request:', url);
  }
  
  // Get token for authentication - check multiple storage locations
  // Always check for token, not just for APK
  const token = localStorage.getItem('gabai_token') || 
                sessionStorage.getItem('gabai_token') || 
                localStorage.getItem('token') ||
                sessionStorage.getItem('token');
  
  console.log('🔑 Token found:', !!token, 'for URL:', url);
  
  const headers = new Headers();
  
  // CRITICAL: Always set Content-Type for JSON requests
  if (data && method !== "GET") {
    headers.set("Content-Type", "application/json");
  }
  
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
  
  // Add Bearer token for authenticated endpoints only
  if (token && needsAuth && (url.startsWith('/api') || url.includes('gabai.ai'))) {
    headers.set('Authorization', `Bearer ${token}`);
    console.log('✅ Adding Bearer token to authenticated endpoint:', url);
  } else if (!needsAuth) {
    console.log('🌐 Public endpoint, no auth needed:', url);
  }
  
  // Add timeout using AbortController (60 seconds for chat to handle OpenAI delays, 15 seconds for others)
  const timeoutMs = url.includes('/api/chat') ? 60000 : 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "omit", // FIXED: Never use cookies - always use Bearer tokens
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs/1000} seconds`);
    }
    throw error;
  }
  
  // Handle 401s by clearing token and redirecting
  if (res.status === 401) {
    console.log('❌ 401 Unauthorized - clearing token');
    localStorage.removeItem('gabai_token');
    sessionStorage.removeItem('gabai_token');
    
    // Detect if we're in APK for proper redirect
    const isAPKRedirect = window.location.protocol === 'file:' ||
                         (navigator.userAgent.includes('wv') && navigator.userAgent.includes('Android')) ||
                         (typeof (window as any).cordova !== 'undefined');
    
    if (isAPKRedirect) {
      window.location.hash = '#/login';
    } else {
      window.location.hash = '#/login'; // CHATGPT FIX: Use hash routing
    }
    throw new Error('Unauthorized');
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Handle array query keys properly - first element is path, rest are params
    let url: string;
    if (Array.isArray(queryKey) && queryKey.length > 1) {
      const [basePath, ...params] = queryKey;
      url = `${basePath}/${params.join('/')}`;
    } else {
      url = queryKey.join("/");
    }
    
    // CRITICAL FIX: Ensure URL has leading slash (fixes 404 after SMS verify)
    url = ensureLeadingSlash(url);
    console.log('📍 Query normalized URL:', url);
    
    // Detect if running as APK (Cordova/Capacitor or WebView)
    // Note: APK loads from https://gabai.ai, NOT file://
    const isCordova = typeof (window as any).cordova !== 'undefined';
    const isCapacitor = typeof (window as any).Capacitor !== 'undefined';
    const isWebView = navigator.userAgent.includes('wv') && navigator.userAgent.includes('Android');
    const isVoltBuilder = (window as any).IS_VOLTBUILDER_APK;
    const isAPK = isCordova || isCapacitor || isWebView || isVoltBuilder;
    
    if (isAPK) {
      console.log('📱 APK detected in query:', { isCordova, isCapacitor, isWebView, isVoltBuilder });
    }
    
    // If running as APK, prepend production API base
    if (isAPK && url.startsWith('/api/')) {
      url = `https://gabai.ai${url}`;
      console.log('📱 APK Query request:', url);
    }
    
    // Get token for authentication - check multiple storage locations
    // Always check for token, not just for APK
    const token = localStorage.getItem('gabai_token') || 
                  sessionStorage.getItem('gabai_token') || 
                  localStorage.getItem('token') ||
                  sessionStorage.getItem('token');
    
    console.log('🔑 Query Token found:', !!token, 'for URL:', url);
    
    const headers: HeadersInit = {};
    
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
    
    // Add Bearer token for authenticated endpoints only
    if (token && needsAuth && (url.startsWith('/api') || url.includes('gabai.ai'))) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('✅ Adding Bearer token to authenticated query:', url);
    } else if (!needsAuth) {
      console.log('🌐 Public query endpoint, no auth needed:', url);
    }
    
    const res = await fetch(url, {
      headers,
      credentials: "omit", // FIXED: Never use cookies - always use Bearer tokens
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
