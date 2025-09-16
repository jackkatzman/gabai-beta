import { useCallback } from 'react';

// Simple alarm system for MVP - no complex permissions or external APIs
// Uses basic HTML5 audio and web notifications

interface SimpleAlarm {
  id: string;
  title: string;
  time: Date;
  sound: string;
  isActive: boolean;
}

const ALARM_SOUNDS = [
  { id: 'beep', name: 'Beep', frequency: 800 },
  { id: 'chime', name: 'Chime', frequency: 600 },
  { id: 'bell', name: 'Bell', frequency: 440 },
  { id: 'buzz', name: 'Buzz', frequency: 200 },
  { id: 'ping', name: 'Ping', frequency: 1000 }
];

export function useSimpleAlarms() {
  // Generate simple alarm sounds using Web Audio API
  const playAlarmSound = useCallback((soundId: string) => {
    try {
      const sound = ALARM_SOUNDS.find(s => s.id === soundId) || ALARM_SOUNDS[0];
      
      // Create AudioContext
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure sound
      oscillator.frequency.setValueAtTime(sound.frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      // Volume control
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);
      
      // Play for 2 seconds
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 2);
      
    } catch (error) {
      console.error('Error playing alarm sound:', error);
      // Fallback to system beep
      console.log('\u0007'); // ASCII bell character
    }
  }, []);

  // Get available alarm sounds
  const getAlarmSounds = useCallback(() => {
    return ALARM_SOUNDS;
  }, []);

  // Schedule a simple alarm using setTimeout and web notifications
  const scheduleSimpleAlarm = useCallback(async (alarm: Omit<SimpleAlarm, 'id' | 'isActive'>) => {
    try {
      const alarmId = `alarm_${Date.now()}`;
      const timeUntilAlarm = alarm.time.getTime() - Date.now();
      
      console.log('🔔 Scheduling alarm:', { 
        title: alarm.title, 
        time: alarm.time.toLocaleString(), 
        timeUntilAlarm: Math.round(timeUntilAlarm / 1000) + 's'
      });
      
      if (timeUntilAlarm <= 0) {
        throw new Error('Alarm time must be in the future');
      }
      
      // Request notification permission if needed
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('🔔 Notification permission:', permission);
      }
      
      // Schedule the alarm with error handling
      const timeoutId = setTimeout(() => {
        try {
          console.log('🔔 Alarm firing:', alarm.title);
          
          // Play sound
          playAlarmSound(alarm.sound);
          
          // Show notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(alarm.title, {
              body: `Alarm: ${alarm.title}`,
              icon: '/favicon.ico',
              tag: alarmId,
              requireInteraction: true
            });
          } else {
            console.log('🔔 Notification not available, using alert');
            alert(`🔔 ALARM: ${alarm.title}`);
          }
          
          // Store in localStorage that alarm fired
          const firedAlarms = JSON.parse(localStorage.getItem('firedAlarms') || '[]');
          firedAlarms.push({
            id: alarmId,
            title: alarm.title,
            firedAt: new Date().toISOString()
          });
          localStorage.setItem('firedAlarms', JSON.stringify(firedAlarms));
          
        } catch (error) {
          console.error('🔔 Error firing alarm:', error);
          alert(`🔔 ALARM: ${alarm.title}`);
        }
        
      }, timeUntilAlarm);
      
      // Store scheduled alarm
      const scheduledAlarms = JSON.parse(localStorage.getItem('scheduledAlarms') || '[]');
      const newAlarm: SimpleAlarm = {
        id: alarmId,
        title: alarm.title,
        time: alarm.time,
        sound: alarm.sound,
        isActive: true
      };
      scheduledAlarms.push(newAlarm);
      localStorage.setItem('scheduledAlarms', JSON.stringify(scheduledAlarms));
      
      console.log('🔔 Alarm scheduled successfully with ID:', alarmId);
      return alarmId;
      
    } catch (error) {
      console.error('🔔 Error scheduling alarm:', error);
      throw error;
    }
  }, [playAlarmSound]);

  // Get scheduled alarms
  const getScheduledAlarms = useCallback((): SimpleAlarm[] => {
    try {
      return JSON.parse(localStorage.getItem('scheduledAlarms') || '[]');
    } catch {
      return [];
    }
  }, []);

  // Cancel an alarm
  const cancelAlarm = useCallback((alarmId: string) => {
    const scheduledAlarms = getScheduledAlarms();
    const updatedAlarms = scheduledAlarms.filter(alarm => alarm.id !== alarmId);
    localStorage.setItem('scheduledAlarms', JSON.stringify(updatedAlarms));
  }, [getScheduledAlarms]);

  return {
    playAlarmSound,
    getAlarmSounds,
    scheduleSimpleAlarm,
    getScheduledAlarms,
    cancelAlarm
  };
}