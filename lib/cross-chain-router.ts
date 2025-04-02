"use client";

import { useState, useEffect } from 'react';
import { NetworkInfo } from './ethereum';
import { useNetworkSpeed } from './network-speed';
import { useTransactionEstimator, TransactionType, PriorityLevel } from './transaction-estimator';
import { useNetworkHistory } from './network-history';
import { useSecurityRatings } from './security-ratings';

// Bridge protocol types
export type BridgeProtocol =
  | 'layerzero'
  | 'wormhole'
  | 'stargate'
  | 'hop'
  | 'synapse'
  | 'across'
  | 'celer'
  | 'multichain'
  | 'polygon'
  | 'arbitrum'
  | 'optimism'
  | 'base'
  | 'custom';

// Bridge route step
export interface BridgeStep {
  sourceChainId: number;
  destChainId: number;
  protocol: BridgeProtocol;
  estimatedTimeSeconds: number;
  estimatedFeeUSD: number;
  trustAssumptions: string[];
  securityScore: number; // 0-100
  reliabilityScore: number; // 0-100
}

// Full cross-chain route
export interface CrossChainRoute {
  steps: BridgeStep[];
  sourceChainId: number;
  destinationChainId: number;
  totalTimeSeconds: number;
  totalFeeUSD: number;
  overallSecurityScore: number;
  overallReliabilityScore: number;
  routeRisk: 'low' | 'medium' | 'high';
}

// Bridge protocol metadata
interface BridgeProtocolInfo {
  name: string;
  description: string;
  securityScore: number; // 0-100
  reliabilityScore: number; // 0-100
  supportedChains: number[];
  website: string;
  trustAssumptions: string[];
  estimatedTimeMinutes: number;
  baseFeeUSD: number;
  variableFeePercentage: number;
}

