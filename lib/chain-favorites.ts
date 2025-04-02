"use client";

import { useState, useEffect } from 'react';

const FAVORITES_KEY = 'dunix-chain-favorites';

export const useChainFavorites = () => {
  const [favoriteChainIds, setFavoriteChainIds] = useState<number[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Load favorites from localStorage on component mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedFavorites = localStorage.getItem(FAVORITES_KEY);
      if (storedFavorites) {
        const parsed = JSON.parse(storedFavorites);
        if (Array.isArray(parsed)) {
          setFavoriteChainIds(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading chain favorites:', error);
    }

    setInitialized(true);
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (!initialized || typeof window === 'undefined') return;

    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteChainIds));
    } catch (error) {
      console.error('Error saving chain favorites:', error);
    }
  }, [favoriteChainIds, initialized]);

  const isFavorite = (chainId: number): boolean => {
    return favoriteChainIds.includes(chainId);
  };

  const toggleFavorite = (chainId: number) => {
    setFavoriteChainIds(prevFavorites => {
      if (prevFavorites.includes(chainId)) {
        return prevFavorites.filter(id => id !== chainId);
      } else {
        return [...prevFavorites, chainId];
      }
    });
  };

  return {
    favoriteChainIds,
    isFavorite,
    toggleFavorite
  };
};
