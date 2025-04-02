/**
 * Token Price Alert System
 *
 * This module provides functionality for monitoring and alerting on token price changes.
 * It supports setting price targets, monitoring price trends, and generating alerts
 * when configured conditions are met.
 */

import { AlertCategory, AlertSeverity } from './real-time-data';

export interface TokenInfo {
  symbol: string;         // Token symbol (e.g., 'ETH')
  name: string;           // Token name (e.g., 'Ethereum')
  address: string;        // Contract address
  chainId: number;        // Chain ID
  decimals: number;       // Token decimals
  logoUrl: string;        // Logo URL
  currentPrice: number;   // Current price in USD
  priceChange24h: number; // 24h price change percentage
  volume24h: number;      // 24h trading volume
  marketCap: number;      // Market capitalization
}

export enum PriceAlertCondition {
  Above = 'above',
  Below = 'below',
  PercentageIncrease = 'percentage_increase',
  PercentageDecrease = 'percentage_decrease',
  VolatilitySpike = 'volatility_spike',
  PriceTarget = 'price_target',
  PriceRange = 'price_range'
}

export interface PriceAlert {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  chainId: number;
  condition: PriceAlertCondition;
  targetPrice?: number;    // For Above/Below/PriceTarget conditions
  percentage?: number;     // For percentage-based conditions
  minPrice?: number;       // For PriceRange condition
  maxPrice?: number;       // For PriceRange condition
  volatilityThreshold?: number; // For VolatilitySpike condition
  timeframe: '1h' | '24h' | '7d'; // Timeframe to monitor
  repeatable: boolean;     // Whether alert should trigger repeatedly
  enabled: boolean;        // Whether alert is enabled
  createdAt: number;       // Timestamp when alert was created
  lastTriggeredAt?: number; // Last time alert was triggered
  notificationChannels: {  // Which channels to use for notification
    inApp: boolean;
    sound: boolean;
    mobile: boolean;
    discord: boolean;
    telegram: boolean;
  };
}

export interface PriceAlertHistory {
  alertId: string;
  tokenSymbol: string;
  tokenName: string;
  chainId: number;
  condition: PriceAlertCondition;
  triggerPrice: number;
  targetPrice?: number;
  percentage?: number;
  triggeredAt: number;
  message: string;
}

// Token price cache to avoid unnecessary API calls
const tokenPriceCache = new Map<string, TokenInfo>();

// In-memory storage for price alerts and history
// In a real application, this would be stored in a database
const priceAlerts: PriceAlert[] = [];
const alertHistory: PriceAlertHistory[] = [];

/**
 * Add or update a price alert
 */
export function savePriceAlert(alert: PriceAlert): PriceAlert {
  const index = priceAlerts.findIndex(a => a.id === alert.id);

  if (index >= 0) {
    // Update existing alert
    priceAlerts[index] = alert;
  } else {
    // Add new alert
    priceAlerts.push(alert);
  }

  return alert;
}

/**
 * Delete a price alert
 */
export function deletePriceAlert(alertId: string): boolean {
  const initialLength = priceAlerts.length;
  const filteredAlerts = priceAlerts.filter(alert => alert.id !== alertId);

  // Update the alerts array
  priceAlerts.length = 0;
  priceAlerts.push(...filteredAlerts);

  return priceAlerts.length < initialLength;
}

/**
 * Get all price alerts
 */
export function getPriceAlerts(): PriceAlert[] {
  return [...priceAlerts];
}

/**
 * Get price alerts for a specific token
 */
export function getPriceAlertsForToken(tokenAddress: string, chainId: number): PriceAlert[] {
  return priceAlerts.filter(
    alert => alert.tokenAddress === tokenAddress && alert.chainId === chainId
  );
}

/**
 * Get price alerts for a specific chain
 */
export function getPriceAlertsForChain(chainId: number): PriceAlert[] {
  return priceAlerts.filter(alert => alert.chainId === chainId);
}

/**
 * Get price alert history
 */
