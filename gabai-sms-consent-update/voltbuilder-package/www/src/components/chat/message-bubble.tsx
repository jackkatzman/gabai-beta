import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { LogoBubble } from "@/components/ui/logo-spinner";
import { linkifyText } from "@/utils/linkify";
import { safeTextRender, isTextReady, detectTextDirection } from "@/utils/text-utils";
import type { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
  isUser?: boolean;
}

export function MessageBubble({ message, isUser = false }: MessageBubbleProps) {
  const { speak, isSpeaking } = useSpeechSynthesis();

  const handlePlayAudio = () => {
    if (!isSpeaking) {
      speak(message.content);
    }
  };

  const formatTime = (dateString: string | Date | null) => {
    if (!dateString) return '';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isUser) {
    const textDirection = detectTextDirection(message.content || '');
    return (
      <div className="flex items-start space-x-3 justify-end animate-slideUp">
        <div className="bg-blue-500 rounded-2xl rounded-tr-md px-4 py-3 max-w-xs">
          <p 
            className="text-white text-sm leading-relaxed" 
            dir={textDirection}
            style={{ 
              unicodeBidi: 'plaintext',
              textAlign: textDirection === 'rtl' ? 'right' : 'left',
              writingMode: 'horizontal-tb',
              wordWrap: 'break-word'
            }}
          >
            {isTextReady(message.content) ? safeTextRender(message.content) : "Loading..."}
          </p>
          <span className="text-xs text-blue-200 mt-1 block">
            {formatTime(message.createdAt)}
          </span>
        </div>
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="bg-gray-300 dark:bg-gray-600">
            <span className="text-gray-600 dark:text-gray-300 text-xs">You</span>
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  const aiTextDirection = detectTextDirection(message.content || '');
  return (
    <div className="flex items-start space-x-3 animate-slideUp">
      <LogoBubble size="sm" />
      <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-md px-4 py-3 max-w-xs shadow-sm border border-gray-200 dark:border-gray-700">
        <div 
          className="text-gray-900 dark:text-white text-sm leading-relaxed" 
          dir={aiTextDirection}
          style={{ 
            unicodeBidi: 'plaintext',
            textAlign: aiTextDirection === 'rtl' ? 'right' : 'left',
            writingMode: 'horizontal-tb',
            wordWrap: 'break-word'
          }}
        >
          {isTextReady(message.content) ? linkifyText(safeTextRender(message.content)) : <span>Loading...</span>}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTime(message.createdAt)}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handlePlayAudio}
            disabled={isSpeaking}
            className="h-6 w-6 p-0 ml-2"
          >
            {isSpeaking ? (
              <VolumeX className="h-3 w-3" />
            ) : (
              <Volume2 className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
