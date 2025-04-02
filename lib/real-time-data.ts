/**
 * real-time-data.ts
 *
 * This module implements real-time data fetching using WebSockets and polling
 * to provide up-to-date blockchain metrics for the D-UNIX platform.
 */

import { NETWORKS } from './ethereum';
import { playSound } from './sound-manager';

// Types for our real-time data
export interface RealTimeData {
  // Gas price data
  gasPrices: Record<string, GasPriceData>;
  // Trading volumes
  volumes: Record<string, VolumeData>;
  // Protocol TVL changes
  protocols: Record<string, ProtocolData[]>;
  // Last updated timestamp
  lastUpdated: number;
  alerts: VolumeAlert[];
  settings: {
    alertThreshold: number;
    alertEnabled: boolean;
    alertMaxCount: number;
    soundSettings: SoundSettings; // Add sound settings
    alertRules: AlertRule[]; // Add custom alert rules
    mobileDevices: MobileDevice[]; // Add mobile devices for push notifications
    selectedCategories: AlertCategory[]; // Categories to monitor (empty means all)
  }
}

export interface VolumeAlert {
  chainId: number;
  chainName: string;
  timestamp: number;
  changePercent: number;
  volume: number;
  formattedVolume: string;
  timeframe: '1h' | '24h';
  isPositive: boolean;
  isSignificant: boolean;
  message: string;
  id: string; // Unique identifier for the alert
  read: boolean; // Whether the alert has been read by the user
  category: AlertCategory; // Type of alert
  severity: AlertSeverity; // Importance level of the alert
  playSoundNotification: boolean; // Whether this alert should play a sound
  sendPushNotification: boolean; // Whether this alert should send a push notification
}

// Define alert categories
export enum AlertCategory {
  VolumeChange = 'volume_change',
  PriceMovement = 'price_movement',
  LiquidityChange = 'liquidity_change',
  GasPrice = 'gas_price',
  SlippageWarning = 'slippage_warning',
  NetworkCongestion = 'network_congestion',
  TradingOpportunity = 'trading_opportunity'
}

// Define alert severity levels
export enum AlertSeverity {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical'
}

// Define alert rule for custom filtering
export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  chainIds: number[]; // Specific chains to monitor (empty means all chains)
  categories: AlertCategory[]; // Categories to monitor (empty means all categories)
  minimumThreshold: number; // Minimum percent change to trigger an alert
  minimumVolume: number; // Minimum volume amount to consider (0 means any volume)
  timeframes: ('1h' | '24h')[]; // Which timeframes to monitor
  playSoundNotification: boolean; // Whether to play sound for this rule
  sendPushNotification: boolean; // Whether to send push notifications for this rule
  severityLevel: AlertSeverity; // The severity level of this rule
}

// Define mobile device for push notifications
export interface MobileDevice {
  id: string;
  name: string;
  token: string; // Push notification token
  enabled: boolean; // Whether push notifications are enabled for this device
}

// Define sound notification settings
export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0.0 to 1.0
  soundType: 'beep' | 'chime' | 'alert' | 'notification';
  playSoundForSeverity: AlertSeverity; // Minimum severity to play sound for
  muteTimeStart: number; // Hour of day to start muting (0-23)
  muteTimeEnd: number; // Hour of day to end muting (0-23)
}

export interface GasPriceData {
  standard: number;
  fast: number;
  instant: number;
  baseFee: number;
  formattedStandard: string;
  formattedFast: string;
  formattedInstant: string;
  formatted: string; // For backward compatibility
  history: {
    timestamp: number;
    standard: number;
    fast: number;
    instant: number;
  }[];
}

export interface VolumeData {
  daily: number;
  weekly: number;
  monthly: number;
  dailyChange: number;
  weeklyChange: number;
  formatted: {
    daily: string;
    weekly: string;
    monthly: string;
    dailyChange: string;
  };
  history: {
    timestamp: number;
    volume: number;
  }[];
  // Add detailed transaction metrics
  transactionCount: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  averageTransactionSize: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  formattedTransactionCount: {
    daily: string;
    weekly: string;
    monthly: string;
  };
  formattedAverageSize: {
    daily: string;
    weekly: string;
    monthly: string;
  };
  volumeGrowth: {
    daily: number;  // % change compared to previous day
    weekly: number; // % change compared to previous week
    monthly: number; // % change compared to previous month
  };
  // Historical data for different timeframes
  dailyHistory: Array<{timestamp: number, volume: number}>;
  weeklyHistory: Array<{timestamp: number, volume: number}>;
  monthlyHistory: Array<{timestamp: number, volume: number}>;
}

export interface ProtocolData {
  name: string;
  chainId: number;
  tvl: number;
  change24h: number;
  formatted: {
    tvl: string;
    change24h: string;
  };
}

// History size for gas prices and volumes (24 hours with 5 minute intervals)
const HISTORY_SIZE = 288; // 24 * 12

// WebSocket connections for each supported chain
const websockets: Record<string, WebSocket> = {};

