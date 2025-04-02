'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface SuspenseLoadingProps {
  variant?: 'default' | 'panel' | 'fullscreen' | 'inline' | 'skeleton';
  label?: string;
  height?: string;
  width?: string;
  className?: string;
}

const SuspenseLoading: React.FC<SuspenseLoadingProps> = ({
  variant = 'default',
  label = 'Loading...',
  height = 'h-40',
  width = 'w-full',
  className = '',
}) => {
  // Fullscreen loader
  if (variant === 'fullscreen') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-black/90 border border-white/10 p-6 rounded-lg flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-white animate-spin mb-4" />
          <p className="text-white/80 text-sm">{label}</p>
        </div>
      </div>
    );
  }

  // Panel loader - used inside cards/panels
  if (variant === 'panel') {
    return (
      <div className={`border border-white/10 p-4 bg-black/50 rounded-md flex flex-col items-center justify-center ${height} ${width} ${className}`}>
        <Loader2 className="h-6 w-6 text-white/50 animate-spin mb-3" />
        <p className="text-white/50 text-xs">{label}</p>
      </div>
    );
  }

  // Inline loader - used in buttons or inline with text
  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center ${className}`}>
        <Loader2 className="h-3 w-3 text-white/70 animate-spin mr-2" />
        <span className="text-white/70 text-xs">{label}</span>
      </span>
    );
  }

  // Skeleton loader - used for content placeholder
  if (variant === 'skeleton') {
    return (
      <div className={`${width} ${height} ${className}`}>
        <div className="animate-pulse flex flex-col space-y-3">
          <div className="h-3 bg-white/5 rounded w-3/4"></div>
          <div className="h-3 bg-white/5 rounded"></div>
          <div className="h-3 bg-white/5 rounded w-5/6"></div>
          <div className="h-3 bg-white/5 rounded w-2/3"></div>
          <div className="h-3 bg-white/5 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Default loader
  return (
    <div className={`flex items-center justify-center ${height} ${width} ${className}`}>
      <Loader2 className="h-5 w-5 text-white/60 animate-spin mr-2" />
      <span className="text-white/60 text-sm">{label}</span>
    </div>
  );
};

export default SuspenseLoading;
