import { useState, useRef, useCallback } from "react";
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
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
          setIsTranscribing(false);
          // Stop all tracks to release the microphone
          stream.getTracks().forEach(track => track.stop());
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
    }
  }, [options, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
