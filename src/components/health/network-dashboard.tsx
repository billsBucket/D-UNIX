"use client";

import React, { useState, useEffect } from 'react';
import { useRealTimeData } from '@/hooks/use-real-time-data';
import ChainStatusCard from './chain-status-card';
import { ChainStatus, generateChainsData, calculateStats, createProblemChains } from './chain-data';

// Define possible sort types
type SortType = 'default' | 'OPERATIONAL' | 'CONGESTED' | 'DEGRADED' | 'OUTAGE';

export default function NetworkDashboard() {
  const [chainsData, setChainsData] = useState<ChainStatus[]>([]);
  const [sortedChainsData, setSortedChainsData] = useState<ChainStatus[]>([]);
  const [overallHealth, setOverallHealth] = useState(79);
  const [lastUpdated, setLastUpdated] = useState('');
  const [statusCounts, setStatusCounts] = useState({
    operational: 4,
    congested: 6,
    degraded: 0,
    outage: 0
  });
  // Add sort state
  const [currentSort, setCurrentSort] = useState<SortType>('default');

  // Use real-time data hook with 30 second interval
  const { data: realTimeData, refresh } = useRealTimeData({
    refreshInterval: 30000, // Every 30 seconds via the hook
    metrics: ['all']
  });

  // Generate chain data
  const updateChainData = () => {
    // Create a set of problem chains for more realistic data
    const problemChains = createProblemChains();

    // Generate data for all chains
    const data = generateChainsData(problemChains);

    // Calculate statistics
    const stats = calculateStats(data);

    // Update state
    setChainsData(data);
    setStatusCounts({
      operational: stats.operational,
      congested: stats.congested,
      degraded: stats.degraded,
      outage: stats.outage
    });
    setOverallHealth(stats.healthScore);
  };

  // Sort chains based on current sort type
  useEffect(() => {
    if (chainsData.length === 0) return;

    let sorted = [...chainsData];

    if (currentSort === 'default') {
      // Keep original order
    } else {
      // Filter to show chains with the selected status first
      sorted = [
        ...chainsData.filter(chain => chain.status === currentSort),
        ...chainsData.filter(chain => chain.status !== currentSort)
      ];
    }

    setSortedChainsData(sorted);
  }, [chainsData, currentSort]);

  // Update time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const ampm = hours >= 12 ? 'PM' : 'AM';

      setLastUpdated(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`);
    };

    // Update now and every 30 seconds
    updateTime();
    const interval = setInterval(updateTime, 30000); // Update time every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Generate initial data and refresh periodically
  useEffect(() => {
    // Initial data generation
    updateChainData();

    // Set up interval for data refresh (every 30 seconds)
    const interval = setInterval(() => {
      updateChainData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Manual refresh
  const handleRefresh = () => {
    refresh();
    updateChainData();
  };

  // Handle status filter click
  const handleStatusClick = (status: SortType) => {
    // If already sorted by this status, reset to default
    if (currentSort === status) {
      setCurrentSort('default');
    } else {
      setCurrentSort(status);
    }
  };

  return (
    <div className="w-full font-mono">
      <h1 className="text-3xl font-mono uppercase tracking-widest mb-2">
        NETWORK HEALTH MONITOR
      </h1>
      <div className="w-full h-px bg-white mb-4"></div>

      <div className="w-full border border-white/20 bg-black/50">
        {/* Header with updated time */}
        <div className="flex justify-between items-center px-3 py-2 border-b border-white/20">
          <h2 className="font-mono text-sm uppercase">NETWORK HEALTH DASHBOARD</h2>
          <div className="text-xs opacity-80">UPDATED: {lastUpdated}</div>
        </div>

        {/* Health Overview */}
        <div className="p-3">
          <div className="mb-4">
            <div className="font-mono uppercase mb-1 text-xs opacity-80">OVERALL HEALTH</div>
            <div className="flex items-start">
              <div className="text-2xl font-mono font-bold mr-4 mt-[-4px]">{overallHealth}%</div>
              <div className="flex-grow h-5 bg-black/80 ml-1">
                {/* Health bar with gradient based on health score */}
                <div className="flex h-full">
                  {/* First section - Orange to Yellow (0-30%) */}
                  <div
                    className="h-full bg-gradient-to-r from-[#FF5500] to-[#FFBB00]"
                    style={{ width: `${Math.min(overallHealth, 30)}%` }}
                  ></div>

                  {/* Second section - Yellow to Green (30-80%) */}
                  {overallHealth > 30 && (
                    <div
                      className="h-full bg-gradient-to-r from-[#FFBB00] to-[#00FF00]"
                      style={{ width: `${Math.min(overallHealth - 30, 50)}%` }}
                    ></div>
                  )}

                  {/* Third section - Bright green (80-100%) */}
                  {overallHealth > 80 && (
                    <div
                      className="h-full bg-[#00FF00]"
                      style={{ width: `${Math.min(overallHealth - 80, 20)}%` }}
                    ></div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status Counts - Made clickable */}
          <div className="grid grid-cols-4 gap-0 mb-3">
            <button
              onClick={() => handleStatusClick('OPERATIONAL')}
              className={`border border-white/20 p-2 text-center ${currentSort === 'OPERATIONAL' ? 'bg-black/30' : ''}`}
            >
              <div className="text-[#1ee921] font-mono text-xs uppercase">OPERATIONAL</div>
              <div className="text-xl font-mono">{statusCounts.operational}</div>
            </button>
            <button
              onClick={() => handleStatusClick('CONGESTED')}
              className={`border border-white/20 p-2 text-center ${currentSort === 'CONGESTED' ? 'bg-black/30' : ''}`}
            >
              <div className="text-[#FFBB00] font-mono text-xs uppercase">CONGESTED</div>
              <div className="text-xl font-mono">{statusCounts.congested}</div>
            </button>
            <button
              onClick={() => handleStatusClick('DEGRADED')}
              className={`border border-white/20 p-2 text-center ${currentSort === 'DEGRADED' ? 'bg-black/30' : ''}`}
            >
              <div className="text-[#FF5500] font-mono text-xs uppercase">DEGRADED</div>
              <div className="text-xl font-mono">{statusCounts.degraded}</div>
            </button>
            <button
              onClick={() => handleStatusClick('OUTAGE')}
              className={`border border-white/20 p-2 text-center ${currentSort === 'OUTAGE' ? 'bg-black/30' : ''}`}
            >
              <div className="text-[#FF0000] font-mono text-xs uppercase">OUTAGE</div>
              <div className="text-xl font-mono">{statusCounts.outage}</div>
            </button>
          </div>

          {/* Chain Status Cards in a grid layout */}
          <div className="grid grid-cols-2 gap-0 border-t border-white/20">
            {sortedChainsData.map((chain) => (
              <ChainStatusCard
                key={chain.id}
                chain={chain}
                onStatusClick={handleStatusClick}
              />
            ))}
          </div>
        </div>

        <div className="border-t border-white/20 py-1 text-center text-xs opacity-70">
          DATA REFRESHED EVERY 30 SECONDS
        </div>
      </div>
    </div>
  );
}
