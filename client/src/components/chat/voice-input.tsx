import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Camera, Paperclip, X } from "lucide-react";
import { useVoice } from "@/hooks/use-voice";
import { useCamera } from "@/hooks/use-camera";
import { isNativeApp } from "@/utils/capacitor";

interface VoiceInputProps {
  onSendMessage: (message: string, attachments?: File[]) => void;
  disabled?: boolean;
}

export function VoiceInput({ onSendMessage, disabled }: VoiceInputProps) {
  const [message, setMessage] = useState("");
  const [isHolding, setIsHolding] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const { isCapturing, imagePreview, capturePhoto, clearPreview, fileInputRef, handleFileSelect } = useCamera({
    onCaptureComplete: async (imageData) => {
      console.log("📸 Photo captured, processing image");
      
      try {
        // Check if we received data
        if (!imageData) {
          throw new Error("No image data received");
        }
        
        let blob: Blob;
        
        // Check if it's already a Blob (from native camera or file input)
        if (imageData instanceof Blob) {
          console.log("📸 Received blob directly:", imageData.size, "bytes, type:", imageData.type);
          blob = imageData;
        } 
        // Handle base64 string (fallback)
        else if (typeof imageData === 'string' && imageData.startsWith('data:')) {
          console.log("📸 Received base64 string, converting to blob");
          const response = await fetch(imageData);
          blob = await response.blob();
          console.log("📸 Converted to blob:", blob.size, "bytes");
        } 
        else {
          throw new Error("Unknown image data format");
        }
        
        // Verify we have actual data
        if (blob.size === 0) {
          throw new Error("Photo blob is empty");
        }
        
        console.log("📸 Sending photo blob with message, size:", blob.size);
        // Send blob directly, don't convert to File
        onSendMessage("📸 [Photo attached] Can you identify what's in this photo?", [blob as any]);
        
        // Set preview for display
        const reader = new FileReader();
        reader.onloadend = () => {
          setPendingImage(reader.result as string);
        };
        reader.readAsDataURL(blob)
        
      } catch (error: any) {
        console.error("📸 Error processing photo:", error.message || error);
        alert("Failed to process camera image. Please try again.");
      }
      
      clearPreview();
      setTimeout(() => setPendingImage(null), 100);
    },
    onError: (error) => {
      console.error("Camera error:", error);
    }
  });

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

  const handleAttachmentSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    console.log("🔍 handleSend called:", { message: message.trim(), disabled, hasAttachments: attachments.length > 0 });
    if ((message.trim() || attachments.length > 0) && !disabled) {
      console.log("📤 Sending message:", message.trim(), "with", attachments.length, "attachments");
      onSendMessage(message.trim() || "[Files attached]", attachments.length > 0 ? attachments : undefined);
      setMessage("");
      setPendingImage(null);
      setAttachments([]);
      clearPreview();
      console.log("✅ Message sent and input cleared");
    } else {
      console.log("❌ Send blocked:", { isEmpty: !message.trim() && attachments.length === 0, disabled });
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
      {/* Display attached files */}
      {attachments.length > 0 && (
        <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center gap-1 bg-white dark:bg-gray-700 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-600">
                <Paperclip className="h-3 w-3 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300 max-w-[150px] truncate">
                  {file.name}
                </span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="ml-1 text-gray-400 hover:text-red-500"
                  data-testid={`remove-attachment-${index}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Two-row layout: action buttons on top, text input below */}
      <div className="flex flex-col gap-2 max-w-4xl mx-auto">
        {/* Row 1: Action buttons (mic, camera, attachments) */}
        <div className="flex items-center justify-center gap-3">
          {/* Attachment Button */}
          <Button
            onClick={() => attachmentInputRef.current?.click()}
            disabled={disabled}
            className="h-12 w-12 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 touch-manipulation"
            style={{ 
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            data-testid="attachment-button"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          {/* Camera Button */}
          <Button
            onClick={capturePhoto}
            disabled={disabled || isCapturing}
            className={`
              h-12 w-12 rounded-full transition-all duration-200 touch-manipulation
              ${isCapturing
                ? "animate-pulse bg-purple-500 hover:bg-purple-600 text-white" 
                : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
              }
            `}
            style={{ 
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            data-testid="camera-button"
          >
            <Camera className={`h-5 w-5 ${isCapturing ? 'animate-pulse' : ''}`} />
          </Button>

          {/* Voice Button - prominent in center */}
          <Button
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            disabled={disabled || isTranscribing}
            className={`
              h-16 w-16 rounded-full transition-all duration-200 touch-manipulation shadow-lg
              ${isRecording
                ? "animate-pulse shadow-red-500/50 scale-110 bg-red-500 hover:bg-red-600 text-white" 
                : "bg-blue-500 hover:bg-blue-600 text-white hover:scale-105 active:scale-95 shadow-blue-500/30"
              }
            `}
            style={{ 
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            data-testid="voice-button"
          >
            <Mic className={`h-7 w-7 ${isRecording ? 'animate-pulse' : ''}`} />
          </Button>
        </div>
        
        {/* Helper text for voice button */}
        <div className="text-center -mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isRecording ? "Release to send" : "Hold to speak"}
          </span>
        </div>

        {/* Row 2: Text input and send button */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Text Input */}
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
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
            {pendingImage && (
              <div className="absolute top-0 left-0 right-0 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-2 text-sm text-green-800 dark:text-green-200 z-10">
                Photo ready to send
              </div>
            )}
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={(!message.trim() && attachments.length === 0) || disabled}
            className="h-11 w-11 rounded-full bg-green-500 hover:bg-green-600 text-white touch-manipulation"
            style={{ 
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            data-testid="send-button"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Hidden file input for camera capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      {/* Hidden file input for general attachments */}
      <input
        ref={attachmentInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf,.doc,.docx,.txt"
        onChange={handleAttachmentSelect}
        style={{ display: 'none' }}
        data-testid="file-input"
      />

      {isTranscribing && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-lg border">
          Processing your voice...
        </div>
      )}
      {isCapturing && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-lg border">
          Capturing photo...
        </div>
      )}
    </div>
  );
}