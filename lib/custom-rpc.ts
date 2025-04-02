"use client";

import { useState, useEffect } from 'react';
import { NETWORKS } from './ethereum';

const CUSTOM_RPC_KEY = 'dunix-custom-rpc-urls';

export interface CustomRPC {
  chainId: number;
  rpcUrl: string;
  timestamp: number;
  name?: string;
}

export const useCustomRPC = () => {
  const [customRPCs, setCustomRPCs] = useState<CustomRPC[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Load custom RPCs from localStorage on component mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedRPCs = localStorage.getItem(CUSTOM_RPC_KEY);
      if (storedRPCs) {
        const parsed = JSON.parse(storedRPCs);
        if (Array.isArray(parsed)) {
          setCustomRPCs(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading custom RPC URLs:', error);
    }

    setInitialized(true);
  }, []);

  // Save custom RPCs to localStorage whenever they change
  useEffect(() => {
    if (!initialized || typeof window === 'undefined') return;

    try {
      localStorage.setItem(CUSTOM_RPC_KEY, JSON.stringify(customRPCs));
    } catch (error) {
      console.error('Error saving custom RPC URLs:', error);
    }
  }, [customRPCs, initialized]);

  // Add or update a custom RPC URL for a chain
  const setCustomRPC = (chainId: number, rpcUrl: string, name?: string) => {
    if (!rpcUrl) return false;

    setCustomRPCs(prev => {
      const existingIndex = prev.findIndex(rpc => rpc.chainId === chainId);

      // Create the new or updated RPC entry
      const rpcEntry: CustomRPC = {
        chainId,
        rpcUrl,
        timestamp: Date.now(),
        name: name || `Custom RPC for ${NETWORKS[chainId]?.name || `Chain ${chainId}`}`
      };

      if (existingIndex >= 0) {
        // Update existing entry
        const updated = [...prev];
        updated[existingIndex] = rpcEntry;
        return updated;
      } else {
        // Add new entry
        return [...prev, rpcEntry];
      }
    });

    return true;
  };

  // Remove a custom RPC URL for a chain
  const removeCustomRPC = (chainId: number) => {
    setCustomRPCs(prev => prev.filter(rpc => rpc.chainId !== chainId));
  };

  // Get the custom RPC URL for a specific chain if it exists
  const getCustomRPC = (chainId: number): CustomRPC | undefined => {
    return customRPCs.find(rpc => rpc.chainId === chainId);
  };

  // Get the effective RPC URL for a chain (custom if set, otherwise default)
  const getEffectiveRPC = (chainId: number): string => {
    const customRPC = getCustomRPC(chainId);
    if (customRPC) {
      return customRPC.rpcUrl;
    }

    // Fall back to default RPC URL
    return NETWORKS[chainId]?.rpcUrl || '';
  };

  // Check if a chain has a custom RPC URL
  const hasCustomRPC = (chainId: number): boolean => {
    return customRPCs.some(rpc => rpc.chainId === chainId);
  };

  // Validate an RPC URL
  const validateRPCUrl = async (rpcUrl: string): Promise<boolean> => {
    try {
      // Simple JSON-RPC request to test the endpoint
      const request = {
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      };

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        timeout: 5000 // 5 second timeout
      } as any);

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data && data.result !== undefined;
    } catch (error) {
      console.error('Error validating RPC URL:', error);
      return false;
    }
  };

  return {
    customRPCs,
    setCustomRPC,
    removeCustomRPC,
    getCustomRPC,
    getEffectiveRPC,
    hasCustomRPC,
    validateRPCUrl
  };
};
