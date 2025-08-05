import { useState, useRef, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface UseVoiceOptions {
  onTranscriptionComplete?: (text: string) => void;
  onError?: (error: string) => void;
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
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
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
          
          const audioBlob = new Blob(chunksRef.current, { type: "audio/wav" });
          const { text } = await api.transcribeAudio(audioBlob);
          
          options.onTranscriptionComplete?.(text);
        } catch (error: any) {
          const errorMessage = `Transcription failed: ${error.message}`;
          options.onError?.(errorMessage);
          toast({
            title: "Transcription Error",
            description: errorMessage,
            variant: "destructive",
          });
        } finally {
          cleanup();
        }
      });

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error: any) {
      const errorMessage = `Failed to start recording: ${error.message}`;
      options.onError?.(errorMessage);
      toast({
        title: "Recording Error",
        description: errorMessage,
        variant: "destructive",
      });
      cleanup();
    }
  }, [options, toast, cleanup]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording || isTranscribing) {
      cleanup(); // Force cleanup when toggling off
    } else {
      startRecording();
    }
  }, [isRecording, isTranscribing, startRecording, cleanup]);

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
