/**
 * Alert Analytics System
 *
 * This module provides functionality for analyzing historical alert data,
 * identifying patterns, and visualizing alert trends.
 */

import { AlertCategory } from './real-time-data';
import { PriceAlertCondition, PriceAlertHistory } from './token-price-alert';

export interface AlertAnalyticsTimeFrame {
  id: string;
  label: string;
  days: number;
}

export interface AlertAnalyticsMetric {
  id: string;
  label: string;
  description: string;
  value: number;
  change: number; // Percentage change from previous period
  isPositive: boolean;
}

export interface AlertFrequencyData {
  timeframe: AlertAnalyticsTimeFrame;
  categories: {
    category: AlertCategory | 'price';
    count: number;
    percentage: number;
  }[];
  total: number;
}

export interface AlertTrendData {
  label: string;
  date: string;
  count: number;
  categories: Record<string, number>;
}

export interface ChainAlertDistribution {
  chainId: number;
  chainName: string;
  count: number;
  percentage: number;
}

// Fixed time frames for analytics
export const ANALYTICS_TIMEFRAMES: AlertAnalyticsTimeFrame[] = [
  { id: '24h', label: '24 Hours', days: 1 },
  { id: '7d', label: '7 Days', days: 7 },
  { id: '30d', label: '30 Days', days: 30 },
  { id: '90d', label: '90 Days', days: 90 }
];

/**
 * Calculate alert analytics metrics
 */
export function calculateAlertMetrics(
  alerts: any[],
  priceAlerts: PriceAlertHistory[],
  timeframe: AlertAnalyticsTimeFrame
): AlertAnalyticsMetric[] {
  const now = Date.now();
  const timeframeCutoff = now - (timeframe.days * 24 * 60 * 60 * 1000);

  // Filter alerts for current timeframe
  const recentAlerts = alerts.filter(alert => alert.timestamp >= timeframeCutoff || alert.triggeredAt >= timeframeCutoff);
  const recentPriceAlerts = priceAlerts.filter(alert => alert.triggeredAt >= timeframeCutoff);

  // Calculate previous timeframe for comparison
  const previousTimeframeCutoff = timeframeCutoff - (timeframe.days * 24 * 60 * 60 * 1000);
  const previousAlerts = alerts.filter(alert =>
    (alert.timestamp >= previousTimeframeCutoff && alert.timestamp < timeframeCutoff) ||
    (alert.triggeredAt >= previousTimeframeCutoff && alert.triggeredAt < timeframeCutoff)
  );
  const previousPriceAlerts = priceAlerts.filter(alert =>
    alert.triggeredAt >= previousTimeframeCutoff && alert.triggeredAt < timeframeCutoff
  );

  // Calculate metrics
  const metrics: AlertAnalyticsMetric[] = [];

  // Total Alerts
  const totalAlerts = recentAlerts.length + recentPriceAlerts.length;
  const previousTotal = previousAlerts.length + previousPriceAlerts.length;
  const totalChange = previousTotal === 0 ? 100 : ((totalAlerts - previousTotal) / previousTotal) * 100;

  metrics.push({
    id: 'total-alerts',
    label: 'Total Alerts',
    description: `Total alerts triggered in the last ${timeframe.label.toLowerCase()}`,
    value: totalAlerts,
    change: totalChange,
    isPositive: totalChange >= 0
  });

  // Price Alerts
  const priceAlertsPercentage = previousPriceAlerts.length === 0 ? 100 :
    ((recentPriceAlerts.length - previousPriceAlerts.length) / previousPriceAlerts.length) * 100;

  metrics.push({
    id: 'price-alerts',
    label: 'Price Alerts',
    description: `Price-related alerts in the last ${timeframe.label.toLowerCase()}`,
    value: recentPriceAlerts.length,
    change: priceAlertsPercentage,
    isPositive: priceAlertsPercentage >= 0
  });

  // Volume Alerts
  const volumeAlerts = recentAlerts.filter(alert =>
    alert.category === AlertCategory.VolumeChange
  );
  const previousVolumeAlerts = previousAlerts.filter(alert =>
    alert.category === AlertCategory.VolumeChange
  );
  const volumeChange = previousVolumeAlerts.length === 0 ? 100 :
    ((volumeAlerts.length - previousVolumeAlerts.length) / previousVolumeAlerts.length) * 100;

  metrics.push({
    id: 'volume-alerts',
    label: 'Volume Alerts',
    description: `Volume change alerts in the last ${timeframe.label.toLowerCase()}`,
    value: volumeAlerts.length,
    change: volumeChange,
    isPositive: volumeChange >= 0
  });

  // Volatility Alerts (price spikes)
  const volatilityAlerts = recentPriceAlerts.filter(alert =>
    alert.condition === PriceAlertCondition.VolatilitySpike
  );
  const previousVolatilityAlerts = previousPriceAlerts.filter(alert =>
    alert.condition === PriceAlertCondition.VolatilitySpike
  );
  const volatilityChange = previousVolatilityAlerts.length === 0 ? 100 :
    ((volatilityAlerts.length - previousVolatilityAlerts.length) / previousVolatilityAlerts.length) * 100;

  metrics.push({
    id: 'volatility-alerts',
    label: 'Volatility Alerts',
    description: `Price volatility alerts in the last ${timeframe.label.toLowerCase()}`,
    value: volatilityAlerts.length,
    change: volatilityChange,
    isPositive: volatilityChange >= 0 // Note: More volatility is not necessarily positive
  });

  return metrics;
}

