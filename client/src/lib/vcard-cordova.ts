declare global {
  interface Window {
    cordova?: any;
    resolveLocalFileSystemURL?: any;
  }
}

const isCordova = () => typeof window !== 'undefined' && !!window.cordova;

function writeVCardToCache(filename: string, data: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const baseDir =
      (window as any).cordova?.file?.cacheDirectory ||
      (window as any).cordova?.file?.dataDirectory;

    if (!baseDir) return reject(new Error('No Cordova file baseDir'));

    (window as any).resolveLocalFileSystemURL(baseDir, (dir: any) => {
      dir.getFile(filename, { create: true }, (fileEntry: any) => {
        fileEntry.createWriter((writer: any) => {
          writer.onwriteend = () => {
            console.log('📇 VCard written successfully');
            resolve(fileEntry);
          };
          writer.onerror = (e: any) => {
            console.error('📇 VCard write error:', e);
            reject(e);
          };
          const blob = new Blob([data], { type: 'text/vcard;charset=utf-8' });
          writer.write(blob);
        }, reject);
      }, reject);
    }, reject);
  });
}

export async function saveAndOpenVCard(options: {
  filename: string;
  vcardText?: string;
  vcardUrl?: string;
}) {
  const { filename, vcardText, vcardUrl } = options;

  // Check if we're in APK/WebView without full Cordova file system
  const isAPK = window.location.protocol === 'file:' || 
                window.location.hostname === 'localhost' ||
                window.location.hostname.includes('replit') ||
                /wv|Android/.test(navigator.userAgent);
  
  // For APK without full Cordova file system, try to download and save
  if (isAPK && vcardUrl) {
    console.log('📇 APK detected - downloading vCard:', vcardUrl);
    
    // Ensure it's an absolute URL
    const fullUrl = vcardUrl.startsWith('http') ? vcardUrl : `https://gabai.ai${vcardUrl}`;
    
    try {
      // Get auth token for APK downloads
      const token = localStorage.getItem('gabai_token') || 
                   sessionStorage.getItem('gabai_token') || 
                   localStorage.getItem('token') || 
                   sessionStorage.getItem('token');
      
      // Fetch the vCard data with authentication
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(fullUrl, { headers });
      if (!response.ok) {
        throw new Error(`Failed to fetch vCard: ${response.status}`);
      }
      
      const vcardData = await response.text();
      console.log('📇 vCard data fetched, saving to device...');
      
      // Try to save using Cordova file system if available
      if ((window as any).cordova?.file?.cacheDirectory) {
        try {
          const fileEntry = await writeVCardToCache(filename, vcardData);
          console.log('📇 VCard saved to:', fileEntry.toURL());
          console.log('📇 VCard native path:', fileEntry.nativeURL);
          
          // Try to open with fileOpener2 if available
          if ((window as any).cordova?.plugins?.fileOpener2) {
            console.log('📇 Opening VCard with fileOpener2...');
            // Use nativeURL instead of toURL() for better Android compatibility
            const filePath = fileEntry.nativeURL || fileEntry.toURL();
            (window as any).cordova.plugins.fileOpener2.open(
              filePath,
              'text/x-vcard',
              {
                error: (e: any) => {
                  console.error('📇 VCard open failed:', e);
                  // Try with socialSharing plugin as fallback
                  if ((window as any).plugins?.socialsharing) {
                    console.log('📇 Trying socialSharing plugin...');
                    (window as any).plugins.socialsharing.shareWithOptions({
                      files: [filePath],
                      message: 'Save contact',
                      subject: 'Contact'
                    }, 
                    () => console.log('📇 VCard shared successfully'),
                    (err: any) => console.error('📇 SocialSharing failed:', err)
                    );
                  } else {
                    console.log('📇 No share options available, file saved to cache');
                  }
                },
                success: () => console.log('📇 VCard opened successfully')
              }
            );
          } else {
            console.log('📇 fileOpener2 not available');
            // Try socialSharing if available
            if ((window as any).plugins?.socialsharing) {
              console.log('📇 Using socialSharing to share VCard...');
              (window as any).plugins.socialsharing.shareWithOptions({
                files: [fileEntry.nativeURL || fileEntry.toURL()],
                message: 'Save contact',
                subject: 'Contact'
              },
              () => console.log('📇 VCard shared successfully'),
              (err: any) => console.error('📇 SocialSharing failed:', err)
              );
            } else {
              console.log('📇 No plugins available, file saved to cache at:', fileEntry.nativeURL);
            }
          }
          return;
        } catch (error) {
          console.error('📇 Failed to save to cache:', error);
        }
      }
      
      // Fallback to blob download
      const blob = new Blob([vcardData], { type: 'text/vcard;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      console.log('📇 vCard download triggered');
      
    } catch (error) {
      console.error('📇 vCard download error:', error);
      // Last resort - open in browser
      window.open(fullUrl, '_system');
    }
    return;
  }

  // Web fallback: plain download
  if (!isCordova() || !window.cordova?.file?.cacheDirectory) {
    let text = vcardText;
    if (!text && vcardUrl) {
      const response = await fetch(vcardUrl, { credentials: 'include' });
      text = await response.text();
    }
    
    const blob = new Blob([text || 'BEGIN:VCARD\nEND:VCARD'], { type: 'text/vcard;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    return;
  }

  // Cordova path with full file system
  let text = vcardText;
  if (!text && vcardUrl) {
    // Use XHR for better Cordova compatibility
    text = await new Promise<string>((resolve, reject) => {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', vcardUrl, true);
        xhr.withCredentials = true;
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.responseText);
            else reject(new Error('VCard download failed: ' + xhr.status));
          }
        };
        xhr.send();
      } catch (e) { reject(e as any); }
    });
  }

  if (!text) throw new Error('No VCard data provided');

  const fileEntry = await writeVCardToCache(filename, text);
  console.log('📇 VCard saved to:', fileEntry.toURL());

  // Open with contacts app using fileOpener2
  if ((window as any).cordova?.plugins?.fileOpener2) {
    (window as any).cordova.plugins.fileOpener2.open(
      fileEntry.toURL(),
      'text/vcard',
      {
        error: (e: any) => {
          console.log('📇 VCard open failed, trying fallback', e);
          // Fallback to download
          const blob = new Blob([text], { type: 'text/vcard;charset=utf-8' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = filename;
          a.click();
        },
        success: () => console.log('📇 VCard opened successfully')
      }
    );
  } else {
    // Fallback if fileOpener2 not available
    const blob = new Blob([text], { type: 'text/vcard;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    console.log('📇 VCard download triggered (no fileOpener2)');
  }
}