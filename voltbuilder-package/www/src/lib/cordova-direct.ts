// Direct Cordova plugin usage - no wrappers, no complexity
// Just the simple approach that worked before

// Extend Window interface for Cordova-specific properties
interface CordovaWindow extends Window {
  cordova?: any;
  device?: any;
  Camera?: any;
  Media?: any;  // Media plugin for direct audio recording
  resolveLocalFileSystemURL?: any;
}

// Global state for audio recording
let activeMediaRecorder: any = null;
let activeRecordingPath: string = '';
let isCurrentlyRecording = false;
let recordingStopResolver: ((value: void) => void) | null = null;

// Camera result to Blob converter - handles all formats
async function toImageBlob(input: any, fallbackMime = 'image/jpeg'): Promise<Blob> {
  // Already a Blob/File?
  if (input instanceof Blob) return input;

  // FILE_URI (file:// or cdvfile://) -> read bytes
  if (typeof input === 'string' && /^(file|cdvfile):\/\//i.test(input)) {
    return new Promise((resolve, reject) => {
      (window as any).resolveLocalFileSystemURL(input, (entry: any) => {
        entry.file((file: any) => {
          const r = new FileReader();
          r.onloadend = () => resolve(new Blob([r.result as ArrayBuffer], { type: file.type || fallbackMime }));
          r.onerror = reject;
          r.readAsArrayBuffer(file);
        }, reject);
      }, reject);
    });
  }

  // DATA_URL with or without double-prefix
  if (typeof input === 'string' && input.startsWith('data:')) {
    const lastIndex = input.lastIndexOf('base64,');
    const payload = lastIndex >= 0 ? input.slice(lastIndex + 'base64,'.length) : input;
    const mimeMatch = /^data:([^;]+);/i.exec(input);
    const mime = mimeMatch ? mimeMatch[1] : fallbackMime;
    return base64ToBlob(payload, mime);
  }

  // Base64-only string
  if (typeof input === 'string' && /^[A-Za-z0-9+/=]+$/.test(input.slice(0, 64))) {
    return base64ToBlob(input, fallbackMime);
  }

  // Unknown or object-like with .data
  if (input && typeof input === 'object' && typeof input.data === 'string') {
    return base64ToBlob(input.data, input.mime || fallbackMime);
  }

  throw new Error('Unsupported camera result format');
}

function base64ToBlob(b64: string, mime = 'application/octet-stream'): Blob {
  const bin = atob(b64);
  const len = bin.length;
  const u8 = new Uint8Array(len);
  for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
  return new Blob([u8], { type: mime });
}

