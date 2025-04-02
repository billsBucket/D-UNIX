"use client";

import { useState, useEffect } from 'react';
import { NetworkInfo, NetworkStatus, NETWORKS } from './ethereum';

const CUSTOM_NETWORKS_KEY = 'dunix-custom-networks';

export interface CustomNetwork extends NetworkInfo {
  isCustom: true;
  addedAt: number;
}

export const useCustomNetworks = () => {
  const [customNetworks, setCustomNetworks] = useState<Record<number, CustomNetwork>>({});
  const [initialized, setInitialized] = useState(false);

  // Load custom networks from localStorage on component mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedNetworks = localStorage.getItem(CUSTOM_NETWORKS_KEY);
      if (storedNetworks) {
        const parsed = JSON.parse(storedNetworks);
        if (typeof parsed === 'object') {
          setCustomNetworks(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading custom networks:', error);
    }

    setInitialized(true);
  }, []);

  // Save custom networks to localStorage whenever they change
  useEffect(() => {
    if (!initialized || typeof window === 'undefined') return;

    try {
      localStorage.setItem(CUSTOM_NETWORKS_KEY, JSON.stringify(customNetworks));
    } catch (error) {
      console.error('Error saving custom networks:', error);
    }
  }, [customNetworks, initialized]);

  // Check if a chain ID is already in use (built-in or custom)
  const isChainIdInUse = (chainId: number): boolean => {
    return chainId in NETWORKS || chainId in customNetworks;
  };

  // Validate network information
  const validateNetworkInfo = (network: Partial<NetworkInfo>): string[] => {
    const errors: string[] = [];

    if (!network.chainId) {
      errors.push('Chain ID is required');
    } else if (isChainIdInUse(network.chainId)) {
      errors.push(`Chain ID ${network.chainId} is already in use`);
    }

    if (!network.name || network.name.trim() === '') {
      errors.push('Network name is required');
    }

    if (!network.symbol || network.symbol.trim() === '') {
      errors.push('Network currency symbol is required');
    }

    if (!network.decimals) {
      errors.push('Currency decimals are required');
    }

    if (!network.rpcUrl || network.rpcUrl.trim() === '') {
      errors.push('RPC URL is required');
    } else if (!network.rpcUrl.startsWith('http')) {
      errors.push('RPC URL must start with http:// or https://');
    }

    if (!network.blockExplorer || network.blockExplorer.trim() === '') {
      errors.push('Block explorer URL is required');
    } else if (!network.blockExplorer.startsWith('http')) {
      errors.push('Block explorer URL must start with http:// or https://');
    }

    return errors;
  };

  // Add a new custom network
  const addCustomNetwork = (network: Omit<NetworkInfo, 'status' | 'gasPrice' | 'features'>): [boolean, string[]] => {
    const validationErrors = validateNetworkInfo(network);
    if (validationErrors.length > 0) {
      return [false, validationErrors];
    }

    // Create the custom network with required properties
    const customNetwork: CustomNetwork = {
      ...network,
      status: 'online' as NetworkStatus,
      gasPrice: 'Unknown',
      features: ['Custom'],
      isCustom: true,
      addedAt: Date.now()
    };

    setCustomNetworks(prev => ({
      ...prev,
      [network.chainId]: customNetwork
    }));

    return [true, []];
  };

  // Update an existing custom network
  const updateCustomNetwork = (chainId: number, updates: Partial<NetworkInfo>): [boolean, string[]] => {
    if (!(chainId in customNetworks)) {
      return [false, [`Network with chain ID ${chainId} not found`]];
    }

    // Cannot change the chain ID of an existing network
    if (updates.chainId && updates.chainId !== chainId) {
      return [false, ['Cannot change the chain ID of an existing network']];
    }

    // Validate fields that are being updated
    const fieldsToValidate = { ...customNetworks[chainId], ...updates };
    const validationErrors = validateNetworkInfo(fieldsToValidate);
    if (validationErrors.length > 0) {
      return [false, validationErrors];
    }

    // Update the network
    setCustomNetworks(prev => ({
      ...prev,
      [chainId]: {
        ...prev[chainId],
        ...updates
      }
    }));

    return [true, []];
  };

  // Remove a custom network
  const removeCustomNetwork = (chainId: number): boolean => {
    if (!(chainId in customNetworks)) {
      return false;
    }

    setCustomNetworks(prev => {
      const newNetworks = { ...prev };
      delete newNetworks[chainId];
      return newNetworks;
    });

    return true;
  };

  // Get a specific custom network
  const getCustomNetwork = (chainId: number): CustomNetwork | undefined => {
    return customNetworks[chainId];
  };

  // Get all networks (built-in + custom)
  const getAllNetworks = (): Record<number, NetworkInfo> => {
    return { ...NETWORKS, ...customNetworks };
  };

  // Verify if a chain is a custom network
  const isCustomNetwork = (chainId: number): boolean => {
    return chainId in customNetworks;
  };

  return {
    customNetworks,
    addCustomNetwork,
    updateCustomNetwork,
    removeCustomNetwork,
    getCustomNetwork,
    getAllNetworks,
    isCustomNetwork,
    isChainIdInUse
  };
};
