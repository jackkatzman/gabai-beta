import { GabaiCheckIcon } from "@/components/ui/gabai-check-icon";

export function TypingIndicator() {
  return (
    <div className="flex items-start space-x-3 animate-slideUp" data-testid="typing-gabai">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
        <span className="text-white font-bold text-sm">AI</span>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center">
          <GabaiCheckIcon size="md" spin className="text-blue-500" />
        </div>
      </div>
    </div>
  );
}