import React from 'react';
import { cn } from '@/lib/utils';

interface LogoSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LogoSpinner({ className, size = 'md' }: LogoSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      {/* Blue bubble background */}
      <div className={cn(
        'relative rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center',
        sizeClasses[size]
      )}>
        {/* White checkmark with spin animation */}
        <svg
          className="w-1/2 h-1/2 text-white animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
    </div>
  );
}

// Just the bubble without the spinning checkmark
export function LogoBubble({ className, size = 'md' }: LogoSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn(
        'relative rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center',
        sizeClasses[size]
      )}>
        <svg
          className="w-1/2 h-1/2 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
    </div>
  );
}