// Initialize the realTimeData object with mock data
export const realTimeData: RealTimeData = {
  gasPrices: {
    "1": { // Ethereum
      standard: 25,
      fast: 35,
      instant: 50,
      baseFee: 20,
      formattedStandard: "25 GWEI",
      formattedFast: "35 GWEI",
      formattedInstant: "50 GWEI",
      formatted: "25 GWEI",
      history: Array(HISTORY_SIZE).fill(0).map((_, i) => ({
        timestamp: Date.now() - (HISTORY_SIZE - i) * 5 * 60 * 1000,
        standard: 25 + Math.sin(i * 0.1) * 10,
        fast: 35 + Math.sin(i * 0.1) * 12,
        instant: 50 + Math.sin(i * 0.1) * 15
      }))
    },
    "42161": { // Arbitrum
      standard: 18,
      fast: 28,
      instant: 40,
      baseFee: 15,
      formattedStandard: "18 GWEI",
      formattedFast: "28 GWEI",
      formattedInstant: "40 GWEI",
      formatted: "18 GWEI",
      history: Array(HISTORY_SIZE).fill(0).map((_, i) => ({
        timestamp: Date.now() - (HISTORY_SIZE - i) * 5 * 60 * 1000,
        standard: 18 + Math.cos(i * 0.12) * 8,
        fast: 28 + Math.cos(i * 0.12) * 10,
        instant: 40 + Math.cos(i * 0.12) * 12
      }))
    },
    "56": { // BNB Chain
      standard: 8,
      fast: 12,
      instant: 20,
      baseFee: 6,
      formattedStandard: "8 GWEI",
      formattedFast: "12 GWEI",
      formattedInstant: "20 GWEI",
      formatted: "8 GWEI",
      history: Array(HISTORY_SIZE).fill(0).map((_, i) => ({
        timestamp: Date.now() - (HISTORY_SIZE - i) * 5 * 60 * 1000,
        standard: 8 + Math.sin(i * 0.15) * 4,
        fast: 12 + Math.sin(i * 0.15) * 6,
        instant: 20 + Math.sin(i * 0.15) * 8
      }))
    },
    "137": { // Polygon
      standard: 35,
      fast: 50,
      instant: 70,
      baseFee: 30,
      formattedStandard: "35 GWEI",
      formattedFast: "50 GWEI",
      formattedInstant: "70 GWEI",
      formatted: "35 GWEI",
      history: Array(HISTORY_SIZE).fill(0).map((_, i) => ({
        timestamp: Date.now() - (HISTORY_SIZE - i) * 5 * 60 * 1000,
        standard: 35 + Math.cos(i * 0.08) * 15,
        fast: 50 + Math.cos(i * 0.08) * 20,
        instant: 70 + Math.cos(i * 0.08) * 25
      }))
    },
    "10": { // Optimism
      standard: 15,
      fast: 25,
      instant: 35,
      baseFee: 12,
      formattedStandard: "15 GWEI",
      formattedFast: "25 GWEI",
      formattedInstant: "35 GWEI",
      formatted: "15 GWEI",
      history: Array(HISTORY_SIZE).fill(0).map((_, i) => ({
        timestamp: Date.now() - (HISTORY_SIZE - i) * 5 * 60 * 1000,
        standard: 15 + Math.sin(i * 0.2) * 7,
        fast: 25 + Math.sin(i * 0.2) * 10,
        instant: 35 + Math.sin(i * 0.2) * 12
      }))
    },
    "43114": { // Avalanche
      standard: 22,
      fast: 32,
      instant: 45,
      baseFee: 18,
      formattedStandard: "22 GWEI",
      formattedFast: "32 GWEI",
      formattedInstant: "45 GWEI",
      formatted: "22 GWEI",
      history: Array(HISTORY_SIZE).fill(0).map((_, i) => ({
        timestamp: Date.now() - (HISTORY_SIZE - i) * 5 * 60 * 1000,
        standard: 22 + Math.cos(i * 0.1) * 9,
        fast: 32 + Math.cos(i * 0.1) * 12,
        instant: 45 + Math.cos(i * 0.1) * 15
      }))
    },
    "8453": { // Base
      standard: 10,
      fast: 18,
      instant: 25,
      baseFee: 8,
      formattedStandard: "10 GWEI",
      formattedFast: "18 GWEI",
      formattedInstant: "25 GWEI",
      formatted: "10 GWEI",
      history: Array(HISTORY_SIZE).fill(0).map((_, i) => ({
        timestamp: Date.now() - (HISTORY_SIZE - i) * 5 * 60 * 1000,
        standard: 10 + Math.sin(i * 0.12) * 5,
        fast: 18 + Math.sin(i * 0.12) * 8,
        instant: 25 + Math.sin(i * 0.12) * 10
      }))
    },
    "250": { // Fantom
      standard: 12,
      fast: 20,
      instant: 30,
      baseFee: 10,
      formattedStandard: "12 GWEI",
      formattedFast: "20 GWEI",
      formattedInstant: "30 GWEI",
      formatted: "12 GWEI",
      history: Array(HISTORY_SIZE).fill(0).map((_, i) => ({
        timestamp: Date.now() - (HISTORY_SIZE - i) * 5 * 60 * 1000,
        standard: 12 + Math.cos(i * 0.15) * 6,
        fast: 20 + Math.cos(i * 0.15) * 9,
        instant: 30 + Math.cos(i * 0.15) * 12
      }))
    },
    "5000": { // Solana (using a mock EVM-compatible id)
      standard: 28,
      fast: 40,
      instant: 55,
      baseFee: 25,
      formattedStandard: "28 GWEI",
      formattedFast: "40 GWEI",
      formattedInstant: "55 GWEI",
      formatted: "28 GWEI",
      history: Array(HISTORY_SIZE).fill(0).map((_, i) => ({
        timestamp: Date.now() - (HISTORY_SIZE - i) * 5 * 60 * 1000,
        standard: 28 + Math.sin(i * 0.09) * 12,
        fast: 40 + Math.sin(i * 0.09) * 15,
        instant: 55 + Math.sin(i * 0.09) * 18
      }))
    },
    "5001": { // Kadena (using a mock EVM-compatible id)
      standard: 20,
      fast: 30,
      instant: 42,
      baseFee: 18,
      formattedStandard: "20 GWEI",
      formattedFast: "30 GWEI",
      formattedInstant: "42 GWEI",
      formatted: "20 GWEI",
      history: Array(HISTORY_SIZE).fill(0).map((_, i) => ({
        timestamp: Date.now() - (HISTORY_SIZE - i) * 5 * 60 * 1000,
        standard: 20 + Math.cos(i * 0.11) * 9,
        fast: 30 + Math.cos(i * 0.11) * 12,
        instant: 42 + Math.cos(i * 0.11) * 15
      }))
    }
  },
  volumes: {
    "1": { // Ethereum
      daily: 1800000000, // $1.8B
      weekly: 12600000000, // $12.6B
      monthly: 54000000000, // $54B
      dailyChange: 5.2,
      weeklyChange: 3.7,
      formatted: {
        daily: "$1.8B",
        weekly: "$12.6B",
        monthly: "$54B",
        dailyChange: "+5.2%"
      },
      history: Array(48).fill(0).map((_, i) => ({
        timestamp: Date.now() - (48 - i) * 30 * 60 * 1000,
        volume: 1800000000 * (0.9 + Math.random() * 0.2)
      })),
      transactionCount: {
        daily: 1500000,
        weekly: 10500000,
        monthly: 45000000
      },
      averageTransactionSize: {
        daily: 1200,
        weekly: 1200,
        monthly: 1200
      },
      formattedTransactionCount: {
        daily: "1.5M",
        weekly: "10.5M",
        monthly: "45M"
      },
      formattedAverageSize: {
        daily: "$1,200",
        weekly: "$1,200",
        monthly: "$1,200"
      },
      volumeGrowth: {
        daily: 5.2,
        weekly: 3.7,
        monthly: 2.1
      },
      dailyHistory: Array(30).fill(0).map((_, i) => ({
        timestamp: Date.now() - (30 - i) * 24 * 60 * 60 * 1000,
        volume: 1800000000 * (0.8 + Math.random() * 0.4)
      })),
      weeklyHistory: Array(12).fill(0).map((_, i) => ({
        timestamp: Date.now() - (12 - i) * 7 * 24 * 60 * 60 * 1000,
        volume: 12600000000 * (0.8 + Math.random() * 0.4)
      })),
      monthlyHistory: Array(12).fill(0).map((_, i) => ({
        timestamp: Date.now() - (12 - i) * 30 * 24 * 60 * 60 * 1000,
        volume: 54000000000 * (0.8 + Math.random() * 0.4)
      }))
    },
    "42161": { // Arbitrum
      daily: 720000000, // $720M
      weekly: 5040000000, // $5.04B
      monthly: 21600000000, // $21.6B
      dailyChange: 2.3,
      weeklyChange: 1.5,
      formatted: {
        daily: "$720M",
        weekly: "$5.04B",
        monthly: "$21.6B",
        dailyChange: "+2.3%"
      },
      history: Array(48).fill(0).map((_, i) => ({
        timestamp: Date.now() - (48 - i) * 30 * 60 * 1000,
        volume: 720000000 * (0.9 + Math.random() * 0.2)
      })),
      transactionCount: {
        daily: 820000,
        weekly: 5740000,
        monthly: 24600000
      },
      averageTransactionSize: {
        daily: 878,
        weekly: 878,
        monthly: 878
      },
      formattedTransactionCount: {
        daily: "820K",
        weekly: "5.74M",
        monthly: "24.6M"
      },
      formattedAverageSize: {
        daily: "$878",
        weekly: "$878",
        monthly: "$878"
      },
      volumeGrowth: {
        daily: 2.3,
        weekly: 1.5,
        monthly: 1.1
      },
      dailyHistory: [],
      weeklyHistory: [],
      monthlyHistory: []
    },
    "10": { // Optimism
      daily: 540000000, // $540M
      weekly: 3780000000, // $3.78B
      monthly: 16200000000, // $16.2B
      dailyChange: 1.9,
      weeklyChange: 1.2,
      formatted: {
        daily: "$540M",
        weekly: "$3.78B",
        monthly: "$16.2B",
        dailyChange: "+1.9%"
      },
      history: Array(48).fill(0).map((_, i) => ({
        timestamp: Date.now() - (48 - i) * 30 * 60 * 1000,
        volume: 540000000 * (0.9 + Math.random() * 0.2)
      })),
      transactionCount: {
        daily: 420000,
        weekly: 2940000,
        monthly: 12600000
      },
      averageTransactionSize: {
        daily: 1285,
        weekly: 1285,
        monthly: 1285
      },
      formattedTransactionCount: {
        daily: "420K",
        weekly: "2.94M",
        monthly: "12.6M"
      },
      formattedAverageSize: {
        daily: "$1,285",
        weekly: "$1,285",
        monthly: "$1,285"
      },
      volumeGrowth: {
        daily: 1.9,
        weekly: 1.2,
        monthly: 0.8
      },
      dailyHistory: [],
      weeklyHistory: [],
      monthlyHistory: []
    },
    "8453": { // Base
      daily: 380000000, // $380M
      weekly: 2660000000, // $2.66B
      monthly: 11400000000, // $11.4B
      dailyChange: 5.1,
      weeklyChange: 3.2,
      formatted: {
        daily: "$380M",
        weekly: "$2.66B",
        monthly: "$11.4B",
        dailyChange: "+5.1%"
      },
      history: Array(48).fill(0).map((_, i) => ({
        timestamp: Date.now() - (48 - i) * 30 * 60 * 1000,
        volume: 380000000 * (0.9 + Math.random() * 0.2)
      })),
      transactionCount: {
        daily: 350000,
        weekly: 2450000,
        monthly: 10500000
      },
      averageTransactionSize: {
        daily: 1085,
        weekly: 1085,
        monthly: 1085
      },
      formattedTransactionCount: {
        daily: "350K",
        weekly: "2.45M",
        monthly: "10.5M"
      },
      formattedAverageSize: {
        daily: "$1,085",
        weekly: "$1,085",
        monthly: "$1,085"
      },
      volumeGrowth: {
        daily: 5.1,
        weekly: 3.2,
        monthly: 1.8
      },
      dailyHistory: [],
      weeklyHistory: [],
      monthlyHistory: []
    },
    "56": { // BNB Chain
      daily: 500000000, // $500M
      weekly: 3500000000, // $3.5B
      monthly: 15000000000, // $15B
      dailyChange: -0.5,
      weeklyChange: -0.3,
      formatted: {
        daily: "$500M",
        weekly: "$3.5B",
        monthly: "$15B",
        dailyChange: "-0.5%"
      },
      history: Array(48).fill(0).map((_, i) => ({
        timestamp: Date.now() - (48 - i) * 30 * 60 * 1000,
        volume: 500000000 * (0.9 + Math.random() * 0.2)
      })),
      transactionCount: {
        daily: 620000,
        weekly: 4340000,
        monthly: 18600000
      },
      averageTransactionSize: {
        daily: 806,
        weekly: 806,
        monthly: 806
      },
      formattedTransactionCount: {
        daily: "620K",
        weekly: "4.34M",
        monthly: "18.6M"
      },
      formattedAverageSize: {
        daily: "$806",
        weekly: "$806",
        monthly: "$806"
      },
      volumeGrowth: {
        daily: -0.5,
        weekly: -0.3,
        monthly: -0.1
      },
      dailyHistory: [],
      weeklyHistory: [],
      monthlyHistory: []
    },
    "137": { // Polygon
      daily: 300000000, // $300M
      weekly: 2100000000, // $2.1B
      monthly: 9000000000, // $9B
      dailyChange: 0.4,
      weeklyChange: 0.3,
      formatted: {
        daily: "$300M",
        weekly: "$2.1B",
        monthly: "$9B",
        dailyChange: "+0.4%"
      },
      history: Array(48).fill(0).map((_, i) => ({
        timestamp: Date.now() - (48 - i) * 30 * 60 * 1000,
        volume: 300000000 * (0.9 + Math.random() * 0.2)
      })),
      transactionCount: {
        daily: 580000,
        weekly: 4060000,
        monthly: 17400000
      },
      averageTransactionSize: {
        daily: 517,
        weekly: 517,
        monthly: 517
      },
      formattedTransactionCount: {
        daily: "580K",
        weekly: "4.06M",
        monthly: "17.4M"
      },
      formattedAverageSize: {
        daily: "$517",
        weekly: "$517",
        monthly: "$517"
      },
      volumeGrowth: {
        daily: 0.4,
        weekly: 0.3,
        monthly: 0.2
      },
      dailyHistory: [],
      weeklyHistory: [],
      monthlyHistory: []
    },
    "5000": { // Solana (mock chain ID)
      daily: 480000000, // $480M
      weekly: 3360000000, // $3.36B
      monthly: 14400000000, // $14.4B
      dailyChange: 3.2,
      weeklyChange: 2.5,
      formatted: {
        daily: "$480M",
        weekly: "$3.36B",
        monthly: "$14.4B",
        dailyChange: "+3.2%"
      },
      history: Array(48).fill(0).map((_, i) => ({
        timestamp: Date.now() - (48 - i) * 30 * 60 * 1000,
        volume: 480000000 * (0.9 + Math.random() * 0.2)
      })),
      transactionCount: {
        daily: 1800000,
        weekly: 12600000,
        monthly: 54000000
      },
      averageTransactionSize: {
        daily: 267,
        weekly: 267,
        monthly: 267
      },
      formattedTransactionCount: {
        daily: "1.8M",
        weekly: "12.6M",
        monthly: "54M"
      },
      formattedAverageSize: {
        daily: "$267",
        weekly: "$267",
        monthly: "$267"
      },
      volumeGrowth: {
        daily: 3.2,
        weekly: 2.5,
        monthly: 1.8
      },
      dailyHistory: [],
      weeklyHistory: [],
      monthlyHistory: []
    },
    "43114": { // Avalanche
      daily: 280000000, // $280M
      weekly: 1960000000, // $1.96B
      monthly: 8400000000, // $8.4B
      dailyChange: -1.2,
      weeklyChange: -0.8,
      formatted: {
        daily: "$280M",
        weekly: "$1.96B",
        monthly: "$8.4B",
        dailyChange: "-1.2%"
      },
      history: [],
      transactionCount: {
        daily: 340000,
        weekly: 2380000,
        monthly: 10200000
      },
      averageTransactionSize: {
        daily: 823,
        weekly: 823,
        monthly: 823
      },
      formattedTransactionCount: {
        daily: "340K",
        weekly: "2.38M",
        monthly: "10.2M"
      },
      formattedAverageSize: {
        daily: "$823",
        weekly: "$823",
        monthly: "$823"
      },
      volumeGrowth: {
        daily: -1.2,
        weekly: -0.8,
        monthly: -0.5
      },
      dailyHistory: [],
      weeklyHistory: [],
      monthlyHistory: []
    },
    "250": { // Fantom
      daily: 120000000, // $120M
      weekly: 840000000, // $840M
      monthly: 3600000000, // $3.6B
      dailyChange: -0.7,
      weeklyChange: -0.5,
      formatted: {
        daily: "$120M",
        weekly: "$840M",
        monthly: "$3.6B",
        dailyChange: "-0.7%"
      },
      history: [],
      transactionCount: {
        daily: 180000,
        weekly: 1260000,
        monthly: 5400000
      },
      averageTransactionSize: {
        daily: 667,
        weekly: 667,
        monthly: 667
      },
      formattedTransactionCount: {
        daily: "180K",
        weekly: "1.26M",
        monthly: "5.4M"
      },
      formattedAverageSize: {
        daily: "$667",
        weekly: "$667",
        monthly: "$667"
      },
      volumeGrowth: {
        daily: -0.7,
        weekly: -0.5,
        monthly: -0.3
      },
      dailyHistory: [],
      weeklyHistory: [],
      monthlyHistory: []
    },
    "5001": { // Kadena (mock chain ID)
      daily: 50000000, // $50M
      weekly: 350000000, // $350M
      monthly: 1500000000, // $1.5B
      dailyChange: 1.5,
      weeklyChange: 1.2,
      formatted: {
        daily: "$50M",
        weekly: "$350M",
        monthly: "$1.5B",
        dailyChange: "+1.5%"
      },
      history: [],
      transactionCount: {
        daily: 75000,
        weekly: 525000,
        monthly: 2250000
      },
      averageTransactionSize: {
        daily: 667,
        weekly: 667,
        monthly: 667
      },
      formattedTransactionCount: {
        daily: "75K",
        weekly: "525K",
        monthly: "2.25M"
      },
      formattedAverageSize: {
        daily: "$667",
        weekly: "$667",
        monthly: "$667"
      },
      volumeGrowth: {
        daily: 1.5,
        weekly: 1.2,
        monthly: 0.9
      },
      dailyHistory: [],
      weeklyHistory: [],
      monthlyHistory: []
    }
  },
  protocols: {
    "1": [ // Ethereum
      {
        name: "ETHEREUM",
        chainId: 1,
        tvl: 40500000000, // $40.5B
        change24h: 0.8,
        formatted: {
          tvl: "40.5B",
          change24h: "+0.8%"
        }
      }
    ],
    "42161": [ // Arbitrum
      {
        name: "ARBITRUM",
        chainId: 42161,
        tvl: 7200000000, // $7.2B
        change24h: 2.3,
        formatted: {
          tvl: "7.2B",
          change24h: "+2.3%"
        }
      }
    ],
    "56": [ // BNB Chain
      {
        name: "BNB CHAIN",
        chainId: 56,
        tvl: 4300000000, // $4.3B
        change24h: -0.5,
        formatted: {
          tvl: "4.3B",
          change24h: "-0.5%"
        }
      }
    ],
    "5000": [ // Mock Solana
      {
        name: "SOLANA",
        chainId: 5000,
        tvl: 2800000000, // $2.8B
        change24h: 3.2,
        formatted: {
          tvl: "2.8B",
          change24h: "+3.2%"
        }
      }
    ],
    "137": [ // Polygon
      {
        name: "POLYGON",
        chainId: 137,
        tvl: 1700000000, // $1.7B
        change24h: 0.4,
        formatted: {
          tvl: "1.7B",
          change24h: "+0.4%"
        }
      }
    ],
    "10": [ // Optimism
      {
        name: "OPTIMISM",
        chainId: 10,
        tvl: 1600000000, // $1.6B
        change24h: 1.9,
        formatted: {
          tvl: "1.6B",
          change24h: "+1.9%"
        }
      }
    ],
    "43114": [ // Avalanche
      {
        name: "AVALANCHE",
        chainId: 43114,
        tvl: 1100000000, // $1.1B
        change24h: -1.2,
        formatted: {
          tvl: "1.1B",
          change24h: "-1.2%"
        }
      }
    ],
    "8453": [ // Base
      {
        name: "BASE",
        chainId: 8453,
        tvl: 985200000, // $985.2M
        change24h: 5.1,
        formatted: {
          tvl: "985.2M",
          change24h: "+5.1%"
        }
      }
    ],
    "250": [ // Fantom
      {
        name: "FANTOM",
        chainId: 250,
        tvl: 452600000, // $452.6M
        change24h: -0.7,
        formatted: {
          tvl: "452.6M",
          change24h: "-0.7%"
        }
      }
    ],
    "5001": [ // Mock Kadena
      {
        name: "KADENA",
        chainId: 5001,
        tvl: 124300000, // $124.3M
        change24h: 1.5,
        formatted: {
          tvl: "124.3M",
          change24h: "+1.5%"
        }
      }
    ]
  },
  lastUpdated: Date.now(),
  alerts: [],
  settings: {
    alertThreshold: 5,
    alertEnabled: true,
    alertMaxCount: 50,
    soundSettings: {
      enabled: true,
      volume: 0.7,
      soundType: "notification",
      playSoundForSeverity: AlertSeverity.Medium,
      muteTimeStart: 22, // 10 PM
      muteTimeEnd: 8, // 8 AM
    },
    alertRules: [],
    mobileDevices: [],
    selectedCategories: []
  }
};