// Bridge protocol information
const BRIDGE_PROTOCOLS: Record<BridgeProtocol, BridgeProtocolInfo> = {
  'layerzero': {
    name: 'LayerZero',
    description: 'A cross-chain messaging protocol with a focus on security and reliability.',
    securityScore: 85,
    reliabilityScore: 90,
    supportedChains: [1, 56, 137, 42161, 10, 8453, 43114],
    website: 'https://layerzero.network',
    trustAssumptions: ['Ultra Light Node validators', 'Oracle relayers'],
    estimatedTimeMinutes: 15,
    baseFeeUSD: 2.5,
    variableFeePercentage: 0.05,
  },
  'wormhole': {
    name: 'Wormhole',
    description: 'A generic message-passing protocol that connects multiple blockchains.',
    securityScore: 80,
    reliabilityScore: 85,
    supportedChains: [1, 56, 137, 42161, 10, 43114, 250],
    website: 'https://wormhole.com',
    trustAssumptions: ['Guardian network', '2/3 majority honest'],
    estimatedTimeMinutes: 10,
    baseFeeUSD: 2.0,
    variableFeePercentage: 0.06,
  },
  'stargate': {
    name: 'Stargate',
    description: 'A fully composable liquidity transport protocol built on LayerZero.',
    securityScore: 82,
    reliabilityScore: 88,
    supportedChains: [1, 56, 137, 42161, 10, 43114, 250],
    website: 'https://stargate.finance',
    trustAssumptions: ['LayerZero security assumptions', 'Liquidity providers'],
    estimatedTimeMinutes: 20,
    baseFeeUSD: 3.0,
    variableFeePercentage: 0.08,
  },
  'hop': {
    name: 'Hop Protocol',
    description: 'A scalable rollup-to-rollup general token bridge.',
    securityScore: 80,
    reliabilityScore: 83,
    supportedChains: [1, 137, 42161, 10, 8453],
    website: 'https://hop.exchange',
    trustAssumptions: ['Bonder network', 'Challenge period'],
    estimatedTimeMinutes: 25,
    baseFeeUSD: 1.8,
    variableFeePercentage: 0.07,
  },
  'synapse': {
    name: 'Synapse Protocol',
    description: 'A cross-chain layer for bridging assets between blockchains.',
    securityScore: 78,
    reliabilityScore: 80,
    supportedChains: [1, 56, 137, 42161, 10, 43114, 250],
    website: 'https://synapseprotocol.com',
    trustAssumptions: ['Validators', 'Liquidity providers'],
    estimatedTimeMinutes: 30,
    baseFeeUSD: 2.2,
    variableFeePercentage: 0.09,
  },
  'across': {
    name: 'Across Protocol',
    description: 'A fast, secure, capital-efficient bridge secured by UMA.',
    securityScore: 75,
    reliabilityScore: 78,
    supportedChains: [1, 137, 42161, 10, 8453],
    website: 'https://across.to',
    trustAssumptions: ['UMA Optimistic Oracle', 'Relayers'],
    estimatedTimeMinutes: 40,
    baseFeeUSD: 1.5,
    variableFeePercentage: 0.06,
  },
  'celer': {
    name: 'Celer Network',
    description: 'A liquidity network that enables fast, secure cross-chain token transfers.',
    securityScore: 75,
    reliabilityScore: 80,
    supportedChains: [1, 56, 137, 42161, 10, 43114],
    website: 'https://celer.network',
    trustAssumptions: ['State Guardian Network', 'Multi-sig security'],
    estimatedTimeMinutes: 15,
    baseFeeUSD: 1.0,
    variableFeePercentage: 0.05,
  },
  'multichain': {
    name: 'Multichain',
    description: 'A cross-chain router protocol that enables assets to flow between blockchains.',
    securityScore: 70,
    reliabilityScore: 75,
    supportedChains: [1, 56, 137, 42161, 10, 43114, 250],
    website: 'https://multichain.org',
    trustAssumptions: ['SMPC network', 'Validators'],
    estimatedTimeMinutes: 35,
    baseFeeUSD: 1.2,
    variableFeePercentage: 0.07,
  },
  'polygon': {
    name: 'Polygon Bridge',
    description: 'The official bridge for Polygon PoS chain.',
    securityScore: 75,
    reliabilityScore: 80,
    supportedChains: [1, 137],
    website: 'https://polygon.technology',
    trustAssumptions: ['Polygon validators', '2/3 majority honest'],
    estimatedTimeMinutes: 45, // Withdrawals take longer
    baseFeeUSD: 0.5,
    variableFeePercentage: 0.02,
  },
  'arbitrum': {
    name: 'Arbitrum Bridge',
    description: 'The official bridge for Arbitrum.',
    securityScore: 80,
    reliabilityScore: 85,
    supportedChains: [1, 42161],
    website: 'https://arbitrum.io',
    trustAssumptions: ['Optimistic rollup security', 'Challenge period'],
    estimatedTimeMinutes: 60, // Withdrawals take 7 days
    baseFeeUSD: 0.8,
    variableFeePercentage: 0.02,
  },
  'optimism': {
    name: 'Optimism Bridge',
    description: 'The official bridge for Optimism.',
    securityScore: 80,
    reliabilityScore: 85,
    supportedChains: [1, 10],
    website: 'https://optimism.io',
    trustAssumptions: ['Optimistic rollup security', 'Challenge period'],
    estimatedTimeMinutes: 60, // Withdrawals take 7 days
    baseFeeUSD: 0.8,
    variableFeePercentage: 0.02,
  },
  'base': {
    name: 'Base Bridge',
    description: 'The official bridge for Base.',
    securityScore: 80,
    reliabilityScore: 80,
    supportedChains: [1, 8453],
    website: 'https://base.org',
    trustAssumptions: ['Optimistic rollup security', 'Challenge period'],
    estimatedTimeMinutes: 60, // Withdrawals take 7 days
    baseFeeUSD: 0.8,
    variableFeePercentage: 0.02,
  },
  'custom': {
    name: 'Custom Bridge',
    description: 'User-defined custom bridge.',
    securityScore: 50,
    reliabilityScore: 50,
    supportedChains: [],
    website: '',
    trustAssumptions: ['Unknown'],
    estimatedTimeMinutes: 30,
    baseFeeUSD: 2.0,
    variableFeePercentage: 0.1,
  },
};

