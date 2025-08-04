import { apiRequest } from "./queryClient";

export const calendarApi = {
  // Export all user's calendar events as ICS file
  async exportCalendar(userId: string): Promise<void> {
    const response = await fetch(`/api/calendar/export/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to export calendar: ${response.statusText}`);
    }

    // Get the filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
      : 'gabai-calendar.ics';

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
};