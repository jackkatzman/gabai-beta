// Handle mobile-specific authentication flows
import { isNativeMobileApp } from "./device";

export function handleMobileAuthRedirect() {
  if (typeof window === 'undefined') return;
  
  const urlParams = new URLSearchParams(window.location.search);
  const isMobile = urlParams.get('mobile');
  const authSuccess = urlParams.get('auth');
  const onboarding = urlParams.get('onboarding');
  
  console.log('📱 Mobile auth handler:', {
    isMobile,
    authSuccess,
    onboarding,
    isNativeApp: isNativeMobileApp()
  });
  
  if (isMobile && authSuccess === 'success') {
    console.log('✅ Mobile authentication successful!');
    // Clean up URL parameters
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    
    // Force refresh to update auth state
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
  
  if (isMobile && onboarding === 'true') {
    console.log('🔄 Mobile user needs onboarding');
    // Handle onboarding redirect for mobile
  }
}

export function initializeMobileAuth() {
  if (typeof window === 'undefined') return;
  
  // Check URL parameters on app startup
  handleMobileAuthRedirect();
  
  // Listen for page visibility changes (when returning from OAuth)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('📱 App became visible - checking auth state');
      handleMobileAuthRedirect();
    }
  });
}