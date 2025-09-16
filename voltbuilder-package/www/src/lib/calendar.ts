import { apiRequest } from "./queryClient";
import { saveAndOpenICS } from "./calendar-cordova";

export const calendarApi = {
  // Export all user's calendar events as ICS file
  async exportCalendar(userId: string): Promise<void> {
    console.log('📅 Starting calendar export for user:', userId);
    
    const endpoint = `/api/calendar/export/${userId}`;
    
    try {
      // Get the auth token from localStorage first (SMS auth), then cookies (Google auth)
      let gabaiToken = localStorage.getItem('gabai_token') || 
                       sessionStorage.getItem('gabai_token') || 
                       localStorage.getItem('token') || 
                       sessionStorage.getItem('token');
      
      // Fallback to cookies if not in localStorage
      if (!gabaiToken) {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'gabai_token') {
            gabaiToken = value;
            break;
          }
        }
      }
      
      // Detect if running as APK and use production URL
      const isAPK = window.location.protocol === 'file:' || 
                    window.location.hostname === 'localhost' ||
                    typeof window.Android !== 'undefined';
      
      const baseUrl = isAPK ? 'https://gabai.ai' : window.location.origin;
      
      // Build URL with auth token for APK/Cordova
      const downloadUrl = gabaiToken 
        ? `${baseUrl}${endpoint}?token=${encodeURIComponent(gabaiToken)}`
        : `${baseUrl}${endpoint}`;
      
      console.log('📅 Calendar download URL:', downloadUrl);
      
      // For APK, ensure we use the full URL with https://
      const fullDownloadUrl = downloadUrl.startsWith('http') ? downloadUrl : 
                             downloadUrl.startsWith('//') ? `https:${downloadUrl}` :
                             downloadUrl.startsWith('/') ? `https://gabai.ai${downloadUrl}` :
                             downloadUrl;
      
      console.log('📅 Full download URL:', fullDownloadUrl);
      
      // Use the Cordova-compatible download function
      await saveAndOpenICS({
        filename: 'gabai-calendar.ics',
        icsUrl: fullDownloadUrl
      });
      
      console.log('📅 Calendar export initiated successfully');
    } catch (error) {
      console.error('📅 Calendar export error:', error);
      throw error;
    }
  },

  // Export single reminder as ICS file
  async exportEvent(reminderId: string): Promise<void> {
    console.log('📅 Starting event export for reminder:', reminderId);
    
    const endpoint = `/api/calendar/event/${reminderId}`;
    
    try {
      // Get the auth token from localStorage first (SMS auth), then cookies (Google auth)
      let gabaiToken = localStorage.getItem('gabai_token') || 
                       sessionStorage.getItem('gabai_token') || 
                       localStorage.getItem('token') || 
                       sessionStorage.getItem('token');
      
      // Fallback to cookies if not in localStorage
      if (!gabaiToken) {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'gabai_token') {
            gabaiToken = value;
            break;
          }
        }
      }
      
      // Detect if running as APK and use production URL
      const isAPK = window.location.protocol === 'file:' || 
                    window.location.hostname === 'localhost' ||
                    typeof window.Android !== 'undefined';
      
      const baseUrl = isAPK ? 'https://gabai.ai' : window.location.origin;
      
      // Build URL with auth token for APK/Cordova
      const downloadUrl = gabaiToken 
        ? `${baseUrl}${endpoint}?token=${encodeURIComponent(gabaiToken)}`
        : `${baseUrl}${endpoint}`;
      
      console.log('📅 Event download URL:', downloadUrl);
      
      // For APK, ensure we use the full URL with https://
      const fullDownloadUrl = downloadUrl.startsWith('http') ? downloadUrl : 
                             downloadUrl.startsWith('//') ? `https:${downloadUrl}` :
                             downloadUrl.startsWith('/') ? `https://gabai.ai${downloadUrl}` :
                             downloadUrl;
      
      console.log('📅 Full download URL:', fullDownloadUrl);
      
      // Use the Cordova-compatible download function
      await saveAndOpenICS({
        filename: 'gabai-event.ics',
        icsUrl: fullDownloadUrl
      });
      
      console.log('📅 Event export initiated successfully');
    } catch (error) {
      console.error('📅 Event export error:', error);
      throw error;
    }
  },

  // Get calendar subscription URL for user
  getSubscriptionUrl(userId: string): string {
    return `${window.location.origin}/api/calendar/export/${userId}`;
  }
};// Force rebuild Wed Aug 27 10:28:39 PM UTC 2025
