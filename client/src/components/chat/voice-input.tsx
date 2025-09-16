import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send } from "lucide-react";
import { useVoice } from "@/hooks/use-voice";
import { isNativeApp } from "@/utils/capacitor";

interface VoiceInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onSendMessage, disabled }: VoiceInputProps) {
  const [message, setMessage] = useState("");
  const [isHolding, setIsHolding] = useState(false);
  const [transcript, setTranscript] = useState("");

  const { isRecording, isTranscribing, toggleRecording } = useVoice({
    onTranscriptionComplete: (text) => {
      if (text.trim()) {
        console.log("🎤 Voice transcription complete:", text.trim());
        // Send message immediately without setting it in the input field
        onSendMessage(`🎤 ${text.trim()}`);
        // Clear any existing message in the input field
        setMessage("");
        // Clear transcript display
        setTranscript("");
        console.log("✅ Voice message sent and input cleared");
      }
    },
    onTranscriptUpdate: (text) => {
      console.log("🎤 Voice transcript update:", text);
      setTranscript(text);
    },
    onError: (error) => {
      console.error("Voice input error:", error);
      // Clear transcript on error
      setTranscript("");
    }
  });

  const handleVoiceToggle = async () => {
    console.log("🎤 APK Voice toggle clicked:", { isRecording, isTranscribing, disabled });
    if (!disabled && !isTranscribing) {
      try {
        console.log("🎤 APK Attempting to toggle recording...");
        await toggleRecording();
        console.log("🎤 APK Recording toggled successfully");
      } catch (error) {
        console.error("🎤 APK Voice recording error:", error);
        // Clear any stuck states
        setTranscript("");
        setMessage("");
        // Show user-friendly error
        alert(`Voice input error: ${(error as any).message || 'Please check microphone permissions'}`);
      }
    } else {
      console.log("🎤 APK Voice toggle blocked:", { disabled, isTranscribing });
    }
  };

  const handleSend = () => {
    console.log("🔍 handleSend called:", { message: message.trim(), disabled });
    if (message.trim() && !disabled) {
      console.log("📤 Sending message:", message.trim());
      onSendMessage(message.trim());
      setMessage("");
      console.log("✅ Message sent and input cleared");
    } else {
      console.log("❌ Send blocked:", { isEmpty: !message.trim(), disabled });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      console.log("⌨️ Enter key pressed - sending message:", message.trim());
      handleSend();
    }
  };

  const handleMouseDown = () => {
    console.log("🎤 Voice button pressed");
    if (!disabled && !isTranscribing) {
      // Simple toggle for all environments
      handleVoiceToggle();
    }
  };

  const handleMouseUp = () => {
    // Do nothing - toggle handles everything
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only prevent default if not passive
    if (e.cancelable) {
      e.preventDefault();
    }
    e.stopPropagation();
    // Prevent context menu and system behaviors
    document.body.style.webkitUserSelect = 'none';
    document.body.style.userSelect = 'none';
    handleMouseDown();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Only prevent default if not passive
    if (e.cancelable) {
      e.preventDefault();
    }
    e.stopPropagation();
    // Restore user selection
    document.body.style.webkitUserSelect = '';
    document.body.style.userSelect = '';
    handleMouseUp();
  };

  const handleTouchCancel = (e: React.TouchEvent) => {
    // Only prevent default if not passive
    if (e.cancelable) {
      e.preventDefault();
    }
    e.stopPropagation();
    // Restore user selection
    document.body.style.webkitUserSelect = '';
    document.body.style.userSelect = '';
    handleMouseUp();
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-3 max-w-4xl mx-auto bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex-1 relative">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message or hold mic to speak..."
            disabled={disabled}
            className="mobile-text-input pr-4"
            style={{ 
              fontSize: '16px',
              minHeight: '44px'
            }}
            data-testid="message-input"
          />
          {transcript && (
            <div className="absolute top-0 left-0 right-0 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-2 text-sm text-blue-800 dark:text-blue-200 z-10">
              Voice: "{transcript}"
            </div>
          )}
        </div>

        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="h-12 w-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white touch-manipulation flex-shrink-0"
          style={{ 
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          data-testid="send-button"
        >
          <Send className="h-5 w-5" />
        </Button>

        {/* Voice Button */}
        <Button
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          disabled={disabled || isTranscribing}
          className={`
            h-12 w-12 rounded-full transition-all duration-200 touch-manipulation flex-shrink-0
            ${isRecording
              ? "animate-pulse shadow-lg shadow-red-500/25 scale-105 bg-red-500 hover:bg-red-600 text-white" 
              : "bg-gray-500 hover:bg-gray-600 text-white shadow-lg hover:scale-105 active:scale-95"
            }
          `}
          style={{ 
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          data-testid="voice-button"
        >
          <Mic className={`h-5 w-5 ${isRecording ? 'animate-pulse' : ''}`} />
        </Button>
      </div>

      {isTranscribing && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-lg border">
          Processing your voice...
        </div>
      )}
    </div>
  );
}