import { useState, useRef, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CordovaDirect } from "@/lib/cordova-direct";

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
      
      // Check if we're in APK/Cordova environment
      const isAPK = (window as any).IS_APK || 
                    (window as any).IS_VOLTBUILDER_APK ||
                    (navigator.userAgent && navigator.userAgent.includes('Android'));
      
      // Use direct Cordova audio capture if available
      if (isAPK || CordovaDirect.isAvailable()) {
        console.log('🎤 APK detected, starting audio recording...');
        
        try {
          // Start recording (non-blocking)
          setIsRecording(true);
          await CordovaDirect.startAudioCapture();
          
          // Recording is now active - it will continue until stopRecording is called
          console.log('🎤 Recording started successfully');
          return;
        } catch (error: any) {
          console.error("Failed to start audio recording:", error);
          setIsRecording(false);
          setIsTranscribing(false);
          throw error;
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
      
      // ChatGPT Fix: Try very permissive constraints first
      const constraintOptions = [
        { audio: true }, // Simplest - try this first
        { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }
      ];
      
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
      console.log('🎤 APK: Microphone access granted, starting recording...');
      
      // APK-specific codec selection for maximum mobile compatibility
      let mediaRecorder;
      const supportedFormats = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/wav'
      ];
      
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
        }
      });

      mediaRecorder.addEventListener("stop", async () => {
        try {
          setIsRecording(false);
          setIsTranscribing(true);
          
          // Use the actual mime type from the recorder
          const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });
          const { text } = await api.transcribeAudio(audioBlob);
          
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
          console.error("Voice transcription error:", error);
          const errorMessage = `Transcription failed: ${error.message}`;
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

      mediaRecorder.start();
      setIsRecording(true);
      console.log('🎤 Recording started successfully');
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
    try {
      // Check if we're using Cordova recording
      const isAPK = (window as any).IS_APK || 
                    (window as any).IS_VOLTBUILDER_APK ||
                    (navigator.userAgent && navigator.userAgent.includes('Android'));
      
      if ((isAPK || CordovaDirect.isAvailable()) && CordovaDirect.isRecording()) {
        console.log('🎤 Stopping Cordova recording...');
        setIsRecording(false);
        setIsTranscribing(true);
        
        const audioBlob = await CordovaDirect.stopAudioCapture();
        if (audioBlob) {
          console.log('🎤 Got audio blob:', audioBlob.type, audioBlob.size);
          const { text } = await api.transcribeAudio(audioBlob);
          
          if (options.onTranscriptionComplete) {
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
        }
        
        setIsTranscribing(false);
        return;
      }
      
      // For web recording, stop MediaRecorder if it's active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      // Also cleanup streams immediately
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    } catch (error) {
      console.error('❌ Error stopping recording:', error);
    }
  }, []);

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