/**
 * Initialize WebSocket connections for supported chains
 */
function initializeWebSockets() {
  // This is now a mock function
  console.log("Initializing WebSocket connections...");
}

/**
 * Set up mock chain data
 */
function setUpMockChainData() {
  // This function would normally initialize mock data, now handled in the main object
  console.log("Setting up mock chain data...");
}

/**
 * Simulate real-time data changes with small random variations
 * This function updates the realTimeData object with slightly altered values
 * to simulate real-time price and volume changes across all chains
 */
function simulateRealTimeUpdates() {
  // Update gas prices for all chains
  Object.keys(realTimeData.gasPrices).forEach(chainId => {
    const gasData = realTimeData.gasPrices[chainId];

    // Random fluctuation between -5% and +5%
    const standardChange = (Math.random() * 0.1) - 0.05;
    const fastChange = (Math.random() * 0.1) - 0.05;
    const instantChange = (Math.random() * 0.1) - 0.05;

    // Update gas prices with small random changes
    gasData.standard = Math.max(1, gasData.standard * (1 + standardChange));
    gasData.fast = Math.max(1, gasData.fast * (1 + fastChange));
    gasData.instant = Math.max(1, gasData.instant * (1 + instantChange));

    // Update formatted values
    gasData.formattedStandard = `${Math.round(gasData.standard)} GWEI`;
    gasData.formattedFast = `${Math.round(gasData.fast)} GWEI`;
    gasData.formattedInstant = `${Math.round(gasData.instant)} GWEI`;
    gasData.formatted = gasData.formattedStandard;

    // Add new history point and remove oldest one
    if (gasData.history.length > 0) {
      gasData.history.push({
        timestamp: Date.now(),
        standard: gasData.standard,
        fast: gasData.fast,
        instant: gasData.instant
      });

      if (gasData.history.length > HISTORY_SIZE) {
        gasData.history.shift();
      }
    }
  });

  // Update volumes for all chains
  Object.keys(realTimeData.volumes).forEach(chainId => {
    const volumeData = realTimeData.volumes[chainId];

    // Random volume fluctuation between -3% and +3%
    const volumeChange = (Math.random() * 0.06) - 0.03;

    // Update volume data with small random changes
    volumeData.daily = volumeData.daily * (1 + volumeChange);
    volumeData.weekly = volumeData.weekly * (1 + volumeChange * 0.5);  // Less volatile for weekly
    volumeData.monthly = volumeData.monthly * (1 + volumeChange * 0.2); // Even less volatile for monthly

    // Update daily change percentage with more variance (-1% to +1.5%)
    volumeData.dailyChange = volumeData.dailyChange + ((Math.random() * 2.5) - 1);
    // Keep it within reasonable bounds
    volumeData.dailyChange = Math.min(15, Math.max(-10, volumeData.dailyChange));

    // Update formatted values
    const formatCurrency = (value: number) => {
      if (value >= 1_000_000_000) {
        return `$${(value / 1_000_000_000).toFixed(1)}B`;
      } else {
        return `$${(value / 1_000_000).toFixed(0)}M`;
      }
    };

    volumeData.formatted.daily = formatCurrency(volumeData.daily);
    volumeData.formatted.weekly = formatCurrency(volumeData.weekly);
    volumeData.formatted.monthly = formatCurrency(volumeData.monthly);
    volumeData.formatted.dailyChange = `${volumeData.dailyChange >= 0 ? '+' : ''}${volumeData.dailyChange.toFixed(1)}%`;

    // Add new history point
    if (volumeData.history.length > 0) {
      volumeData.history.push({
        timestamp: Date.now(),
        volume: volumeData.daily * (0.9 + Math.random() * 0.2)
      });

      if (volumeData.history.length > 48) {
        volumeData.history.shift();
      }
    }
  });

  // Update protocol TVL and change percentages
  Object.keys(realTimeData.protocols).forEach(chainId => {
    const protocols = realTimeData.protocols[chainId];

    protocols.forEach(protocol => {
      // Random TVL fluctuation between -2% and +2%
      const tvlChange = (Math.random() * 0.04) - 0.02;

      // Update TVL with small random changes
      protocol.tvl = protocol.tvl * (1 + tvlChange);

      // Update 24h change percentage with more variance (-0.8% to +1.2%)
      protocol.change24h = protocol.change24h + ((Math.random() * 2) - 0.8);
      // Keep it within reasonable bounds
      protocol.change24h = Math.min(10, Math.max(-8, protocol.change24h));

      // Update formatted values
      const formatTVL = (value: number) => {
        if (value >= 1_000_000_000) {
          return `${(value / 1_000_000_000).toFixed(1)}B`;
        } else {
          return `${(value / 1_000_000).toFixed(1)}M`;
        }
      };

      protocol.formatted.tvl = formatTVL(protocol.tvl);
      protocol.formatted.change24h = `${protocol.change24h >= 0 ? '+' : ''}${protocol.change24h.toFixed(1)}%`;
    });
  });

  // Update last updated timestamp
  realTimeData.lastUpdated = Date.now();
}

