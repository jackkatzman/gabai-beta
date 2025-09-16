// Automatic authentication for VoltBuilder APK
export async function triggerAPKAuthentication() {
  console.log('🚀 APK Auto-auth: Starting authentication...');
  
  try {
    const response = await fetch('/api/auth/mobile-bypass', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for cookies
      body: JSON.stringify({
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          timestamp: new Date().toISOString(),
          apkMode: true
        }
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ APK Auto-auth: Success', result.message);
      return result;
    } else {
      const error = await response.text();
      console.error('❌ APK Auto-auth: Failed', response.status, error);
      return null;
    }
  } catch (error) {
    console.error('❌ APK Auto-auth: Exception', error);
    return null;
  }
}

export function isVoltBuilderAPK(): boolean {
  const userAgent = navigator.userAgent || '';
  return userAgent.includes('wv') && 
         userAgent.includes('Android') && 
         userAgent.includes('Chrome');
}

export function shouldAutoAuth(): boolean {
  return isVoltBuilderAPK() || 
         (import.meta.env.DEV && /Mobile|Android/i.test(navigator.userAgent));
}