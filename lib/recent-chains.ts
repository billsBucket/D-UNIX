"use client";

import { useState, useEffect } from 'react';

const RECENT_CHAINS_KEY = 'dunix-recent-chains';
const MAX_RECENT_CHAINS = 5; // Maximum number of recent chains to track

export interface RecentChain {
  chainId: number;
  timestamp: number;
  useCount: number;
}

export const useRecentChains = () => {
  const [recentChains, setRecentChains] = useState<RecentChain[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Load recent chains from localStorage on component mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedChains = localStorage.getItem(RECENT_CHAINS_KEY);
      if (storedChains) {
        const parsed = JSON.parse(storedChains);
        if (Array.isArray(parsed)) {
          setRecentChains(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading recent chains:', error);
    }

    setInitialized(true);
  }, []);

  // Save recent chains to localStorage whenever they change
  useEffect(() => {
    if (!initialized || typeof window === 'undefined') return;

    try {
      localStorage.setItem(RECENT_CHAINS_KEY, JSON.stringify(recentChains));
    } catch (error) {
      console.error('Error saving recent chains:', error);
    }
  }, [recentChains, initialized]);

  // Function to add a chain to recent chains or update its position/count
  const addRecentChain = (chainId: number) => {
    setRecentChains(prev => {
      // Check if the chain is already in the list
      const existingIndex = prev.findIndex(chain => chain.chainId === chainId);

      if (existingIndex >= 0) {
        // Chain exists, update it and move to the front
        const updatedChains = [...prev];
        const existingChain = {
          ...updatedChains[existingIndex],
          timestamp: Date.now(),
          useCount: updatedChains[existingIndex].useCount + 1
        };

        // Remove the chain from its current position
        updatedChains.splice(existingIndex, 1);

        // Add it to the front
        return [existingChain, ...updatedChains];
      } else {
        // New chain, add to the front
        const newChain: RecentChain = {
          chainId,
          timestamp: Date.now(),
          useCount: 1
        };

        // Add new chain and limit the list to MAX_RECENT_CHAINS
        return [newChain, ...prev].slice(0, MAX_RECENT_CHAINS);
      }
    });
  };

  // Get most frequently used chains
  const getMostFrequentChains = (limit: number = MAX_RECENT_CHAINS): number[] => {
    return [...recentChains]
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, limit)
      .map(chain => chain.chainId);
  };

  // Get most recently used chains
  const getMostRecentChains = (limit: number = MAX_RECENT_CHAINS): number[] => {
    return recentChains.slice(0, limit).map(chain => chain.chainId);
  };

  return {
    recentChains,
    addRecentChain,
    getMostFrequentChains,
    getMostRecentChains
  };
};
