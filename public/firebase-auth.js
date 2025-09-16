// Firebase Google Authentication for Cordova/VoltBuilder
class FirebaseGoogleAuth {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    return new Promise((resolve) => {
      document.addEventListener('deviceready', async () => {
        console.log('🔥 Firebase Auth: Device ready, initializing...');
        
        // Check if Firebase plugin is available
        if (typeof FirebasePlugin === 'undefined') {
          console.error('❌ Firebase plugin not available');
          throw new Error('Firebase plugin not installed');
        }
        
        this.isInitialized = true;
        console.log('✅ Firebase Auth initialized');
        resolve();
      }, false);
    });
  }

  async signInWithGoogle() {
    try {
      await this.initialize();
      
      console.log('🔑 Attempting Google sign-in via Firebase...');
      
      // Sign in with Google using Firebase plugin
      const result = await FirebasePlugin.signInWithGoogle();
      console.log('✅ Google sign-in successful:', result);
      
      // Extract user information
      const userInfo = {
        uid: result.uid || result.user?.uid,
        email: result.email || result.user?.email,
        displayName: result.displayName || result.user?.displayName,
        photoURL: result.photoURL || result.user?.photoURL,
        idToken: result.idToken,
        accessToken: result.accessToken
      };
      
      // Send to our backend for session creation
      await this.createBackendSession(userInfo);
      
      return userInfo;
      
    } catch (error) {
      console.error('❌ Google sign-in failed:', error);
      throw error;
    }
  }

  async createBackendSession(userInfo) {
    try {
      const apiBase = window.__API_BASE__ || window.location.origin;
      
      const response = await fetch(`${apiBase}/api/auth/firebase-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          uid: userInfo.uid,
          email: userInfo.email,
          displayName: userInfo.displayName,
          photoURL: userInfo.photoURL,
          idToken: userInfo.idToken
        })
      });

      if (!response.ok) {
        throw new Error(`Backend session creation failed: ${response.status}`);
      }

      const sessionData = await response.json();
      console.log('✅ Backend session created:', sessionData);
      
      return sessionData;
      
    } catch (error) {
      console.error('❌ Failed to create backend session:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await this.initialize();
      
      // Sign out from Firebase
      await FirebasePlugin.signOut();
      
      // Clear backend session
      const apiBase = window.__API_BASE__ || window.location.origin;
      await fetch(`${apiBase}/api/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      
      console.log('✅ Successfully signed out');
      
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw error;
    }
  }

  // Fallback method using InAppBrowser
  async signInWithGoogleBrowser() {
    try {
      console.log('🌐 Using browser fallback for Google authentication...');
      
      const apiBase = window.__API_BASE__ || window.location.origin;
      const authUrl = `${apiBase}/api/login`;
      
      return new Promise((resolve, reject) => {
        const ref = cordova.InAppBrowser.open(authUrl, '_blank', 
          'location=yes,clearcache=yes,clearsessioncache=yes,toolbar=yes');
        
        const checkCompleted = setInterval(() => {
          ref.executeScript({
            code: 'window.location.href'
          }, (result) => {
            const currentUrl = result[0];
            
            // Check if auth completed (redirected to our app)
            if (currentUrl.includes('gabai://auth/callback') || 
                currentUrl.includes('/auth/success')) {
              clearInterval(checkCompleted);
              ref.close();
              resolve({ success: true });
            }
          });
        }, 1000);
        
        ref.addEventListener('exit', () => {
          clearInterval(checkCompleted);
          reject(new Error('Authentication cancelled'));
        });
      });
      
    } catch (error) {
      console.error('❌ Browser authentication failed:', error);
      throw error;
    }
  }
}

// Global instance
window.firebaseAuth = new FirebaseGoogleAuth();

// Expose methods globally for easy access
window.signInWithGoogle = () => window.firebaseAuth.signInWithGoogle();
window.signInWithGoogleBrowser = () => window.firebaseAuth.signInWithGoogleBrowser();
window.signOutFirebase = () => window.firebaseAuth.signOut();