// Export function to initialize real-time data
export function initializeRealTimeData() {
  initializeWebSockets();
  setUpMockChainData();

  // Perform initial simulation update
  simulateRealTimeUpdates();

  // Set up interval to simulate real-time updates (every 10 seconds)
  const updateInterval = setInterval(() => {
    simulateRealTimeUpdates();
  }, 10000);

  // Return a cleanup function that can be called when the component unmounts
  return () => {
    console.log("Cleaning up real-time data connections...");
    clearInterval(updateInterval);
    // In a real implementation, this would close WebSocket connections
    // and clean up any other resources
  };
}

// Create a non-nested function instead of a nested export
export function simulateRealTimeDataUpdate() {
  simulateRealTimeUpdates();
}

/**
 * Get real-time data
 */
export function getRealTimeData(): RealTimeData {
  return realTimeData;
}

/**
 * Get gas price data for a specific chain
 */
export function getGasPriceData(chainId: number): GasPriceData | undefined {
  return realTimeData.gasPrices[chainId.toString()];
}

/**
 * Get volume data for a specific chain
 */
export function getVolumeData(chainId: number): VolumeData | undefined {
  return realTimeData.volumes[chainId.toString()];
}

/**
 * Get protocol data for a specific chain
 */
export function getProtocolsForChain(chainId: number): ProtocolData[] {
  return realTimeData.protocols[chainId.toString()] || [];
}

