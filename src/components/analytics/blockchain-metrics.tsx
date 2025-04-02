"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRealTimeData } from '@/hooks/use-real-time-data';
import Image from 'next/image';
import { ChevronDown, ChevronUp, RefreshCw, Info, ExternalLink, ArrowUpDown } from 'lucide-react';

interface ChainMetric {
  chain: string;
  symbol: string;
  iconUrl: string;
  tvl: number;
  formattedTVL: string;
  change24h: number;
  volume: number;
  formattedVolume: string;
  gasPrice: number;
  transactions: number;
  description: string;
  website: string;
  marketCap: number;
  formattedMarketCap: string;
  txFees: string;
  blockTime: string;
  consensus: string;
}

// Chain mapping for coin ID lookup
const chainCoinIds: Record<string, number> = {
  'ETHEREUM': 1027,
  'ARBITRUM': 11841,
  'BNB CHAIN': 1839,
  'SOLANA': 5426,
  'POLYGON': 3890,
  'OPTIMISM': 11840,
  'AVALANCHE': 5805,
  'BASE': 27716,
  'FANTOM': 3513,
  'KADENA': 5647
};

// Additional data about each blockchain for tooltips and expanded views
const chainData: Record<string, {
  description: string;
  website: string;
  marketCap: number;
  txFees: string;
  blockTime: string;
  consensus: string;
}> = {
  'ETHEREUM': {
    description: 'Decentralized blockchain platform featuring smart contract functionality',
    website: 'https://ethereum.org',
    marketCap: 320500000000,
    txFees: '$2-20',
    blockTime: '12 sec',
    consensus: 'Proof of Stake'
  },
  'ARBITRUM': {
    description: 'Layer 2 scaling solution for Ethereum that aims to improve scalability and reduce fees',
    website: 'https://arbitrum.io',
    marketCap: 2100000000,
    txFees: '$0.10-1.00',
    blockTime: '<1 sec',
    consensus: 'Optimistic Rollup'
  },
  'BNB CHAIN': {
    description: 'Blockchain network built for running smart contract-based applications',
    website: 'https://www.bnbchain.org',
    marketCap: 58700000000,
    txFees: '$0.10-0.30',
    blockTime: '3 sec',
    consensus: 'PoSA'
  },
  'SOLANA': {
    description: 'High-performance blockchain supporting builders around the world',
    website: 'https://solana.com',
    marketCap: 54200000000,
    txFees: '<$0.01',
    blockTime: '400ms',
    consensus: 'Proof of History'
  },
  'POLYGON': {
    description: 'Protocol for building and connecting Ethereum-compatible blockchain networks',
    website: 'https://polygon.technology',
    marketCap: 9100000000,
    txFees: '$0.01-0.05',
    blockTime: '2 sec',
    consensus: 'Proof of Stake'
  },
  'OPTIMISM': {
    description: 'Layer 2 scaling solution for Ethereum that reduces fees and latency',
    website: 'https://optimism.io',
    marketCap: 2700000000,
    txFees: '$0.05-0.50',
    blockTime: '<1 sec',
    consensus: 'Optimistic Rollup'
  },
  'AVALANCHE': {
    description: 'Open, programmable smart contracts platform for decentralized applications',
    website: 'https://avax.network',
    marketCap: 12400000000,
    txFees: '$0.05-0.10',
    blockTime: '2 sec',
    consensus: 'Avalanche'
  },
  'BASE': {
    description: 'Secure, low-cost, developer-friendly Ethereum L2 built to bring the next billion users onchain',
    website: 'https://base.org',
    marketCap: 0, // No native token
    txFees: '$0.05-0.20',
    blockTime: '<1 sec',
    consensus: 'Optimistic Rollup'
  },
  'FANTOM': {
    description: 'High-performance, scalable, EVM-compatible, and secure smart contract platform',
    website: 'https://fantom.foundation',
    marketCap: 1070000000,
    txFees: '<$0.01',
    blockTime: '1 sec',
    consensus: 'Proof of Stake'
  },
  'KADENA': {
    description: 'The only scalable layer 1 Proof of Work blockchain with throughput of 480,000 TPS',
    website: 'https://kadena.io',
    marketCap: 250000000,
    txFees: '<$0.01',
    blockTime: '30 sec',
    consensus: 'Proof of Work'
  }
};