// Direct bridge support between chains
const DIRECT_BRIDGE_SUPPORT: Record<number, Record<number, BridgeProtocol[]>> = {
  // From Ethereum
  1: {
    // To Polygon
    137: ['polygon', 'layerzero', 'wormhole', 'hop', 'celer', 'multichain'],
    // To Arbitrum
    42161: ['arbitrum', 'layerzero', 'hop', 'across', 'celer', 'multichain'],
    // To Optimism
    10: ['optimism', 'layerzero', 'hop', 'across', 'celer', 'multichain'],
    // To Base
    8453: ['base', 'layerzero', 'hop', 'across'],
  },
  // From Polygon
  137: {
    // To Ethereum
    1: ['polygon', 'layerzero', 'wormhole', 'hop', 'celer', 'multichain'],
    // To Arbitrum
    42161: ['layerzero', 'hop', 'celer', 'multichain'],
    // To Optimism
    10: ['layerzero', 'hop', 'celer', 'multichain'],
    // To Base
    8453: ['layerzero', 'hop'],
  },
  // From Arbitrum
  42161: {
    // To Ethereum
    1: ['arbitrum', 'layerzero', 'hop', 'across', 'celer', 'multichain'],
    // To Polygon
    137: ['layerzero', 'hop', 'celer', 'multichain'],
    // To Optimism
    10: ['layerzero', 'hop', 'celer'],
    // To Base
    8453: ['layerzero', 'hop'],
  },
  // From Optimism
  10: {
    // To Ethereum
    1: ['optimism', 'layerzero', 'hop', 'across', 'celer', 'multichain'],
    // To Polygon
    137: ['layerzero', 'hop', 'celer', 'multichain'],
    // To Arbitrum
    42161: ['layerzero', 'hop', 'celer'],
    // To Base
    8453: ['layerzero', 'hop'],
  },
  // From Base
  8453: {
    // To Ethereum
    1: ['base', 'layerzero', 'hop', 'across'],
    // To Polygon
    137: ['layerzero', 'hop'],
    // To Arbitrum
    42161: ['layerzero', 'hop'],
    // To Optimism
    10: ['layerzero', 'hop'],
  },
};