/**
 * Mark an alert as read
 */
export function markAlertAsRead(alertId: string) {
  const alert = realTimeData.alerts.find(a => a.id === alertId);
  if (alert) {
    alert.read = true;
  }
}

/**
 * Add a new volume alert
 */
export function addVolumeAlert(alert: Omit<VolumeAlert, 'id' | 'read'>): VolumeAlert {
  const newAlert: VolumeAlert = {
    ...alert,
    id: Date.now().toString(),
    read: false
  };

  // Add to the beginning of the array
  realTimeData.alerts.unshift(newAlert);

  // Keep only the most recent alerts based on settings
  realTimeData.alerts = realTimeData.alerts.slice(0, realTimeData.settings.alertMaxCount);

  // Play notification sound
  if (newAlert.playSoundNotification) {
    playSound('volume');
  }

  return newAlert;
}

/**
 * Clear all alerts
 */
export function clearAllAlerts() {
  realTimeData.alerts = [];
}

/**
 * Update alert settings
 */
export function updateAlertSettings(settings: {
  alertThreshold?: number;
  alertEnabled?: boolean;
  alertMaxCount?: number;
  soundSettings?: Partial<SoundSettings>;
  selectedCategories?: AlertCategory[];
}) {
  if (settings.alertThreshold !== undefined) {
    realTimeData.settings.alertThreshold = settings.alertThreshold;
  }

  if (settings.alertEnabled !== undefined) {
    realTimeData.settings.alertEnabled = settings.alertEnabled;
  }

  if (settings.alertMaxCount !== undefined) {
    realTimeData.settings.alertMaxCount = settings.alertMaxCount;
  }

  if (settings.soundSettings) {
    realTimeData.settings.soundSettings = {
      ...realTimeData.settings.soundSettings,
      ...settings.soundSettings
    };
  }

  if (settings.selectedCategories) {
    realTimeData.settings.selectedCategories = [...settings.selectedCategories];
  }
}