export const CordovaDirect = {
  isAvailable(): boolean {
    const win = window as CordovaWindow;
    // Check multiple indicators that we're in a Cordova/APK environment
    return typeof win !== 'undefined' && (
           win.cordova !== undefined ||
           (win as any).IS_APK ||
           (win as any).IS_VOLTBUILDER_APK ||
           // Check if we're in a WebView by looking at user agent
           (navigator.userAgent && (
             navigator.userAgent.includes('wv') ||
             navigator.userAgent.includes('Cordova') ||
             navigator.userAgent.includes('Android')
           ))
    );
  },

  // Start audio recording using Media plugin
  async startAudioRecording(): Promise<void> {
    console.log('🎤 Starting direct audio recording with Media plugin...');
    
    return new Promise((resolve, reject) => {
      const win = window as CordovaWindow;
      
      if (!win.Media) {
        reject(new Error('Media plugin not available'));
        return;
      }
      
      if (isCurrentlyRecording && activeMediaRecorder) {
        console.log('⚠️ Recording already in progress');
        resolve();
        return;
      }
      
      console.log('✅ Media plugin available - starting recording');
      
      // Use 3gp extension for Android Media compatibility
      const fileName = 'gabai_recording_' + Date.now() + '.3gp';
      
      // Use full path for Android - try different paths in order of preference
      let recordingPath = fileName; // Default fallback
      
      // Try to use cordova file paths if available
      if ((win as any).cordova?.file) {
        if ((win as any).cordova.file.cacheDirectory) {
          recordingPath = (win as any).cordova.file.cacheDirectory + fileName;
          console.log('📁 Using cache directory:', recordingPath);
        } else if ((win as any).cordova.file.dataDirectory) {
          recordingPath = (win as any).cordova.file.dataDirectory + fileName;
          console.log('📁 Using data directory:', recordingPath);
        } else if ((win as any).cordova.file.externalCacheDirectory) {
          recordingPath = (win as any).cordova.file.externalCacheDirectory + fileName;
          console.log('📁 Using external cache directory:', recordingPath);
        }
      }
      
      activeRecordingPath = recordingPath;
      
      console.log('📝 Recording to:', activeRecordingPath);
      
      try {
        // Create Media object
        activeMediaRecorder = new win.Media(
          activeRecordingPath,
          () => {
            console.log('✅ Recording completed successfully');
          },
          (error: any) => {
            console.error('❌ Recording error:', error);
            // Don't reject on all errors - some are non-fatal
            if (error?.code === 0) {
              // Code 0 is often just a status update
              console.log('Media status update (not an error)');
            } else if (error?.code !== undefined && error.code > 0) {
              isCurrentlyRecording = false;
              activeMediaRecorder = null;
              reject(new Error('Recording failed: ' + (error.message || error.code || error)));
            }
          },
          (status: number) => {
            const statusNames = ['None', 'Starting', 'Running', 'Paused', 'Stopped'];
            console.log('🎤 Recording status:', statusNames[status] || status);
            
            // Status 4 = Stopped
            if (status === 4 && recordingStopResolver) {
              console.log('✅ Recording stopped successfully');
              recordingStopResolver();
              recordingStopResolver = null;
            }
          }
        );
        
        // Start recording
        activeMediaRecorder.startRecord();
        isCurrentlyRecording = true;
        console.log('🔴 Recording started successfully');
        resolve();
        
      } catch (error: any) {
        console.error('❌ Failed to create Media object:', error);
        isCurrentlyRecording = false;
        activeMediaRecorder = null;
        reject(new Error('Failed to initialize recording: ' + error));
      }
    });
  },
  
  // Stop audio recording and return the recorded file
  async stopAudioRecording(): Promise<Blob> {
    console.log('🛑 Stopping audio recording...');
    
    const win = window as CordovaWindow;
    
    if (!isCurrentlyRecording || !activeMediaRecorder) {
      throw new Error('No recording in progress');
    }
    
    // Create a promise to wait for the stop status
    const stopPromise = new Promise<void>((resolveStop) => {
      recordingStopResolver = resolveStop;
      // Fallback timeout in case status callback doesn't fire
      setTimeout(() => {
        if (recordingStopResolver === resolveStop) {
          console.log('⚠️ Stop status timeout, continuing anyway...');
          recordingStopResolver = null;
          resolveStop();
        }
      }, 2000);
    });
    
    // Stop the recording
    activeMediaRecorder.stopRecord();
    activeMediaRecorder.release();
    
    // Wait for the stop status or timeout
    await stopPromise;
    
    // Additional delay for file system write
    await new Promise(res => setTimeout(res, 500));
    
    // Now read the file
    return new Promise((resolve, reject) => {
      win.resolveLocalFileSystemURL(
        activeRecordingPath,
        (fileEntry: any) => {
          fileEntry.file(
            (file: any) => {
              console.log('✅ Got file from fileEntry:', file);
              console.log('🔍 File info:', {
                name: file.name,
                size: file.size,
                type: file.type,
                constructor: file.constructor?.name
              });
              
              // ALWAYS read as ArrayBuffer and create a fresh Blob
              const reader = new FileReader();
              reader.onloadend = function() {
                const arrayBuffer = reader.result as ArrayBuffer;
                
                // Android Media typically records in 3GPP/AMR format
                // Use the correct MIME type for the actual content
                const mimeType = 'audio/3gpp';
                
                // Create a fresh Blob with the correct MIME type
                const audioBlob = new Blob([arrayBuffer], { type: mimeType });
                console.log('✅ Created Blob:', {
                  type: audioBlob.type,
                  size: audioBlob.size,
                  isBlob: audioBlob instanceof Blob
                });
                
                // Reset state
                isCurrentlyRecording = false;
                activeMediaRecorder = null;
                activeRecordingPath = '';
                
                // Return the Blob
                resolve(audioBlob);
              };
              reader.onerror = (error) => {
                isCurrentlyRecording = false;
                activeMediaRecorder = null;
                activeRecordingPath = '';
                reject(new Error('Failed to read file: ' + error));
              };
              reader.readAsArrayBuffer(file);
            }, 
            (error: any) => {
              console.error('❌ Failed to get file from fileEntry:', error);
              isCurrentlyRecording = false;
              activeMediaRecorder = null;
              activeRecordingPath = '';
              reject(new Error('Failed to get recorded file: ' + error));
            }
          );
        },
        (error: any) => {
          console.error('❌ Failed to resolve file URL:', error);
          isCurrentlyRecording = false;
          activeMediaRecorder = null;
          activeRecordingPath = '';
          reject(new Error('Failed to resolve recorded file: ' + error));
        }
      );
    });
  },
  
  // Check if currently recording
  isRecording(): boolean {
    return isCurrentlyRecording;
  },
  
  // Legacy captureAudio method - now toggles recording
  async captureAudio(): Promise<Blob> {
    console.log('🎤 Toggle audio recording...');
    
    if (this.isRecording()) {
      // Stop recording and return the blob
      return await this.stopAudioRecording();
    } else {
      // Start recording and wait for it to be stopped
      await this.startAudioRecording();
      // Return a promise that will resolve when recording is stopped
      return new Promise((resolve, reject) => {
        // This will be resolved when stopAudioRecording is called
        // For now, reject with a message
        reject(new Error('Recording started. Call captureAudio again to stop.'));
      });
    }
  },

  // Direct camera capture - returns Blob for consistent handling
  async capturePhoto(): Promise<Blob> {
    console.log('📷 Direct camera capture...');
    
    return new Promise((resolve, reject) => {
      if (!navigator.camera) {
        reject(new Error('Camera not available'));
        return;
      }

      const win = window as CordovaWindow;
      const options = { 
        quality: 50, 
        destinationType: win.Camera?.DestinationType?.DATA_URL || 0,  // Return as base64
        sourceType: win.Camera?.PictureSourceType?.CAMERA || 1,
        encodingType: win.Camera?.EncodingType?.JPEG || 0,
        correctOrientation: true
      };
      
      console.log('📷 Camera options:', options);

      navigator.camera.getPicture(
        // Cordova requires plain functions, not async
        function(imageData: string) {
          console.log('✅ Photo captured, converting to blob...');
          console.log('📸 First 100 chars:', imageData.substring(0, 100));
          
          // Convert to blob then resolve
          toImageBlob(imageData, 'image/jpeg')
            .then(function(blob) {
              console.log('📷 Blob created:', blob.type, blob.size);
              resolve(blob);
            })
            .catch(function(error) {
              console.error('❌ Camera blob conversion error:', error);
              reject(error);
            });
        },
        (error: any) => {
          console.error('❌ Camera error:', error);
          reject(new Error('Camera failed: ' + (error.message || error)));
        },
        options
      );
    });
  },

  // Test function to check what plugins are available
  getAvailablePlugins(): { [key: string]: boolean } {
    const win = window as CordovaWindow;
    return {
      cordova: !!win.cordova,
      camera: !!navigator.camera,
      capture: !!navigator.device?.capture,
      captureAudio: !!navigator.device?.capture?.captureAudio,
      captureImage: !!navigator.device?.capture?.captureImage,
      captureVideo: !!navigator.device?.capture?.captureVideo,
      media: !!win.Media,  // Direct audio recording
      file: !!win.resolveLocalFileSystemURL,
      device: !!win.device,
      // These should be false in v18
      permissions: !!win.cordova?.plugins?.permissions,
      diagnostic: !!win.cordova?.plugins?.diagnostic
    };
  },

  // Initialize on deviceready
  initialize(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isAvailable()) {
        console.log('🌐 Not in Cordova environment');
        resolve();
        return;
      }

      const onDeviceReady = () => {
        console.log('📱 Device ready - plugins available:', this.getAvailablePlugins());
        resolve();
      };

      const win = window as CordovaWindow;
      if (document.readyState === 'complete' && win.cordova) {
        // Already loaded
        onDeviceReady();
      } else {
        document.addEventListener('deviceready', onDeviceReady, false);
      }
    });
  }
};