// Create custom hook for cross-chain routing
export const useCrossChainRouter = () => {
  const [customBridges, setCustomBridges] = useState<{
    protocol: BridgeProtocol,
    fromChainId: number,
    toChainId: number
  }[]>([]);

  const [transactionAmount, setTransactionAmount] = useState<number>(100); // Default $100
  const [priorityLevel, setPriorityLevel] = useState<PriorityLevel>('medium');

  const { estimateTransaction } = useTransactionEstimator();
  const { getReliabilityScore } = useNetworkHistory();
  const { speedResults } = useNetworkSpeed();
  const { securityRatings, generateRating } = useSecurityRatings();

  // Get supported bridges between two chains
  const getSupportedBridges = (
    fromChainId: number,
    toChainId: number
  ): BridgeProtocol[] => {
    // Check for direct bridge support
    const directBridges = DIRECT_BRIDGE_SUPPORT[fromChainId]?.[toChainId] || [];

    // Add any custom bridges
    const customBridgesForRoute = customBridges.filter(
      bridge => bridge.fromChainId === fromChainId && bridge.toChainId === toChainId
    ).map(bridge => bridge.protocol);

    // Combine and deduplicate
    return [...new Set([...directBridges, ...customBridgesForRoute])];
  };

  // Get all possible paths between source and destination chains
  const findAllPaths = (
    sourceChainId: number,
    destinationChainId: number,
    maxHops: number = 2
  ): number[][] => {
    // Direct path if exists
    if (getSupportedBridges(sourceChainId, destinationChainId).length > 0) {
      return [[sourceChainId, destinationChainId]];
    }

    // If max hops is 1, we can only do direct routes
    if (maxHops === 1) {
      return [];
    }

    // Find intermediate chains
    const allChains = Object.keys(DIRECT_BRIDGE_SUPPORT).map(Number);
    const intermediateChains = allChains.filter(
      chainId => chainId !== sourceChainId && chainId !== destinationChainId
    );

    // Get all 2-hop paths
    const twoHopPaths = intermediateChains
      .filter(intermediateChainId =>
        getSupportedBridges(sourceChainId, intermediateChainId).length > 0 &&
        getSupportedBridges(intermediateChainId, destinationChainId).length > 0
      )
      .map(intermediateChainId => [sourceChainId, intermediateChainId, destinationChainId]);

    return twoHopPaths.length > 0 ? twoHopPaths : [];
  };

  // Calculate a single bridge step
  const calculateBridgeStep = (
    sourceChainId: number,
    destChainId: number,
    protocol: BridgeProtocol,
    sourceNetwork: NetworkInfo,
    destNetwork: NetworkInfo
  ): BridgeStep => {
    const protocolInfo = BRIDGE_PROTOCOLS[protocol];

    // Calculate time based on protocol info and network latency
    const sourceResult = speedResults.find(r => r.chainId === sourceChainId);
    const destResult = speedResults.find(r => r.chainId === destChainId);

    // Latency factor calculation - higher latency means longer bridge time
    const sourceLatencyFactor = sourceResult && sourceResult.success
      ? Math.max(1, 1 + (sourceResult.latency / 1000))
      : 1.5;

    const destLatencyFactor = destResult && destResult.success
      ? Math.max(1, 1 + (destResult.latency / 1000))
      : 1.5;

    // Calculate estimated time in seconds
    const baseTimeSeconds = protocolInfo.estimatedTimeMinutes * 60;
    const estimatedTimeSeconds = baseTimeSeconds * sourceLatencyFactor * destLatencyFactor;

    // Calculate fee based on amount and protocol fee structure
    const baseFeeUSD = protocolInfo.baseFeeUSD;
    const variableFee = transactionAmount * protocolInfo.variableFeePercentage;

    // Add gas costs on both chains
    const sourceGasCost = estimateTransaction(
      sourceChainId,
      sourceNetwork,
      'bridge' as TransactionType,
      priorityLevel
    ).estimatedCostUSD;

    const destGasCost = estimateTransaction(
      destChainId,
      destNetwork,
      'transfer' as TransactionType,
      priorityLevel
    ).estimatedCostUSD;

    const estimatedFeeUSD = baseFeeUSD + variableFee + sourceGasCost + destGasCost;

    // Get security and reliability scores
    const sourceNetworkSecurity = securityRatings[sourceChainId]?.overallScore || 50;
    const destNetworkSecurity = securityRatings[destChainId]?.overallScore || 50;

    // Calculate security score as combination of protocol and network security
    const securityScore = Math.round(
      (protocolInfo.securityScore * 0.6) +
      (sourceNetworkSecurity * 0.2) +
      (destNetworkSecurity * 0.2)
    );

    // Calculate reliability score
    const sourceReliability = getReliabilityScore(sourceChainId) || 50;
    const destReliability = getReliabilityScore(destChainId) || 50;

    const reliabilityScore = Math.round(
      (protocolInfo.reliabilityScore * 0.6) +
      (sourceReliability * 0.2) +
      (destReliability * 0.2)
    );

    return {
      sourceChainId,
      destChainId,
      protocol,
      estimatedTimeSeconds,
      estimatedFeeUSD,
      trustAssumptions: protocolInfo.trustAssumptions,
      securityScore,
      reliabilityScore,
    };
  };

  // Generate cross-chain routes between networks
  const generateRoutes = (
    sourceChainId: number,
    destinationChainId: number,
    networks: Record<number, NetworkInfo>,
    maxHops: number = 2
  ): CrossChainRoute[] => {
    // Find all possible paths
    const paths = findAllPaths(sourceChainId, destinationChainId, maxHops);

    if (paths.length === 0) {
      return [];
    }

    const routes: CrossChainRoute[] = [];

    // For each path, generate route with steps
    paths.forEach(path => {
      const steps: BridgeStep[] = [];

      // For each step in the path, calculate bridge options
      for (let i = 0; i < path.length - 1; i++) {
        const fromChainId = path[i];
        const toChainId = path[i + 1];

        // Get supported bridges for this step
        const supportedBridges = getSupportedBridges(fromChainId, toChainId);

        if (supportedBridges.length === 0) {
          continue; // Skip if no bridges available
        }

        // Use the best bridge for this step by default (highest security score)
        let bestBridge = supportedBridges[0];
        let bestScore = 0;

        supportedBridges.forEach(bridge => {
          const score = BRIDGE_PROTOCOLS[bridge].securityScore;
          if (score > bestScore) {
            bestScore = score;
            bestBridge = bridge;
          }
        });

        // Calculate bridge step
        const step = calculateBridgeStep(
          fromChainId,
          toChainId,
          bestBridge,
          networks[fromChainId],
          networks[toChainId]
        );

        steps.push(step);
      }

      if (steps.length === 0) {
        return; // Skip if no steps could be calculated
      }

      // Calculate overall route metrics
      const totalTimeSeconds = steps.reduce((sum, step) => sum + step.estimatedTimeSeconds, 0);
      const totalFeeUSD = steps.reduce((sum, step) => sum + step.estimatedFeeUSD, 0);

      // Calculate security and reliability as weighted averages
      let weightedSecuritySum = 0;
      let weightedReliabilitySum = 0;
      let totalWeight = 0;

      steps.forEach(step => {
        // Weight is based on fee proportion of total
        const weight = step.estimatedFeeUSD / totalFeeUSD;
        weightedSecuritySum += step.securityScore * weight;
        weightedReliabilitySum += step.reliabilityScore * weight;
        totalWeight += weight;
      });

      const overallSecurityScore = Math.round(weightedSecuritySum / totalWeight);
      const overallReliabilityScore = Math.round(weightedReliabilitySum / totalWeight);

      // Determine overall route risk
      let routeRisk: 'low' | 'medium' | 'high';

      if (overallSecurityScore >= 80 && overallReliabilityScore >= 80) {
        routeRisk = 'low';
      } else if (overallSecurityScore >= 60 && overallReliabilityScore >= 60) {
        routeRisk = 'medium';
      } else {
        routeRisk = 'high';
      }

      routes.push({
        steps,
        sourceChainId,
        destinationChainId,
        totalTimeSeconds,
        totalFeeUSD,
        overallSecurityScore,
        overallReliabilityScore,
        routeRisk,
      });
    });

    // Sort routes by risk (low to high), then by fee (low to high)
    return routes.sort((a, b) => {
      const riskOrder = { low: 0, medium: 1, high: 2 };
      const riskDiff = riskOrder[a.routeRisk] - riskOrder[b.routeRisk];

      if (riskDiff !== 0) return riskDiff;

      return a.totalFeeUSD - b.totalFeeUSD;
    });
  };

  // Find optimal route based on different criteria
  const findOptimalRoute = (
    routes: CrossChainRoute[],
    criteria: 'security' | 'cost' | 'speed' | 'balanced' = 'balanced'
  ): CrossChainRoute | null => {
    if (routes.length === 0) {
      return null;
    }

    switch (criteria) {
      case 'security':
        // Sort by security score (highest first)
        return [...routes].sort((a, b) => b.overallSecurityScore - a.overallSecurityScore)[0];

      case 'cost':
        // Sort by total fee (lowest first)
        return [...routes].sort((a, b) => a.totalFeeUSD - b.totalFeeUSD)[0];

      case 'speed':
        // Sort by total time (lowest first)
        return [...routes].sort((a, b) => a.totalTimeSeconds - b.totalTimeSeconds)[0];

      case 'balanced':
      default:
        // Calculate a balanced score
        const scoredRoutes = routes.map(route => {
          // Normalize scores between 0-1 (higher is better)
          const securityNorm = route.overallSecurityScore / 100;
          const reliabilityNorm = route.overallReliabilityScore / 100;

          // Invert cost and time so that lower is better
          const maxFee = Math.max(...routes.map(r => r.totalFeeUSD));
          const costNorm = 1 - (route.totalFeeUSD / maxFee);

          const maxTime = Math.max(...routes.map(r => r.totalTimeSeconds));
          const timeNorm = 1 - (route.totalTimeSeconds / maxTime);

          // Calculate balanced score with weights
          const balancedScore =
            (securityNorm * 0.3) + // 30% security
            (reliabilityNorm * 0.2) + // 20% reliability
            (costNorm * 0.25) + // 25% cost
            (timeNorm * 0.25); // 25% speed

          return { route, score: balancedScore };
        });

        // Return route with highest score
        return scoredRoutes.sort((a, b) => b.score - a.score)[0].route;
    }
  };

  // Validate route to ensure it's still valid
  const validateRoute = (
    route: CrossChainRoute,
    networks: Record<number, NetworkInfo>
  ): { isValid: boolean; issues: string[] } => {
    const issues: string[] = [];

    // Check if all chains in the route are available
    const chainsInRoute = new Set<number>([
      route.sourceChainId,
      route.destinationChainId,
      ...route.steps.map(step => step.destChainId)
    ]);

    for (const chainId of chainsInRoute) {
      if (!networks[chainId]) {
        issues.push(`Chain ID ${chainId} is not available in the provided networks.`);
      }
    }

    // Check that all steps are connected
    for (let i = 0; i < route.steps.length - 1; i++) {
      const currentStep = route.steps[i];
      const nextStep = route.steps[i + 1];

      if (currentStep.destChainId !== nextStep.sourceChainId) {
        issues.push(`Route is not continuous between steps ${i + 1} and ${i + 2}.`);
      }
    }

    // Validate first and last steps
    if (route.steps.length > 0) {
      if (route.steps[0].sourceChainId !== route.sourceChainId) {
        issues.push(`First step does not start from the source chain ${route.sourceChainId}.`);
      }

      if (route.steps[route.steps.length - 1].destChainId !== route.destinationChainId) {
        issues.push(`Last step does not end at the destination chain ${route.destinationChainId}.`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  };

  // Add a custom bridge
  const addCustomBridge = (
    fromChainId: number,
    toChainId: number,
    protocol: BridgeProtocol = 'custom'
  ): void => {
    setCustomBridges(prev => [
      ...prev,
      { fromChainId, toChainId, protocol }
    ]);
  };

  // Set transaction amount for fee calculation
  const setAmount = (amount: number): void => {
    setTransactionAmount(amount);
  };

  // Set priority level for gas estimations
  const setPriority = (priority: PriorityLevel): void => {
    setPriorityLevel(priority);
  };

  // Format route step for display
  const formatRouteStep = (step: BridgeStep, networks: Record<number, NetworkInfo>): string => {
    const sourceNetwork = networks[step.sourceChainId];
    const destNetwork = networks[step.destChainId];
    const protocolInfo = BRIDGE_PROTOCOLS[step.protocol];

    return `${sourceNetwork?.name || `Chain ${step.sourceChainId}`} → ` +
           `${destNetwork?.name || `Chain ${step.destChainId}`} via ${protocolInfo.name} ` +
           `(~${formatTime(step.estimatedTimeSeconds)}, $${step.estimatedFeeUSD.toFixed(2)})`;
  };

  // Format time in a human-readable way
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)} seconds`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)} minutes`;
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.round((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    } else {
      const days = Math.floor(seconds / 86400);
      const hours = Math.round((seconds % 86400) / 3600);
      return `${days}d ${hours}h`;
    }
  };

  return {
    generateRoutes,
    findOptimalRoute,
    validateRoute,
    addCustomBridge,
    setAmount,
    setPriority,
    formatRouteStep,
    formatTime,
    getSupportedBridges,
    BRIDGE_PROTOCOLS,
  };
};
