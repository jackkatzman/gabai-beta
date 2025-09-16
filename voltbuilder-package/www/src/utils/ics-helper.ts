// ICS Download Helper for mobile and web
import { CordovaNative } from "@/lib/cordova-native";

declare global { 
  interface Window { 
    cordova?: any; 
    resolveLocalFileSystemURL?: any; 
  } 
}

const isCordova = () => typeof window !== 'undefined' && !!window.cordova;

function writeCache(filename: string, text: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const baseDir = (window as any).cordova?.file?.cacheDirectory || (window as any).cordova?.file?.dataDirectory;
    if (!baseDir) return reject(new Error('No Cordova file baseDir'));

    window.resolveLocalFileSystemURL(baseDir, (dir: any) => {
      dir.getFile(filename, { create: true }, (fileEntry: any) => {
        fileEntry.createWriter((w: any) => {
          w.onwriteend = () => resolve(fileEntry);
          w.onerror = reject;
          w.write(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
        }, reject);
      }, reject);
    }, reject);
  });
}

export async function saveAndOpenICS({ 
  filename, 
  icsText, 
  icsUrl 
}: { 
  filename: string; 
  icsText?: string; 
  icsUrl?: string; 
}) {
  // Check if Cordova native is available
  if (CordovaNative.isAvailable() && icsText) {
    console.log('📅 Using native Cordova ICS handler');
    const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
    await CordovaNative.openIcsFile(blob, filename);
    return;
  }
  
  // Check if we're in APK/WebView environment (without Cordova)
  const isAPK = window.location.protocol === 'file:' || 
                (window as any).IS_APK || 
                (window as any).IS_VOLTBUILDER_APK ||
                /wv|Android/.test(navigator.userAgent);
  
  // For APK/WebView (without Cordova), open the URL directly in system browser
  if (isAPK && icsUrl) {
    console.log('📱 APK detected - opening in system browser:', icsUrl);
    // Try multiple methods to open in system browser
    if (window.cordova?.InAppBrowser) {
      window.cordova.InAppBrowser.open(icsUrl, '_system');
    } else {
      // Fallback to window.open with _system
      window.open(icsUrl, '_system');
    }
    return;
  }
  
  // Web fallback
  if (!isCordova()) {
    const blob = new Blob([icsText || 'BEGIN:VCALENDAR\nEND:VCALENDAR'], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(blob); 
    a.download = filename; 
    a.click(); 
    return;
  }

  let text = icsText;
  if (!text && icsUrl) {
    text = await new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', icsUrl, true);
      xhr.withCredentials = true; // include cookies
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          (xhr.status >= 200 && xhr.status < 300) ? resolve(xhr.responseText) : reject(new Error('ICS fetch ' + xhr.status));
        }
      };
      xhr.send();
    });
  }
  if (!text) throw new Error('No ICS data');

  const entry = await writeCache(filename, text);
  (window as any).cordova?.plugins?.fileOpener2?.open(entry.toURL(), 'text/calendar',
    { 
      error: (e: any) => {
        console.log('open fail', e);
        // Fallback to system browser on error
        if ((window as any).cordova?.InAppBrowser) {
          (window as any).cordova.InAppBrowser.open(icsUrl || '#', '_system');
        } else {
          window.open(icsUrl || '#', '_blank');
        }
      }, 
      success: () => {} 
    });
}