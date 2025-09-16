import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();

  const speak = useCallback(async (text: string) => {
    try {
      setIsSpeaking(true);
      const audioBlob = await api.generateSpeech(text);
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.addEventListener("ended", () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      });

      audio.addEventListener("error", () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Playback Error",
          description: "Failed to play audio response",
          variant: "destructive",
        });
      });

      await audio.play();
    } catch (error: any) {
      setIsSpeaking(false);
      toast({
        title: "Speech Error",
        description: `Failed to generate speech: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopSpeaking = useCallback(() => {
    // Stop any currently playing audio
    setIsSpeaking(false);
  }, []);

  return {
    speak,
    stopSpeaking,
    isSpeaking,
  };
}
