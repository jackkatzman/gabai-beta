import { apiRequest } from "./queryClient";

export const calendarApi = {
  // Export all user's calendar events as ICS file
  async exportCalendar(userId: string): Promise<void> {
    console.log('📅 Starting calendar export for user:', userId);
    
    const response = await fetch(`/api/calendar/export/${userId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'text/calendar, application/octet-stream, */*'
      }
    });
    
    console.log('📅 Calendar export response status:', response.status);
    console.log('📅 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Calendar export error:', errorText);
      throw new Error(`Failed to export calendar: ${response.statusText}`);
    }

    // Get the filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
      : 'gabai-calendar.ics';

    // Create blob and download
    const blob = await response.blob();
    console.log('📅 Calendar blob size:', blob.size);
    console.log('📅 Calendar blob type:', blob.type);
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    
    console.log('📅 Triggering download for file:', filename);
    a.click();
    
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      console.log('📅 Calendar download cleanup completed');
    }, 100);
  },

  // Export single reminder as ICS file
  async exportEvent(reminderId: string): Promise<void> {
    const response = await fetch(`/api/calendar/event/${reminderId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to export event: ${response.statusText}`);
    }

    // Get the filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
      : 'gabai-event.ics';

    // Create blob and download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Get calendar subscription URL for user
  getSubscriptionUrl(userId: string): string {
    return `${window.location.origin}/api/calendar/export/${userId}`;
  }
};// Force rebuild Wed Aug 27 10:28:39 PM UTC 2025
