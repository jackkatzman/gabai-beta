// Web-compatible mobile OAuth handler for VoltBuilder builds
// This version avoids Capacitor imports that break web builds

export async function setupMobileAuth() {
  console.log('📱 Setting up mobile OAuth handler');
  
  // Only set up deep links in mobile environment
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    // Mobile environment - register deep link handler
    console.log('📱 Mobile environment detected - setting up deep link handler');
    
    try {
      // Check if we can import Capacitor App dynamically
      if ((window as any).Capacitor?.Plugins?.App) {
        // Use existing Capacitor App plugin
        const App = (window as any).Capacitor.Plugins.App;
        App.addListener('appUrlOpen', (data: { url: string }) => {
          console.log('🔗 Deep link received:', data.url);
          handleDeepLink(data.url);
        });
        console.log('✅ Capacitor App listener registered');
      } else {
        throw new Error('Capacitor App not available');
      }
    } catch (error) {
      console.log('⚠️ Capacitor App not available, using fallback handler');
      
      // Fallback handler for VoltBuilder/Cordova
      (window as any).handleAuthCallback = (url: string) => {
        console.log('🔗 Auth callback received:', url);
        handleDeepLink(url);
      };
    }
  } else {
    console.log('🌐 Web environment - mobile auth not needed');
  }
}

function handleDeepLink(url: string) {
  try {
    const urlObj = new URL(url);
    console.log('🔍 Processing deep link:', { protocol: urlObj.protocol, host: urlObj.hostname, path: urlObj.pathname });
    
    if (urlObj.protocol === 'gabai:' && urlObj.hostname === 'auth') {
      const token = urlObj.searchParams.get('token');
      const code = urlObj.searchParams.get('code');
      
      if (token) {
        console.log('✅ Mobile auth token received');
        completeAuthWithToken(token);
      } else if (code) {
        console.log('✅ Mobile auth code received'); 
        // Could handle OAuth code exchange here if needed
        console.log('⚠️ Code-based auth not implemented, use token flow');
      } else {
        console.log('⚠️ No token or code in deep link');
      }
    } else {
      console.log('❌ Deep link not for auth:', url);
    }
  } catch (error) {
    console.error('❌ Error processing deep link:', error);
  }
}

export async function startMobileAuth() {
  console.log('🔐 Starting VoltBuilder iframe-based OAuth flow');
  
  const API_BASE = 'https://gabai.ai';
  const state = 'voltbuilder-iframe';
  
  const oauthUrl = `${API_BASE}/api/auth/google?state=${encodeURIComponent(state)}&mobile=true&embed=true`;
  
  console.log('🔗 Creating OAuth iframe:', oauthUrl);
  
  try {
    // Create iframe for authentication instead of popup/external browser
    const iframe = document.createElement('iframe');
    iframe.src = oauthUrl;
    iframe.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90vw;
      height: 80vh;
      max-width: 400px;
      max-height: 600px;
      border: none;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      z-index: 10000;
      background: white;
    `;
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
    `;
    
    // Add to page
    document.body.appendChild(overlay);
    document.body.appendChild(iframe);
    
    console.log('✅ OAuth iframe created');
    
    // Listen for auth success messages from iframe
    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== API_BASE) return;
      
      if (event.data === 'auth_success' || event.data?.type === 'auth_success') {
        console.log('✅ Auth success message received from iframe');
        
        // Clean up iframe and overlay
        document.body.removeChild(iframe);
        document.body.removeChild(overlay);
        window.removeEventListener('message', messageHandler);
        
        // Reload to refresh auth state
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    };
    
    window.addEventListener('message', messageHandler);
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      width: 30px;
      height: 30px;
      border: none;
      border-radius: 50%;
      background: #ef4444;
      color: white;
      font-size: 16px;
      cursor: pointer;
      z-index: 10001;
    `;
    
    closeBtn.onclick = () => {
      document.body.removeChild(iframe);
      document.body.removeChild(overlay);
      window.removeEventListener('message', messageHandler);
      console.log('❌ OAuth iframe closed by user');
    };
    
    document.body.appendChild(closeBtn);
    
    // Auto-close after 5 minutes
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
        document.body.removeChild(overlay);
        if (document.body.contains(closeBtn)) {
          document.body.removeChild(closeBtn);
        }
        window.removeEventListener('message', messageHandler);
        console.log('⏰ OAuth iframe timeout');
      }
    }, 300000);
    
  } catch (error) {
    console.error('❌ Error creating OAuth iframe:', error);
    // Fallback - navigate in same window (last resort)
    window.location.href = oauthUrl;
  }
}

async function completeAuthWithToken(token: string) {
  try {
    console.log('🎫 Completing auth with token');
    
    const response = await fetch('/api/auth/mobile/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    
    if (response.ok) {
      console.log('✅ Mobile auth verification successful');
      // Reload to refresh auth state
      window.location.reload();
    } else {
      console.error('❌ Token verification failed');
    }
  } catch (error) {
    console.error('❌ Error verifying token:', error);
  }
}