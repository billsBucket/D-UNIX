"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRealTimeData } from '@/hooks/use-real-time-data';

interface ChainMetric {
  id: number;
  name: string;
  tvl: number;
  formattedTvl: string;
  change24h: number;
  formattedChange: string;
  symbol: string; // For the chain symbol/icon
}

export default function BlockchainAnalytics() {
  const [chainMetrics, setChainMetrics] = useState<ChainMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'tvl' | 'change' | 'volume' | 'txs' | 'gas'>('tvl');
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');
  const [isMobile, setIsMobile] = useState(false);
  const [displayCount, setDisplayCount] = useState(5); // Default to showing 5 chains on mobile

  // Use our real-time data hook
  const { data: realTimeData, lastUpdate, refresh } = useRealTimeData({
    refreshInterval: 10000, // Refresh every 10 seconds
    metrics: ['protocols'] // We only need protocol data for this component
  });

  // Check if we're on a mobile device and adjust display count
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setDisplayCount(mobile ? 5 : 10); // Show 5 on mobile, 10 on desktop
    };

    // Set initial value
    checkIfMobile();

    // Add event listener
    window.addEventListener('resize', checkIfMobile);

    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    if (!realTimeData) return;

    setIsLoading(true);
    try {
      // Format data into chain metrics
      const metrics: ChainMetric[] = [];

      // Define chain symbol mapping
      const chainSymbols: Record<string, string> = {
        'ETHEREUM': 'E',
        'ARBITRUM': 'A',
        'BNB CHAIN': 'B',
        'SOLANA': 'S',
        'POLYGON': 'P',
        'OPTIMISM': 'O',
        'AVALANCHE': 'A',
        'BASE': 'B',
        'FANTOM': 'F',
        'KADENA': 'K'
      };

      // Extract protocol data from realTimeData
      Object.values(realTimeData.protocols).forEach(protocolGroup => {
        protocolGroup.forEach(protocol => {
          metrics.push({
            id: protocol.chainId,
            name: protocol.name,
            tvl: protocol.tvl,
            formattedTvl: protocol.formatted.tvl,
            change24h: protocol.change24h,
            formattedChange: protocol.formatted.change24h,
            symbol: chainSymbols[protocol.name] || protocol.name.charAt(0)
          });
        });
      });

      // Sort metrics based on the sort criteria
      sortMetrics(metrics, sortBy);

      // Filter metrics if needed
      let filteredMetrics = metrics;
      if (filter === 'positive') {
        filteredMetrics = metrics.filter(m => m.change24h > 0);
      } else if (filter === 'negative') {
        filteredMetrics = metrics.filter(m => m.change24h < 0);
      }

      // Update state
      setChainMetrics(filteredMetrics);
      setIsLoading(false);
    } catch (error) {
      console.error('Error updating chain metrics:', error);
      setIsLoading(false);
    }
  }, [realTimeData, sortBy, filter]);

  // Helper function to format TVL values
  const formatTVL = (value: number): string => {
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(1)}B`;
    } else if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    } else {
      return `${(value / 1_000).toFixed(1)}K`;
    }
  };

  // Function to sort metrics based on criteria
  const sortMetrics = (metrics: ChainMetric[], criteria: 'tvl' | 'change' | 'volume' | 'txs' | 'gas') => {
    switch (criteria) {
      case 'tvl':
        metrics.sort((a, b) => b.tvl - a.tvl);
        break;
      case 'change':
        metrics.sort((a, b) => b.change24h - a.change24h);
        break;
      // Add more sorting criteria as needed
      default:
        metrics.sort((a, b) => b.tvl - a.tvl);
    }
  };

  // Handle sort button click
  const handleSortChange = (criteria: 'tvl' | 'change' | 'volume' | 'txs' | 'gas') => {
    setSortBy(criteria);
  };

  // Handle filter button click
  const handleFilterChange = (filterType: 'all' | 'positive' | 'negative') => {
    setFilter(filterType);
  };

  // Toggle between showing more/less chains on mobile
  const toggleDisplayCount = () => {
    setDisplayCount(displayCount === 5 ? 10 : 5);
  };

  // Get metrics to display based on display count
  const displayedMetrics = chainMetrics.slice(0, displayCount);

  return (
    <div className="dunix-card border border-white/10 p-3 md:p-4">
      <h2 className="text-lg md:text-xl font-mono uppercase mb-2">BLOCKCHAIN ANALYTICS</h2>
      <p className="text-xs opacity-70 mb-3 md:mb-4">CHAIN METRICS COMPARISON DASHBOARD</p>

      {/* Sort buttons - scrollable on mobile */}
      <div className="mobile-scroll-container mb-3">
        <div className="flex items-center min-w-[450px]">
          <span className="text-xs opacity-70 mr-2 whitespace-nowrap">SORT BY:</span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className={`text-xs px-2 py-1 h-auto ${sortBy === 'tvl' ? 'bg-white/10' : ''}`}
              onClick={() => handleSortChange('tvl')}
            >
              TVL ↓
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`text-xs px-2 py-1 h-auto ${sortBy === 'change' ? 'bg-white/10' : ''}`}
              onClick={() => handleSortChange('change')}
            >
              24H CHANGE
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`text-xs px-2 py-1 h-auto ${sortBy === 'volume' ? 'bg-white/10' : ''}`}
              onClick={() => handleSortChange('volume')}
            >
              VOLUME
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`text-xs px-2 py-1 h-auto ${sortBy === 'txs' ? 'bg-white/10' : ''}`}
              onClick={() => handleSortChange('txs')}
            >
              TXS
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`text-xs px-2 py-1 h-auto ${sortBy === 'gas' ? 'bg-white/10' : ''}`}
              onClick={() => handleSortChange('gas')}
            >
              GAS
            </Button>
          </div>
        </div>
      </div>

      {/* Filter buttons - horizontal scrolling on mobile */}
      <div className="mobile-scroll-container mb-3">
        <div className="flex items-center min-w-[350px]">
          <span className="text-xs opacity-70 mr-2 whitespace-nowrap">FILTER:</span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className={`text-xs px-3 py-1 h-auto ${filter === 'all' ? 'bg-white/10' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              ALL
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`text-xs px-3 py-1 h-auto ${filter === 'positive' ? 'bg-white/10 text-green-400' : 'text-green-400'}`}
              onClick={() => handleFilterChange('positive')}
            >
              POSITIVE
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`text-xs px-3 py-1 h-auto ${filter === 'negative' ? 'bg-white/10 text-red-400' : 'text-red-400'}`}
              onClick={() => handleFilterChange('negative')}
            >
              NEGATIVE
            </Button>
          </div>
        </div>
      </div>

      {/* Chain metrics table with responsive styling */}
      <div className="responsive-table mb-3">
        <table className="responsive-table-inner">
          <thead>
            <tr className="border-b border-white/20">
              <th className="text-left py-2 text-xs font-normal opacity-70">RANK</th>
              <th className="text-left py-2 text-xs font-normal opacity-70">CHAIN</th>
              <th className="text-right py-2 text-xs font-normal opacity-70">TVL</th>
              <th className="text-right py-2 text-xs font-normal opacity-70">24H</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && displayedMetrics.map((chain, index) => (
              <tr key={chain.id} className="border-b border-white/10">
                <td className="py-2 text-xs">{index + 1}</td>
                <td className="py-2">
                  <div className="flex items-center">
                    <div className="w-6 h-6 flex items-center justify-center bg-white/10 text-xs">
                      {chain.symbol}
                    </div>
                    <span className="text-xs ml-2">{chain.name}</span>
                  </div>
                </td>
                <td className="py-2 text-right text-xs">{chain.formattedTvl}</td>
                <td className={`py-2 text-right text-xs ${chain.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {chain.formattedChange}
                </td>
              </tr>
            ))}

            {isLoading && Array(displayCount).fill(0).map((_, index) => (
              <tr key={index} className="border-b border-white/10">
                <td className="py-2 text-xs">{index + 1}</td>
                <td className="py-2">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-white/10"></div>
                    <div className="w-16 h-3 ml-2 bg-white/10 animate-pulse"></div>
                  </div>
                </td>
                <td className="py-2 text-right">
                  <div className="w-12 h-3 ml-auto bg-white/10 animate-pulse"></div>
                </td>
                <td className="py-2 text-right">
                  <div className="w-12 h-3 ml-auto bg-white/10 animate-pulse"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show more/less button on mobile */}
      {isMobile && chainMetrics.length > 5 && (
        <div className="text-center mb-3">
          <Button
            variant="outline"
            size="sm"
            className="text-xs py-1 w-full"
            onClick={toggleDisplayCount}
          >
            {displayCount === 5 ? 'SHOW MORE CHAINS' : 'SHOW LESS'}
          </Button>
        </div>
      )}

      {/* Data refresh indicator */}
      <div className="text-xs opacity-50 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          DATA REFRESHED AT {lastUpdate ? lastUpdate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'} PM
        </div>
        <div className="mt-1 md:mt-0">
          — {displayedMetrics.length} OF {chainMetrics.length} CHAINS —
        </div>
      </div>
    </div>
  );
}