/**
 * Calculate alert frequency distribution by category
 */
export function calculateAlertFrequency(
  alerts: any[],
  priceAlerts: PriceAlertHistory[],
  timeframe: AlertAnalyticsTimeFrame
): AlertFrequencyData {
  const now = Date.now();
  const timeframeCutoff = now - (timeframe.days * 24 * 60 * 60 * 1000);

  // Filter alerts for current timeframe
  const recentAlerts = alerts.filter(alert => alert.timestamp >= timeframeCutoff || alert.triggeredAt >= timeframeCutoff);
  const recentPriceAlerts = priceAlerts.filter(alert => alert.triggeredAt >= timeframeCutoff);

  // Count alerts by category
  const categoryCounts: Record<string, number> = {};

  // Process regular alerts
  recentAlerts.forEach(alert => {
    const category = alert.category || 'unknown';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  // Add price alerts as a separate category
  categoryCounts['price'] = recentPriceAlerts.length;

  // Calculate totals
  const total = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);

  // Format results
  const categories = Object.entries(categoryCounts).map(([category, count]) => ({
    category: category as (AlertCategory | 'price'),
    count,
    percentage: total === 0 ? 0 : (count / total) * 100
  }));

  // Sort by count (descending)
  categories.sort((a, b) => b.count - a.count);

  return {
    timeframe,
    categories,
    total
  };
}

/**
 * Generate alert trend data for charting
 */
export function generateAlertTrendData(
  alerts: any[],
  priceAlerts: PriceAlertHistory[],
  timeframe: AlertAnalyticsTimeFrame
): AlertTrendData[] {
  const now = Date.now();
  const timeframeCutoff = now - (timeframe.days * 24 * 60 * 60 * 1000);

  // Determine the appropriate interval based on timeframe
  let interval = 24 * 60 * 60 * 1000; // Default to daily
  let format = 'MM/DD'; // Default date format

  if (timeframe.days <= 1) {
    interval = 60 * 60 * 1000; // Hourly for 24h
    format = 'HH:mm';
  } else if (timeframe.days > 30) {
    interval = 7 * 24 * 60 * 60 * 1000; // Weekly for > 30 days
    format = 'MM/DD';
  }

  // Generate time periods
  const periods: { start: number; end: number; label: string }[] = [];
  let periodStart = timeframeCutoff;

  while (periodStart < now) {
    const periodEnd = Math.min(periodStart + interval, now);
    const date = new Date(periodStart);

    let label = '';
    if (format === 'HH:mm') {
      label = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else {
      label = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    }

    periods.push({
      start: periodStart,
      end: periodEnd,
      label
    });

    periodStart = periodEnd;
  }

  // Count alerts for each period
  return periods.map(period => {
    // Filter alerts for this period
    const periodAlerts = alerts.filter(alert =>
      (alert.timestamp >= period.start && alert.timestamp < period.end) ||
      (alert.triggeredAt >= period.start && alert.triggeredAt < period.end)
    );
    const periodPriceAlerts = priceAlerts.filter(alert =>
      alert.triggeredAt >= period.start && alert.triggeredAt < period.end
    );

    // Count by category
    const categories: Record<string, number> = {};

    // Process regular alerts
    periodAlerts.forEach(alert => {
      const category = alert.category || 'unknown';
      categories[category] = (categories[category] || 0) + 1;
    });

    // Add price alerts as a separate category
    categories['price'] = periodPriceAlerts.length;

    return {
      label: period.label,
      date: new Date(period.start).toISOString(),
      count: periodAlerts.length + periodPriceAlerts.length,
      categories
    };
  });
}

/**
 * Calculate alert distribution by chain
 */
export function calculateChainDistribution(
  alerts: any[],
  priceAlerts: PriceAlertHistory[]
): ChainAlertDistribution[] {
  // Count alerts by chain
  const chainCounts: Record<number, { count: number; name: string }> = {};

  // Process regular alerts
  alerts.forEach(alert => {
    if (!alert.chainId) return;

    if (!chainCounts[alert.chainId]) {
      chainCounts[alert.chainId] = {
        count: 0,
        name: alert.chainName || `Chain ${alert.chainId}`
      };
    }

    chainCounts[alert.chainId].count++;
  });

  // Process price alerts
  priceAlerts.forEach(alert => {
    if (!chainCounts[alert.chainId]) {
      chainCounts[alert.chainId] = {
        count: 0,
        name: alert.tokenName ? `${alert.tokenSymbol} Chain` : `Chain ${alert.chainId}`
      };
    }

    chainCounts[alert.chainId].count++;
  });

  // Calculate total
  const total = Object.values(chainCounts).reduce((sum, data) => sum + data.count, 0);

  // Format results
  const distribution = Object.entries(chainCounts).map(([chainIdStr, data]) => ({
    chainId: parseInt(chainIdStr),
    chainName: data.name,
    count: data.count,
    percentage: total === 0 ? 0 : (data.count / total) * 100
  }));

  // Sort by count (descending)
  distribution.sort((a, b) => b.count - a.count);

  return distribution;
}

/**
 * Detect anomalies in alert patterns
 * This can be used to highlight unusual alert activity
 */
export function detectAlertAnomalies(
  alerts: any[],
  priceAlerts: PriceAlertHistory[],
  timeframe: AlertAnalyticsTimeFrame
): {
  anomalies: {
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    details: string;
  }[];
  hasAnomalies: boolean;
} {
  const now = Date.now();
  const timeframeCutoff = now - (timeframe.days * 24 * 60 * 60 * 1000);

  // Get trend data for analysis
  const trendData = generateAlertTrendData(alerts, priceAlerts, timeframe);

  const anomalies = [];

  // Check for significant spikes in alert frequency
  if (trendData.length > 2) {
    const counts = trendData.map(data => data.count);
    const average = counts.reduce((sum, count) => sum + count, 0) / counts.length;
    const stdDev = Math.sqrt(
      counts.reduce((sum, count) => sum + Math.pow(count - average, 2), 0) / counts.length
    );

    // Identify periods with unusually high alert counts (> 2 standard deviations)
    const spikePeriods = trendData.filter(data => data.count > average + 2 * stdDev);

    if (spikePeriods.length > 0) {
      anomalies.push({
        type: 'frequency_spike',
        description: `Unusual spike in alert frequency detected in ${spikePeriods.length} period(s)`,
        severity: spikePeriods.length > 2 ? 'high' : 'medium',
        details: `Highest count: ${Math.max(...spikePeriods.map(p => p.count))} alerts (avg: ${average.toFixed(1)})`
      });
    }
  }

  // Check for unusual distribution of alert categories
  const frequency = calculateAlertFrequency(alerts, priceAlerts, timeframe);
  const categories = frequency.categories;

  if (categories.length > 1) {
    // Check if one category is dominating unusually
    const topCategory = categories[0];
    if (topCategory.percentage > 75) {
      anomalies.push({
        type: 'category_imbalance',
        description: `Unusual dominance of "${topCategory.category}" alerts (${topCategory.percentage.toFixed(1)}%)`,
        severity: topCategory.percentage > 90 ? 'high' : 'medium',
        details: `${topCategory.count} out of ${frequency.total} alerts are in this category`
      });
    }
  }

  // Check for unusual chains with high alert counts
  const chainDistribution = calculateChainDistribution(alerts, priceAlerts);

  if (chainDistribution.length > 1) {
    // Check if one chain is dominating unusually
    const topChain = chainDistribution[0];
    if (topChain.percentage > 80) {
      anomalies.push({
        type: 'chain_concentration',
        description: `Unusual concentration of alerts on ${topChain.chainName} (${topChain.percentage.toFixed(1)}%)`,
        severity: topChain.percentage > 95 ? 'high' : 'medium',
        details: `${topChain.count} out of ${chainDistribution.reduce((sum, c) => sum + c.count, 0)} alerts are on this chain`
      });
    }
  }

  return {
    anomalies,
    hasAnomalies: anomalies.length > 0
  };
}
