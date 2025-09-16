// Import types and conditional imports
interface AppUrlOpenEvent {
  url: string;
}

export async function setupDeepLinkAuth() {
  console.log('🔗 Setting up deep link OAuth handler');
  
  // Check if Capacitor is available
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    try {
      // Listen for deep link returns from OAuth
      const { App } = await import('@capacitor/app');
      App.addListener('appUrlOpen', async ({ url }: AppUrlOpenEvent) => {
    console.log('🔗 Deep link received:', url);
    
    try {
      const urlObj = new URL(url);
      
      // Check if this is our OAuth callback
      if (urlObj.protocol === 'gabai:' && 
          urlObj.hostname === 'auth' && 
          urlObj.pathname === '/callback') {
        
        console.log('✅ OAuth callback deep link detected');
        
        // Extract token or code from URL
        const token = urlObj.searchParams.get('token');
        const code = urlObj.searchParams.get('code');
        const error = urlObj.searchParams.get('error');
        
        if (error) {
          console.error('❌ OAuth error:', error);
          return;
        }
        
        if (token) {
          console.log('🎫 Token received, completing login');
          await completeLoginWithToken(token);
        } else if (code) {
          console.log('🔑 Code received, exchanging for token');
          await exchangeCodeForToken(code);
        }
        
        // Close browser if still open
        try {
          const { Browser } = await import('@capacitor/browser');
          await Browser.close();
        } catch (e) {
          // Browser might already be closed
        }
        
        // Reload to refresh auth state
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Error processing deep link:', error);
    }
      });
    } catch (error) {
      console.log('⚠️ Capacitor App plugin not available');
    }
  } else {
    console.log('🌐 Web environment - deep links not needed');
  }
}

async function completeLoginWithToken(token: string) {
  try {
    // Store token and validate with server
    const response = await fetch('/api/auth/mobile/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    
    if (response.ok) {
      console.log('✅ Mobile auth verification successful');
      // Token is now stored in session
    } else {
      console.error('❌ Token verification failed');
    }
  } catch (error) {
    console.error('❌ Error verifying token:', error);
  }
}

async function exchangeCodeForToken(code: string) {
  try {
    const response = await fetch('/api/auth/mobile/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    
    if (response.ok) {
      console.log('✅ Code exchange successful');
      // Session is now established
    } else {
      console.error('❌ Code exchange failed');
    }
  } catch (error) {
    console.error('❌ Error exchanging code:', error);
  }
}

export async function startExternalOAuth() {
  try {
    console.log('🌐 Starting external OAuth flow');
    
    // Build OAuth URL with deep link redirect
    const API_BASE = 'https://gabai.ai';
    const redirectUri = 'gabai://auth/callback';
    const state = 'mobile-app';
    
    const oauthUrl = `${API_BASE}/api/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
    
    console.log('🔗 Opening OAuth URL:', oauthUrl);
    
    // Check if we're in a Capacitor environment
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      try {
        // Open in external browser
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({
          url: oauthUrl,
          windowName: '_system'
        });
        console.log('✅ External browser opened for OAuth');
      } catch (error) {
        console.log('⚠️ Capacitor Browser not available, using fallback');
        // Fallback to window.open for non-Capacitor environments
        window.open(oauthUrl, '_blank');
      }
    } else {
      // Web environment fallback
      console.log('🌐 Web environment - using window.open');
      window.open(oauthUrl, '_blank');
    }
  } catch (error) {
    console.error('❌ Error starting external OAuth:', error);
    throw error;
  }
}