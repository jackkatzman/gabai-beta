import { useState, useRef, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

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
      
      console.log('🎤 APK Voice Input: Requesting microphone permission...');
      
      // APK-specific microphone access with enhanced mobile permissions
      const audioConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        // Mobile-specific enhancements
        ...(window.navigator.userAgent.includes('Mobile') && {
          channelCount: 1,
          sampleRate: 16000,
          sampleSize: 16
        })
      };
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: audioConstraints
      });
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
          
          // Keep transcript visible for 5 seconds instead of 1
          if (options.onTranscriptUpdate) {
            options.onTranscriptUpdate(text);
            setTimeout(() => {
              if (options.onTranscriptUpdate) {
                options.onTranscriptUpdate('');
              }
            }, 5000);
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
      const errorMessage = `Failed to start recording: ${error.message}`;
      if (options.onError) {
        options.onError(errorMessage);
      }
      toast({
        title: "Voice Recording Error",
        description: error.name === 'NotAllowedError' ? 'Microphone permission denied. Please allow microphone access.' : errorMessage,
        variant: "destructive",
      });
      cleanup();
    }
  }, [options, toast, cleanup]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    // Also cleanup streams immediately
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording || isTranscribing) {
      stopRecording(); // Proper stop instead of force cleanup
    } else {
      startRecording();
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
