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
  const [isHolding, setIsHolding] = useState(false);
  
  const { isRecording, isTranscribing, startRecording, stopRecording } = useVoice({
    onTranscriptionComplete: (text) => {
      if (text.trim()) {
        onSendMessage(text.trim());
      }
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

  const handleMouseDown = () => {
    if (!disabled && !isTranscribing) {
      setIsHolding(true);
      startRecording();
    }
  };

  const handleMouseUp = () => {
    if (isHolding && isRecording) {
      setIsHolding(false);
      stopRecording();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Prevent context menu and system behaviors
    document.body.style.webkitUserSelect = 'none';
    document.body.style.userSelect = 'none';
    handleMouseDown();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Restore user selection
    document.body.style.webkitUserSelect = '';
    document.body.style.userSelect = '';
    handleMouseUp();
  };

  const handleTouchCancel = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Restore user selection
    document.body.style.webkitUserSelect = '';
    document.body.style.userSelect = '';
    handleMouseUp();
  };

  return (
    <div 
      className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 space-y-3"
      style={{ touchAction: 'manipulation' }}
    >
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
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          disabled={disabled || isTranscribing}
          style={{ 
            touchAction: 'none',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none'
          }}
          className={`w-full max-w-md h-14 rounded-full transition-all duration-200 shadow-lg select-none flex items-center justify-center space-x-3 font-medium text-lg ${
            isRecording 
              ? "bg-red-500 hover:bg-red-600 animate-pulse text-white scale-95" 
              : "bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white active:scale-95"
          }`}
        >
          <Mic className="h-6 w-6" />
          <span className="font-semibold">
            {isRecording ? "Release to Send" : isTranscribing ? "Processing..." : "Hold to Talk"}
          </span>
        </Button>
      </div>

      {/* Recording State Indicator */}
      {isRecording && (
        <div className="mt-2 flex items-center justify-center space-x-2 animate-fadeIn">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Recording... Release to send your message
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
        <div className="mt-2 flex items-center justify-center space-x-2 animate-fadeIn">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Processing and sending your message...
          </span>
        </div>
      )}
    </div>
  );
}
