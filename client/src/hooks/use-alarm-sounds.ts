import { useCallback } from 'react';

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
  // Get user's device ringtones (Capacitor)
  const getUserRingtones = useCallback(async (): Promise<string[]> => {
    try {
      if ((window as any).Capacitor?.isNativePlatform()) {
        // Access device ringtones via Capacitor File system
        // const { Filesystem, Directory } = await import('@capacitor/filesystem');
        
        // On Android, ringtones are typically in /system/media/audio/ringtones
        // This would require additional Capacitor plugins for full access
        
        return [
          'default',
          'classic-alarm',
          'morning-birds',
          'gentle-chime',
          'urgent-beep'
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
      console.error('Error accessing ringtones:', error);
      return ['default'];
    }
  }, []);

  // Generate AI voice alarm using ElevenLabs
  const generateVoiceAlarm = useCallback(async (options: VoiceAlarmOptions): Promise<string | null> => {
    try {
      const response = await fetch('/api/elevenlabs/generate-alarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: options.text, // Use user's exact text without modification
          voiceId: options.voiceId || getVoiceIdForPersonality(options.personality),
          speed: options.speed || 1.0,
          stability: options.stability || 0.75,
          similarityBoost: options.similarityBoost || 0.75
        })
      });

      if (!response.ok) throw new Error('Voice generation failed');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      return audioUrl;
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