/**
 * Export data to CSV
 */
export function exportDataToCSV(dataType: 'gas' | 'volume' | 'protocols'): string {
  let csvContent = '';

  switch (dataType) {
    case 'gas':
      // Create CSV for gas price data
      csvContent = 'Chain,Standard (GWEI),Fast (GWEI),Instant (GWEI),Last Updated\n';
      Object.entries(realTimeData.gasPrices).forEach(([chainIdStr, data]) => {
        const chainName = NETWORKS[parseInt(chainIdStr)]?.name || 'Unknown';
        csvContent += `${chainName},${data.standard},${data.fast},${data.instant},${new Date(realTimeData.lastUpdated).toISOString()}\n`;
      });
      break;

    case 'volume':
      // Create CSV for volume data
      csvContent = 'Chain,Daily Volume,Weekly Volume,Monthly Volume,Daily Change,Last Updated\n';
      Object.entries(realTimeData.volumes).forEach(([chainIdStr, data]) => {
        const chainName = NETWORKS[parseInt(chainIdStr)]?.name || 'Unknown';
        csvContent += `${chainName},${data.daily},${data.weekly},${data.monthly},${data.dailyChange}%,${new Date(realTimeData.lastUpdated).toISOString()}\n`;
      });
      break;

    case 'protocols':
      // Create CSV for protocol data
      csvContent = 'Protocol,Chain,TVL,24h Change,Last Updated\n';
      Object.values(realTimeData.protocols).forEach(protocols => {
        protocols.forEach(protocol => {
          const chainName = NETWORKS[protocol.chainId]?.name || 'Unknown';
          csvContent += `${protocol.name},${chainName},${protocol.tvl},${protocol.change24h}%,${new Date(realTimeData.lastUpdated).toISOString()}\n`;
        });
      });
      break;
  }

  return csvContent;
}

