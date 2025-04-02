"use client";

import React from 'react';
import { WalletProvider } from './wallet-provider';
import { Toaster } from 'sonner';
import GlobalErrorBoundary from './global-error-boundary';

// Client providers with global error handling
export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <GlobalErrorBoundary
      componentName="Application Root"
      onError={(error) => {
        console.error('Global application error:', error);
      }}
    >
      <WalletProvider useMock={true}>
        {children}
        <Toaster position="bottom-right" theme="dark" />
      </WalletProvider>
    </GlobalErrorBoundary>
  );
}
