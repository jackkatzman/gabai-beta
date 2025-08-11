import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send } from "lucide-react";
import { useVoice } from "@/hooks/use-voice";

interface VoiceInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onSendMessage, disabled }: VoiceInputProps) {
  const [message, setMessage] = useState("");
  
  const { isRecording, isTranscribing, toggleRecording } = useVoice({
    onTranscriptionComplete: (text) => {
      setMessage(text);
    }
  });

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 space-y-3">
      {/* Text Input Row */}
      <div className="flex items-center space-x-3">
        <div className="flex-1 relative">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={disabled}
            dir="auto"
            style={{ unicodeBidi: 'plaintext', textAlign: 'start' }}
            className="pr-12"
          />
          <Button
            size="default"
            variant="ghost"
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Large Talk Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={toggleRecording}
          disabled={disabled || isTranscribing}
          className={`w-full max-w-md h-14 rounded-full transition-all duration-200 shadow-lg active:scale-95 flex items-center justify-center space-x-3 font-medium text-lg ${
            isRecording 
              ? "bg-red-500 hover:bg-red-600 animate-pulse text-white" 
              : "bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          }`}
        >
          <Mic className="h-6 w-6" />
          <span className="font-semibold">
            {isRecording ? "Stop Recording" : isTranscribing ? "Processing..." : "Hold to Talk"}
          </span>
        </Button>
      </div>

      {/* Recording State Indicator */}
      {isRecording && (
        <div className="mt-3 flex items-center justify-center space-x-2 animate-fadeIn">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Recording... Tap to stop
          </span>
          <div className="flex space-x-1">
            <div className="w-1 h-4 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-1 h-4 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-1 h-4 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
        </div>
      )}

      {/* Transcribing State */}
      {isTranscribing && (
        <div className="mt-3 flex items-center justify-center space-x-2 animate-fadeIn">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Processing your voice...
          </span>
        </div>
      )}
    </div>
  );
}
