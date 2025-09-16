import { useCallback } from 'react';

// Native notification system for Capacitor mobile apps
// Replaces web-based toast notifications with better mobile UX

interface NotificationOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

export function useNativeNotifications() {
  const showNotification = useCallback(async (options: NotificationOptions) => {
    try {
      // For Capacitor mobile apps, use native notifications
      if (window.Capacitor?.isNativePlatform()) {
        // Import Capacitor notifications dynamically
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        
        await LocalNotifications.schedule({
          notifications: [{
            title: options.title,
            body: options.description || '',
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 100) }, // Show immediately
          }]
        });
      } else {
        // Fallback for web: simple console log or browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(options.title, {
            body: options.description,
            icon: '/icon-192x192.png'
          });
        } else {
          // Simple visual feedback for web
          console.log(`📱 ${options.title}${options.description ? ': ' + options.description : ''}`);
          
          // Create a simple visual notification for web
          const notification = document.createElement('div');
          notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            options.variant === 'destructive' ? 'bg-red-500 text-white' :
            options.variant === 'success' ? 'bg-green-500 text-white' :
            'bg-blue-500 text-white'
          }`;
          notification.innerHTML = `
            <div class="font-semibold">${options.title}</div>
            ${options.description ? `<div class="text-sm opacity-90">${options.description}</div>` : ''}
          `;
          
          document.body.appendChild(notification);
          
          // Auto-remove after duration
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, options.duration || 3000);
        }
      }
    } catch (error) {
      console.error('Notification error:', error);
      // Fallback to console log
      console.log(`📱 ${options.title}${options.description ? ': ' + options.description : ''}`);
    }
  }, []);

  return {
    toast: showNotification,
    showNotification
  };
}

// Legacy compatibility - replace useToast calls with this
export const useToast = useNativeNotifications;