"use client";

import { useState, useEffect } from 'react';
import { NetworkInfo } from './ethereum';
import { useNetworkSpeed, NetworkSpeedResult } from './network-speed';
import { useNetworkHistory } from './network-history';

interface AutoNetworkOptions {
  maxLatency?: number; // Maximum acceptable latency in ms
  preferCurrentNetwork?: boolean; // Whether to prefer current network if it's within acceptable latency
  latencyThreshold?: number; // Latency difference threshold to trigger a switch
  reliabilityThreshold?: number; // Minimum reliability score
  excludedNetworks?: number[]; // Networks to exclude from auto-switching
}

export interface NetworkRanking {
  chainId: number;
  score: number;
  latency: number;
  reliability: number;
  isRecommended: boolean;
}

export const useAutoNetwork = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [options, setOptions] = useState<AutoNetworkOptions>({
    maxLatency: 500,
    preferCurrentNetwork: true,
    latencyThreshold: 100,
    reliabilityThreshold: 70,
    excludedNetworks: []
  });
  const [lastRankings, setLastRankings] = useState<NetworkRanking[]>([]);
  const [initialized, setInitialized] = useState(false);

  const { speedResults, testAllNetworks } = useNetworkSpeed();
  const { getReliabilityScore } = useNetworkHistory();

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedEnabled = localStorage.getItem('dunix-auto-network-enabled');
      if (storedEnabled !== null) {
        setIsEnabled(storedEnabled === 'true');
      }

      const storedOptions = localStorage.getItem('dunix-auto-network-options');
      if (storedOptions) {
        setOptions(JSON.parse(storedOptions));
      }
    } catch (error) {
      console.error('Error loading auto-network settings:', error);
    }

    setInitialized(true);
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    if (!initialized || typeof window === 'undefined') return;

    try {
      localStorage.setItem('dunix-auto-network-enabled', isEnabled.toString());
      localStorage.setItem('dunix-auto-network-options', JSON.stringify(options));
    } catch (error) {
      console.error('Error saving auto-network settings:', error);
    }
  }, [isEnabled, options, initialized]);

  // Find best network based on speed results and history
  const findBestNetwork = (
    availableNetworks: Record<number, NetworkInfo>,
    currentChainId?: number
  ): number | null => {
    if (Object.keys(speedResults).length === 0) {
      return null; // Not enough data to make a recommendation
    }

    const { maxLatency, preferCurrentNetwork, latencyThreshold, reliabilityThreshold, excludedNetworks } = options;

    // Calculate scores for networks
    const rankings: NetworkRanking[] = Object.keys(availableNetworks)
      .map(id => parseInt(id))
      .filter(chainId => !excludedNetworks?.includes(chainId)) // Filter out excluded networks
      .map(chainId => {
        const speedResult = speedResults.find(r => r.chainId === chainId);

        // If no speed result or failed test, give a very low score
        if (!speedResult || !speedResult.success) {
          return {
            chainId,
            score: -1000,
            latency: 9999,
            reliability: 0,
            isRecommended: false
          };
        }

        // Get reliability score from history
        const reliability = getReliabilityScore(chainId);

        // Calculate base score based on latency (lower is better)
        // 0ms = 1000 points, 1000ms = 0 points
        const latencyScore = Math.max(0, 1000 - speedResult.latency);

        // Add reliability score (0-100)
        // Weight reliability as 30% of the total score
        const weightedReliabilityScore = reliability * 3;

        // Total score (max 1300)
        const score = latencyScore + weightedReliabilityScore;

        return {
          chainId,
          score,
          latency: speedResult.latency,
          reliability,
          isRecommended: speedResult.latency <= (maxLatency || 500) && reliability >= (reliabilityThreshold || 0)
        };
      })
      // Sort by score (highest first)
      .sort((a, b) => b.score - a.score);

    // Store rankings for later reference
    setLastRankings(rankings);

    // No viable networks
    if (rankings.length === 0 || rankings[0].score < 0) {
      return null;
    }

    // If we want to prefer the current network and it's within acceptable parameters
    if (preferCurrentNetwork && currentChainId) {
      const currentNetwork = rankings.find(r => r.chainId === currentChainId);
      const bestNetwork = rankings[0];

      if (currentNetwork && currentNetwork.isRecommended) {
        // Only switch if the best network is significantly better
        const latencyDifference = currentNetwork.latency - bestNetwork.latency;
        if (latencyDifference < (latencyThreshold || 100)) {
          return currentChainId; // Stay on current network
        }
      }
    }

    // Return the best network
    return rankings[0].chainId;
  };

  // Update options
  const updateOptions = (newOptions: Partial<AutoNetworkOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  };

  // Toggle auto-switching
  const toggleAutoSwitching = () => {
    setIsEnabled(prev => !prev);
  };

  // Test all networks and get a recommendation
  const getRecommendedNetwork = async (
    availableNetworks: Record<number, NetworkInfo>,
    currentChainId?: number
  ): Promise<number | null> => {
    await testAllNetworks();
    return findBestNetwork(availableNetworks, currentChainId);
  };

  // Get the current network rankings
  const getNetworkRankings = (): NetworkRanking[] => {
    return lastRankings;
  };

  return {
    isEnabled,
    options,
    lastRankings,
    updateOptions,
    toggleAutoSwitching,
    findBestNetwork,
    getRecommendedNetwork,
    getNetworkRankings
  };
};
