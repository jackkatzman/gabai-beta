import { useCallback } from 'react';

// Advanced alarm sound system with custom ringtones and ElevenLabs voice synthesis
// Supports user ringtones, voice notes, and AI-generated wake-up calls

interface VoiceAlarmOptions {
  text: string;
  voiceId?: string; // ElevenLabs voice ID
  personality?: 'drill-sergeant' | 'gentle' | 'motivational' | 'funny' | 'angry-mom' | 'grandma';
  speed?: number;
  stability?: number;
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
          text: getPersonalizedWakeUpText(options.text, options.personality),
          voiceId: options.voiceId || getVoiceIdForPersonality(options.personality),
          speed: options.personality === 'drill-sergeant' ? 1.1 : (options.speed || 1.0),
          stability: options.personality === 'drill-sergeant' ? 0.95 : (options.stability || 0.75),
          similarityBoost: options.personality === 'drill-sergeant' ? 1.0 : 0.75
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

// Helper function to get personalized wake-up text based on personality
function getPersonalizedWakeUpText(baseText: string, personality?: string): string {
  const templates = {
    'drill-sergeant': [
      `GET UP NOW SOLDIER! ${baseText}! DROP AND GIVE ME TWENTY PUSH-UPS!`,
      `WAKE UP RECRUIT! ${baseText}! THE ENEMY DOESN'T SLEEP AND NEITHER SHOULD YOU!`,
      `MOVE IT MOVE IT MOVE IT! ${baseText}! I'VE SEEN DEAD FISH WITH MORE ENERGY!`,
      `ON YOUR FEET MAGGOT! ${baseText}! NO EXCUSES, NO SNOOZE BUTTON, JUST DISCIPLINE!`
    ],
    'gentle': [
      `Good morning sunshine. ${baseText}. Time to start your beautiful day.`,
      `Wake up slowly and peacefully. ${baseText}. You've got this.`,
      `Gentle rise and shine. ${baseText}. Take your time, you're doing great.`
    ],
    'motivational': [
      `Champions don't sleep in! ${baseText}! Today is your day to shine!`,
      `Success starts now! ${baseText}! Get up and seize the day!`,
      `You're destined for greatness! ${baseText}! Make today amazing!`
    ],
    'funny': [
      `Wakey wakey eggs and bakey! ${baseText}! Even your coffee is judging you right now.`,
      `Rise and grind! Or just rise... we'll take what we can get. ${baseText}!`,
      `Your bed called, it wants a divorce. ${baseText}! Time to get up!`
    ],
    'angry-mom': [
      `GET UP RIGHT NOW! ${baseText}! I didn't raise you to be late!`,
      `DON'T MAKE ME COME UP THERE! ${baseText}! Move it!`,
      `You're going to be late AGAIN! ${baseText}! Get moving this instant!`
    ],
    'grandma': [
      `Good morning sweetheart! ${baseText}. Grandma made your favorite breakfast, but it's getting cold!`,
      `Rise and shine my dear! ${baseText}. Don't make your old grandma worry about you sleeping too much.`,
      `Wake up precious! ${baseText}. Grandma has fresh cookies waiting, but only if you get up now!`,
      `Time to get up honey bunny! ${baseText}. Your grandma loves you so much, now don't be late!`
    ]
  };

  const personalityTemplates = templates[personality as keyof typeof templates];
  if (personalityTemplates) {
    const randomTemplate = personalityTemplates[Math.floor(Math.random() * personalityTemplates.length)];
    return randomTemplate;
  }

  return `Wake up! ${baseText}`;
}

// Helper function to get ElevenLabs voice ID for personality
function getVoiceIdForPersonality(personality?: string): string {
  const voiceMap = {
    'drill-sergeant': 'DGzg6RaUqxGRTHSBjfgF', // Correct drill sergeant voice ID provided by user
    'gentle': '21m00Tcm4TlvDq8ikWAM', // Rachel - gentle female voice  
    'motivational': 'AZnzlk1XvdvUeBnXmlld', // Domi - energetic female voice
    'funny': 'TxGEqnHWrfWFTfGW9XjX', // Josh - casual male voice
    'angry-mom': 'jsCqWAovK2LkecY7zXl4', // Freya - stern female voice
    'grandma': 'XB0fDUnXU5powFXDhCwa', // Charlotte - warm elderly female voice
  };

  return voiceMap[personality as keyof typeof voiceMap] || voiceMap['gentle'];
}