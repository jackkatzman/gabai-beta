import { useCallback } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

interface AlarmData {
  id: string;
  title: string;
  message: string;
  time: Date;
  soundName?: string;
}

export function useCapacitorAlarms() {
  // Request permissions for notifications
  const requestPermissions = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      console.log('Not on native platform, using web notifications');
      return false;
    }

    try {
      const result = await LocalNotifications.requestPermissions();
      console.log('📱 Notification permissions:', result);
      return result.display === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }, []);

  // Schedule an alarm using Capacitor LocalNotifications
  const scheduleAlarm = useCallback(async (alarm: AlarmData) => {
    try {
      // For native platforms (APK)
      if (Capacitor.isNativePlatform()) {
        // Request permissions first
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
          throw new Error('Notification permissions not granted');
        }

        // Cancel any existing alarm with same ID
        await LocalNotifications.cancel({ notifications: [{ id: parseInt(alarm.id) || Date.now() }] });

        // Schedule the alarm
        const scheduleResult = await LocalNotifications.schedule({
          notifications: [{
            id: parseInt(alarm.id) || Date.now(),
            title: alarm.title,
            body: alarm.message,
            schedule: { 
              at: alarm.time,
              allowWhileIdle: true // Important for Android
            },
            sound: alarm.soundName || 'default',
            smallIcon: 'ic_stat_alarm',
            largeIcon: 'ic_launcher',
            channelId: 'gabai_alarms',
            extra: {
              alarmId: alarm.id,
              timestamp: alarm.time.toISOString()
            }
          }]
        });

        console.log('✅ Alarm scheduled:', scheduleResult);
        return true;
      } else {
        // Fallback for web - use browser notifications
        const timeUntilAlarm = alarm.time.getTime() - Date.now();
        
        if (timeUntilAlarm <= 0) {
          throw new Error('Alarm time must be in the future');
        }

        // Request browser notification permission
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.warn('Browser notifications not granted');
          }
        }

        // Schedule with setTimeout for web
        setTimeout(() => {
          // Play sound
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGHzvLTgjMGHm7A7+OZURE');
          audio.play().catch(e => console.log('Audio play failed:', e));

          // Show notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(alarm.title, {
              body: alarm.message,
              icon: '/icon-192x192.png',
              badge: '/icon-192x192.png',
              vibrate: [200, 100, 200]
            });
          }

          // Visual feedback
          alert(`⏰ ${alarm.title}\n${alarm.message}`);
        }, timeUntilAlarm);

        console.log(`⏰ Web alarm scheduled for ${alarm.time.toLocaleString()}`);
        return true;
      }
    } catch (error) {
      console.error('Failed to schedule alarm:', error);
      throw error;
    }
  }, [requestPermissions]);

  // Cancel an alarm
  const cancelAlarm = useCallback(async (alarmId: string) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.cancel({ 
          notifications: [{ id: parseInt(alarmId) || 0 }] 
        });
        console.log('✅ Alarm cancelled:', alarmId);
      } catch (error) {
        console.error('Failed to cancel alarm:', error);
      }
    }
  }, []);

  // Get all pending alarms
  const getPendingAlarms = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const pending = await LocalNotifications.getPending();
        console.log('📱 Pending alarms:', pending);
        return pending.notifications;
      } catch (error) {
        console.error('Failed to get pending alarms:', error);
        return [];
      }
    }
    return [];
  }, []);

  // Initialize notification channel for Android
  const initializeAlarmChannel = useCallback(async () => {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      try {
        await LocalNotifications.createChannel({
          id: 'gabai_alarms',
          name: 'GabAi Alarms',
          description: 'Alarm notifications from GabAi',
          importance: 5, // Max importance
          visibility: 1, // Public
          sound: 'default',
          vibration: true,
          lights: true
        });
        console.log('✅ Android notification channel created');
      } catch (error) {
        console.error('Failed to create notification channel:', error);
      }
    }
  }, []);

  return {
    scheduleAlarm,
    cancelAlarm,
    getPendingAlarms,
    requestPermissions,
    initializeAlarmChannel
  };
}