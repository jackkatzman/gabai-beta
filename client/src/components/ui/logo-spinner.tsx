import React from 'react';
import { cn } from '@/lib/utils';

interface LogoSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LogoSpinner({ className, size = 'md' }: LogoSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10', 
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="relative">
        {/* Speech bubble background */}
        <div className={cn(
          'relative rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg',
          sizeClasses[size]
        )}>
          {/* Speech bubble tail */}
          <div className={cn(
            'absolute bg-gradient-to-br from-blue-500 to-blue-600 rotate-45 rounded-sm',
            size === 'sm' ? '-bottom-1 left-2 w-2 h-2' : 
            size === 'md' ? '-bottom-1.5 left-3 w-3 h-3' : 
            '-bottom-2 left-6 w-4 h-4'
          )}></div>
          
          {/* Checkmark with subtle pulse animation */}
          <svg
            className={cn('text-white animate-pulse', iconSizes[size])}
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
    </div>
  );
}

// Just the bubble without the spinning checkmark
export function LogoBubble({ className, size = 'md' }: LogoSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="relative">
        {/* Speech bubble background */}
        <div className={cn(
          'relative rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg',
          sizeClasses[size]
        )}>
          {/* Speech bubble tail */}
          <div className={cn(
            'absolute bg-gradient-to-br from-blue-500 to-blue-600 rotate-45 rounded-sm',
            size === 'sm' ? '-bottom-1 left-2 w-2 h-2' : 
            size === 'md' ? '-bottom-1.5 left-3 w-3 h-3' : 
            '-bottom-2 left-6 w-4 h-4'
          )}></div>
          
          {/* Checkmark */}
          <svg
            className={cn('text-white', iconSizes[size])}
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
    </div>
  );
}