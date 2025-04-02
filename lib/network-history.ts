"use client";

import { useState, useEffect } from 'react';
import { NetworkStatus } from './ethereum';

const HISTORY_CACHE_KEY = 'dunix-network-history';
const MAX_HISTORY_ENTRIES = 100; // Maximum number of data points to store per network
const HISTORY_EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export interface NetworkHistoryEntry {
  timestamp: number;
  latency: number;
  status: NetworkStatus;
  success: boolean;
  error?: string;
}

export interface NetworkHistory {
  [chainId: number]: NetworkHistoryEntry[];
}

export const useNetworkHistory = () => {
  const [history, setHistory] = useState<NetworkHistory>({});
  const [initialized, setInitialized] = useState(false);

  // Load network history from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const cachedHistory = localStorage.getItem(HISTORY_CACHE_KEY);
      if (cachedHistory) {
        const parsed = JSON.parse(cachedHistory);
        if (typeof parsed === 'object') {
          // Filter out expired entries
          const now = Date.now();
          const filteredHistory: NetworkHistory = {};

          Object.entries(parsed).forEach(([chainId, entries]) => {
            if (Array.isArray(entries)) {
              const validEntries = (entries as NetworkHistoryEntry[]).filter(
                entry => now - entry.timestamp < HISTORY_EXPIRY_TIME
              );

              if (validEntries.length > 0) {
                filteredHistory[parseInt(chainId)] = validEntries;
              }
            }
          });

          setHistory(filteredHistory);
        }
      }
    } catch (error) {
      console.error('Error loading network history:', error);
    }

    setInitialized(true);
  }, []);

  // Save history to localStorage when it changes
  useEffect(() => {
    if (!initialized || typeof window === 'undefined') return;

    try {
      localStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving network history:', error);
    }
  }, [history, initialized]);

  // Add a new history entry for a network
  const addHistoryEntry = (
    chainId: number,
    entry: Omit<NetworkHistoryEntry, 'timestamp'>
  ) => {
    const timestamp = Date.now();
    const fullEntry: NetworkHistoryEntry = { ...entry, timestamp };

    setHistory(prev => {
      const networkHistory = prev[chainId] || [];

      // Add new entry to the beginning of the array
      const updatedHistory = [fullEntry, ...networkHistory];

      // Limit the number of entries
      const limitedHistory = updatedHistory.slice(0, MAX_HISTORY_ENTRIES);

      return {
        ...prev,
        [chainId]: limitedHistory
      };
    });
  };

  // Get history for a specific network
  const getNetworkHistory = (chainId: number): NetworkHistoryEntry[] => {
    return history[chainId] || [];
  };

  // Calculate average latency for a network over a time period
  const getAverageLatency = (chainId: number, periodMs: number = 24 * 60 * 60 * 1000): number => {
    const networkHistory = getNetworkHistory(chainId);
    if (networkHistory.length === 0) return -1;

    const now = Date.now();
    const relevantEntries = networkHistory.filter(
      entry => entry.success && now - entry.timestamp < periodMs
    );

    if (relevantEntries.length === 0) return -1;

    const sum = relevantEntries.reduce((total, entry) => total + entry.latency, 0);
    return Math.round(sum / relevantEntries.length);
  };

  // Calculate uptime percentage for a network over a time period
  const getUptimePercentage = (chainId: number, periodMs: number = 24 * 60 * 60 * 1000): number => {
    const networkHistory = getNetworkHistory(chainId);
    if (networkHistory.length === 0) return 0;

    const now = Date.now();
    const relevantEntries = networkHistory.filter(
      entry => now - entry.timestamp < periodMs
    );

    if (relevantEntries.length === 0) return 0;

    const successfulEntries = relevantEntries.filter(entry => entry.success);
    return Math.round((successfulEntries.length / relevantEntries.length) * 100);
  };

  // Calculate reliability score based on latency, uptime, and status
  const getReliabilityScore = (chainId: number, periodMs: number = 24 * 60 * 60 * 1000): number => {
    const uptime = getUptimePercentage(chainId, periodMs);
    const avgLatency = getAverageLatency(chainId, periodMs);

    if (uptime === 0 || avgLatency === -1) return 0;

    // Score based on latency (0-50 points)
    // Lower latency = higher score
    // 0ms = 50 points, 1000ms or more = 0 points
    const latencyScore = Math.max(0, 50 - (avgLatency / 20));

    // Score based on uptime (0-50 points)
    // Higher uptime = higher score
    // 100% = 50 points, 0% = 0 points
    const uptimeScore = uptime / 2;

    // Total score (0-100)
    return Math.round(latencyScore + uptimeScore);
  };

  // Get a summary of network history for a specific chain
  const getNetworkSummary = (chainId: number) => {
    const entries = getNetworkHistory(chainId);

    // Last 24 hours
    const day = 24 * 60 * 60 * 1000;
    const avgLatency24h = getAverageLatency(chainId, day);
    const uptime24h = getUptimePercentage(chainId, day);
    const reliability24h = getReliabilityScore(chainId, day);

    // Last 7 days
    const week = 7 * day;
    const avgLatency7d = getAverageLatency(chainId, week);
    const uptime7d = getUptimePercentage(chainId, week);
    const reliability7d = getReliabilityScore(chainId, week);

    // Recent trends
    const latestEntries = entries.slice(0, 10);
    const latencyTrend = latestEntries.length >= 2
      ? latestEntries[0].latency - latestEntries[latestEntries.length - 1].latency
      : 0;

    return {
      totalEntries: entries.length,
      latestStatus: entries.length > 0 ? entries[0].status : 'offline' as NetworkStatus,
      latestLatency: entries.length > 0 ? entries[0].latency : -1,
      avgLatency24h,
      uptime24h,
      reliability24h,
      avgLatency7d,
      uptime7d,
      reliability7d,
      latencyTrend
    };
  };

  // Clear history for a specific network
  const clearNetworkHistory = (chainId: number) => {
    setHistory(prev => {
      const newHistory = { ...prev };
      delete newHistory[chainId];
      return newHistory;
    });
  };

  // Clear all history
  const clearAllHistory = () => {
    setHistory({});
  };

  return {
    history,
    addHistoryEntry,
    getNetworkHistory,
    getAverageLatency,
    getUptimePercentage,
    getReliabilityScore,
    getNetworkSummary,
    clearNetworkHistory,
    clearAllHistory
  };
};
