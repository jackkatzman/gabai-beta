import { useCallback } from 'react';
import { api } from '@/lib/api-bulletproof';

// Advanced alarm sound system with custom ringtones and ElevenLabs voice synthesis
// Supports user ringtones, voice notes, and AI-generated wake-up calls

interface VoiceAlarmOptions {
  text: string;
  voiceId?: string; // ElevenLabs voice ID
  personality?: 'drill-sergeant' | 'gentle' | 'motivational' | 'funny' | 'angry-mom' | 'grandma';
  speed?: number;
  stability?: number;
  similarityBoost?: number;
}

interface CustomSoundOptions {
  type: 'ringtone' | 'voice-note' | 'ai-voice' | 'system';
  source?: string; // file path or URL
  voiceOptions?: VoiceAlarmOptions;
}

export function useAlarmSounds() {
  // Get user's device ringtones (APK native support)
  const getUserRingtones = useCallback(async (): Promise<string[]> => {
    try {
      if ((window as any).Capacitor?.isNativePlatform()) {
        console.log('🔔 APK: Getting native Android ringtones');
        // APK-specific Android ringtones
        return [
          'content://settings/system/alarm_alert', // Default alarm
          'content://settings/system/notification_sound', // Default notification
          'content://media/internal/audio/media/1', // System ringtone 1
          'content://media/internal/audio/media/2', // System ringtone 2
          'Argon',
          'Cesium', 
          'Chromium',
          'Helium',
          'Krypton',
          'Neon',
          'Oxygen',
          'Platinum',
          'Timer',
          'Uranium'
        ];
      } else {
        // Web fallback - return common web audio options
        return [
          'default',
          'beep',
          'chime',
          'bell'
        ];
      }
    } catch (error) {
      console.error('APK: Error accessing ringtones:', error);
      return ['default', 'Timer', 'Alarm'];
    }
  }, []);

  // Generate AI voice alarm using ElevenLabs or fallback to local files
  const generateVoiceAlarm = useCallback(async (options: VoiceAlarmOptions): Promise<string | null> => {
    try {
      // APK: Try ElevenLabs voice generation first
      console.log('🔔 APK Generating voice alarm:', options);
      try {
        // For blob responses, we need special handling
        const token = localStorage.getItem('gabai_token') || sessionStorage.getItem('gabai_token');
        const response = await fetch('/api/elevenlabs/generate-alarm', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({
            text: options.text, // Use user's exact text without modification
            voiceId: options.voiceId || getVoiceIdForPersonality(options.personality),
            speed: options.speed || 1.0,
            stability: options.stability || 0.75,
            similarityBoost: options.similarityBoost || 0.75
          })
        });

        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          console.log('🔔 APK Voice alarm generated successfully');
          return audioUrl;
        } else {
          console.log('🔔 APK ElevenLabs failed, using fallback');
        }
      } catch (apiError) {
        console.log('🔔 APK ElevenLabs API call failed:', apiError);
      }
      
      // Fallback to local voice files if ElevenLabs fails
      console.log('ElevenLabs failed, using local voice file for:', options.personality);
      const localFile = getLocalVoiceFile(options.personality);
      console.log('Using correct drill voice file (test_natural_drill.mp3):', localFile);
      return localFile;
    } catch (error) {
      console.error('ElevenLabs voice generation error:', error);
      return null;
    }
  }, []);

  // Record voice note for alarm
  const recordVoiceNote = useCallback(async (): Promise<string | null> => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        return new Promise((resolve) => {
          const mediaRecorder = new MediaRecorder(stream);
          const audioChunks: Blob[] = [];

          mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
          };

          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            stream.getTracks().forEach(track => track.stop());
            resolve(audioUrl);
          };

          // Auto-stop after 10 seconds
          setTimeout(() => {
            mediaRecorder.stop();
          }, 10000);

          mediaRecorder.start();
        });
      }
      return null;
    } catch (error) {
      console.error('Voice recording error:', error);
      return null;
    }
  }, []);

  // Play custom alarm sound
  const playAlarmSound = useCallback(async (options: CustomSoundOptions): Promise<boolean> => {
    try {
      let audioUrl: string | null = null;

      switch (options.type) {
        case 'ai-voice':
          if (options.voiceOptions) {
            audioUrl = await generateVoiceAlarm(options.voiceOptions);
            // Log which drill voice file is being used
            if (options.voiceOptions.personality === 'drill-sergeant') {
              console.log('🎯 Using correct drill voice file:', audioUrl);
            }
          }
          break;
        
        case 'voice-note':
          audioUrl = options.source || null;
          break;
        
        case 'ringtone':
          audioUrl = options.source || '/sounds/default-alarm.mp3';
          break;
        
        case 'system':
        default:
          audioUrl = '/sounds/default-alarm.mp3';
          break;
      }

      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.loop = true;
        audio.volume = 0.8;
        
        // Store reference globally for cleanup
        (window as any).lastPlayedAudio = audio;
        
        // For mobile, try to play with user interaction context
        const playPromise = audio.play();
        
        if (playPromise) {
          await playPromise;
          
          // Auto-stop after 60 seconds to prevent infinite loop
          setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
            if ((window as any).lastPlayedAudio === audio) {
              (window as any).lastPlayedAudio = null;
            }
          }, 60000);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Alarm sound playback error:', error);
      return false;
    }
  }, [generateVoiceAlarm]);

  return {
    getUserRingtones,
    generateVoiceAlarm,
    recordVoiceNote,
    playAlarmSound
  };
}

// REMOVED: Text modification function - user's text should be used exactly as typed

// Helper function to get ElevenLabs voice ID for personality
function getVoiceIdForPersonality(personality?: string): string {
  const voiceMap = {
    'drill-sergeant': 'DGzg6RaUqxGRTHSBjfgF', // Your selected drill sergeant voice from ElevenLabs library
    'gentle': '21m00Tcm4TlvDq8ikWAM', // Rachel - gentle voice  
    'motivational': 'pNInz6obpgDQGcFmaJgB', // Your selected motivational voice from ElevenLabs library
    'funny': 'TxGEqnHWrfWFTfGW9XjX', // Josh - casual voice
    'angry-mom': 'jsCqWAovK2LkecY7zXl4', // Freya - stern voice
    'grandma': 'XB0fDUnXU5powFXDhCwa', // Charlotte - warm elderly voice
  };

  return voiceMap[personality as keyof typeof voiceMap] || voiceMap['gentle'];
}

// Fallback function to use local voice files when ElevenLabs fails
function getLocalVoiceFile(personality?: string): string {
  const localVoiceMap = {
    'drill-sergeant': '/test_natural_drill.mp3', // Using the correct "drill" voice file
    'gentle': '/test_gentle.mp3',
    'motivational': '/test_motivational.mp3',
    'funny': '/test_speech.mp3',
    'natural-drill': '/test_natural_drill.mp3'
  };
  
  return localVoiceMap[personality as keyof typeof localVoiceMap] || localVoiceMap['gentle'];
}