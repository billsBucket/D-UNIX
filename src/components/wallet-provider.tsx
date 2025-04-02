"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useWallet, WalletState } from '@/lib/wallet';

// Define what shape the wallet context will have
interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
  formatAddress: (address: string) => string;
  isConnected: boolean;
  isConnecting: boolean;
}

// Create the context with a default value (will be overridden by the provider)
const WalletContext = createContext<WalletContextType | null>(null);

// Create a hook to use the wallet context
export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  // Use real wallet without mock option
  const walletProps = useWallet();

  return (
    <WalletContext.Provider value={walletProps as WalletContextType}>
      {children}
    </WalletContext.Provider>
  );
}
