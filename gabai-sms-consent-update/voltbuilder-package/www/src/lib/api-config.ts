// API Configuration for both web and mobile environments
export function getApiBaseUrl(): string {
  // Check if we're in a Cordova/Capacitor environment (APK)
  const isFile = window.location.protocol === 'file:';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isCordova = typeof (window as any).cordova !== 'undefined';
  const isCapacitor = typeof (window as any).Capacitor !== 'undefined';
  
  // For APK/mobile app, always use production server
  if (isFile || isCordova || isCapacitor) {
    console.log('📱 Mobile environment detected - using production API');
    return 'https://gabai.ai';
  }
  
  // For local development
  if (isLocalhost) {
    console.log('💻 Local development - using local API');
    return window.location.origin;
  }
  
  // For production web
  console.log('🌐 Production web - using origin API');
  return window.location.origin;
}

export const API_BASE = getApiBaseUrl();

// Helper to build full API URLs
export function apiUrl(endpoint: string): string {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE}${cleanEndpoint}`;
}