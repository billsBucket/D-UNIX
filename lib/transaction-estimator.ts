"use client";

import { useState, useEffect } from 'react';
import { NetworkInfo } from './ethereum';
import { useNetworkSpeed } from './network-speed';
import { useNetworkHistory } from './network-history';

// Transaction types with different gas requirements
export type TransactionType =
  | 'transfer' // Simple token transfer
  | 'swap' // Token swap on DEX
  | 'mint' // NFT minting
  | 'stake' // Staking tokens
  | 'lending' // Lending operation
  | 'bridge' // Cross-chain bridge operation
  | 'custom'; // Custom transaction

// Gas usage estimates based on transaction type (in gas units)
const GAS_ESTIMATES: Record<TransactionType, number> = {
  transfer: 21000,
  swap: 150000,
  mint: 200000,
  stake: 100000,
  lending: 180000,
  bridge: 250000,
  custom: 100000
};

// Transaction priority levels with multipliers
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

const PRIORITY_MULTIPLIERS: Record<PriorityLevel, number> = {
  low: 0.8,
  medium: 1.0,
  high: 1.2,
  urgent: 1.5
};

// Traffic congestion levels with multipliers
export type CongestionLevel = 'low' | 'medium' | 'high' | 'extreme';

const CONGESTION_MULTIPLIERS: Record<CongestionLevel, number> = {
  low: 1.0,
  medium: 1.3,
  high: 1.8,
  extreme: 3.0
};

// Block time estimates in seconds
const BLOCK_TIMES: Record<number, number> = {
  1: 12, // Ethereum
  137: 2, // Polygon
  42161: 0.3, // Arbitrum
  10: 2, // Optimism
  8453: 2, // Base
  // Add more as needed
};

// Default block time if not specified
const DEFAULT_BLOCK_TIME = 12;

// Transaction estimation result
export interface TransactionEstimate {
  chainId: number;
  networkName: string;
  gasUnits: number;
  gasPrice: string;
  gasPriceValue: number; // In gwei
  estimatedCostGwei: number;
  estimatedCostUSD: number;
  estimatedTimeSeconds: number;
  estimatedTimeFormatted: string;
  priority: PriorityLevel;
  congestion: CongestionLevel;
  reliability: number;
  recommendationScore: number;
}

// Estimated gas prices (in USD) for various chains
interface TokenPrices {
  [symbol: string]: number; // Price in USD
}