export function getPriceAlertHistory(
  limit?: number,
  tokenAddress?: string,
  chainId?: number
): PriceAlertHistory[] {
  // Filter history based on provided parameters
  let history = [...alertHistory];

  if (tokenAddress && chainId) {
    const token = getTokenInfo(tokenAddress, chainId);
    if (token) {
      history = history.filter(h => h.tokenSymbol === token.symbol && h.chainId === chainId);
    }
  } else if (chainId) {
    history = history.filter(h => h.chainId === chainId);
  }

  // Sort by timestamp (most recent first)
  history.sort((a, b) => b.triggeredAt - a.triggeredAt);

  // Limit results if needed
  if (limit && limit > 0) {
    history = history.slice(0, limit);
  }

  return history;
}

/**
 * Get token information
 */
export function getTokenInfo(tokenAddress: string, chainId: number): TokenInfo | null {
  const cacheKey = `${chainId}-${tokenAddress}`;

  // Check cache first
  if (tokenPriceCache.has(cacheKey)) {
    return tokenPriceCache.get(cacheKey) || null;
  }

  // In a real implementation, we would fetch from an API
  // For this example, we'll generate mock data for popular tokens

  // Check if this is a known token
  let tokenInfo: TokenInfo | null = null;

  if (tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
    // ETH
    tokenInfo = {
      symbol: 'ETH',
      name: 'Ethereum',
      address: tokenAddress,
      chainId,
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
      currentPrice: 3500 + (Math.random() * 200 - 100), // Random around $3500
      priceChange24h: Math.random() * 10 - 5, // -5% to +5%
      volume24h: 20000000000 + (Math.random() * 5000000000), // ~$20B
      marketCap: 420000000000 + (Math.random() * 10000000000) // ~$420B
    };
  } else if (tokenAddress.toLowerCase() === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48') {
    // USDC
    tokenInfo = {
      symbol: 'USDC',
      name: 'USD Coin',
      address: tokenAddress,
      chainId,
      decimals: 6,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
      currentPrice: 0.999 + (Math.random() * 0.002 - 0.001), // Around $1
      priceChange24h: Math.random() * 0.2 - 0.1, // -0.1% to +0.1%
      volume24h: 5000000000 + (Math.random() * 1000000000), // ~$5B
      marketCap: 30000000000 + (Math.random() * 1000000000) // ~$30B
    };
  } else if (tokenAddress.toLowerCase() === '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599') {
    // WBTC
    tokenInfo = {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      address: tokenAddress,
      chainId,
      decimals: 8,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3717.png',
      currentPrice: 63000 + (Math.random() * 2000 - 1000), // Random around $63,000
      priceChange24h: Math.random() * 8 - 4, // -4% to +4%
      volume24h: 500000000 + (Math.random() * 100000000), // ~$500M
      marketCap: 18000000000 + (Math.random() * 1000000000) // ~$18B
    };
  } else if (tokenAddress.toLowerCase() === '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984') {
    // UNI
    tokenInfo = {
      symbol: 'UNI',
      name: 'Uniswap',
      address: tokenAddress,
      chainId,
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7083.png',
      currentPrice: 10 + (Math.random() * 2 - 1), // Random around $10
      priceChange24h: Math.random() * 15 - 7.5, // -7.5% to +7.5%
      volume24h: 300000000 + (Math.random() * 50000000), // ~$300M
      marketCap: 7000000000 + (Math.random() * 500000000) // ~$7B
    };
  } else {
    // Generate random token info for unknown tokens
    const symbols = ['TOKEN', 'COIN', 'DEX', 'FIN', 'DEFI'];
    const names = ['TokenSwap', 'CoinProtocol', 'DexFinance', 'FinNetwork', 'DefiToken'];

    const randomIndex = Math.floor(Math.random() * symbols.length);

    tokenInfo = {
      symbol: symbols[randomIndex],
      name: names[randomIndex],
      address: tokenAddress,
      chainId,
      decimals: 18,
      logoUrl: 'https://placehold.co/64x64/gray/white?text=' + symbols[randomIndex],
      currentPrice: 1 + (Math.random() * 100),
      priceChange24h: Math.random() * 20 - 10, // -10% to +10%
      volume24h: Math.random() * 10000000,
      marketCap: Math.random() * 100000000
    };
  }

  // Cache the result
  if (tokenInfo) {
    tokenPriceCache.set(cacheKey, tokenInfo);
  }

  return tokenInfo;
}

/**
 * Check if a price alert condition has triggered
 */
