import { useCallback } from 'react';

// Capacitor native scheduling system for alarms, reminders, and recurring events
// Provides better mobile UX than web-based date pickers

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform(): boolean;
    };
  }
}

interface ScheduleOptions {
  title: string;
  description?: string;
  date: Date;
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  sound?: string;
  vibration?: boolean;
  voiceOptions?: {
    text: string;
    personality: 'drill-sergeant' | 'gentle' | 'funny';
  };
}

interface DatePickerOptions {
  mode: 'date' | 'time' | 'datetime';
  format?: string;
  theme?: 'light' | 'dark';
  min?: Date;
  max?: Date;
}

export function useCapacitorScheduler() {
  // Native date/time picker
  const showDatePicker = useCallback(async (options: DatePickerOptions): Promise<Date | null> => {
    try {
      if (window.Capacitor?.isNativePlatform()) {
        // Use Capacitor native date picker - dynamically imported
        // const { DatetimePicker } = await import('@capacitor-community/datetime-picker');
        
        // Fallback to web picker for now (Capacitor datetime picker will be configured separately)
        return showWebDatePicker(options);
      } else {
        return showWebDatePicker(options);
      }
    } catch (error) {
      console.error('Date picker error:', error);
      return null;
    }
  }, []);

  // Schedule native alarm/notification
  const scheduleAlarm = useCallback(async (options: ScheduleOptions): Promise<number | null> => {
    try {
      if (window.Capacitor?.isNativePlatform()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        
        // Request permissions first
        const permission = await LocalNotifications.requestPermissions();
        if (permission.display !== 'granted') {
          throw new Error('Notification permissions not granted');
        }

        const notificationId = Date.now();
        
        // Schedule the notification
        await LocalNotifications.schedule({
          notifications: [{
            id: notificationId,
            title: options.title,
            body: options.description || '',
            schedule: {
              at: options.date,
              repeats: options.recurring !== 'none',
              every: getRepeatInterval(options.recurring)
            },
            sound: options.sound || 'default',
            actionTypeId: 'ALARM_ACTION',
          }]
        });

        return notificationId;
      } else {
        // Web fallback using setTimeout and browser notifications
        const timeUntilAlarm = options.date.getTime() - Date.now();
        
        if (timeUntilAlarm > 0) {
          setTimeout(async () => {
            if ('Notification' in window) {
              const permission = await Notification.requestPermission();
              if (permission === 'granted') {
                new Notification(options.title, {
                  body: options.description,
                  icon: '/icon-192x192.png',
                  requireInteraction: true
                });
              }
            }
            
            // Play sound if available
            if (options.sound && options.sound !== 'default') {
              const audio = new Audio(options.sound);
              audio.play().catch(console.error);
            }
          }, timeUntilAlarm);
          
          return Date.now(); // Return a simple ID
        }
        
        return null;
      }
    } catch (error) {
      console.error('Alarm scheduling error:', error);
      return null;
    }
  }, []);

  // Cancel scheduled alarm
  const cancelAlarm = useCallback(async (alarmId: number): Promise<boolean> => {
    try {
      if (window.Capacitor?.isNativePlatform()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.cancel({ notifications: [{ id: alarmId }] });
        return true;
      } else {
        // Web fallback - limited cancellation support
        console.log(`Cancelling alarm ${alarmId} (web fallback)`);
        return true;
      }
    } catch (error) {
      console.error('Alarm cancellation error:', error);
      return false;
    }
  }, []);

  // Get all scheduled alarms
  const getScheduledAlarms = useCallback(async () => {
    try {
      if (window.Capacitor?.isNativePlatform()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const result = await LocalNotifications.getPending();
        return result.notifications.map(n => ({
          id: n.id,
          title: n.title,
          body: n.body,
          schedule: n.schedule
        }));
      } else {
        // Web fallback - return empty array
        return [];
      }
    } catch (error) {
      console.error('Get alarms error:', error);
      return [];
    }
  }, []);

  return {
    showDatePicker,
    scheduleAlarm,
    cancelAlarm,
    getScheduledAlarms
  };
}

// Helper functions
function formatDateForInput(date: Date, mode: string): string {
  if (mode === 'time') {
    return date.toTimeString().slice(0, 5);
  } else if (mode === 'datetime') {
    return date.toISOString().slice(0, 16);
  } else {
    return date.toISOString().slice(0, 10);
  }
}

function showWebDatePicker(options: DatePickerOptions): Promise<Date | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = options.mode === 'time' ? 'time' : 
               options.mode === 'datetime' ? 'datetime-local' : 'date';
    
    if (options.min) input.min = formatDateForInput(options.min, options.mode);
    if (options.max) input.max = formatDateForInput(options.max, options.mode);
    
    input.style.position = 'fixed';
    input.style.top = '-9999px';
    document.body.appendChild(input);
    
    input.addEventListener('change', () => {
      const selectedDate = input.value ? new Date(input.value) : null;
      document.body.removeChild(input);
      resolve(selectedDate);
    });
    
    input.addEventListener('blur', () => {
      setTimeout(() => {
        if (input.parentNode) {
          document.body.removeChild(input);
          resolve(null);
        }
      }, 100);
    });
    
    input.focus();
    input.click();
  });
}

function getRepeatInterval(recurring?: string) {
  switch (recurring) {
    case 'daily': return 'day';
    case 'weekly': return 'week';
    case 'monthly': return 'month';
    case 'yearly': return 'year';
    default: return undefined;
  }
}