// Utility for estimating transaction costs and times
export const useTransactionEstimator = () => {
  const [customGasUnits, setCustomGasUnits] = useState<number>(100000);
  const [tokenPrices, setTokenPrices] = useState<TokenPrices>({
    ETH: 3000,
    MATIC: 0.80,
    // Add more as needed
  });
  const [congestionLevels, setCongestionLevels] = useState<Record<number, CongestionLevel>>({});

  const { speedResults } = useNetworkSpeed();
  const { getReliabilityScore } = useNetworkHistory();

  // Estimate congestion levels based on latency and other factors
  useEffect(() => {
    const newCongestionLevels: Record<number, CongestionLevel> = {};

    speedResults.forEach(result => {
      if (!result.success) {
        newCongestionLevels[result.chainId] = 'extreme';
        return;
      }

      // Use latency as a rough indicator of congestion
      if (result.latency < 100) {
        newCongestionLevels[result.chainId] = 'low';
      } else if (result.latency < 300) {
        newCongestionLevels[result.chainId] = 'medium';
      } else if (result.latency < 800) {
        newCongestionLevels[result.chainId] = 'high';
      } else {
        newCongestionLevels[result.chainId] = 'extreme';
      }
    });

    setCongestionLevels(newCongestionLevels);
  }, [speedResults]);

  // Parse gas price string to number value in gwei
  const parseGasPrice = (gasPriceStr: string): number => {
    const match = gasPriceStr.match(/(\d+(\.\d+)?)\s*(gwei|Gwei)/);
    if (match) {
      return parseFloat(match[1]);
    }

    // Handle other formats or return a default
    return 30; // Default to 30 gwei if format is unknown
  };

  // Estimate transaction for a single network
  const estimateTransaction = (
    chainId: number,
    network: NetworkInfo,
    txType: TransactionType = 'transfer',
    priority: PriorityLevel = 'medium',
    customGas?: number
  ): TransactionEstimate => {
    // Get network congestion or default to medium
    const congestion = congestionLevels[chainId] || 'medium';

    // Get gas units based on transaction type or custom value
    const gasUnits = txType === 'custom' ? (customGas || customGasUnits) : GAS_ESTIMATES[txType];

    // Parse gas price from network info or use fallback
    const parsedGasPrice = parseGasPrice(network.gasPrice || '30 gwei');

    // Calculate adjusted gas price with priority and congestion
    const adjustedGasPrice = parsedGasPrice *
      PRIORITY_MULTIPLIERS[priority] *
      CONGESTION_MULTIPLIERS[congestion];

    // Calculate total gas cost in gwei
    const costInGwei = gasUnits * adjustedGasPrice / 1e9;

    // Convert to USD based on token price
    const tokenSymbol = network.symbol;
    const tokenPrice = tokenPrices[tokenSymbol] || 1; // Default to 1 USD if price not available
    const costInUSD = costInGwei * tokenPrice;

    // Get block time for the network
    const blockTime = BLOCK_TIMES[chainId] || DEFAULT_BLOCK_TIME;

    // Estimate confirmation time based on priority, congestion, and block time
    const estimatedBlocks = priority === 'urgent' ? 1 :
                            priority === 'high' ? 2 :
                            priority === 'medium' ? 3 : 5;

    // Adjust for congestion
    const congestionTimeMultiplier =
      congestion === 'extreme' ? 3.0 :
      congestion === 'high' ? 1.8 :
      congestion === 'medium' ? 1.3 : 1.0;

    const estimatedTimeSeconds = estimatedBlocks * blockTime * congestionTimeMultiplier;

    // Format time for display
    const estimatedTimeFormatted = formatTime(estimatedTimeSeconds);

    // Get reliability score or default
    const reliability = getReliabilityScore(chainId) || 50;

    // Calculate recommendation score (higher is better)
    // Factors: cost (40%), speed (30%), reliability (30%)
    const costScore = Math.max(0, 100 - (costInUSD * 100)); // Lower cost = higher score
    const speedScore = Math.max(0, 100 - (estimatedTimeSeconds / 2)); // Lower time = higher score

    const recommendationScore =
      (costScore * 0.4) +
      (speedScore * 0.3) +
      (reliability * 0.3);

    return {
      chainId,
      networkName: network.name,
      gasUnits,
      gasPrice: `${adjustedGasPrice.toFixed(2)} gwei`,
      gasPriceValue: adjustedGasPrice,
      estimatedCostGwei: parseFloat(costInGwei.toFixed(6)),
      estimatedCostUSD: parseFloat(costInUSD.toFixed(4)),
      estimatedTimeSeconds,
      estimatedTimeFormatted,
      priority,
      congestion,
      reliability,
      recommendationScore: Math.round(recommendationScore)
    };
  };

  // Estimate transaction across multiple networks
  const estimateTransactionAcrossNetworks = (
    networks: Record<number, NetworkInfo>,
    txType: TransactionType = 'transfer',
    priority: PriorityLevel = 'medium',
    customGas?: number
  ): TransactionEstimate[] => {
    const estimates = Object.entries(networks).map(([chainIdStr, network]) => {
      const chainId = parseInt(chainIdStr);
      return estimateTransaction(chainId, network, txType, priority, customGas);
    });

    // Sort by recommendation score (highest first)
    return estimates.sort((a, b) => b.recommendationScore - a.recommendationScore);
  };

  // Calculate transaction time savings between networks
  const calculateTimeSavings = (
    fromChainId: number,
    toChainId: number,
    txType: TransactionType = 'transfer',
    priority: PriorityLevel = 'medium'
  ): { timeSavingsSeconds: number, percentageSaved: number } | null => {
    const networks = {
      [fromChainId]: BLOCK_TIMES[fromChainId] ? { blockTime: BLOCK_TIMES[fromChainId] } : null,
      [toChainId]: BLOCK_TIMES[toChainId] ? { blockTime: BLOCK_TIMES[toChainId] } : null
    };

    if (!networks[fromChainId] || !networks[toChainId]) {
      return null; // One or both networks don't have data
    }

    // Calculate time for both networks
    const estimateFrom = estimateTransaction(
      fromChainId,
      { ...networks[fromChainId], name: '', symbol: '', decimals: 18, rpcUrl: '', blockExplorer: '', logoUrl: '' },
      txType,
      priority
    );

    const estimateTo = estimateTransaction(
      toChainId,
      { ...networks[toChainId], name: '', symbol: '', decimals: 18, rpcUrl: '', blockExplorer: '', logoUrl: '' },
      txType,
      priority
    );

    const timeSavingsSeconds = estimateFrom.estimatedTimeSeconds - estimateTo.estimatedTimeSeconds;
    const percentageSaved = (timeSavingsSeconds / estimateFrom.estimatedTimeSeconds) * 100;

    return {
      timeSavingsSeconds,
      percentageSaved
    };
  };

  // Helper function to format time in a human-readable way
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)} seconds`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)} minutes`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.round((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  // Update custom gas units
  const setCustomGasAmount = (gas: number) => {
    setCustomGasUnits(gas);
  };

  // Update token prices
  const updateTokenPrice = (symbol: string, price: number) => {
    setTokenPrices(prev => ({
      ...prev,
      [symbol]: price
    }));
  };

  return {
    estimateTransaction,
    estimateTransactionAcrossNetworks,
    calculateTimeSavings,
    setCustomGasAmount,
    updateTokenPrice,
    congestionLevels,
    customGasUnits,
    tokenPrices
  };
};
