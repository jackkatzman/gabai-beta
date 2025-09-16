// Native Firebase authentication bridge for VoltBuilder/Capacitor
// Uses FirebasePlugin when available, falls back to web SDK for browser

declare global {
  interface Window {
    __CORDOVA_READY__?: boolean;
    FirebasePlugin?: {
      signInWithGoogle(): Promise<{
        idToken: string;
        accessToken: string;
        user: {
          uid: string;
          email: string;
          displayName: string;
          photoURL?: string;
        };
      }>;
      verifyPhoneNumber(
        phoneNumber: string, 
        timeoutDuration: number,
        successCallback: (verificationId: string) => void,
        errorCallback: (error: string) => void
      ): void;
      confirmCode(
        verificationId: string,
        code: string,
        successCallback: (result: any) => void,
        errorCallback: (error: string) => void
      ): void;
    };
  }
}

// Wait for Cordova to be ready before checking Firebase plugin
function waitForCordova(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.__CORDOVA_READY__ === true) {
      console.log('✅ Cordova already ready');
      resolve(true);
      return;
    }
    
    if (window.__CORDOVA_READY__ === false) {
      console.log('🌐 Not a Cordova environment');
      resolve(false);
      return;
    }
    
    // Wait for cordova-ready event
    const handleCordovaReady = () => {
      console.log('🔥 Received cordova-ready event');
      window.removeEventListener('cordova-ready', handleCordovaReady);
      resolve(window.__CORDOVA_READY__ === true);
    };
    
    window.addEventListener('cordova-ready', handleCordovaReady);
    
    // Timeout after 5 seconds
    setTimeout(() => {
      console.log('⏰ Cordova wait timeout');
      window.removeEventListener('cordova-ready', handleCordovaReady);
      resolve(false);
    }, 5000);
  });
}

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  };
  error?: string;
}

export interface PhoneAuthResult {
  success: boolean;
  verificationId?: string;
  error?: string;
}

export interface PhoneVerifyResult {
  success: boolean;
  user?: {
    id: string;
    phone: string;
    name?: string;
  };
  error?: string;
}

// Check if native Firebase plugin is available (after Cordova is ready)
export async function isNativeFirebaseAvailable(): Promise<boolean> {
  console.log('🔍 Starting Firebase plugin detection...');
  
  const cordovaReady = await waitForCordova();
  
  if (!cordovaReady) {
    console.log('📱 Cordova not available - using web auth');
    return false;
  }
  
  console.log('✅ Cordova ready, waiting for plugins...');
  
  // Give plugins extra time to load after Cordova ready
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Detailed debugging
  console.log('🔍 window object exists:', typeof window !== 'undefined');
  console.log('🔍 window.FirebasePlugin exists:', typeof window.FirebasePlugin);
  console.log('🔍 window.FirebasePlugin value:', window.FirebasePlugin);
  
  if (typeof window.FirebasePlugin === 'object' && window.FirebasePlugin) {
    console.log('🔍 FirebasePlugin methods:', Object.keys(window.FirebasePlugin));
  }
  
  const hasFirebasePlugin = typeof window !== 'undefined' && 
                           typeof window.FirebasePlugin !== 'undefined' &&
                           window.FirebasePlugin !== null &&
                           typeof window.FirebasePlugin.signInWithGoogle === 'function';
  
  console.log('🔥 Firebase plugin available:', hasFirebasePlugin);
  
  if (!hasFirebasePlugin) {
    console.log('❌ Firebase plugin detection failed - falling back to web auth');
  }
  
  return hasFirebasePlugin;
}

// Native Google Sign-In
export async function signInWithGoogleNative(): Promise<AuthResult> {
  console.log('🔥 Starting native Google sign-in');
  
  if (!(await isNativeFirebaseAvailable())) {
    return {
      success: false,
      error: 'Native Firebase plugin not available'
    };
  }

  try {
    const result = await window.FirebasePlugin!.signInWithGoogle();
    console.log('✅ Native Google sign-in successful');
    
    return {
      success: true,
      user: {
        id: result.user.uid,
        email: result.user.email,
        name: result.user.displayName || result.user.email,
        avatar: result.user.photoURL || undefined
      }
    };
  } catch (error) {
    console.error('❌ Native Google sign-in failed:', error);
    return {
      success: false,
      error: `Google sign-in failed: ${error}`
    };
  }
}

// Native Phone Authentication
export async function verifyPhoneNumberNative(phoneNumber: string): Promise<PhoneAuthResult> {
  console.log('📱 Starting native phone verification for:', phoneNumber);
  
  if (!(await isNativeFirebaseAvailable())) {
    return {
      success: false,
      error: 'Native Firebase plugin not available'
    };
  }

  return new Promise((resolve) => {
    window.FirebasePlugin!.verifyPhoneNumber(
      phoneNumber,
      60, // 60 seconds timeout
      (verificationId: string) => {
        console.log('✅ Phone verification SMS sent, verification ID:', verificationId);
        resolve({
          success: true,
          verificationId
        });
      },
      (error: string) => {
        console.error('❌ Phone verification failed:', error);
        resolve({
          success: false,
          error: `Phone verification failed: ${error}`
        });
      }
    );
  });
}

// Confirm Phone Code
export async function confirmPhoneCodeNative(verificationId: string, code: string): Promise<PhoneVerifyResult> {
  console.log('🔢 Confirming phone code');
  
  if (!(await isNativeFirebaseAvailable())) {
    return {
      success: false,
      error: 'Native Firebase plugin not available'
    };
  }

  return new Promise((resolve) => {
    window.FirebasePlugin!.confirmCode(
      verificationId,
      code,
      (result: any) => {
        console.log('✅ Phone code confirmed successfully');
        resolve({
          success: true,
          user: {
            id: result.uid || `phone-${Date.now()}`,
            phone: result.phoneNumber || 'unknown',
            name: result.displayName || 'Phone User'
          }
        });
      },
      (error: string) => {
        console.error('❌ Phone code confirmation failed:', error);
        resolve({
          success: false,
          error: `Code confirmation failed: ${error}`
        });
      }
    );
  });
}

// Unified authentication method that chooses native vs web
export async function authenticateWithGoogle(): Promise<AuthResult> {
  console.log('🔍 Checking authentication method...');
  
  if (await isNativeFirebaseAvailable()) {
    console.log('📱 Using native Firebase authentication');
    return await signInWithGoogleNative();
  } else {
    console.log('🌐 Native Firebase not available - falling back to web auth');
    return {
      success: false,
      error: 'Please use web authentication in browser environment'
    };
  }
}