/**
 * Get sound settings
 */
export function getSoundSettings(): SoundSettings {
  return { ...realTimeData.settings.soundSettings };
}

/**
 * Update sound settings
 */
export function updateSoundSettings(settings: Partial<SoundSettings>): void {
  realTimeData.settings.soundSettings = {
    ...realTimeData.settings.soundSettings,
    ...settings
  };
}

/**
 * Play a test sound notification
 */
export function playTestSound(): void {
  // In a real implementation, this would play an actual sound
  console.log(`🔊 Playing test sound (${realTimeData.settings.soundSettings.soundType}) at volume ${realTimeData.settings.soundSettings.volume}`);
}

/**
 * Get all alert rules
 */
export function getAlertRules(): AlertRule[] {
  return [...realTimeData.settings.alertRules];
}

/**
 * Add or update an alert rule
 */
export function saveAlertRule(rule: AlertRule): void {
  const index = realTimeData.settings.alertRules.findIndex(r => r.id === rule.id);

  if (index >= 0) {
    // Update existing rule
    realTimeData.settings.alertRules[index] = rule;
  } else {
    // Add new rule
    realTimeData.settings.alertRules.push(rule);
  }
}

/**
 * Delete an alert rule
 */
export function deleteAlertRule(ruleId: string): void {
  realTimeData.settings.alertRules = realTimeData.settings.alertRules.filter(r => r.id !== ruleId);
}

/**
 * Get all registered mobile devices
 */
export function getMobileDevices(): MobileDevice[] {
  return [...realTimeData.settings.mobileDevices];
}

/**
 * Add or update a mobile device
 */
export function saveMobileDevice(device: MobileDevice): void {
  const index = realTimeData.settings.mobileDevices.findIndex(d => d.id === device.id);

  if (index >= 0) {
    // Update existing device
    realTimeData.settings.mobileDevices[index] = device;
  } else {
    // Add new device
    realTimeData.settings.mobileDevices.push(device);
  }
}

/**
 * Remove a mobile device
 */
export function removeMobileDevice(deviceId: string): void {
  realTimeData.settings.mobileDevices = realTimeData.settings.mobileDevices.filter(d => d.id !== deviceId);
}

/**
 * Get enabled alert categories
 */
export function getEnabledCategories(): AlertCategory[] {
  return [...realTimeData.settings.selectedCategories];
}
