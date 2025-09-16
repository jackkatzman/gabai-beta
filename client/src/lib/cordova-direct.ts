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
let activeMediaRecorder: MediaRecorder | null = null;
let activeRecordingPath: string = '';
let isCurrentlyRecording = false;
let recordingStopResolver: ((value: Blob) => void) | null = null;
let recordingStream: MediaStream | null = null;

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

  // Start audio recording using media-capture plugin (not used anymore)
  async startAudioRecording(): Promise<void> {
    console.log('🎤 Starting audio is now handled by captureAudio toggle');
    // This method is deprecated in favor of captureAudio
    throw new Error('Use captureAudio instead');
  },
  
  // Stop audio recording (not used anymore)
  async stopAudioRecording(): Promise<Blob> {
    console.log('🛑 Stopping audio is now handled by captureAudio');
    // This method is deprecated in favor of captureAudio
    throw new Error('Use captureAudio instead');
  },
  
  // Check if currently recording
  isRecording(): boolean {
    return isCurrentlyRecording;
  },
  
  // Start audio recording (non-blocking)
  async startAudioCapture(): Promise<void> {
    console.log('🎤 Starting audio recording...');
    
    // Clean up any existing recording
    this.stopAudioCapture();
    
    // Try native capture first; if device has no recorder app, fall back to MediaRecorder
    if (navigator.device?.capture?.captureAudio) {
      // For now, skip native capture as it requires external app
      // Fall directly to MediaRecorder for better control
      console.log('📱 Using in-app recording for better control...');
    }
    
    // Always use MediaRecorder for better control over stop/start
    await this.startMediaRecorder();
  },
  
  // Stop audio recording and return the blob
  async stopAudioCapture(): Promise<Blob | null> {
    console.log('⏹️ Stopping audio recording...');
    
    if (!activeMediaRecorder || !isCurrentlyRecording) {
      console.log('⚠️ No active recording to stop');
      return null;
    }
    
    return new Promise((resolve) => {
      recordingStopResolver = resolve;
      
      // Stop the MediaRecorder
      if (activeMediaRecorder.state === 'recording') {
        activeMediaRecorder.stop();
      }
      
      // Cleanup will happen in the onstop handler
    });
  },
  
  // Smart audio capture with fallback (for backward compatibility)
  async captureAudio(duration: number = 60): Promise<Blob> {
    console.log('🎤 Starting smart audio capture...');
    
    // Start recording
    await this.startAudioCapture();
    
    // Wait for duration or until stopped
    return new Promise((resolve) => {
      setTimeout(async () => {
        const blob = await this.stopAudioCapture();
        if (blob) {
          resolve(blob);
        } else {
          throw new Error('Failed to capture audio');
        }
      }, duration * 1000);
    });
  },
  
  // Native capture using media-capture plugin
  async captureWithCordova(duration: number = 60): Promise<Blob> {
    console.log('🎤 Trying native media-capture...');
    
    return new Promise((resolve, reject) => {
      navigator.device.capture.captureAudio(
        async (mediaFiles: any[]) => {
          if (mediaFiles && mediaFiles.length > 0) {
            const audioFile = mediaFiles[0];
            console.log('✅ Audio captured:', audioFile.fullPath);
            console.log('📝 File details:', {
              name: audioFile.name,
              size: audioFile.size,
              type: audioFile.type || 'audio/mp4'
            });
            
            try {
              const blob = await this.fileToBlob(audioFile.fullPath, audioFile);
              console.log('✅ Converted to Blob:', blob.type, blob.size);
              resolve(blob);
            } catch (error) {
              console.error('❌ Failed to convert audio to blob:', error);
              reject(error);
            }
          } else {
            reject(new Error('No audio recorded'));
          }
        },
        (error: any) => {
          console.error('❌ Audio capture error:', error);
          const errorMessage = error.message || error.code || 'Audio capture failed';
          reject(new Error(errorMessage));
        },
        { limit: 1, duration }
      );
    });
  },
  
  // Start MediaRecorder (non-blocking)
  async startMediaRecorder(): Promise<void> {
    console.log('🎙️ Starting in-app MediaRecorder...');
    
    // Request microphone permission in webview
    recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Determine best MIME type
    const mimeType = this.getBestAudioMimeType();
    console.log('📼 Recording with MIME type:', mimeType);
    
    activeMediaRecorder = new MediaRecorder(recordingStream, { mimeType });
    const chunks: Blob[] = [];
    
    activeMediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    activeMediaRecorder.onstop = () => {
      console.log('⏹️ Recording stopped, processing audio...');
      
      // Stop all tracks
      if (recordingStream) {
        recordingStream.getTracks().forEach(track => track.stop());
        recordingStream = null;
      }
      
      const recordedType = activeMediaRecorder?.mimeType || mimeType || 'audio/webm';
      const blob = new Blob(chunks, { type: recordedType });
      console.log('✅ Audio blob created:', blob.type, blob.size);
      
      // Cleanup
      activeMediaRecorder = null;
      isCurrentlyRecording = false;
      
      // Resolve the promise if someone is waiting
      if (recordingStopResolver) {
        recordingStopResolver(blob);
        recordingStopResolver = null;
      }
    };
    
    activeMediaRecorder.onerror = (event: any) => {
      console.error('❌ MediaRecorder error:', event.error);
      
      // Cleanup on error
      if (recordingStream) {
        recordingStream.getTracks().forEach(track => track.stop());
        recordingStream = null;
      }
      activeMediaRecorder = null;
      isCurrentlyRecording = false;
      
      if (recordingStopResolver) {
        recordingStopResolver(new Blob([], { type: 'audio/webm' }));
        recordingStopResolver = null;
      }
    };
    
    // Start recording
    console.log('🔴 Recording started...');
    activeMediaRecorder.start();
    isCurrentlyRecording = true;
  },
  
  // In-app recorder using MediaRecorder API (for backward compatibility)
  async captureWithMediaRecorder(maxSeconds: number = 60): Promise<Blob> {
    await this.startMediaRecorder();
    
    return new Promise((resolve) => {
      recordingStopResolver = resolve;
      
      // Auto-stop after maxSeconds
      setTimeout(() => {
        if (activeMediaRecorder && activeMediaRecorder.state === 'recording') {
          console.log('⏱️ Auto-stopping after', maxSeconds, 'seconds');
          activeMediaRecorder.stop();
        }
      }, maxSeconds * 1000);
    });
  },
  
  // Get best supported audio MIME type for MediaRecorder
  getBestAudioMimeType(): string {
    // Prefer webm/opus as it's widely supported and good quality
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      '' // Let browser choose
    ];
    
    for (const type of types) {
      if (type === '' || (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type))) {
        return type;
      }
    }
    
    return ''; // Let browser choose default
  },
  
  // Helper: Convert Cordova file path to Blob with correct MIME type
  async fileToBlob(path: string, originalFile?: any): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const win = window as CordovaWindow;
      
      // Prefer localURL over fullPath for better compatibility
      const fileUrl = originalFile?.localURL || path;
      
      win.resolveLocalFileSystemURL(
        fileUrl,
        (entry: any) => {
          entry.file(
            (file: File) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                // Use the actual file type or detect from extension
                let mimeType = file.type || originalFile?.type || 'audio/3gpp';
                
                // If type is missing, try to infer from filename
                if (!mimeType || mimeType === 'application/octet-stream') {
                  const name = file.name || originalFile?.name || path;
                  if (name.endsWith('.m4a')) mimeType = 'audio/mp4';
                  else if (name.endsWith('.mp4')) mimeType = 'audio/mp4';
                  else if (name.endsWith('.3gp') || name.endsWith('.3gpp')) mimeType = 'audio/3gpp';
                  else if (name.endsWith('.amr')) mimeType = 'audio/amr';
                  else if (name.endsWith('.wav')) mimeType = 'audio/wav';
                  else mimeType = 'audio/3gpp'; // Default for Android
                }
                
                console.log('📎 Creating Blob with detected MIME type:', mimeType);
                const blob = new Blob([reader.result as ArrayBuffer], { type: mimeType });
                resolve(blob);
              };
              reader.onerror = reject;
              reader.readAsArrayBuffer(file);
            },
            reject
          );
        },
        (error: any) => {
          console.error('❌ Failed to resolve file URL:', fileUrl, error);
          reject(error);
        }
      );
    });
  },

  // Use media-capture plugin for camera as well - more reliable
  async capturePhoto(): Promise<Blob> {
    console.log('📷 Using media-capture for photo...');
    
    return new Promise((resolve, reject) => {
      if (!navigator.device?.capture?.captureImage) {
        reject(new Error('Image capture not available'));
        return;
      }

      console.log('📷 Starting image capture...');
      navigator.device.capture.captureImage(
        async (mediaFiles: any[]) => {
          if (mediaFiles && mediaFiles.length > 0) {
            const imageFile = mediaFiles[0];
            console.log('✅ Photo captured:', imageFile.fullPath);
            console.log('📸 File details:', {
              name: imageFile.name,
              size: imageFile.size,
              type: imageFile.type || 'image/jpeg'
            });
            
            // Convert file path to Blob with proper MIME type
            try {
              const blob = await this.fileToImageBlob(imageFile.fullPath, imageFile);
              console.log('✅ Converted to Blob:', blob.type, blob.size);
              resolve(blob);
            } catch (error) {
              console.error('❌ Failed to convert image to blob:', error);
              reject(error);
            }
          } else {
            reject(new Error('No image captured'));
          }
        },
        (error: any) => {
          console.error('❌ Image capture error:', error);
          const errorMessage = error.message || error.code || 'Image capture failed';
          reject(new Error(errorMessage));
        },
        { limit: 1 }
      );
    });
  },
  
  // Helper: Convert image file path to Blob
  async fileToImageBlob(path: string, originalFile?: any): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const win = window as CordovaWindow;
      
      // Prefer localURL over fullPath for better compatibility
      const fileUrl = originalFile?.localURL || path;
      
      win.resolveLocalFileSystemURL(
        fileUrl,
        (entry: any) => {
          entry.file(
            (file: File) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                // Use the actual file type or default to JPEG
                let mimeType = file.type || originalFile?.type || 'image/jpeg';
                
                // If type is missing, try to infer from filename
                if (!mimeType || mimeType === 'application/octet-stream') {
                  const name = file.name || originalFile?.name || path;
                  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) mimeType = 'image/jpeg';
                  else if (name.endsWith('.png')) mimeType = 'image/png';
                  else if (name.endsWith('.gif')) mimeType = 'image/gif';
                  else if (name.endsWith('.bmp')) mimeType = 'image/bmp';
                  else mimeType = 'image/jpeg'; // Default
                }
                
                console.log('🖼️ Creating image Blob with MIME type:', mimeType);
                const blob = new Blob([reader.result as ArrayBuffer], { type: mimeType });
                resolve(blob);
              };
              reader.onerror = reject;
              reader.readAsArrayBuffer(file);
            },
            reject
          );
        },
        (error: any) => {
          console.error('❌ Failed to resolve image file URL:', fileUrl, error);
          reject(error);
        }
      );
    });
  },

  // Test function to check what plugins are available
  getAvailablePlugins(): { [key: string]: boolean } {
    const win = window as CordovaWindow;
    return {
      cordova: !!win.cordova,
      camera: !!navigator.device?.capture?.captureImage,  // Using media-capture now
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
        // Request permissions on startup if diagnostic plugin is available
        this.ensureRuntimePermissions();
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
  },
  
  // Request runtime permissions for microphone and camera
  async ensureRuntimePermissions(): Promise<void> {
    const win = window as CordovaWindow;
    const diagnostic = win.cordova?.plugins?.diagnostic;
    
    if (!diagnostic) {
      console.log('📱 Diagnostic plugin not available, permissions will be requested on use');
      return;
    }
    
    console.log('🔐 Checking runtime permissions...');
    
    // Check and request microphone permission
    try {
      const micStatus = await new Promise<string>((resolve) => {
        diagnostic.getMicrophoneAuthorizationStatus(resolve, (error: any) => {
          console.warn('Failed to get mic status:', error);
          resolve('NOT_REQUESTED');
        });
      });
      
      console.log('🎤 Microphone permission status:', micStatus);
      
      if (micStatus !== diagnostic.permissionStatus.GRANTED) {
        const micResult = await new Promise<string>((resolve) => {
          diagnostic.requestMicrophoneAuthorization((result: string) => {
            resolve(result);
          }, (error: any) => {
            console.warn('Failed to request mic permission:', error);
            resolve('DENIED');
          });
        });
        
        console.log('🎤 Microphone permission result:', micResult);
        
        if (micResult === diagnostic.permissionStatus.DENIED_ALWAYS) {
          console.warn('⚠️ Microphone permission permanently denied. User needs to enable in settings.');
        }
      }
    } catch (error) {
      console.warn('Error handling microphone permission:', error);
    }
    
    // Check and request camera permission
    try {
      const camStatus = await new Promise<string>((resolve) => {
        diagnostic.getCameraAuthorizationStatus(resolve, (error: any) => {
          console.warn('Failed to get camera status:', error);
          resolve('NOT_REQUESTED');
        });
      });
      
      console.log('📷 Camera permission status:', camStatus);
      
      if (camStatus !== diagnostic.permissionStatus.GRANTED) {
        const camResult = await new Promise<string>((resolve) => {
          diagnostic.requestCameraAuthorization((result: string) => {
            resolve(result);
          }, (error: any) => {
            console.warn('Failed to request camera permission:', error);
            resolve('DENIED');
          });
        });
        
        console.log('📷 Camera permission result:', camResult);
        
        if (camResult === diagnostic.permissionStatus.DENIED_ALWAYS) {
          console.warn('⚠️ Camera permission permanently denied. User needs to enable in settings.');
        }
      }
    } catch (error) {
      console.warn('Error handling camera permission:', error);
    }
  }
};