"use client";

import React, { useState, useEffect } from 'react';
import { getGasPrice } from '@/lib/ethereum';
import { useWalletContext } from './wallet-provider';
import { NETWORKS } from '@/lib/ethereum';

export default function NetworkStatus() {
  const [gasPrice, setGasPrice] = useState<string>('0');
  const [networkStatus, setNetworkStatus] = useState<'healthy' | 'busy' | 'congested'>('healthy');
  const [isLoading, setIsLoading] = useState(true);
  const { chainId } = useWalletContext();

  // Get current network name
  const networkName = chainId ? NETWORKS[chainId]?.name || 'Unknown' : 'Ethereum';

  // Fetch gas price on mount and periodically
  useEffect(() => {
    const fetchGasPrice = async () => {
      try {
        setIsLoading(true);
        const price = await getGasPrice();
        setGasPrice(price);

        // Determine network status based on gas price
        const priceNum = parseFloat(price);
        if (priceNum < 30) {
          setNetworkStatus('healthy');
        } else if (priceNum < 100) {
          setNetworkStatus('busy');
        } else {
          setNetworkStatus('congested');
        }
      } catch (error) {
        console.error('Failed to fetch gas price:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGasPrice();
    // Update every 15 seconds
    const interval = setInterval(fetchGasPrice, 15000);

    return () => clearInterval(interval);
  }, [chainId]);

  // Get status color based on network status
  const getStatusColor = () => {
    switch (networkStatus) {
      case 'healthy':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'congested':
        return 'bg-red-500';
      default:
        return 'bg-green-500';
    }
  };

  // Get status text based on network status
  const getStatusText = () => {
    switch (networkStatus) {
      case 'healthy':
        return 'Low Traffic';
      case 'busy':
        return 'Moderate Traffic';
      case 'congested':
        return 'High Traffic';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="border border-white/10 bg-black/20 p-2 text-xs flex items-center justify-between">
      <div className="flex items-center">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()} mr-2 ${isLoading ? 'animate-pulse' : ''}`}></div>
        <span className="font-mono">{networkName}: {getStatusText()}</span>
      </div>
      <div className="font-mono">
        {isLoading ? (
          <span className="animate-pulse">Loading...</span>
        ) : (
          <span>Gas: {gasPrice} GWEI</span>
        )}
      </div>
    </div>
  );
}
