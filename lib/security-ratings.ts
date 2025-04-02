"use client";

import { useState, useEffect } from 'react';
import { NetworkInfo } from './ethereum';

// Security factors enum
export enum SecurityFactor {
  Decentralization = 'decentralization',
  Validators = 'validators',
  Attacks = 'attacks',
  Bounty = 'bounty',
  Audit = 'audit',
  Age = 'age',
  Community = 'community',
  TVL = 'tvl',
}

// Risk levels
export type RiskLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

// Security rating model
export interface SecurityRating {
  chainId: number;
  overallScore: number; // 0-100
  riskLevel: RiskLevel;
  factors: Record<SecurityFactor, number>; // Individual factor scores, 0-100
  attackHistory: AttackHistory[];
  lastUpdated: number; // Timestamp
  securityAudits: AuditInfo[];
  tvlUSD: number; // Total Value Locked in USD
  decentralizationMetrics: DecentralizationMetrics;
}

export interface AttackHistory {
  date: string;
  description: string;
  fundLoss: number; // in USD
  mitigated: boolean;
  attackVector: string;
}

export interface AuditInfo {
  auditor: string;
  date: string;
  report: string; // URL
  issues: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface DecentralizationMetrics {
  validatorCount: number;
  nakamatoCoefficient: number; // 1-100, higher is better
  geographicDistribution: number; // 1-100, higher is better
  ownershipConcentration: number; // 0-100, lower is better
}

// Network categories with base security profiles
export enum NetworkCategory {
  L1MainChain = 'l1_mainchain',
  L2Rollup = 'l2_rollup',
  SideChain = 'sidechain',
  AppChain = 'appchain',
  Bridge = 'bridge',
}

// Base security profiles for different network categories
const BASE_SECURITY_PROFILES: Record<NetworkCategory, Partial<Record<SecurityFactor, number>>> = {
  [NetworkCategory.L1MainChain]: {
    [SecurityFactor.Decentralization]: 85,
    [SecurityFactor.Validators]: 90,
    [SecurityFactor.Age]: 95,
    [SecurityFactor.Community]: 90,
  },
  [NetworkCategory.L2Rollup]: {
    [SecurityFactor.Decentralization]: 65,
    [SecurityFactor.Validators]: 75,
    [SecurityFactor.Age]: 70,
    [SecurityFactor.Community]: 75,
  },
  [NetworkCategory.SideChain]: {
    [SecurityFactor.Decentralization]: 60,
    [SecurityFactor.Validators]: 70,
    [SecurityFactor.Age]: 65,
    [SecurityFactor.Community]: 65,
  },
  [NetworkCategory.AppChain]: {
    [SecurityFactor.Decentralization]: 50,
    [SecurityFactor.Validators]: 60,
    [SecurityFactor.Age]: 55,
    [SecurityFactor.Community]: 60,
  },
  [NetworkCategory.Bridge]: {
    [SecurityFactor.Decentralization]: 45,
    [SecurityFactor.Validators]: 55,
    [SecurityFactor.Age]: 50,
    [SecurityFactor.Community]: 50,
  },
};

// Pre-defined security data for well-known chains
const CHAIN_SECURITY_DATA: Record<number, {
  category: NetworkCategory;
  customFactors?: Partial<Record<SecurityFactor, number>>;
  tvlUSD?: number;
  attackHistory?: AttackHistory[];
  securityAudits?: AuditInfo[];
  decentralizationMetrics?: Partial<DecentralizationMetrics>;
}> = {
  // Ethereum
  1: {
    category: NetworkCategory.L1MainChain,
    customFactors: {
      [SecurityFactor.Bounty]: 95,
      [SecurityFactor.Audit]: 95,
      [SecurityFactor.TVL]: 100,
    },
    tvlUSD: 100_000_000_000, // $100B example
    decentralizationMetrics: {
      validatorCount: 550000,
      nakamatoCoefficient: 95,
      geographicDistribution: 90,
      ownershipConcentration: 20,
    },
    securityAudits: [
      {
        auditor: 'ConsenSys Diligence',
        date: '2023-01-15',
        report: 'https://consensys.io/diligence/audits/ethereum',
        issues: { critical: 0, high: 0, medium: 3, low: 5 }
      },
      {
        auditor: 'Trail of Bits',
        date: '2022-07-01',
        report: 'https://www.trailofbits.com/reports/ethereum-pos',
        issues: { critical: 0, high: 1, medium: 4, low: 7 }
      }
    ],
    attackHistory: []
  },
  // Polygon
  137: {
    category: NetworkCategory.SideChain,
    customFactors: {
      [SecurityFactor.Bounty]: 85,
      [SecurityFactor.Audit]: 80,
      [SecurityFactor.TVL]: 80,
    },
    tvlUSD: 1_500_000_000, // $1.5B example
    decentralizationMetrics: {
      validatorCount: 100,
      nakamatoCoefficient: 65,
      geographicDistribution: 70,
      ownershipConcentration: 40,
    },
    securityAudits: [
      {
        auditor: 'Quantstamp',
        date: '2022-05-02',
        report: 'https://quantstamp.com/audits/polygon',
        issues: { critical: 0, high: 2, medium: 5, low: 10 }
      }
    ],
    attackHistory: [
      {
        date: '2021-12-05',
        description: 'Vulnerability in the Polygon Plasma Bridge',
        fundLoss: 2000000,
        mitigated: true,
        attackVector: 'Smart Contract Vulnerability'
      }
    ]
  },
  // Arbitrum
  42161: {
    category: NetworkCategory.L2Rollup,
    customFactors: {
      [SecurityFactor.Bounty]: 80,
      [SecurityFactor.Audit]: 85,
      [SecurityFactor.TVL]: 85,
    },
    tvlUSD: 3_000_000_000, // $3B example
    decentralizationMetrics: {
      validatorCount: 1,
      nakamatoCoefficient: 30,
      geographicDistribution: 30,
      ownershipConcentration: 90,
    },
    securityAudits: [
      {
        auditor: 'Trail of Bits',
        date: '2022-08-15',
        report: 'https://www.trailofbits.com/reports/arbitrum',
        issues: { critical: 0, high: 1, medium: 3, low: 8 }
      }
    ],
    attackHistory: []
  },
  // Optimism
  10: {
    category: NetworkCategory.L2Rollup,
    customFactors: {
      [SecurityFactor.Bounty]: 80,
      [SecurityFactor.Audit]: 85,
      [SecurityFactor.TVL]: 80,
    },
    tvlUSD: 2_000_000_000, // $2B example
    decentralizationMetrics: {
      validatorCount: 1,
      nakamatoCoefficient: 30,
      geographicDistribution: 30,
      ownershipConcentration: 90,
    },
    securityAudits: [
      {
        auditor: 'OpenZeppelin',
        date: '2022-06-20',
        report: 'https://blog.openzeppelin.com/optimism-security-audit',
        issues: { critical: 0, high: 1, medium: 4, low: 9 }
      }
    ],
    attackHistory: []
  },
  // Base
  8453: {
    category: NetworkCategory.L2Rollup,
    customFactors: {
      [SecurityFactor.Bounty]: 75,
      [SecurityFactor.Audit]: 80,
      [SecurityFactor.TVL]: 70,
    },
    tvlUSD: 500_000_000, // $500M example
    decentralizationMetrics: {
      validatorCount: 1,
      nakamatoCoefficient: 25,
      geographicDistribution: 20,
      ownershipConcentration: 95,
    },
    securityAudits: [
      {
        auditor: 'Consensys Diligence',
        date: '2023-01-05',
        report: 'https://consensys.io/diligence/audits/base',
        issues: { critical: 0, high: 1, medium: 5, low: 8 }
      }
    ],
    attackHistory: []
  },
};

// Default values for missing factors
const DEFAULT_FACTOR_SCORES: Record<SecurityFactor, number> = {
  [SecurityFactor.Decentralization]: 50,
  [SecurityFactor.Validators]: 50,
  [SecurityFactor.Attacks]: 50,
  [SecurityFactor.Bounty]: 50,
  [SecurityFactor.Audit]: 50,
  [SecurityFactor.Age]: 50,
  [SecurityFactor.Community]: 50,
  [SecurityFactor.TVL]: 50,
};

// Factor weights for overall score calculation
const FACTOR_WEIGHTS: Record<SecurityFactor, number> = {
  [SecurityFactor.Decentralization]: 0.20,
  [SecurityFactor.Validators]: 0.15,
  [SecurityFactor.Attacks]: 0.15,
  [SecurityFactor.Bounty]: 0.10,
  [SecurityFactor.Audit]: 0.15,
  [SecurityFactor.Age]: 0.05,
  [SecurityFactor.Community]: 0.05,
  [SecurityFactor.TVL]: 0.15,
};

// Calculate risk level based on overall score
const calculateRiskLevel = (score: number): RiskLevel => {
  if (score >= 90) return 'very_low';
  if (score >= 75) return 'low';
  if (score >= 50) return 'medium';
  if (score >= 30) return 'high';
  return 'very_high';
};

// Calculate a security score for attacks history
const calculateAttackScore = (history: AttackHistory[]): number => {
  if (!history || history.length === 0) return 100; // No attacks is good

  let score = 100;

  // Each attack reduces the score
  history.forEach(attack => {
    // More recent attacks have more impact
    const yearsAgo = (Date.now() - new Date(attack.date).getTime()) / (1000 * 60 * 60 * 24 * 365);
    const timeDecay = Math.min(1, Math.max(0.2, 1 - (yearsAgo / 5))); // Decay factor over 5 years

    // Loss severity (logarithmic scale)
    const lossSeverity = Math.min(50, Math.log10(attack.fundLoss + 1) * 5);

    // Mitigation factor
    const mitigationFactor = attack.mitigated ? 0.3 : 1.0;

    // Calculate impact
    const impact = lossSeverity * timeDecay * mitigationFactor;

    // Reduce score by impact
    score = Math.max(0, score - impact);
  });

  return score;
};

// Calculate a security score for audits
const calculateAuditScore = (audits: AuditInfo[]): number => {
  if (!audits || audits.length === 0) return 40; // No audits is concerning

  let score = 50; // Base score for having audits

  // More audits are better
  score += Math.min(20, audits.length * 5);

  // Recency of audits
  const mostRecent = audits.reduce((latest, audit) => {
    const auditDate = new Date(audit.date).getTime();
    return auditDate > latest ? auditDate : latest;
  }, 0);

  const monthsAgo = (Date.now() - mostRecent) / (1000 * 60 * 60 * 24 * 30);
  const recencyScore = Math.max(0, 20 - monthsAgo); // Up to 20 points for recency

  score += recencyScore;

  // Deductions for issues
  let deduction = 0;
  audits.forEach(audit => {
    deduction += audit.issues.critical * 10;
    deduction += audit.issues.high * 5;
    deduction += audit.issues.medium * 2;
    deduction += audit.issues.low * 0.5;
  });

  return Math.max(0, Math.min(100, score - deduction));
};

// Calculate a TVL-based security score
const calculateTVLScore = (tvl: number): number => {
  // Log scale: 0 points at $0, 100 points at $100B
  if (tvl <= 0) return 0;
  return Math.min(100, Math.max(0, Math.log10(tvl) * 10));
};

// Create custom hook for security ratings
export const useSecurityRatings = () => {
  const [securityRatings, setSecurityRatings] = useState<Record<number, SecurityRating>>({});
  const [customData, setCustomData] = useState<Record<number, Partial<typeof CHAIN_SECURITY_DATA[0]>>>({});

  // Generate rating for a single chain
  const generateRating = (chainId: number, networkInfo: NetworkInfo): SecurityRating => {
    // Get the predefined security data or create empty object
    const securityData = CHAIN_SECURITY_DATA[chainId] || customData[chainId] || {
      category: NetworkCategory.AppChain // Default to AppChain for unknown chains
    };

    // Base factors from network category
    const baseFactors = BASE_SECURITY_PROFILES[securityData.category] || {};

    // Custom factors for this specific chain
    const customFactors = securityData.customFactors || {};

    // Attack history
    const attackHistory = securityData.attackHistory || [];
    const attackScore = calculateAttackScore(attackHistory);

    // Security audits
    const securityAudits = securityData.securityAudits || [];
    const auditScore = calculateAuditScore(securityAudits);

    // TVL score
    const tvlUSD = securityData.tvlUSD || 0;
    const tvlScore = calculateTVLScore(tvlUSD);

    // Decentralization metrics
    const defaultDecentralizationMetrics: DecentralizationMetrics = {
      validatorCount: 1,
      nakamatoCoefficient: 0,
      geographicDistribution: 0,
      ownershipConcentration: 100
    };

    const decentralizationMetrics = {
      ...defaultDecentralizationMetrics,
      ...securityData.decentralizationMetrics
    };

    // Calculate decentralization score
    const decentralizationScore =
      Math.min(100, decentralizationMetrics.validatorCount > 1000 ? 100 :
                   decentralizationMetrics.validatorCount / 10) * 0.3 +
      decentralizationMetrics.nakamatoCoefficient * 0.3 +
      decentralizationMetrics.geographicDistribution * 0.2 +
      (100 - decentralizationMetrics.ownershipConcentration) * 0.2;

    // Combine all factor scores
    const factorScores: Record<SecurityFactor, number> = {
      ...DEFAULT_FACTOR_SCORES,
      ...baseFactors,
      ...customFactors,
      [SecurityFactor.Attacks]: attackScore,
      [SecurityFactor.Audit]: auditScore,
      [SecurityFactor.TVL]: tvlScore,
      [SecurityFactor.Decentralization]: decentralizationScore,
    };

    // Calculate overall score
    let overallScore = 0;
    Object.entries(factorScores).forEach(([factor, score]) => {
      overallScore += score * FACTOR_WEIGHTS[factor as SecurityFactor];
    });

    // Round to nearest integer
    overallScore = Math.round(overallScore);

    // Determine risk level
    const riskLevel = calculateRiskLevel(overallScore);

    return {
      chainId,
      overallScore,
      riskLevel,
      factors: factorScores as Record<SecurityFactor, number>,
      attackHistory,
      lastUpdated: Date.now(),
      securityAudits,
      tvlUSD,
      decentralizationMetrics,
    };
  };

  // Generate ratings for all networks
  const generateRatingsForNetworks = (networks: Record<number, NetworkInfo>): void => {
    const newRatings: Record<number, SecurityRating> = {};

    Object.entries(networks).forEach(([chainIdStr, network]) => {
      const chainId = parseInt(chainIdStr);
      newRatings[chainId] = generateRating(chainId, network);
    });

    setSecurityRatings(newRatings);
  };

  // Add custom security data for a specific chain
  const addCustomSecurityData = (
    chainId: number,
    data: Partial<typeof CHAIN_SECURITY_DATA[0]>
  ): void => {
    setCustomData(prev => ({
      ...prev,
      [chainId]: {
        ...prev[chainId],
        ...data
      }
    }));
  };

  // Interpret risk level for display
  const getRiskLevelDisplay = (riskLevel: RiskLevel): {
    label: string;
    color: string;
    description: string;
  } => {
    switch (riskLevel) {
      case 'very_low':
        return {
          label: 'Very Low Risk',
          color: 'green',
          description: 'Highly secure blockchain with robust security measures and proven track record.'
        };
      case 'low':
        return {
          label: 'Low Risk',
          color: 'lightgreen',
          description: 'Well-established blockchain with good security practices and minimal vulnerabilities.'
        };
      case 'medium':
        return {
          label: 'Medium Risk',
          color: 'yellow',
          description: 'Moderately secure blockchain with some potential vulnerabilities that should be considered.'
        };
      case 'high':
        return {
          label: 'High Risk',
          color: 'orange',
          description: 'Significant security concerns present. Exercise caution when using this network.'
        };
      case 'very_high':
        return {
          label: 'Very High Risk',
          color: 'red',
          description: 'Major security vulnerabilities or unproven implementation. Not recommended for valuable assets.'
        };
    }
  };

  // Get descriptions for security factors
  const getFactorDescription = (factor: SecurityFactor): string => {
    switch (factor) {
      case SecurityFactor.Decentralization:
        return 'Measures how distributed the network is across validators and geographic regions.';
      case SecurityFactor.Validators:
        return 'Assesses the number, quality, and diversity of network validators.';
      case SecurityFactor.Attacks:
        return 'Evaluates the history of successful attacks, their severity, and mitigation.';
      case SecurityFactor.Bounty:
        return 'Measures the presence and size of security bug bounty programs.';
      case SecurityFactor.Audit:
        return 'Assesses the quality, recency, and coverage of security audits.';
      case SecurityFactor.Age:
        return 'Considers how long the network has been operational.';
      case SecurityFactor.Community:
        return 'Evaluates the size and engagement of the developer and user community.';
      case SecurityFactor.TVL:
        return 'Total Value Locked - measures economic security as a function of assets on the chain.';
      default:
        return 'No description available.';
    }
  };

  return {
    securityRatings,
    generateRating,
    generateRatingsForNetworks,
    addCustomSecurityData,
    getRiskLevelDisplay,
    getFactorDescription,
  };
};
