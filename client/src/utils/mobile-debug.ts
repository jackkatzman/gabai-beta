// Mobile debugging utilities
export function addMobileDebugInfo() {
  if (typeof window === 'undefined') return;
  
  console.log('🔧 MOBILE DEBUG INFO:');
  console.log('📱 User Agent:', navigator.userAgent);
  console.log('🌐 Location:', window.location.href);
  console.log('🔗 Origin:', window.location.origin);
  console.log('📊 Screen:', window.screen.width + 'x' + window.screen.height);
  console.log('📱 Platform Detection:', {
    isMobile: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent),
    isAndroid: /Android/.test(navigator.userAgent),
    isIOS: /iPhone|iPad/.test(navigator.userAgent),
    isCapacitor: window.location.protocol === 'capacitor:'
  });
}

export function logAuthState(user: any, isLoading: boolean) {
  console.log('🔐 AUTH STATE:', {
    hasUser: !!user,
    isLoading,
    userEmail: user?.email,
    timestamp: new Date().toISOString()
  });
}