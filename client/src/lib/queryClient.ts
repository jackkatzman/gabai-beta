import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { api as bulletproofApi } from "./api-bulletproof";

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
  // Use bulletproof client's auth logic but return real Response
  url = ensureLeadingSlash(url);
  const originalPath = url;  // Keep original path for comparisons
  
  const headers = new Headers();
  
  if (data && method !== "GET") {
    headers.set("Content-Type", "application/json");
  }
  
  // APK detection - MUST match getQueryFn logic exactly
  const isFileProtocol = window.location.protocol === 'file:';
  const isCordova = typeof (window as any).cordova !== 'undefined';
  const isCapacitor = typeof (window as any).Capacitor !== 'undefined';
  const isWebView = navigator.userAgent.includes('wv') && navigator.userAgent.includes('Android');
  const isVoltBuilder = (window as any).IS_VOLTBUILDER_APK;
  const isAPK = isFileProtocol || isCordova || isCapacitor || isWebView || isVoltBuilder;
  
  // Environment detection: relative URL for local dev, absolute for production/APK
  const isDevelopment = 
    window.location.hostname.includes('localhost') ||
    window.location.hostname.includes('repl.co') ||  // Replit dev domains
    window.location.hostname.includes('replit.dev') ||
    window.location.hostname.includes('riker.replit.dev') ||
    window.location.hostname.includes('127.0.0.1') ||
    window.location.hostname.includes('0.0.0.0');
  
  let fullUrl: string;
  if (isDevelopment && !isAPK) {
    // Local development - use relative URL
    fullUrl = originalPath;
  } else {
    // Production or APK - use absolute URL
    fullUrl = `https://gabai.ai${originalPath}`;
  }
  
  // Get token for authentication - check multiple storage locations (MATCH getQueryFn)
  const token = localStorage.getItem('gabai_token') || 
                sessionStorage.getItem('gabai_token') || 
                localStorage.getItem('token') ||
                sessionStorage.getItem('token');
  
  // List of public endpoints that don't need authentication (MATCH getQueryFn)
  const publicEndpoints = [
    '/api/sms/send-verification',
    '/api/sms/verify-code',
    '/api/auth/magic-link',
    '/api/auth/sms-code',
    '/api/auth/google',
    '/api/auth/simple-login'
  ];
  
  // Check public endpoints against original path (not fullUrl with hostname)
  const needsAuth = !publicEndpoints.some(endpoint => originalPath.includes(endpoint));
  
  // Add Bearer token for authenticated endpoints only (MATCH getQueryFn)
  if (token && needsAuth && originalPath.startsWith('/api')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Use session cookies for web, omit for APK
  const credentials = isAPK ? 'omit' : 'include';
  
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials,
  });
  
  // Handle 401 by clearing token and redirecting
  if (res.status === 401) {
    localStorage.removeItem('gabai_token');
    sessionStorage.removeItem('gabai_token');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    window.location.hash = '#/login';
    throw new Error('401 Unauthorized');
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
    const originalPath = url;  // Keep original path for comparisons
    console.log('📍 Query normalized URL:', url);
    
    // Detect if running as APK (Cordova/Capacitor or WebView)
    const isFileProtocol = window.location.protocol === 'file:';
    const isCordova = typeof (window as any).cordova !== 'undefined';
    const isCapacitor = typeof (window as any).Capacitor !== 'undefined';
    const isWebView = navigator.userAgent.includes('wv') && navigator.userAgent.includes('Android');
    const isVoltBuilder = (window as any).IS_VOLTBUILDER_APK;
    const isAPK = isFileProtocol || isCordova || isCapacitor || isWebView || isVoltBuilder;
    
    // Environment detection: relative URL for local dev, absolute for production/APK
    const isDevelopment = 
      window.location.hostname.includes('localhost') ||
      window.location.hostname.includes('repl.co') ||  // Replit dev domains
      window.location.hostname.includes('replit.dev') ||
      window.location.hostname.includes('riker.replit.dev') ||
      window.location.hostname.includes('127.0.0.1') ||
      window.location.hostname.includes('0.0.0.0');
    
    if (isAPK) {
      console.log('📱 APK detected in query:', { isCordova, isCapacitor, isWebView, isVoltBuilder });
    }
    
    // Compute full URL based on environment (mirror apiRequest logic)
    let fullUrl: string;
    if (isDevelopment && !isAPK) {
      // Local development - use relative URL
      fullUrl = originalPath;
      console.log('🏠 Dev Query request:', fullUrl);
    } else {
      // Production or APK - use absolute URL
      fullUrl = `https://gabai.ai${originalPath}`;
      console.log('🌐 Production/APK Query request:', fullUrl);
    }
    
    // Get token for authentication - check multiple storage locations
    // Always check for token, not just for APK
    const token = localStorage.getItem('gabai_token') || 
                  sessionStorage.getItem('gabai_token') || 
                  localStorage.getItem('token') ||
                  sessionStorage.getItem('token');
    
    console.log('🔑 Query Token found:', !!token, 'for path:', originalPath);
    
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
    
    // Check public endpoints against original path (not fullUrl with hostname)
    const needsAuth = !publicEndpoints.some(endpoint => originalPath.includes(endpoint));
    
    // Add Bearer token for authenticated endpoints only
    if (token && needsAuth && originalPath.startsWith('/api')) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('✅ Adding Bearer token to authenticated query:', originalPath);
    } else if (!needsAuth) {
      console.log('🌐 Public query endpoint, no auth needed:', originalPath);
    }
    
    // Use session cookies for web, omit for APK
    const credentials = isAPK ? 'omit' : 'include';
    
    const res = await fetch(fullUrl, {
      headers,
      credentials,
    });

    // Handle 401 by clearing token and redirecting (MATCH apiRequest)
    if (res.status === 401) {
      localStorage.removeItem('gabai_token');
      sessionStorage.removeItem('gabai_token');
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.hash = '#/login';
      
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      throw new Error('401 Unauthorized');
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
