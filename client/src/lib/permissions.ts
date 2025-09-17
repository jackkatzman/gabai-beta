// Permission handling for Cordova/APK environments
export class PermissionManager {
  private static instance: PermissionManager | null = null;

  static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  // Check if we're in APK/Cordova environment
  private isAPK(): boolean {
    return window.location.protocol === 'file:' || 
           window.location.hostname === 'localhost' ||
           window.location.hostname.includes('replit') ||
           /wv|Android/.test(navigator.userAgent) ||
           typeof (window as any).cordova !== 'undefined';
  }

  // Request camera permission
  async requestCameraPermission(): Promise<boolean> {
    console.log('📸 Requesting camera permission...');
    
    if (!this.isAPK()) {
      // Web: Use browser's permission API
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        console.log('✅ Camera permission granted (web)');
        return true;
      } catch (error) {
        console.error('❌ Camera permission denied:', error);
        return false;
      }
    }

    // APK/Cordova: Use plugin if available
    if ((window as any).cordova?.plugins?.permissions) {
      return new Promise((resolve) => {
        const permissions = (window as any).cordova.plugins.permissions;
        permissions.requestPermission(
          permissions.CAMERA,
          (status: any) => {
            console.log('📸 Camera permission status:', status);
            resolve(status.hasPermission);
          },
          () => {
            console.error('❌ Camera permission request failed');
            resolve(false);
          }
        );
      });
    }

    // Fallback: Try to trigger permission through getUserMedia
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      console.log('✅ Camera permission granted (fallback)');
      return true;
    } catch (error) {
      console.error('❌ Camera permission denied (fallback):', error);
      return false;
    }
  }

  // Request microphone permission
  async requestMicrophonePermission(): Promise<boolean> {
    console.log('🎤 Requesting microphone permission...');
    
    if (!this.isAPK()) {
      // Web: Use browser's permission API
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        console.log('✅ Microphone permission granted (web)');
        return true;
      } catch (error) {
        console.error('❌ Microphone permission denied:', error);
        return false;
      }
    }

    // APK/Cordova: Use plugin if available
    if ((window as any).cordova?.plugins?.permissions) {
      return new Promise((resolve) => {
        const permissions = (window as any).cordova.plugins.permissions;
        permissions.requestPermission(
          permissions.RECORD_AUDIO,
          (status: any) => {
            console.log('🎤 Microphone permission status:', status);
            resolve(status.hasPermission);
          },
          () => {
            console.error('❌ Microphone permission request failed');
            resolve(false);
          }
        );
      });
    }

    // Fallback: Try to trigger permission through getUserMedia
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      console.log('✅ Microphone permission granted (fallback)');
      return true;
    } catch (error) {
      console.error('❌ Microphone permission denied (fallback):', error);
      return false;
    }
  }

  // Request contacts permission
  async requestContactsPermission(): Promise<boolean> {
    console.log('📱 Requesting contacts permission...');
    
    if (!this.isAPK()) {
      console.log('📱 Contacts permission not needed on web');
      return true;
    }

    // APK/Cordova: Use plugin if available
    if ((window as any).cordova?.plugins?.permissions) {
      return new Promise((resolve) => {
        const permissions = (window as any).cordova.plugins.permissions;
        permissions.requestPermission(
          permissions.READ_CONTACTS,
          (status: any) => {
            console.log('📱 Contacts permission status:', status);
            resolve(status.hasPermission);
          },
          () => {
            console.error('❌ Contacts permission request failed');
            resolve(false);
          }
        );
      });
    }

    // No fallback for contacts - it's a native-only feature
    console.log('⚠️ Contacts permission not available without Cordova plugin');
    return false;
  }

  // Request all permissions at once
  async requestAllPermissions(): Promise<{
    camera: boolean;
    microphone: boolean;
    contacts: boolean;
  }> {
    const results = await Promise.all([
      this.requestCameraPermission(),
      this.requestMicrophonePermission(),
      this.requestContactsPermission()
    ]);

    return {
      camera: results[0],
      microphone: results[1],
      contacts: results[2]
    };
  }

  // Check permission status without requesting
  async checkPermission(permission: 'camera' | 'microphone' | 'contacts'): Promise<boolean> {
    if (!this.isAPK()) {
      // Web: Use Permissions API if available
      if ('permissions' in navigator) {
        try {
          const permName = permission === 'camera' ? 'camera' : 
                          permission === 'microphone' ? 'microphone' : 
                          null;
          
          if (permName) {
            const result = await navigator.permissions.query({ name: permName as PermissionName });
            return result.state === 'granted';
          }
        } catch (error) {
          console.log('⚠️ Permission check not supported:', error);
        }
      }
      return false;
    }

    // APK/Cordova: Check with plugin
    if ((window as any).cordova?.plugins?.permissions) {
      const permissions = (window as any).cordova.plugins.permissions;
      const permName = permission === 'camera' ? permissions.CAMERA :
                      permission === 'microphone' ? permissions.RECORD_AUDIO :
                      permissions.READ_CONTACTS;

      return new Promise((resolve) => {
        permissions.hasPermission(
          permName,
          (status: any) => resolve(status.hasPermission),
          () => resolve(false)
        );
      });
    }

    return false;
  }
}

export const permissionManager = PermissionManager.getInstance();