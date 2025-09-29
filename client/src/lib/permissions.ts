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
           typeof (window as any).cordova !== 'undefined' ||
           (window as any).IS_APK === true ||
           (window as any).IS_VOLTBUILDER_APK === true;
  }

  // Request camera permission
  async requestCameraPermission(): Promise<boolean> {
    console.log('📸 Requesting camera permission...');
    
    // Check if we're in APK environment first
    if (this.isAPK() && (window as any).cordova?.plugins?.permissions) {
      console.log('📸 Using Cordova permissions plugin for camera');
      
      return new Promise((resolve) => {
        const permissions = (window as any).cordova.plugins.permissions;
        
        // First check if we already have permission
        permissions.hasPermission(permissions.CAMERA, 
          (status: any) => {
            console.log('📸 Current camera permission status:', status);
            
            if (status.hasPermission) {
              console.log('✅ Camera permission already granted');
              resolve(true);
            } else {
              // Request permission
              console.log('📸 Requesting camera permission from user...');
              permissions.requestPermission(
                permissions.CAMERA,
                (status: any) => {
                  console.log('📸 Camera permission result:', status);
                  if (status.hasPermission) {
                    console.log('✅ Camera permission granted');
                  } else {
                    console.log('❌ Camera permission denied');
                  }
                  resolve(status.hasPermission);
                },
                () => {
                  console.error('❌ Camera permission request failed');
                  resolve(false);
                }
              );
            }
          },
          () => {
            console.error('❌ Failed to check camera permission');
            resolve(false);
          }
        );
      });
    }
    
    // Web or fallback: Use browser's permission API
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      console.log('✅ Camera permission granted (web/fallback)');
      return true;
    } catch (error) {
      console.error('❌ Camera permission denied:', error);
      return false;
    }
  }

  // Request microphone permission
  async requestMicrophonePermission(): Promise<boolean> {
    console.log('🎤 Requesting microphone permission...');
    
    // Check if we're in APK environment first
    if (this.isAPK() && (window as any).cordova?.plugins?.permissions) {
      console.log('🎤 Using Cordova permissions plugin for microphone');
      
      return new Promise((resolve) => {
        const permissions = (window as any).cordova.plugins.permissions;
        
        // First check if we already have permission
        permissions.hasPermission(permissions.RECORD_AUDIO, 
          (status: any) => {
            console.log('🎤 Current microphone permission status:', status);
            
            if (status.hasPermission) {
              console.log('✅ Microphone permission already granted');
              resolve(true);
            } else {
              // Request permission
              console.log('🎤 Requesting microphone permission from user...');
              permissions.requestPermission(
                permissions.RECORD_AUDIO,
                (status: any) => {
                  console.log('🎤 Microphone permission result:', status);
                  if (status.hasPermission) {
                    console.log('✅ Microphone permission granted');
                  } else {
                    console.log('❌ Microphone permission denied');
                  }
                  resolve(status.hasPermission);
                },
                () => {
                  console.error('❌ Microphone permission request failed');
                  resolve(false);
                }
              );
            }
          },
          () => {
            console.error('❌ Failed to check microphone permission');
            resolve(false);
          }
        );
      });
    }
    
    // Web or fallback: Use browser's permission API
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      console.log('✅ Microphone permission granted (web/fallback)');
      return true;
    } catch (error) {
      console.error('❌ Microphone permission denied:', error);
      return false;
    }
  }

  // Request contacts permission
  async requestContactsPermission(): Promise<boolean> {
    console.log('📱 Requesting contacts permission...');
    
    // Check if we're in APK environment first
    if (this.isAPK() && (window as any).cordova?.plugins?.permissions) {
      console.log('📱 Using Cordova permissions plugin for contacts');
      
      return new Promise((resolve) => {
        const permissions = (window as any).cordova.plugins.permissions;
        
        // First check if we already have permission
        permissions.hasPermission(permissions.READ_CONTACTS, 
          (status: any) => {
            console.log('📱 Current contacts permission status:', status);
            
            if (status.hasPermission) {
              console.log('✅ Contacts permission already granted');
              resolve(true);
            } else {
              // Request permission
              console.log('📱 Requesting contacts permission from user...');
              permissions.requestPermission(
                permissions.READ_CONTACTS,
                (status: any) => {
                  console.log('📱 Contacts permission result:', status);
                  if (status.hasPermission) {
                    console.log('✅ Contacts permission granted');
                  } else {
                    console.log('❌ Contacts permission denied');
                  }
                  resolve(status.hasPermission);
                },
                () => {
                  console.error('❌ Contacts permission request failed');
                  resolve(false);
                }
              );
            }
          },
          () => {
            console.error('❌ Failed to check contacts permission');
            resolve(false);
          }
        );
      });
    }
    
    // Web: Contacts not available
    if (!this.isAPK()) {
      console.log('📱 Contacts permission not needed on web');
      return true;
    }
    
    // No plugin available
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