export default function BlockchainMetrics() {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [sortBy, setSort] = useState('TVL');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [chainMetrics, setChainMetrics] = useState<ChainMetric[]>([]);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Use real-time data hook
  const { data: realTimeData, lastUpdate, refresh } = useRealTimeData({
    refreshInterval: 10000, // Refresh every 10 seconds
    metrics: ['all'] // We need all metrics for this component
  });

  // Chain symbols and identifiers
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

  // Chain colors for each logo background - fallback if no icon is found
  const chainColors: Record<string, string> = {
    'ETHEREUM': '#627eea',
    'ARBITRUM': '#28a0f0',
    'BNB CHAIN': '#f0b90b',
    'SOLANA': '#9945ff',
    'POLYGON': '#8247e5',
    'OPTIMISM': '#ff0420',
    'AVALANCHE': '#e84142',
    'BASE': '#0052ff',
    'FANTOM': '#1969ff',
    'KADENA': '#9553e9'
  };

  // Chain Ids for API data
  const chainIds: Record<string, string> = {
    'ETHEREUM': '1',
    'ARBITRUM': '42161',
    'BNB CHAIN': '56',
    'POLYGON': '137',
    'OPTIMISM': '10',
    'BASE': '8453',
  };

  // Format market cap value
  const formatMarketCap = (value: number): string => {
    if (value === 0) return 'N/A';
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(0)}M`;
    } else {
      return `$${value.toLocaleString()}`;
    }
  };

  // Function to toggle row expansion
  const toggleRowExpansion = (chain: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [chain]: !prev[chain]
    }));
  };

  // Helper function to get logo URL for a chain
  const getChainLogoUrl = (chain: string): string => {
    const coinId = chainCoinIds[chain];
    if (coinId) {
      return `https://s2.coinmarketcap.com/static/img/coins/64x64/${coinId}.png`;
    }
    return '/icons/generic-coin.svg';
  };

  // Function to handle header click for sorting
  const handleHeaderClick = (field: string) => {
    if (sortBy === field) {
      // If already sorting by this field, toggle direction
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // New sort field, default to descending
      setSort(field);
      setSortDirection('desc');
    }
  };

  // Manual refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    // Simulate loading animation for better UX
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Update chain metrics when realTimeData changes
  useEffect(() => {
    if (!realTimeData) return;

    async function fetchData() {
      setLoading(true);

      try {
        // Define chains to display in specific order
        const chainsToDisplay = [
          'ETHEREUM',
          'ARBITRUM',
          'BNB CHAIN',
          'SOLANA',
          'POLYGON',
          'OPTIMISM',
          'AVALANCHE',
          'BASE',
          'FANTOM',
          'KADENA'
        ];

        // Create metrics data for display
        const metricsData: ChainMetric[] = chainsToDisplay.map((chain, index) => {
          const chainId = chainIds[chain] || '';
          const chainInfo = chainData[chain] || {
            description: 'No description available',
            website: '#',
            marketCap: 0,
            txFees: 'N/A',
            blockTime: 'N/A',
            consensus: 'N/A'
          };

          // Generate realistic TVL values
          let tvl: number = 0;
          if (chain === 'ETHEREUM') tvl = 42500;
          else if (chain === 'ARBITRUM') tvl = 18700;
          else if (chain === 'BNB CHAIN') tvl = 15200;
          else if (chain === 'SOLANA') tvl = 12800;
          else if (chain === 'POLYGON') tvl = 9600;
          else if (chain === 'OPTIMISM') tvl = 7400;
          else if (chain === 'AVALANCHE') tvl = 5900;
          else if (chain === 'BASE') tvl = 4600;
          else if (chain === 'FANTOM') tvl = 3200;
          else if (chain === 'KADENA') tvl = 1800;

          // Generate 24h change
          const change24h = (Math.random() * 10) - 5; // Random between -5% and +5%

          // Generate volume data
          const volume = chain === 'ETHEREUM' ? 1800 :
                         chain === 'ARBITRUM' ? 720 :
                         chain === 'BNB CHAIN' ? 680 :
                         chain === 'SOLANA' ? 510 :
                         chain === 'POLYGON' ? 420 :
                         chain === 'OPTIMISM' ? 540 :
                         chain === 'AVALANCHE' ? 320 :
                         chain === 'BASE' ? 380 :
                         chain === 'FANTOM' ? 240 :
                         chain === 'KADENA' ? 140 : 0;

          // Get real gas price data if available
          const gasPrice = chainId && realTimeData.gasPrices[chainId]?.current?.standard ||
                           (Math.random() * 50 + 10).toFixed(2);

          // Generate transaction counts
          const transactions = Math.floor(Math.random() * 1000000) + 500000;

          // Get chain logo from CoinMarketCap
          const iconUrl = getChainLogoUrl(chain);

          return {
            chain,
            symbol: chainSymbols[chain] || '',
            iconUrl,
            tvl,
            formattedTVL: `$${(tvl / 1000).toFixed(1)}B`, // Convert to billions
            change24h,
            volume,
            formattedVolume: `$${volume}M`,
            gasPrice: parseFloat(gasPrice.toString()),
            transactions,
            description: chainInfo.description,
            website: chainInfo.website,
            marketCap: chainInfo.marketCap,
            formattedMarketCap: formatMarketCap(chainInfo.marketCap),
            txFees: chainInfo.txFees,
            blockTime: chainInfo.blockTime,
            consensus: chainInfo.consensus
          };
        });

        // Sort metrics based on the selected sort criteria
        const sortedMetrics = [...metricsData].sort((a, b) => {
          let compareResult = 0;

          if (sortBy === 'TVL') compareResult = b.tvl - a.tvl;
          else if (sortBy === '24H CHANGE') compareResult = b.change24h - a.change24h;
          else if (sortBy === 'VOLUME') compareResult = b.volume - a.volume;
          else if (sortBy === 'TXS') compareResult = b.transactions - a.transactions;
          else if (sortBy === 'GAS') compareResult = a.gasPrice - b.gasPrice;
          else if (sortBy === 'CHAIN') compareResult = a.chain.localeCompare(b.chain);
          else if (sortBy === 'RANK') compareResult = 0; // Maintain original order for rank

          // Flip the comparison if sorting in ascending order
          return sortDirection === 'asc' ? -compareResult : compareResult;
        });

        // Filter metrics if needed
        const filteredMetrics = activeFilter === 'ALL'
          ? sortedMetrics
          : sortedMetrics.filter(metric => {
              if (activeFilter === 'POSITIVE') return metric.change24h > 0;
              if (activeFilter === 'NEGATIVE') return metric.change24h < 0;
              return true;
            });

        setChainMetrics(filteredMetrics);
      } catch (error) {
        console.error('Error processing blockchain metrics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [realTimeData, activeFilter, sortBy, sortDirection]);

  // Loading state with shimmer effect
  if (loading && chainMetrics.length === 0) {
    return (
      <div className="w-full animate-pulse">
        <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-white/10 rounded w-2/3 mb-8"></div>

        <div className="border border-white/10 rounded">
          <div className="h-8 bg-white/5 rounded-t"></div>
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-12 bg-white/5 mt-1"></div>
          ))}
        </div>
      </div>
    );
  }

  // Sort indicator component
  const SortIndicator = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ArrowUpDown className="inline h-3 w-3 opacity-50" />;
    return sortDirection === 'desc' ?
      <ChevronDown className="inline h-3 w-3" /> :
      <ChevronUp className="inline h-3 w-3" />;
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg md:text-xl font-mono uppercase">BLOCKCHAIN ANALYTICS</h2>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1 px-2 py-1 text-xs border border-white/20 hover:bg-white/10 transition-colors"
          disabled={refreshing}
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'REFRESHING...' : 'REFRESH DATA'}
        </button>
      </div>
      <div className="text-xs font-mono mb-4">CHAIN METRICS COMPARISON DASHBOARD</div>

      {/* Filter & Sort Controls */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <div>
          <span className="text-xs mr-2">SORT BY:</span>
          <div className="inline-flex">
            {['TVL', '24H CHANGE', 'VOLUME', 'TXS', 'GAS'].map((option) => (
              <button
                key={option}
                className={`px-2 py-1 text-xs border border-white/20 ${sortBy === option ? 'bg-white/10' : ''}`}
                onClick={() => handleHeaderClick(option)}
              >
                {option}
                {sortBy === option && (sortDirection === 'desc' ? ' ↓' : ' ↑')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-xs mr-2">FILTER:</span>
          <div className="inline-flex">
            {['ALL', 'POSITIVE', 'NEGATIVE'].map((filter) => (
              <button
                key={filter}
                className={`px-2 py-1 text-xs border border-white/20 ${activeFilter === filter ? 'bg-white/10' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chain Metrics Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-white/20">
              <th
                className="py-2 text-left cursor-pointer hover:bg-white/5"
                onClick={() => handleHeaderClick('RANK')}
              >
                RANK <SortIndicator field="RANK" />
              </th>
              <th
                className="py-2 text-left cursor-pointer hover:bg-white/5"
                onClick={() => handleHeaderClick('CHAIN')}
              >
                CHAIN <SortIndicator field="CHAIN" />
              </th>
              <th
                className="py-2 text-right cursor-pointer hover:bg-white/5"
                onClick={() => handleHeaderClick('TVL')}
              >
                TVL <SortIndicator field="TVL" />
              </th>
              <th
                className="py-2 text-right cursor-pointer hover:bg-white/5"
                onClick={() => handleHeaderClick('24H CHANGE')}
              >
                24H CHANGE <SortIndicator field="24H CHANGE" />
              </th>
              <th
                className="py-2 text-right cursor-pointer hover:bg-white/5"
                onClick={() => handleHeaderClick('VOLUME')}
              >
                VOLUME <SortIndicator field="VOLUME" />
              </th>
              <th
                className="py-2 text-right cursor-pointer hover:bg-white/5"
                onClick={() => handleHeaderClick('GAS')}
              >
                GAS (GWEI) <SortIndicator field="GAS" />
              </th>
              <th className="py-2 text-right">
                DETAILS
              </th>
            </tr>
          </thead>
          <tbody>
            {chainMetrics.slice(0, 10).map((metric, index) => (
              <React.Fragment key={metric.chain}>
                <tr className={`border-b border-white/5 hover:bg-white/5 transition-colors ${expandedRows[metric.chain] ? 'bg-white/5' : ''}`}>
                  <td className="py-2">{index + 1}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      {/* Chain logo with tooltip */}
                      <div
                        className="w-8 h-8 rounded-full overflow-hidden border border-white/20 flex-shrink-0 relative group"
                        title={`${metric.chain} - ${metric.description}`}
                      >
                        <Image
                          src={metric.iconUrl}
                          alt={metric.chain}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.backgroundColor = chainColors[metric.chain] || '#333';
                            target.style.display = 'flex';
                            target.style.alignItems = 'center';
                            target.style.justifyContent = 'center';
                            target.style.color = 'white';
                            target.style.fontWeight = 'bold';
                            target.style.fontSize = '14px';
                            target.innerText = metric.symbol;
                          }}
                        />

                        {/* Tooltip */}
                        <div className="absolute left-0 bottom-full mb-2 w-60 bg-black border border-white/20 p-2 rounded text-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity shadow-lg z-50">
                          <div className="font-bold mb-1">{metric.chain}</div>
                          <div className="mb-1">Market Cap: {metric.formattedMarketCap}</div>
                          <div className="text-white/70 text-[10px]">{metric.description}</div>
                        </div>
                      </div>
                      <span className="ml-1">{metric.chain}</span>
                    </div>
                  </td>
                  <td className="py-2 text-right">{metric.formattedTVL}</td>
                  <td className="py-2 text-right" style={{ color: metric.change24h >= 0 ? '#4caf50' : '#f44336' }}>
                    {metric.change24h >= 0 ? '+' : ''}{metric.change24h.toFixed(2)}%
                  </td>
                  <td className="py-2 text-right">{metric.formattedVolume}</td>
                  <td className="py-2 text-right">{metric.gasPrice.toFixed(1)}</td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => toggleRowExpansion(metric.chain)}
                      className="px-2 py-1 rounded border border-white/20 hover:bg-white/10 transition-colors"
                    >
                      {expandedRows[metric.chain] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  </td>
                </tr>

                {/* Expanded row with additional details */}
                {expandedRows[metric.chain] && (
                  <tr className="bg-[#111] border-b border-white/5 text-[11px]">
                    <td colSpan={7} className="py-3 px-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-bold mb-2">CHAIN DETAILS</h4>
                          <p className="text-white/70 mb-2">{metric.description}</p>
                          <div className="flex items-center gap-1 text-white/70">
                            <ExternalLink className="h-3 w-3" />
                            <a
                              href={metric.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-white/90 underline"
                            >
                              {metric.website}
                            </a>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="border border-white/10 p-2 rounded">
                            <div className="text-white/50 mb-1">MARKET CAP</div>
                            <div className="font-bold">{metric.formattedMarketCap}</div>
                          </div>
                          <div className="border border-white/10 p-2 rounded">
                            <div className="text-white/50 mb-1">TX FEES</div>
                            <div className="font-bold">{metric.txFees}</div>
                          </div>
                          <div className="border border-white/10 p-2 rounded">
                            <div className="text-white/50 mb-1">BLOCK TIME</div>
                            <div className="font-bold">{metric.blockTime}</div>
                          </div>
                          <div className="border border-white/10 p-2 rounded">
                            <div className="text-white/50 mb-1">CONSENSUS</div>
                            <div className="font-bold">{metric.consensus}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-right text-xs opacity-60 mt-4">
        DATA REFRESHED AT {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
