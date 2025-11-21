// Simple mobile authentication handler (no Capacitor dependencies)

let isSetup = false;

export function setupDeepLinkHandler() {
  if (isSetup) return;
  isSetup = true;
  
  console.log('🔗 Setting up mobile auth handler (simplified)');
  
  // Listen for visibility changes to detect return from browser
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('📱 App became visible - checking for auth updates');
      
      // Check if we have mobile auth completion flags
      const authInProgress = localStorage.getItem('gabai_mobile_auth_in_progress');
      if (authInProgress) {
        console.log('🔍 Mobile auth was in progress, checking for completion');
        
        // Give the server a moment to process authentication
        setTimeout(async () => {
          try {
            const response = await fetch('/api/auth/user');
            const user = await response.json();
            
            if (user && !user.error) {
              console.log('✅ Mobile auth completed successfully');
              localStorage.removeItem('gabai_mobile_auth_in_progress');
              localStorage.removeItem('gabai_mobile_auth_timestamp');
              
              // Dispatch custom event to trigger immediate auth refetch
              const authEvent = new CustomEvent('gabai-auth-token', { detail: { user } });
              window.dispatchEvent(authEvent);
              console.log('🔔 Dispatched gabai-auth-token event');
              
              // Wait a bit for auth refetch before reload
              setTimeout(() => {
                window.location.reload();
              }, 500);
            }
          } catch (error) {
            console.log('❌ Auth check failed:', error);
          }
        }, 1000);
      }
    }
  });
  
  console.log('✅ Mobile auth handler setup complete');
}