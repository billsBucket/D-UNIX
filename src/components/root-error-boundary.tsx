'use client';

import React from 'react';
import GlobalErrorBoundary from './global-error-boundary';

interface RootErrorBoundaryProps {
  children: React.ReactNode;
}

export default function RootErrorBoundary({ children }: RootErrorBoundaryProps) {
  return (
    <GlobalErrorBoundary
      componentName="Application Root"
      onError={(error) => {
        console.error('Global application error:', error);
      }}
    >
      {children}
    </GlobalErrorBoundary>
  );
}
