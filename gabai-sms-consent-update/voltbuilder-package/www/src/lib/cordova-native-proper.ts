// Proper Cordova implementation using the actual plugin APIs
// Based on ChatGPT's recommendations and architect analysis

declare global {
  interface Window {
    cordova: any;
    device: any;
    navigator: any;
  }
}

let deviceReady = false;
const deviceReadyCallbacks: Array<() => void> = [];

// Wait for deviceready
if (typeof window !== 'undefined' && window.cordova) {
  document.addEventListener('deviceready', () => {
    console.log('📱 Device ready!');
    deviceReady = true;
    deviceReadyCallbacks.forEach(cb => cb());
    deviceReadyCallbacks.length = 0;
  }, false);
}

function waitForDeviceReady(): Promise<void> {
  return new Promise((resolve) => {
    if (deviceReady) {
      resolve();
    } else {
      deviceReadyCallbacks.push(resolve);
    }
  });
}

export const CordovaProper = {
  isAvailable(): boolean {
    return typeof window !== 'undefined' && 
           window.cordova !== undefined;
  },

  // Request microphone permission using the proper plugin API
  async requestMicrophonePermission(): Promise<boolean> {
    console.log('🎤 Requesting microphone permission...');
    
    if (!this.isAvailable()) {
      console.log('❌ Not in Cordova environment');
      return false;
    }

    await waitForDeviceReady();

    return new Promise((resolve) => {
      try {
        // Check if android-permissions plugin is available
        if (window.cordova?.plugins?.permissions) {
          const permissions = window.cordova.plugins.permissions;
          
          // Check current permission status
          permissions.checkPermission(
            permissions.RECORD_AUDIO,
            (status: any) => {
              console.log('📱 Current permission status:', status);
              
              if (status.hasPermission) {
                console.log('✅ Already have microphone permission');
                resolve(true);
              } else {
                console.log('📱 Requesting permission from user...');
                
                // Request permission
                permissions.requestPermission(
                  permissions.RECORD_AUDIO,
                  (status: any) => {
                    console.log('📱 Permission request result:', status);
                    resolve(status.hasPermission);
                  },
                  (error: any) => {
                    console.error('❌ Permission request error:', error);
                    resolve(false);
                  }
                );
              }
            },
            (error: any) => {
              console.error('❌ Permission check error:', error);
              resolve(false);
            }
          );
        } else if (window.cordova?.plugins?.diagnostic) {
          // Alternative: Use diagnostic plugin
          const diagnostic = window.cordova.plugins.diagnostic;
          
          diagnostic.getMicrophoneAuthorizationStatus((status: string) => {
            console.log('📱 Microphone auth status:', status);
            
            if (status === diagnostic.permissionStatus.GRANTED) {
              console.log('✅ Already have microphone permission');
              resolve(true);
            } else {
              diagnostic.requestMicrophoneAuthorization((status: string) => {
                console.log('📱 Permission request result:', status);
                resolve(status === diagnostic.permissionStatus.GRANTED);
              }, (error: any) => {
                console.error('❌ Permission request error:', error);
                resolve(false);
              });
            }
          }, (error: any) => {
            console.error('❌ Permission check error:', error);
            resolve(false);
          });
        } else {
          console.error('❌ No permission plugin available');
          resolve(false);
        }
      } catch (error) {
        console.error('❌ Permission request failed:', error);
        resolve(false);
      }
    });
  },

  // Record audio using the proper media-capture plugin API
  async recordAudio(duration: number = 60): Promise<File> {
    console.log('🎙️ Starting audio recording...');
    
    if (!this.isAvailable()) {
      throw new Error('Not in Cordova environment');
    }

    await waitForDeviceReady();

    return new Promise((resolve, reject) => {
      // Check if media-capture plugin is available
      if (!navigator.device?.capture?.captureAudio) {
        console.error('❌ Media capture plugin not available');
        reject(new Error('Media capture plugin not available'));
        return;
      }

      console.log('📱 Using navigator.device.capture.captureAudio...');
      
      // Success callback
      const captureSuccess = (mediaFiles: any[]) => {
        console.log('✅ Audio captured successfully:', mediaFiles);
        
        if (mediaFiles && mediaFiles.length > 0) {
          const mediaFile = mediaFiles[0];
          console.log('📁 Media file:', {
            fullPath: mediaFile.fullPath,
            localURL: mediaFile.localURL,
            name: mediaFile.name,
            size: mediaFile.size,
            type: mediaFile.type
          });
          
          // Convert to File object
          window.resolveLocalFileSystemURL(
            mediaFile.localURL || mediaFile.fullPath,
            (fileEntry: any) => {
              fileEntry.file((file: File) => {
                console.log('✅ Converted to File object:', file);
                resolve(file);
              }, (error: any) => {
                console.error('❌ Failed to get file:', error);
                reject(error);
              });
            },
            (error: any) => {
              console.error('❌ Failed to resolve file URL:', error);
              reject(error);
            }
          );
        } else {
          reject(new Error('No audio file captured'));
        }
      };

      // Error callback
      const captureError = (error: any) => {
        console.error('❌ Audio capture error:', error);
        
        // Handle different error codes
        let errorMessage = 'Audio capture failed';
        if (error.code === 0) {
          errorMessage = 'Camera/microphone not supported';
        } else if (error.code === 1) {
          errorMessage = 'No media files returned';
        } else if (error.code === 2) {
          errorMessage = 'Capture application busy';
        } else if (error.code === 3) {
          errorMessage = 'Invalid capture configuration';
        } else if (error.code === 20) {
          errorMessage = 'Permission denied';
        }
        
        reject(new Error(errorMessage + ': ' + (error.message || '')));
      };

      // Capture options
      const options = {
        limit: 1,
        duration: duration
      };

      console.log('📱 Calling captureAudio with options:', options);
      
      // Start capture
      navigator.device.capture.captureAudio(
        captureSuccess,
        captureError,
        options
      );
    });
  },

  // Initialize permissions on app startup
  async initializePermissions(): Promise<void> {
    console.log('🚀 Initializing Cordova permissions...');
    
    if (!this.isAvailable()) {
      console.log('❌ Not in Cordova environment');
      return;
    }

    await waitForDeviceReady();

    // Log available plugins
    console.log('📱 Available plugins:', {
      permissions: !!window.cordova?.plugins?.permissions,
      diagnostic: !!window.cordova?.plugins?.diagnostic,
      mediaCapture: !!navigator.device?.capture,
      camera: !!navigator.camera
    });

    // Request microphone permission proactively
    const hasMicPermission = await this.requestMicrophonePermission();
    console.log('🎤 Microphone permission:', hasMicPermission ? 'granted' : 'denied');
  }
};