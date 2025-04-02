import React from 'react';
import { NetworkStatus } from '@/lib/ethereum';

interface NetworkStatusIndicatorProps {
  status?: NetworkStatus;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export const NetworkStatusIndicator = React.memo(({
  status,
  size = 'sm',
  showPulse = false
}: NetworkStatusIndicatorProps) => {
  // If no status or offline, render empty space with same width for alignment
  if (!status || status === 'offline') {
    return <span className={`inline-block ${getSize(size)} opacity-0`}></span>;
  }

  const bgColor = status === 'online' ? "bg-green-500" : "bg-yellow-500";

  const sizeClasses = getSize(size);

  return (
    <span className={`relative flex ${sizeClasses} mr-2`}>
      {showPulse && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${bgColor} opacity-75`}></span>
      )}
      <span className={`relative inline-flex rounded-full ${sizeClasses} ${bgColor}`}></span>
    </span>
  );
});

// Helper function to get size classes
function getSize(size: 'sm' | 'md' | 'lg'): string {
  switch(size) {
    case 'sm': return 'h-1.5 w-1.5';
    case 'md': return 'h-2 w-2';
    case 'lg': return 'h-2.5 w-2.5';
    default: return 'h-1.5 w-1.5';
  }
}

NetworkStatusIndicator.displayName = 'NetworkStatusIndicator';

export default NetworkStatusIndicator;