export function checkPriceAlertCondition(
  alert: PriceAlert,
  currentPrice: number,
  previousPrice: number
): boolean {
  switch(alert.condition) {
    case PriceAlertCondition.Above:
      return alert.targetPrice !== undefined && currentPrice > alert.targetPrice;

    case PriceAlertCondition.Below:
      return alert.targetPrice !== undefined && currentPrice < alert.targetPrice;

    case PriceAlertCondition.PercentageIncrease:
      if (alert.percentage === undefined || previousPrice === 0) return false;
      const increasePercentage = ((currentPrice - previousPrice) / previousPrice) * 100;
      return increasePercentage >= alert.percentage;

    case PriceAlertCondition.PercentageDecrease:
      if (alert.percentage === undefined || previousPrice === 0) return false;
      const decreasePercentage = ((previousPrice - currentPrice) / previousPrice) * 100;
      return decreasePercentage >= alert.percentage;

    case PriceAlertCondition.PriceTarget:
      return alert.targetPrice !== undefined &&
             Math.abs(currentPrice - alert.targetPrice) / alert.targetPrice < 0.005; // Within 0.5%

    case PriceAlertCondition.PriceRange:
      return alert.minPrice !== undefined &&
             alert.maxPrice !== undefined &&
             currentPrice >= alert.minPrice &&
             currentPrice <= alert.maxPrice;

    case PriceAlertCondition.VolatilitySpike:
      if (alert.volatilityThreshold === undefined || previousPrice === 0) return false;
      const priceChange = Math.abs(currentPrice - previousPrice) / previousPrice * 100;
      return priceChange >= alert.volatilityThreshold;

    default:
      return false;
  }
}

/**
 * Format price alert message
 */
export function formatPriceAlertMessage(
  alert: PriceAlert,
  currentPrice: number
): string {
  const symbol = alert.tokenSymbol;

  switch(alert.condition) {
    case PriceAlertCondition.Above:
      return `${symbol} price is now above ${formatCurrency(alert.targetPrice || 0)} at ${formatCurrency(currentPrice)}`;

    case PriceAlertCondition.Below:
      return `${symbol} price is now below ${formatCurrency(alert.targetPrice || 0)} at ${formatCurrency(currentPrice)}`;

    case PriceAlertCondition.PercentageIncrease:
      return `${symbol} price increased by ${alert.percentage?.toFixed(1)}% to ${formatCurrency(currentPrice)}`;

    case PriceAlertCondition.PercentageDecrease:
      return `${symbol} price decreased by ${alert.percentage?.toFixed(1)}% to ${formatCurrency(currentPrice)}`;

    case PriceAlertCondition.PriceTarget:
      return `${symbol} has reached target price of ${formatCurrency(alert.targetPrice || 0)}`;

    case PriceAlertCondition.PriceRange:
      return `${symbol} price (${formatCurrency(currentPrice)}) is now within target range`;

    case PriceAlertCondition.VolatilitySpike:
      return `${symbol} experienced high volatility, now at ${formatCurrency(currentPrice)}`;

    default:
      return `${symbol} price alert triggered at ${formatCurrency(currentPrice)}`;
  }
}

/**
 * Format a price as USD
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(value);
}

/**
 * Process price alerts for a token
 */
export function processPriceAlerts(
  tokenAddress: string,
  chainId: number,
  currentPrice: number,
  previousPrice: number
): PriceAlertHistory[] {
  const tokenInfo = getTokenInfo(tokenAddress, chainId);
  if (!tokenInfo) return [];

  const alerts = getPriceAlertsForToken(tokenAddress, chainId);
  const triggeredAlerts: PriceAlertHistory[] = [];

  for (const alert of alerts) {
    if (!alert.enabled) continue;

    // Skip if this is a non-repeatable alert that has already triggered
    if (!alert.repeatable && alert.lastTriggeredAt !== undefined) continue;

    // Check if alert condition is met
    if (checkPriceAlertCondition(alert, currentPrice, previousPrice)) {
      // Alert has triggered
      const now = Date.now();
      const message = formatPriceAlertMessage(alert, currentPrice);

      // Create history entry
      const historyEntry: PriceAlertHistory = {
        alertId: alert.id,
        tokenSymbol: tokenInfo.symbol,
        tokenName: tokenInfo.name,
        chainId,
        condition: alert.condition,
        triggerPrice: currentPrice,
        targetPrice: alert.targetPrice,
        percentage: alert.percentage,
        triggeredAt: now,
        message
      };

      // Add to history
      alertHistory.push(historyEntry);

      // Update last triggered time
      alert.lastTriggeredAt = now;

      // Add to result
      triggeredAlerts.push(historyEntry);
    }
  }

  return triggeredAlerts;
}

