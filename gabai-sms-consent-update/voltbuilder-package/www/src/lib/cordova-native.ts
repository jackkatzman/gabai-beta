// Cordova Native Plugin Integration for APK
// This file provides native functionality when running in the APK/WebView environment

declare global {
  interface Window {
    cordova?: any;
    Camera?: any;
    ContactsX?: any;
    device?: any;
    plugins?: any;
    resolveLocalFileSystemURL?: any;
    requestFileSystem?: any;
    LocalFileSystem?: any;
  }
  
  interface Navigator {
    camera?: any;
    device?: any;
    contacts?: any;
  }
}

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

// Cordova Contact types
interface ContactFindOptions {
  filter?: string;
  multiple?: boolean;
  desiredFields?: string[];
  hasPhoneNumber?: boolean;
}

export const CordovaNative = {
  // Check if we're running in Cordova environment
  isAvailable(): boolean {
    return typeof window.cordova !== 'undefined';
  },

  // Request camera permission
  async requestCameraPermission(): Promise<boolean> {
    if (!this.isAvailable()) return true;
    
    return new Promise((resolve) => {
      const diagnostic = window.cordova?.plugins?.diagnostic;
      
      if (diagnostic) {
        diagnostic.isCameraAuthorized((authorized: boolean) => {
          if (!authorized) {
            diagnostic.requestCameraAuthorization(
              () => {
                console.log('✅ Camera permission granted');
                resolve(true);
              },
              () => {
                console.error('❌ Camera permission denied');
                resolve(false);
              }
            );
          } else {
            resolve(true);
          }
        }, () => resolve(false));
      } else {
        // Fallback to basic permissions plugin
        const perms = window.cordova?.plugins?.permissions;
        if (perms) {
          perms.requestPermission(
            perms.CAMERA,
            () => resolve(true),
            () => resolve(false)
          );
        } else {
          resolve(true); // Assume permission is granted if no plugin available
        }
      }
    });
  },

  // Request microphone permission
  async requestMicrophonePermission(): Promise<boolean> {
    if (!this.isAvailable()) return true;
    
    return new Promise((resolve) => {
      const diagnostic = window.cordova?.plugins?.diagnostic;
      
      if (diagnostic && diagnostic.getPermissionAuthorizationStatus && diagnostic.requestRuntimePermission) {
        // Android-specific runtime permission handling
        diagnostic.getPermissionAuthorizationStatus(
          (status: string) => {
            console.log('🎤 Microphone permission status:', status);
            
            if (status === 'GRANTED' || status === diagnostic.permissionStatus?.GRANTED) {
              console.log('✅ Microphone permission already granted');
              resolve(true);
            } else if (status === 'DENIED_ALWAYS' || status === diagnostic.permissionStatus?.DENIED_ALWAYS) {
              console.error('❌ Microphone permission permanently denied');
              resolve(false);
            } else {
              // Request the permission
              diagnostic.requestRuntimePermission(
                (grantedStatus: string) => {
                  const granted = grantedStatus === 'GRANTED' || grantedStatus === diagnostic.permissionStatus?.GRANTED;
                  console.log(granted ? '✅ Microphone permission granted' : '❌ Microphone permission denied');
                  resolve(granted);
                },
                () => {
                  console.error('❌ Failed to request microphone permission');
                  resolve(false);
                },
                diagnostic.permission?.RECORD_AUDIO || 'android.permission.RECORD_AUDIO'
              );
            }
          },
          () => {
            console.error('❌ Failed to check microphone permission status, using fallback');
            // Fall back to android-permissions plugin
            this.requestMicrophonePermissionFallback(resolve);
          },
          diagnostic.permission?.RECORD_AUDIO || 'android.permission.RECORD_AUDIO'
        );
      } else {
        // Use fallback if diagnostic plugin doesn't have Android methods
        this.requestMicrophonePermissionFallback(resolve);
      }
    });
  },

  // Fallback method for requesting microphone permission
  requestMicrophonePermissionFallback(resolve: (value: boolean) => void): void {
    const perms = window.cordova?.plugins?.permissions;
    if (perms && perms.RECORD_AUDIO) {
      // Check if we have the permission first
      perms.checkPermission(
        perms.RECORD_AUDIO,
        (status: any) => {
          if (status.hasPermission) {
            console.log('✅ Microphone permission already granted (fallback)');
            resolve(true);
          } else {
            // Request the permission
            perms.requestPermission(
              perms.RECORD_AUDIO,
              () => {
                console.log('✅ Microphone permission granted (fallback)');
                resolve(true);
              },
              () => {
                console.error('❌ Microphone permission denied (fallback)');
                resolve(false);
              }
            );
          }
        },
        () => {
          console.error('❌ Failed to check microphone permission (fallback)');
          resolve(false);
        }
      );
    } else {
      console.warn('⚠️ No permission plugin available, assuming granted');
      resolve(true);
    }
  },

  // Initialize and request all permissions on app start
  async initializePermissions(): Promise<void> {
    if (!this.isAvailable()) return;
    
    return new Promise((resolve) => {
      document.addEventListener('deviceready', async () => {
        console.log('📱 Cordova device ready, requesting permissions...');
        
        if (window.cordova.platformId !== 'android') {
          resolve();
          return;
        }

        try {
          // Using diagnostic plugin for better permission handling
          const diagnostic = window.cordova.plugins?.diagnostic;
          
          if (diagnostic) {
            // Request each permission type
            const permissionRequests = [
              // Camera permission
              new Promise(res => {
                diagnostic.isCameraAuthorized((authorized: boolean) => {
                  if (!authorized) {
                    diagnostic.requestCameraAuthorization(
                      () => res(true),
                      () => res(false)
                    );
                  } else {
                    res(true);
                  }
                }, () => res(false));
              }),
              
              // Microphone permission
              new Promise(res => {
                diagnostic.isMicrophoneAuthorized((authorized: boolean) => {
                  if (!authorized) {
                    diagnostic.requestMicrophoneAuthorization(
                      () => res(true),
                      () => res(false)
                    );
                  } else {
                    res(true);
                  }
                }, () => res(false));
              }),
              
              // Contacts permission
              new Promise(res => {
                diagnostic.isContactsAuthorized((authorized: boolean) => {
                  if (!authorized) {
                    diagnostic.requestContactsAuthorization(
                      () => res(true),
                      () => res(false)
                    );
                  } else {
                    res(true);
                  }
                }, () => res(false));
              }),
              
              // Calendar permission
              new Promise(res => {
                diagnostic.getCalendarAuthorizationStatus((status: string) => {
                  if (status !== 'GRANTED') {
                    diagnostic.requestCalendarAuthorization(
                      () => res(true),
                      () => res(false)
                    );
                  } else {
                    res(true);
                  }
                }, () => res(false));
              })
            ];
            
            await Promise.all(permissionRequests);
            console.log('✅ All permissions requested');
          } else {
            // Fallback to basic permissions plugin
            const perms = window.cordova.plugins?.permissions;
            if (perms) {
              const permissions = [
                perms.CAMERA,
                perms.RECORD_AUDIO,
                perms.READ_CALENDAR,
                perms.WRITE_CALENDAR,
                perms.READ_CONTACTS,
                perms.WRITE_CONTACTS
              ];
              
              await new Promise(res => {
                perms.requestPermissions(
                  permissions,
                  () => res(true),
                  () => res(false)
                );
              });
            }
          }
        } catch (error) {
          console.error('Permission request error:', error);
        }
        
        resolve();
      }, false);
    });
  },

  // Camera - Take photo (with permission guard) - returns Blob
  async takePicture(): Promise<Blob> {
    if (!this.isAvailable()) {
      throw new Error('Camera not available in web environment');
    }

    // Request camera permission if needed
    const hasPermission = await this.requestCameraPermission();
    if (!hasPermission) {
      throw new Error('Camera permission denied');
    }

    return new Promise((resolve, reject) => {
      if (!navigator.camera) {
        reject(new Error('Camera plugin not available'));
        return;
      }

      const options = {
        quality: 75,
        destinationType: window.Camera.DestinationType.DATA_URL,
        sourceType: window.Camera.PictureSourceType.CAMERA,
        encodingType: window.Camera.EncodingType.JPEG,
        correctOrientation: true,
        saveToPhotoAlbum: false,
        targetWidth: 1024,
        targetHeight: 1024
      };

      navigator.camera.getPicture(
        // Cordova requires plain functions, not async
        function(imageData: string) {
          console.log('✅ Photo captured, converting to blob...');
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
        (error: string) => {
          console.error('❌ Camera error:', error);
          reject(new Error(error));
        },
        options
      );
    });
  },

  // Camera - Select from gallery
  async selectPicture(): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Gallery not available in web environment');
    }

    return new Promise((resolve, reject) => {
      const options = {
        quality: 75,
        destinationType: window.Camera.DestinationType.DATA_URL,
        sourceType: window.Camera.PictureSourceType.PHOTOLIBRARY,
        encodingType: window.Camera.EncodingType.JPEG,
        correctOrientation: true,
        targetWidth: 1024,
        targetHeight: 1024
      };

      navigator.camera.getPicture(
        (imageData: string) => {
          resolve(`data:image/jpeg;base64,${imageData}`);
        },
        (error: string) => {
          console.error('Gallery error:', error);
          reject(new Error(error));
        },
        options
      );
    });
  },

  // Microphone - Record audio (with permission guard)
  async recordAudio(duration: number = 60): Promise<File> {
    if (!this.isAvailable()) {
      throw new Error('Audio recording not available in web environment');
    }

    // Request microphone permission if needed
    console.log('🎤 Requesting microphone permission...');
    const hasPermission = await this.requestMicrophonePermission();
    if (!hasPermission) {
      throw new Error('Microphone permission denied. Please allow microphone access in settings.');
    }

    // Double-check permission status before capture on Android
    const diagnostic = window.cordova?.plugins?.diagnostic;
    if (diagnostic && diagnostic.getPermissionAuthorizationStatus) {
      return new Promise((resolve, reject) => {
        diagnostic.getPermissionAuthorizationStatus(
          (status: string) => {
            console.log('🎤 Final permission check:', status);
            if (status !== 'GRANTED' && status !== diagnostic.permissionStatus?.GRANTED) {
              reject(new Error('Microphone permission not granted. Current status: ' + status));
              return;
            }
            // Permission verified, proceed with capture
            this.proceedWithAudioCapture(duration, resolve, reject);
          },
          () => {
            // Failed to check, but we already got permission above, proceed
            console.log('⚠️ Could not verify permission, proceeding with capture');
            this.proceedWithAudioCapture(duration, resolve, reject);
          },
          diagnostic.permission?.RECORD_AUDIO || 'android.permission.RECORD_AUDIO'
        );
      });
    } else {
      // No diagnostic plugin, proceed with capture since we got permission above
      return this.proceedWithAudioCapture(duration);
    }
  },

  // Helper method to handle actual audio capture
  proceedWithAudioCapture(duration: number, resolve?: (value: File) => void, reject?: (reason?: any) => void): Promise<File> {
    const captureFunc = (res: (value: File) => void, rej: (reason?: any) => void) => {
      if (!navigator.device?.capture) {
        rej(new Error('Media capture plugin not available'));
        return;
      }

      console.log('🎤 Starting audio capture...');
      navigator.device.capture.captureAudio(
        (mediaFiles: any[]) => {
          if (mediaFiles && mediaFiles.length > 0) {
            const audioFile = mediaFiles[0];
            console.log('✅ Audio recorded:', audioFile.fullPath);
            
            // Convert to File object for compatibility with existing code
            window.resolveLocalFileSystemURL(audioFile.fullPath,
              (fileEntry: any) => {
                fileEntry.file((file: File) => {
                  res(file);
                }, rej);
              },
              rej
            );
          } else {
            rej(new Error('No audio recorded'));
          }
        },
        (error: any) => {
          console.error('❌ Audio capture error:', error);
          console.error('Native audio capture error:', error);
          const errorMessage = error.message || error.code || 'Audio capture failed';
          rej(new Error(errorMessage));
        },
        { limit: 1, duration }
      );
    };

    if (resolve && reject) {
      captureFunc(resolve, reject);
      return Promise.resolve(new File([], '')); // Return placeholder promise
    } else {
      return new Promise<File>((res, rej) => {
        captureFunc(res, rej);
      });
    }
  },

  // Contacts - Get all contacts using contacts-x plugin
  async getContacts(): Promise<any[]> {
    if (!this.isAvailable()) {
      throw new Error('Contacts not available in web environment');
    }

    return new Promise((resolve, reject) => {
      // contacts-x plugin can be exposed in different ways
      const contactsX = window.ContactsX || (window.navigator as any)?.contactsX || (window as any).contactsX;
      
      if (contactsX) {
        // Use contacts-x plugin (the maintained fork)
        const fields = ['displayName', 'phoneNumbers', 'emails'];
        
        contactsX.find(
          fields,
          (contacts: any[]) => {
            const formattedContacts = contacts.map(c => ({
              id: c.id,
              displayName: c.displayName || `${c.name?.givenName || ''} ${c.name?.familyName || ''}`.trim(),
              phoneNumbers: c.phoneNumbers || [],
              emails: c.emails || [],
              organizations: c.organizations || []
            }));
            console.log(`✅ Retrieved ${formattedContacts.length} contacts`);
            resolve(formattedContacts);
          },
          (error: any) => {
            console.error('ContactsX error:', error);
            reject(new Error(error));
          }
        );
      } else {
        // No contacts plugin available
        console.error('❌ contacts-x plugin not available. Check if cordova-plugin-contacts-x is installed.');
        reject(new Error('contacts-x plugin not available'));
      }
    });
  },

  // Calendar - Create event interactively
  async createCalendarEvent(
    title: string,
    notes: string,
    startDate: Date,
    endDate: Date,
    location?: string
  ): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Calendar not available in web environment');
    }

    return new Promise((resolve, reject) => {
      if (window.plugins?.calendar) {
        window.plugins.calendar.createEventInteractively(
          title,
          location || '',
          notes,
          startDate,
          endDate,
          () => {
            console.log('Calendar event created');
            resolve();
          },
          (error: string) => {
            console.error('Calendar error:', error);
            reject(new Error(error));
          }
        );
      } else {
        reject(new Error('Calendar plugin not available'));
      }
    });
  },

  // File - Save and open ICS file
  async openIcsFile(blob: Blob, filename: string = 'event.ics'): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('File system not available in web environment');
    }

    return new Promise((resolve, reject) => {
      // Get cache directory
      window.resolveLocalFileSystemURL(
        window.cordova.file.cacheDirectory,
        (dirEntry: any) => {
          // Create file
          dirEntry.getFile(filename, { create: true, exclusive: false },
            (fileEntry: any) => {
              // Write blob to file
              fileEntry.createWriter(
                (fileWriter: any) => {
                  fileWriter.onwriteend = () => {
                    // Open with file opener
                    window.cordova.plugins.fileOpener2.open(
                      fileEntry.nativeURL,
                      'text/calendar',
                      {
                        error: (e: any) => {
                          console.error('File opener error:', e);
                          reject(new Error('Failed to open calendar file'));
                        },
                        success: () => {
                          console.log('Calendar file opened');
                          resolve();
                        }
                      }
                    );
                  };
                  
                  fileWriter.onerror = (e: any) => {
                    console.error('File write error:', e);
                    reject(new Error('Failed to write calendar file'));
                  };
                  
                  fileWriter.write(blob);
                },
                reject
              );
            },
            reject
          );
        },
        reject
      );
    });
  },

  // File - Save and open VCF file
  async openVcfFile(blob: Blob, filename: string = 'contact.vcf'): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('File system not available in web environment');
    }

    return new Promise((resolve, reject) => {
      window.resolveLocalFileSystemURL(
        window.cordova.file.cacheDirectory,
        (dirEntry: any) => {
          dirEntry.getFile(filename, { create: true, exclusive: false },
            (fileEntry: any) => {
              fileEntry.createWriter(
                (fileWriter: any) => {
                  fileWriter.onwriteend = () => {
                    window.cordova.plugins.fileOpener2.open(
                      fileEntry.nativeURL,
                      'text/vcard',
                      {
                        error: (e: any) => {
                          console.error('File opener error:', e);
                          reject(new Error('Failed to open contact file'));
                        },
                        success: () => {
                          console.log('Contact file opened');
                          resolve();
                        }
                      }
                    );
                  };
                  
                  fileWriter.onerror = (e: any) => {
                    console.error('File write error:', e);
                    reject(new Error('Failed to write contact file'));
                  };
                  
                  fileWriter.write(blob);
                },
                reject
              );
            },
            reject
          );
        },
        reject
      );
    });
  }
};

// Initialize permissions when the app starts
if (CordovaNative.isAvailable()) {
  CordovaNative.initializePermissions().catch(console.error);
}