import { LogoSpinner } from "@/components/ui/logo-spinner";

export function TypingIndicator() {
  return (
    <div className="flex items-start space-x-3 animate-slideUp">
      <LogoSpinner size="sm" />
      <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">
            GabAi is thinking...
          </span>
        </div>
      </div>
    </div>
  );
}