/**
 * Get the severity level for a price alert
 */
export function getPriceAlertSeverity(alert: PriceAlert): AlertSeverity {
  // Determine severity based on the condition type and parameters
  switch(alert.condition) {
    case PriceAlertCondition.VolatilitySpike:
      // High volatility is more severe
      if (alert.volatilityThreshold && alert.volatilityThreshold >= 10) {
        return AlertSeverity.Critical;
      }
      return AlertSeverity.High;

    case PriceAlertCondition.PriceTarget:
      // Price targets are usually important
      return AlertSeverity.High;

    case PriceAlertCondition.PercentageIncrease:
    case PriceAlertCondition.PercentageDecrease:
      // Larger percentage changes are more severe
      if (alert.percentage && alert.percentage >= 15) {
        return AlertSeverity.High;
      } else if (alert.percentage && alert.percentage >= 5) {
        return AlertSeverity.Medium;
      }
      return AlertSeverity.Low;

    case PriceAlertCondition.Above:
    case PriceAlertCondition.Below:
      // Simple thresholds are medium severity
      return AlertSeverity.Medium;

    case PriceAlertCondition.PriceRange:
      // Price range alerts are typically lower priority
      return AlertSeverity.Low;

    default:
      return AlertSeverity.Medium;
  }
}

/**
 * Create a new price alert
 */
export function createPriceAlert(
  tokenAddress: string,
  chainId: number,
  condition: PriceAlertCondition,
  options: {
    targetPrice?: number;
    percentage?: number;
    minPrice?: number;
    maxPrice?: number;
    volatilityThreshold?: number;
    timeframe?: '1h' | '24h' | '7d';
    repeatable?: boolean;
    notificationChannels?: {
      inApp?: boolean;
      sound?: boolean;
      mobile?: boolean;
      discord?: boolean;
      telegram?: boolean;
    }
  } = {}
): PriceAlert | null {
  // Get token info
  const token = getTokenInfo(tokenAddress, chainId);
  if (!token) return null;

  // Create alert object
  const alert: PriceAlert = {
    id: `price-alert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    tokenAddress,
    tokenSymbol: token.symbol,
    tokenName: token.name,
    chainId,
    condition,
    targetPrice: options.targetPrice,
    percentage: options.percentage,
    minPrice: options.minPrice,
    maxPrice: options.maxPrice,
    volatilityThreshold: options.volatilityThreshold,
    timeframe: options.timeframe || '24h',
    repeatable: options.repeatable !== undefined ? options.repeatable : false,
    enabled: true,
    createdAt: Date.now(),
    notificationChannels: {
      inApp: options.notificationChannels?.inApp !== undefined ? options.notificationChannels.inApp : true,
      sound: options.notificationChannels?.sound !== undefined ? options.notificationChannels.sound : true,
      mobile: options.notificationChannels?.mobile !== undefined ? options.notificationChannels.mobile : true,
      discord: options.notificationChannels?.discord !== undefined ? options.notificationChannels.discord : false,
      telegram: options.notificationChannels?.telegram !== undefined ? options.notificationChannels.telegram : false,
    }
  };

  // Save and return the alert
  return savePriceAlert(alert);
}

// Add some sample alerts for testing
// In a real application, these would be loaded from a database or user settings
export function initializeSamplePriceAlerts() {
  // ETH price above $3700
  createPriceAlert(
    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // ETH
    1, // Ethereum mainnet
    PriceAlertCondition.Above,
    {
      targetPrice: 3700,
      timeframe: '1h',
      repeatable: false
    }
  );

  // BTC 5% price decrease
  createPriceAlert(
    '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
    1, // Ethereum mainnet
    PriceAlertCondition.PercentageDecrease,
    {
      percentage: 5,
      timeframe: '24h',
      repeatable: true
    }
  );

  // UNI volatility spike
  createPriceAlert(
    '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // UNI
    1, // Ethereum mainnet
    PriceAlertCondition.VolatilitySpike,
    {
      volatilityThreshold: 8,
      timeframe: '1h',
      repeatable: true
    }
  );
}
