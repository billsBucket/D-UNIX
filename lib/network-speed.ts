"use client";

import { useState, useEffect } from 'react';
import { NETWORKS } from './ethereum';

const SPEED_TEST_CACHE_KEY = 'dunix-network-speed-tests';
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

export interface NetworkSpeedResult {
  chainId: number;
  latency: number; // in milliseconds
  timestamp: number;
  success: boolean;
  error?: string;
}

export const useNetworkSpeed = () => {
  const [speedResults, setSpeedResults] = useState<NetworkSpeedResult[]>([]);
  const [isLoading, setIsLoading] = useState<Record<number, boolean>>({});
  const [initialized, setInitialized] = useState(false);

  // Load previous test results from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const cachedResults = localStorage.getItem(SPEED_TEST_CACHE_KEY);
      if (cachedResults) {
        const parsed = JSON.parse(cachedResults);
        if (Array.isArray(parsed)) {
          // Filter out expired results
          const now = Date.now();
          const validResults = parsed.filter(
            (result: NetworkSpeedResult) => now - result.timestamp < CACHE_EXPIRY_TIME
          );
          setSpeedResults(validResults);
        }
      }
    } catch (error) {
      console.error('Error loading network speed results:', error);
    }

    setInitialized(true);
  }, []);

  // Save results to localStorage when they change
  useEffect(() => {
    if (!initialized || typeof window === 'undefined') return;

    try {
      localStorage.setItem(SPEED_TEST_CACHE_KEY, JSON.stringify(speedResults));
    } catch (error) {
      console.error('Error saving network speed results:', error);
    }
  }, [speedResults, initialized]);

  // Measure network latency for a specific chain
  const testNetworkSpeed = async (chainId: number): Promise<NetworkSpeedResult> => {
    const network = NETWORKS[chainId];
    if (!network) {
      throw new Error(`Network with chainId ${chainId} not found`);
    }

    setIsLoading(prev => ({ ...prev, [chainId]: true }));

    try {
      // Create a simple JSON-RPC request to measure latency
      const request = {
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      };

      const startTime = performance.now();

      // Send the request to the RPC URL
      const response = await fetch(network.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      // Calculate latency
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      if (!response.ok) {
        throw new Error(`Failed to connect to ${network.name}: ${response.statusText}`);
      }

      const result: NetworkSpeedResult = {
        chainId,
        latency,
        timestamp: Date.now(),
        success: true
      };

      // Update stored results
      setSpeedResults(prev => {
        const existingIndex = prev.findIndex(r => r.chainId === chainId);
        if (existingIndex >= 0) {
          // Replace existing result
          const updated = [...prev];
          updated[existingIndex] = result;
          return updated;
        } else {
          // Add new result
          return [...prev, result];
        }
      });

      return result;
    } catch (error) {
      const errorResult: NetworkSpeedResult = {
        chainId,
        latency: -1,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      // Save error result
      setSpeedResults(prev => {
        const existingIndex = prev.findIndex(r => r.chainId === chainId);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = errorResult;
          return updated;
        } else {
          return [...prev, errorResult];
        }
      });

      return errorResult;
    } finally {
      setIsLoading(prev => ({ ...prev, [chainId]: false }));
    }
  };

  // Test all networks in parallel
  const testAllNetworks = async (): Promise<NetworkSpeedResult[]> => {
    const chainIds = Object.keys(NETWORKS).map(Number);
    const promises = chainIds.map(testNetworkSpeed);
    return Promise.all(promises);
  };

  // Get the result for a specific network
  const getNetworkSpeed = (chainId: number): NetworkSpeedResult | undefined => {
    return speedResults.find(result => result.chainId === chainId);
  };

  // Get the fastest networks based on latency
  const getFastestNetworks = (limit: number = 3): number[] => {
    return [...speedResults]
      .filter(result => result.success && result.latency > 0)
      .sort((a, b) => a.latency - b.latency)
      .slice(0, limit)
      .map(result => result.chainId);
  };

  // Determine if a result is fresh or needs retesting
  const isResultFresh = (chainId: number): boolean => {
    const result = getNetworkSpeed(chainId);
    if (!result) return false;

    const now = Date.now();
    return now - result.timestamp < CACHE_EXPIRY_TIME;
  };

  return {
    speedResults,
    isLoading,
    testNetworkSpeed,
    testAllNetworks,
    getNetworkSpeed,
    getFastestNetworks,
    isResultFresh
  };
};
