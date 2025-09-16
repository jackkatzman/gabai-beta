// Simplified Cordova native functionality for v11 debugging
// Focus on getting microphone working with extensive logging

declare global {
  interface Window {
    cordova: any;
    device: any;
    resolveLocalFileSystemURL: any;
    Camera: any;
    ContactsX: any;
    plugins: any;
    Android: any;
  }
  interface Navigator {
    camera: any;
    device: any;
  }
}

export const CordovaNativeSimple = {
  // Check if running in Cordova environment
  isAvailable(): boolean {
    const available = typeof window.cordova !== 'undefined';
    console.log(`📱 Cordova available: ${available}`);
    return available;
  },

  // Initialize and log plugin status
  async initializeAndLog(): Promise<void> {
    if (!this.isAvailable()) {
      console.log('🌐 Not in Cordova environment');
      return;
    }

    console.log('=== 🔍 CORDOVA PLUGIN STATUS ===');
    console.log('📱 Cordova version:', window.cordova?.version);
    console.log('📱 Platform:', window.cordova?.platformId);
    
    // Check plugins
    const pluginChecks = {
      'android-permissions': !!window.cordova?.plugins?.permissions,
      'diagnostic': !!window.cordova?.plugins?.diagnostic,
      'camera': !!navigator.camera,
      'media-capture': !!navigator.device?.capture,
      'contacts-x': !!(window.ContactsX || (window.navigator as any)?.contactsX),
      'file': !!window.resolveLocalFileSystemURL,
      'file-opener2': !!window.cordova?.plugins?.fileOpener2,
      'inappbrowser': !!window.cordova?.InAppBrowser || !!window.cordova?.plugins?.inappbrowser
    };

    console.log('🔌 Plugin availability:');
    Object.entries(pluginChecks).forEach(([name, available]) => {
      console.log(`  ${available ? '✅' : '❌'} ${name}`);
    });

    // Log permission plugin details if available
    const perms = window.cordova?.plugins?.permissions;
    if (perms) {
      console.log('📋 Android Permissions Plugin Details:');
      const permConstants = Object.keys(perms).filter(k => k === k.toUpperCase());
      console.log('  Available permission constants:', permConstants.slice(0, 10));
      console.log('  RECORD_AUDIO exists:', !!perms.RECORD_AUDIO);
      console.log('  CAMERA exists:', !!perms.CAMERA);
    }

    // Log diagnostic plugin details if available
    const diagnostic = window.cordova?.plugins?.diagnostic;
    if (diagnostic) {
      console.log('🏥 Diagnostic Plugin Details:');
      console.log('  Has requestRuntimePermission:', typeof diagnostic.requestRuntimePermission === 'function');
      console.log('  Has requestRuntimePermissions:', typeof diagnostic.requestRuntimePermissions === 'function');
      console.log('  Has getPermissionAuthorizationStatus:', typeof diagnostic.getPermissionAuthorizationStatus === 'function');
      if (diagnostic.permission) {
        console.log('  Permission constants:', Object.keys(diagnostic.permission).slice(0, 10));
      }
    }

    console.log('=== END PLUGIN STATUS ===');
  },

  // Request microphone permission for audio recording (storage not needed on Android 10+)
  async requestMicrophonePermissionSimple(): Promise<boolean> {
    console.log('🎤 === MICROPHONE PERMISSION REQUEST START ===');
    
    if (!this.isAvailable()) {
      console.log('🎤 Not in Cordova, returning true');
      return true;
    }

    // Log current state
    console.log('🎤 Document ready state:', document.readyState);
    console.log('🎤 Cordova plugins object exists:', !!window.cordova?.plugins);
    
    // Add a delay to ensure plugins are loaded
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return new Promise((resolve) => {
      // Add a timeout to prevent hanging forever
      const timeout = setTimeout(() => {
        console.error('🎤 Permission request timed out after 10 seconds');
        resolve(false);
      }, 10000);
      
      const attemptPermissionRequest = () => {
        console.log('🎤 Attempting permission request...');
        
        const perms = window.cordova?.plugins?.permissions;
        
        if (!perms) {
          console.error('❌ Android permissions plugin not available');
          console.log('Available plugins:', Object.keys(window.cordova?.plugins || {}));
          
          // Try diagnostic as fallback
          const diagnostic = window.cordova?.plugins?.diagnostic;
          if (diagnostic) {
            console.log('🔄 Trying diagnostic plugin as fallback...');
            
            // For diagnostic plugin v7.1.4 - request ONLY microphone
            if (typeof diagnostic.requestRuntimePermissions === 'function') {
              console.log('📱 Using diagnostic requestRuntimePermissions for microphone');
              diagnostic.requestRuntimePermissions(
                (statuses: any) => {
                  console.log('📊 Permission statuses:', statuses);
                  const audioStatus = statuses['android.permission.RECORD_AUDIO'];
                  
                  const audioGranted = audioStatus === 'GRANTED' || audioStatus === diagnostic.permissionStatus?.GRANTED;
                  
                  console.log(`🎤 Microphone: ${audioGranted ? 'GRANTED' : 'DENIED'}`);
                  
                  clearTimeout(timeout);
                  resolve(audioGranted);
                },
                (error: any) => {
                  console.error('❌ Diagnostic permission error:', error);
                  clearTimeout(timeout);
                  resolve(false);
                },
                ['android.permission.RECORD_AUDIO']
              );
            } else {
              console.error('❌ Diagnostic plugin missing requestRuntimePermissions method');
              clearTimeout(timeout);
              resolve(false);
            }
          } else {
            console.error('❌ No permission plugins available at all');
            clearTimeout(timeout);
            resolve(false);
          }
          return;
        }

        console.log('✅ Android permissions plugin found');
        
        // Only check for microphone permission (storage not needed on Android 10+)
        const requiredPerms = [];
        if (perms.RECORD_AUDIO) {
          requiredPerms.push(perms.RECORD_AUDIO);
          console.log('✅ RECORD_AUDIO constant found');
        } else {
          console.error('❌ RECORD_AUDIO constant not found');
        }
        
        if (requiredPerms.length === 0) {
          console.error('❌ No permission constants found');
          console.log('Available constants:', Object.keys(perms).filter(k => k === k.toUpperCase()));
          clearTimeout(timeout);
          resolve(false);
          return;
        }

        console.log('🔍 Requesting microphone permission...');
        
        // Request all permissions at once using requestPermissions (plural)
        if (perms.requestPermissions && requiredPerms.length > 1) {
          console.log('📱 Requesting multiple permissions together...');
          perms.requestPermissions(
            requiredPerms,
            (results: any) => {
              console.log('📊 Permission results:', results);
              const audioGranted = !perms.RECORD_AUDIO || results[perms.RECORD_AUDIO];
              console.log(`🎤 Microphone: ${audioGranted ? '✅' : '❌'}`);
              clearTimeout(timeout);
              resolve(audioGranted);
            },
            (error: any) => {
              console.error('❌ Failed to request permissions:', error);
              clearTimeout(timeout);
              resolve(false);
            }
          );
        } else {
          // Fallback to single permission request for RECORD_AUDIO
          console.log('📱 Requesting single permission (RECORD_AUDIO)...');
          perms.checkPermission(
            perms.RECORD_AUDIO,
            (status: any) => {
              console.log('📊 Current RECORD_AUDIO status:', status);
              
              if (status.hasPermission) {
                console.log('✅ Microphone already granted');
                clearTimeout(timeout);
                resolve(true);
              } else {
                console.log('📱 Requesting microphone permission...');
                perms.requestPermission(
                  perms.RECORD_AUDIO,
                  () => {
                    console.log('✅ Microphone granted');
                    clearTimeout(timeout);
                    resolve(true);
                  },
                  (error: any) => {
                    console.error('❌ Microphone denied:', error);
                    clearTimeout(timeout);
                    resolve(false);
                  }
                );
              }
            },
            (error: any) => {
              console.error('❌ Failed to check permissions:', error);
              clearTimeout(timeout);
              resolve(false);
            }
          );
        }
      };

      // Ensure we're ready
      if (document.readyState === 'complete' && window.cordova) {
        console.log('🎤 Document ready, proceeding immediately');
        // Add small delay to ensure plugins are fully loaded
        setTimeout(attemptPermissionRequest, 100);
      } else {
        console.log('🎤 Waiting for deviceready event...');
        document.addEventListener('deviceready', () => {
          console.log('🎤 Deviceready fired!');
          setTimeout(attemptPermissionRequest, 100);
        }, { once: true });
      }
    });
  },

  // Record audio with extensive logging
  async recordAudio(duration: number = 60): Promise<File> {
    console.log('🎙️ === AUDIO RECORDING START ===');
    console.log('🎙️ Duration requested:', duration);
    
    if (!this.isAvailable()) {
      throw new Error('Not in Cordova environment');
    }

    // Skip permission check - permissions are handled on app startup
    console.log('🎙️ Proceeding with recording (permissions already granted)...');
    
    // Small delay to ensure everything is ready
    await new Promise(resolve => setTimeout(resolve, 200));

    console.log('🎙️ Step 2: Checking media capture plugin...');
    
    // Check if media capture is available
    if (!navigator.device) {
      console.error('❌ navigator.device is undefined');
      throw new Error('Device plugin not available');
    }

    console.log('✅ navigator.device exists');
    console.log('📱 Device properties:', Object.keys(navigator.device));

    if (!navigator.device.capture) {
      console.error('❌ navigator.device.capture is undefined');
      console.log('💡 This means cordova-plugin-media-capture is not loaded');
      throw new Error('Media capture plugin not available');
    }

    console.log('✅ Media capture plugin found');
    console.log('📱 Capture methods:', Object.keys(navigator.device.capture));

    return new Promise((resolve, reject) => {
      console.log('🎙️ Step 3: Calling captureAudio...');
      console.log('🎙️ Options:', { limit: 1, duration });

      try {
        navigator.device.capture.captureAudio(
          (mediaFiles: any[]) => {
            console.log('✅ === CAPTURE SUCCESS ===');
            console.log('📁 Media files received:', mediaFiles);
            
            if (mediaFiles && mediaFiles.length > 0) {
              const audioFile = mediaFiles[0];
              console.log('🎵 Audio file details:', {
                name: audioFile.name,
                fullPath: audioFile.fullPath,
                type: audioFile.type,
                size: audioFile.size
              });
              
              // Convert to File object
              window.resolveLocalFileSystemURL(audioFile.fullPath,
                (fileEntry: any) => {
                  console.log('📁 File entry resolved');
                  fileEntry.file((file: File) => {
                    console.log('✅ File object created');
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
              console.error('❌ No media files in result');
              reject(new Error('No audio recorded'));
            }
          },
          (error: any) => {
            console.error('❌ === CAPTURE ERROR ===');
            console.error('Error object:', error);
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
            
            // Check if it's a permission error
            if (error.message && error.message.includes('Permission')) {
              console.error('🔒 This is a permission error - permission was not actually granted');
            }
            
            reject(new Error(error.message || 'Audio capture failed'));
          },
          { limit: 1, duration }
        );
      } catch (e: any) {
        console.error('❌ === EXCEPTION ===');
        console.error('Exception calling captureAudio:', e);
        console.error('Stack:', e.stack);
        reject(e);
      }
    });
  }
};