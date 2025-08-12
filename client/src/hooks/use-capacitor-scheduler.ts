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
    console.log('📅 scheduleAlarm called with:', options);
    try {
      if (window.Capacitor?.isNativePlatform()) {
        console.log('📱 Using native Capacitor platform');
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
        console.log('🌐 Using web fallback platform');
        // Web fallback using setTimeout and browser notifications
        const timeUntilAlarm = options.date.getTime() - Date.now();
        console.log('⏰ Time until alarm (ms):', timeUntilAlarm);
        
        if (timeUntilAlarm > 0) {
          const alarmId = Date.now();
          
          // Request notification permission first
          let permissionGranted = false;
          if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            permissionGranted = permission === 'granted';
            console.log('🔔 Notification permission:', permission);
          }
          
          // Store alarm in localStorage for retrieval
          const webAlarms = JSON.parse(localStorage.getItem('gabai-web-alarms') || '[]');
          webAlarms.push({
            id: alarmId,
            title: options.title,
            body: options.description,
            schedule: { at: options.date },
            timeoutId: null
          });
          localStorage.setItem('gabai-web-alarms', JSON.stringify(webAlarms));
          console.log('💾 Alarm stored in localStorage:', webAlarms);
          
          const timeoutId = setTimeout(async () => {
            console.log('⏰ Alarm triggered!', options.title);
            if (permissionGranted) {
              new Notification(options.title, {
                body: options.description,
                icon: '/icon-192x192.png',
                requireInteraction: true,
                tag: `gabai-alarm-${alarmId}`
              });
            } else {
              // Fallback alert if notifications not supported
              alert(`🔔 Alarm: ${options.title}\n${options.description || ''}`);
            }
            
            // Play sound if available
            if (options.sound && options.sound !== 'default') {
              const audio = new Audio(options.sound);
              audio.play().catch(console.error);
            }
            
            // Remove from localStorage after triggering
            const updatedAlarms = JSON.parse(localStorage.getItem('gabai-web-alarms') || '[]')
              .filter((alarm: any) => alarm.id !== alarmId);
            localStorage.setItem('gabai-web-alarms', JSON.stringify(updatedAlarms));
          }, timeUntilAlarm);
          
          console.log('✅ Alarm scheduled with ID:', alarmId);
          return alarmId;
        } else {
          console.log('❌ Time until alarm is negative or zero, cannot schedule');
          return null;
        }
      }
    } catch (error) {
      console.error('❌ Alarm scheduling error:', error);
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
        // Web fallback - check localStorage for web alarms
        const webAlarms = localStorage.getItem('gabai-web-alarms');
        if (webAlarms) {
          const alarms = JSON.parse(webAlarms);
          // Filter out expired alarms
          const activeAlarms = alarms.filter((alarm: any) => new Date(alarm.schedule.at) > new Date());
          localStorage.setItem('gabai-web-alarms', JSON.stringify(activeAlarms));
          return activeAlarms;
        }
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