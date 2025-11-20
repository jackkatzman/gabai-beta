import { useState, useRef, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CordovaDirect } from "@/lib/cordova-direct";
import { permissionManager } from "@/lib/permissions";

export interface UseVoiceOptions {
  onTranscriptionComplete?: (text: string) => void;
  onError?: (error: string) => void;
  onTranscriptUpdate?: (text: string) => void;
}

export function useVoice(options: UseVoiceOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
    chunksRef.current = [];
    setIsRecording(false);
    setIsTranscribing(false);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      // Clean up any existing recording first
      cleanup();
      
      console.log('🎤 Voice Input: Requesting microphone permission...');
      console.log('🎤 User Agent:', navigator.userAgent);
      console.log('🎤 HTTPS:', window.location.protocol === 'https:');
      console.log('🎤 mediaDevices available:', !!navigator.mediaDevices);
      
      // Request microphone permission using PermissionManager
      const hasPermission = await permissionManager.requestMicrophonePermission();
      if (!hasPermission) {
        console.error('🎤 Permission denied by PermissionManager');
        throw new Error('Microphone permission denied. Please enable microphone access in your browser settings.');
      }
      
      console.log('🎤 Microphone permission granted, starting recording...');
      
      // Check if we're in APK/Cordova environment
      const isAPK = CordovaDirect.isAvailable();
      
      // Use direct Cordova audio capture if available
      if (isAPK) {
        console.log('🎤 APK detected, starting native audio recording...');
        
        try {
          // Start recording (non-blocking)
          setIsRecording(true);
          await CordovaDirect.startAudioCapture();
          
          // Recording is now active - it will continue until stopRecording is called
          console.log('🎤 Native recording started successfully');
          return;
        } catch (error: any) {
          console.error("Failed to start native audio recording:", error);
          // If native recording fails, fall back to web recording
          console.log('🎤 Falling back to web recording...');
          // Don't throw here, let it fall through to web recording
        }
      }
      
      // Fall back to web getUserMedia
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Voice recording is not supported on this device');
      }
      
      // ChatGPT Fix: Clean up any existing stream before starting
      if (streamRef.current) {
        try { 
          streamRef.current.getTracks().forEach(t => t.stop()); 
        } catch {}
        streamRef.current = null;
      }
      
      // Mobile-friendly audio constraints - start with simplest
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const constraintOptions = isMobile ? [
        { audio: true }, // Mobile needs simplest constraints
        { audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } },
        { audio: { sampleRate: 16000 } }
      ] : [
        { audio: true }, // Desktop - try simple first
        { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }
      ];
      
      console.log('🎤 Mobile device:', isMobile);
      
      let stream: MediaStream | null = null;
      for (const constraints of constraintOptions) {
        try {
          console.log('🎤 Trying audio constraints:', constraints);
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log('🎤 Success with constraints:', constraints);
          break;
        } catch (err) {
          console.log('🎤 Failed with constraints:', constraints, err);
        }
      }
      
      if (!stream) {
        throw new Error('Failed to get audio stream');
      }
      
      streamRef.current = stream;
      console.log('🎤 Microphone access granted, starting recording...');
      
      // Mobile-optimized codec selection
      let mediaRecorder;
      const isMobileSafari = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const supportedFormats = isMobileSafari ? [
        'audio/mp4',  // Safari iOS prefers mp4
        'audio/wav',
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus'
      ] : [
        'audio/webm;codecs=opus',  // Android Chrome prefers webm
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/wav'
      ];
      
      console.log('🎤 Is Mobile Safari:', isMobileSafari);
      
      let selectedFormat = null;
      for (const format of supportedFormats) {
        if (MediaRecorder.isTypeSupported(format)) {
          selectedFormat = format;
          console.log(`🎤 APK: Using audio format: ${format}`);
          break;
        }
      }
      
      if (selectedFormat) {
        mediaRecorder = new MediaRecorder(stream, { mimeType: selectedFormat });
      } else {
        console.log('🎤 APK: Using default MediaRecorder format');
        mediaRecorder = new MediaRecorder(stream);
      }
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log('📊 Audio chunk received:', event.data.size, 'bytes');
        }
      });

      mediaRecorder.addEventListener("stop", async () => {
        try {
          setIsRecording(false);
          setIsTranscribing(true);
          
          // Use the actual mime type from the recorder
          const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });
          
          console.log('🎙️ Audio recording stopped:', {
            chunks: chunksRef.current.length,
            totalSize: chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0),
            mimeType,
            blobSize: audioBlob.size
          });
          
          // Check if we have actual audio data
          if (audioBlob.size === 0 || chunksRef.current.length === 0) {
            console.error('❌ No audio data recorded');
            throw new Error('No audio was recorded. Please try again and hold the button while speaking.');
          }
          
          // Add timeout to transcription request
          const transcribePromise = api.transcribeAudio(audioBlob);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Transcription timeout after 30 seconds')), 30000)
          );
          
          const { text } = await Promise.race([transcribePromise, timeoutPromise]) as { text: string };
          
          console.log('✅ Transcription successful:', text);
          
          if (options.onTranscriptionComplete) {
            options.onTranscriptionComplete(text);
          }
          
          // Clear transcript immediately after sending to avoid stuck state
          if (options.onTranscriptUpdate) {
            options.onTranscriptUpdate(text);
            // Clear transcript after a brief delay to show completion
            setTimeout(() => {
              if (options.onTranscriptUpdate) {
                options.onTranscriptUpdate('');
              }
            }, 1000);
          }
        } catch (error: any) {
          console.error("❌ Voice transcription error:", error);
          const errorMessage = error.message || 'Transcription failed';
          if (options.onError) {
            options.onError(errorMessage);
          }
          toast({
            title: "Transcription Error",
            description: errorMessage,
            variant: "destructive",
          });
        } finally {
          // Clean up streams and reset states
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          mediaRecorderRef.current = null;
          chunksRef.current = [];
          setIsRecording(false);
          setIsTranscribing(false);
        }
      });

      // Start recording with timeslice to ensure data is available
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      console.log('🎤 Recording started successfully with 100ms timeslice');
    } catch (error: any) {
      console.error('🎤 Voice recording failed:', error);
      let userFriendlyMessage = '';
      
      switch (error.name) {
        case 'NotAllowedError':
          userFriendlyMessage = 'Microphone permission denied. Please allow microphone access in your browser settings.';
          break;
        case 'NotFoundError':
          userFriendlyMessage = 'No microphone found. Please check that your device has a microphone.';
          break;
        case 'NotSupportedError':
          userFriendlyMessage = 'Voice recording is not supported on this device or browser.';
          break;
        case 'SecurityError':
          userFriendlyMessage = 'Microphone access blocked for security reasons. Please check your browser settings.';
          break;
        default:
          userFriendlyMessage = `Recording failed: ${error.message}`;
      }
      
      console.log('🎤 APK Voice Error Details:', {
        name: error.name,
        message: error.message,
        userAgent: navigator.userAgent,
        mediaDevicesSupported: !!navigator.mediaDevices,
        getUserMediaSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      });
      
      if (options.onError) {
        options.onError(userFriendlyMessage);
      }
      toast({
        title: "Microphone Issue",
        description: userFriendlyMessage,
        variant: "destructive",
      });
      cleanup();
    }
  }, [options, toast, cleanup, api]);

  const stopRecording = useCallback(async () => {
    console.log('🛑 STOP RECORDING CALLED');
    try {
      // Check if we're using Cordova recording
      const isAPK = CordovaDirect.isAvailable();
      console.log('🛑 isAPK:', isAPK);
      
      if (isAPK) {
        console.log('🎤 Stopping native Cordova recording...');
        setIsRecording(false);
        setIsTranscribing(true);
        
        try {
          const audioBlob = await CordovaDirect.stopAudioCapture();
          if (audioBlob && audioBlob.size > 0) {
            console.log('🎤 Got audio blob:', audioBlob.type, audioBlob.size);
            const { text } = await api.transcribeAudio(audioBlob);
            console.log('🎤 Transcribed text:', text);
            
            if (options.onTranscriptionComplete) {
              console.log('🎤 Calling onTranscriptionComplete with:', text);
              options.onTranscriptionComplete(text);
            }
            
            if (options.onTranscriptUpdate) {
              options.onTranscriptUpdate(text);
              setTimeout(() => {
                if (options.onTranscriptUpdate) {
                  options.onTranscriptUpdate('');
                }
              }, 1000);
            }
          } else {
            console.log('⚠️ No audio data captured');
            throw new Error('No audio was recorded. Please try again.');
          }
        } catch (error: any) {
          console.error('❌ Native recording error:', error);
          if (options.onError) {
            options.onError(error.message || 'Recording failed');
          }
          toast({
            title: "Recording Error",
            description: error.message || 'Recording failed',
            variant: "destructive",
          });
        } finally {
          setIsTranscribing(false);
        }
        return;
      }
      
      // For web recording, stop MediaRecorder if it's active
      console.log('🛑 Web recording - checking MediaRecorder state:', mediaRecorderRef.current?.state);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        console.log('🛑 Stopping MediaRecorder...');
        mediaRecorderRef.current.stop();
      } else {
        console.log('⚠️ MediaRecorder not in recording state');
      }
      // Also cleanup streams immediately
      if (streamRef.current) {
        console.log('🛑 Stopping media stream tracks...');
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    } catch (error) {
      console.error('❌ Error stopping recording:', error);
      toast({
        title: "Stop Recording Error",
        description: (error as Error).message || 'Failed to stop recording',
        variant: "destructive",
      });
    }
  }, [options, toast]);

  const toggleRecording = useCallback(async () => {
    console.log('🎤 Toggle recording:', { isRecording, isTranscribing });
    
    // For APK, media-capture handles the entire flow in startRecording
    // For web, toggle between start and stop
    if (isRecording || isTranscribing) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, isTranscribing, startRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
