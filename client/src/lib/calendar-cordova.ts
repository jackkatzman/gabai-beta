declare global {
  interface Window {
    cordova?: any;
    resolveLocalFileSystemURL?: any;
  }
}

const isCordova = () => typeof window !== 'undefined' && !!window.cordova;

function writeToCache(filename: string, data: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const baseDir =
      (window as any).cordova?.file?.cacheDirectory ||
      (window as any).cordova?.file?.dataDirectory;

    if (!baseDir) return reject(new Error('No Cordova file baseDir'));

    (window as any).resolveLocalFileSystemURL(baseDir, (dir: any) => {
      dir.getFile(filename, { create: true }, (fileEntry: any) => {
        fileEntry.createWriter((writer: any) => {
          writer.onwriteend = () => resolve(fileEntry);
          writer.onerror = (e: any) => reject(e);
          const blob = new Blob([data], { type: 'text/calendar;charset=utf-8' });
          writer.write(blob);
        }, reject);
      }, reject);
    }, reject);
  });
}

export async function saveAndOpenICS(options: {
  filename: string;
  icsText?: string;
  icsUrl?: string;
}) {
  const { filename, icsText, icsUrl } = options;

  // Check if we're in APK/WebView without full Cordova file system
  const isAPK = window.location.protocol === 'file:' || 
                window.location.hostname === 'localhost' ||
                window.location.hostname.includes('replit') ||
                /wv|Android/.test(navigator.userAgent);
  
  // For APK without full Cordova file system, open URL directly
  if (isAPK && icsUrl) {
    console.log('📅 APK detected - opening calendar URL directly:', icsUrl);
    
    // Ensure it's an absolute URL
    const fullUrl = icsUrl.startsWith('http') ? icsUrl : `https://gabai.ai${icsUrl}`;
    
    // Try multiple methods to open in system browser
    if ((window as any).cordova?.InAppBrowser) {
      (window as any).cordova.InAppBrowser.open(fullUrl, '_system');
    } else {
      // Fallback to window.open
      window.open(fullUrl, '_system');
    }
    return;
  }

  // Web fallback: plain download
  if (!isCordova() || !window.cordova?.file?.cacheDirectory) {
    let text = icsText;
    if (!text && icsUrl) {
      const response = await fetch(icsUrl, { credentials: 'include' });
      text = await response.text();
    }
    
    const blob = new Blob([text || 'BEGIN:VCALENDAR\nEND:VCALENDAR'], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    return;
  }

  // Cordova path
  let text = icsText;
  if (!text && icsUrl) {
    // Use XHR for better Cordova compatibility
    text = await new Promise<string>((resolve, reject) => {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', icsUrl, true);
        xhr.withCredentials = true;
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.responseText);
            else reject(new Error('ICS download failed: ' + xhr.status));
          }
        };
        xhr.send();
      } catch (e) { reject(e as any); }
    });
  }

  if (!text) throw new Error('No ICS data provided');

  const fileEntry = await writeToCache(filename, text);

  // Since fileOpener2 is not available, download directly
  console.log('📅 ICS saved to:', fileEntry.toURL());
  
  // Trigger download
  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  console.log('📅 ICS download triggered');
}