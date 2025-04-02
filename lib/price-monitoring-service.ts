"use client";

import {
  getPriceAlerts,
  createPriceAlertNotification,
  PriceAlertCondition
} from './notification-manager';

// Token price cache
interface TokenPrice {
  current: number;
  previous: number;
  timestamp: number;
  percentChange24h: number;
  percentChange1h: number;
}

const tokenPriceCache: Record<string, TokenPrice> = {
  'ETH': {
    current: 3000,
    previous: 2950,
    timestamp: Date.now(),
    percentChange24h: 1.5,
    percentChange1h: 0.3
  },
  'WETH': {
    current: 3000,
    previous: 2950,
    timestamp: Date.now(),
    percentChange24h: 1.5,
    percentChange1h: 0.3
  },
  'USDC': {
    current: 1,
    previous: 1,
    timestamp: Date.now(),
    percentChange24h: 0,
    percentChange1h: 0
  },
  'USDT': {
    current: 1,
    previous: 1,
    timestamp: Date.now(),
    percentChange24h: 0,
    percentChange1h: 0
  },
  'DAI': {
    current: 1,
    previous: 1,
    timestamp: Date.now(),
    percentChange24h: 0.05,
    percentChange1h: 0.01
  },
  'WBTC': {
    current: 60000,
    previous: 59500,
    timestamp: Date.now(),
    percentChange24h: 0.8,
    percentChange1h: 0.2
  },
  'MATIC': {
    current: 0.8,
    previous: 0.78,
    timestamp: Date.now(),
    percentChange24h: 2.5,
    percentChange1h: 0.5
  },
  'UNI': {
    current: 7.2,
    previous: 7.1,
    timestamp: Date.now(),
    percentChange24h: 1.4,
    percentChange1h: 0.3
  },
  'LINK': {
    current: 17.5,
    previous: 17.2,
    timestamp: Date.now(),
    percentChange24h: 1.7,
    percentChange1h: 0.4
  },
  'AAVE': {
    current: 95,
    previous: 93,
    timestamp: Date.now(),
    percentChange24h: 2.1,
    percentChange1h: 0.6
  },
  'SNX': {
    current: 3.2,
    previous: 3.15,
    timestamp: Date.now(),
    percentChange24h: 1.6,
    percentChange1h: 0.3
  },
  'CRV': {
    current: 0.65,
    previous: 0.64,
    timestamp: Date.now(),
    percentChange24h: 1.5,
    percentChange1h: 0.3
  }
};

// Function to simulate real-time price updates for demo purposes
export const simulatePriceUpdates = (intervalMs = 15000): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  // Simulate price volatility at random intervals
  const interval = setInterval(() => {
    // Pick a random token to update
    const tokens = Object.keys(tokenPriceCache);
    const randomToken = tokens[Math.floor(Math.random() * tokens.length)];

    // Generate random price movements (more volatile for demo purposes)
    const volatility = Math.random() * 0.05; // 0-5% movement
    const direction = Math.random() > 0.5 ? 1 : -1; // 50% chance up or down

    const priceInfo = tokenPriceCache[randomToken];

    // Update the cached price
    tokenPriceCache[randomToken] = {
      previous: priceInfo.current,
      current: priceInfo.current * (1 + (volatility * direction)),
      timestamp: Date.now(),
      percentChange1h: priceInfo.percentChange1h + (volatility * direction * 2),
      percentChange24h: priceInfo.percentChange24h + (volatility * direction)
    };

    // Check if this price update triggers any alerts
    checkPriceAlerts();
  }, intervalMs);

  return () => clearInterval(interval);
};

// Function to check for price alert conditions
export const checkPriceAlerts = (): void => {
  if (typeof window === 'undefined') return;

  const alerts = getPriceAlerts();

  // Iterate through each alert to check if conditions are met
  alerts.forEach((alert, index) => {
    const { token, type, value, timeframe, percentChange } = alert;

    // Skip if we don't have price data for this token
    if (!tokenPriceCache[token]) return;

    const { current: currentPrice, previous: previousPrice } = tokenPriceCache[token];

    let isTriggered = false;

    switch (type) {
      case 'above':
        // Check if price went from below to above the threshold
        isTriggered = previousPrice < value && currentPrice >= value;
        break;

      case 'below':
        // Check if price went from above to below the threshold
        isTriggered = previousPrice > value && currentPrice <= value;
        break;

      case 'percent-change':
        if (!percentChange || !timeframe) return;

        // Check based on timeframe
        let relevantChange = 0;

        if (timeframe === '1h') {
          relevantChange = tokenPriceCache[token].percentChange1h;
        } else if (timeframe === '24h') {
          relevantChange = tokenPriceCache[token].percentChange24h;
        }

        // Check if percent change has crossed the threshold (in either direction)
        if (percentChange > 0) {
          isTriggered = relevantChange >= percentChange;
        } else {
          isTriggered = relevantChange <= percentChange;
        }
        break;
    }

    // If alert is triggered, create a notification
    if (isTriggered) {
      createPriceAlertNotification(
        token,
        alert,
        currentPrice,
        previousPrice
      );
    }
  });
};

// Function to get the current price of a token
export const getTokenPrice = (token: string): number | null => {
  if (!tokenPriceCache[token]) return null;
  return tokenPriceCache[token].current;
};

// Function to update a specific token price (for testing or manual updates)
export const updateTokenPrice = (token: string, price: number): void => {
  if (!tokenPriceCache[token]) {
    tokenPriceCache[token] = {
      current: price,
      previous: price,
      timestamp: Date.now(),
      percentChange24h: 0,
      percentChange1h: 0
    };
    return;
  }

  // Update the cache
  tokenPriceCache[token] = {
    ...tokenPriceCache[token],
    previous: tokenPriceCache[token].current,
    current: price,
    timestamp: Date.now()
  };

  // Check alerts after a manual price update
  checkPriceAlerts();
};

// Function to get all token prices
export const getAllTokenPrices = (): Record<string, TokenPrice> => {
  return { ...tokenPriceCache };
};

// Function to create a price alert and start monitoring
export const createAndMonitorPriceAlert = (alert: PriceAlertCondition): void => {
  // Start the price monitoring service if it's not already running
  startMonitoring();

  // Create the price alert
  import('./notification-manager').then(({ addPriceAlert }) => {
    addPriceAlert(alert);
  });
};

let monitoringInterval: ReturnType<typeof setInterval> | null = null;

// Function to start the price monitoring service
export const startMonitoring = (): void => {
  if (typeof window === 'undefined' || monitoringInterval) return;

  // Start the price simulation/monitoring
  const cleanup = simulatePriceUpdates();

  // Store the cleanup function for later
  monitoringInterval = setInterval(() => {}, 1000); // Dummy interval to flag that monitoring is active

  // Attach cleanup to window unload
  window.addEventListener('beforeunload', cleanup);
};

// Function to stop the price monitoring service
export const stopMonitoring = (): void => {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
};
