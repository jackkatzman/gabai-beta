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
  
  // Get token for APK authentication - check multiple storage locations
  let token = null;
  if (isAPK) {
    token = localStorage.getItem('gabai_token') || 
            sessionStorage.getItem('gabai_token') || 
            localStorage.getItem('token') ||
            sessionStorage.getItem('token');
    console.log('🔑 APK Token found:', !!token);
  }
  
  const headers: HeadersInit = data ? { "Content-Type": "application/json" } : {};
  if (isAPK && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: isAPK ? "include" : "include", // Include cookies for both APK and web
  });

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
    
    // Get token for APK authentication - check multiple storage locations
    let token = null;
    if (isAPK) {
      token = localStorage.getItem('gabai_token') || 
              sessionStorage.getItem('gabai_token') || 
              localStorage.getItem('token') ||
              sessionStorage.getItem('token');
      console.log('🔑 APK Query Token found:', !!token);
    }
    
    const headers: HeadersInit = {};
    if (isAPK && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(url, {
      headers,
      credentials: isAPK ? "include" : "include", // Include cookies for both APK and web
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
