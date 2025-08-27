// Mobile authentication bypass for WebView environments
import { isNativeMobileApp } from "./device";

export function shouldUseMobileBypass(): boolean {
  // Check if we're in a mobile APK/WebView environment that needs custom auth
  const hasWebView = /wv/i.test(navigator.userAgent);
  const isReplit = window.location.hostname.includes('replit');
  const isAPK = hasWebView && isReplit;
  const isVoltBuilderAPK = hasWebView;
  
  console.log('🔍 Mobile bypass check:', {
    userAgent: navigator.userAgent.substring(0, 100),
    hasWV: hasWebView,
    hostname: window.location.hostname,
    isAPK,
    isVoltBuilderAPK
  });
  
  // Always return true for WebView environments to show "Sign In with Email"
  return hasWebView;
}

export async function createMobileTestUser() {
  if (!shouldUseMobileBypass()) return null;

  try {
    console.log('📱 Creating mobile test user for WebView environment');

    const response = await fetch('/api/auth/mobile-bypass', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          timestamp: new Date().toISOString()
        }
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Mobile test user created');
      return result;
    } else {
      console.error('❌ Mobile bypass failed:', response.status);
      return null;
    }
  } catch (error) {
    console.error('❌ Mobile bypass error:', error);
    return null;
  }
}