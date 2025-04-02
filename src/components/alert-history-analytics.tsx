"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertAnalyticsTimeFrame,
  AlertAnalyticsMetric,
  AlertFrequencyData,
  AlertTrendData,
  ChainAlertDistribution,
  ANALYTICS_TIMEFRAMES,
  calculateAlertMetrics,
  calculateAlertFrequency,
  generateAlertTrendData,
  calculateChainDistribution,
  detectAlertAnomalies
} from '@/lib/alert-analytics';
import { AlertCategory } from '@/lib/real-time-data';
import { PriceAlertHistory, getPriceAlertHistory } from '@/lib/token-price-alert';

export default function AlertHistoryAnalytics() {
  const [activeTimeFrame, setActiveTimeFrame] = useState<AlertAnalyticsTimeFrame>(ANALYTICS_TIMEFRAMES[0]);
  const [metrics, setMetrics] = useState<AlertAnalyticsMetric[]>([]);
  const [frequencyData, setFrequencyData] = useState<AlertFrequencyData | null>(null);
  const [trendData, setTrendData] = useState<AlertTrendData[]>([]);
  const [chainDistribution, setChainDistribution] = useState<ChainAlertDistribution[]>([]);
  const [anomalies, setAnomalies] = useState<{
    anomalies: {
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      details: string;
    }[];
    hasAnomalies: boolean;
  }>({ anomalies: [], hasAnomalies: false });

  // This would come from a real API in a production app
  const mockVolumeAlerts = [
    {
      id: '1',
      chainId: 1,
      chainName: 'Ethereum',
      timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
      category: AlertCategory.VolumeChange,
      changePercent: 5.2,
      volume: 1200000000,
      formattedVolume: '$1.2B',
      timeframe: '1h',
      isPositive: true,
      isSignificant: true,
      message: 'Ethereum 1h volume up 5.2%',
      read: true,
      severity: 'medium',
      playSoundNotification: true,
      sendPushNotification: false,
    },
    {
      id: '2',
      chainId: 42161,
      chainName: 'Arbitrum',
      timestamp: Date.now() - 1000 * 60 * 30, // 30 min ago
      category: AlertCategory.VolumeChange,
      changePercent: -3.8,
      volume: 450000000,
      formattedVolume: '$450M',
      timeframe: '1h',
      isPositive: false,
      isSignificant: true,
      message: 'Arbitrum 1h volume down 3.8%',
      read: false,
      severity: 'medium',
      playSoundNotification: true,
      sendPushNotification: false,
    },
    {
      id: '3',
      chainId: 137,
      chainName: 'Polygon',
      timestamp: Date.now() - 1000 * 60 * 120, // 2 hours ago
      category: AlertCategory.SlippageWarning,
      changePercent: 0,
      volume: 0,
      formattedVolume: 'N/A',
      timeframe: '24h',
      isPositive: false,
      isSignificant: true,
      message: 'Increased slippage detected on Polygon',
      read: true,
      severity: 'high',
      playSoundNotification: true,
      sendPushNotification: true,
    },
    {
      id: '4',
      chainId: 10,
      chainName: 'Optimism',
      timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
      category: AlertCategory.NetworkCongestion,
      changePercent: 0,
      volume: 0,
      formattedVolume: 'N/A',
      timeframe: '1h',
      isPositive: false,
      isSignificant: true,
      message: 'Network congestion on Optimism',
      read: true,
      severity: 'high',
      playSoundNotification: true,
      sendPushNotification: true,
    },
    {
      id: '5',
      chainId: 1,
      chainName: 'Ethereum',
      timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
      category: AlertCategory.VolumeChange,
      changePercent: 12.5,
      volume: 1500000000,
      formattedVolume: '$1.5B',
      timeframe: '24h',
      isPositive: true,
      isSignificant: true,
      message: 'Ethereum 24h volume up 12.5%',
      read: true,
      severity: 'high',
      playSoundNotification: true,
      sendPushNotification: true,
    },
    {
      id: '6',
      chainId: 56,
      chainName: 'BNB Chain',
      timestamp: Date.now() - 1000 * 60 * 60 * 12, // 12 hours ago
      category: AlertCategory.LiquidityChange,
      changePercent: -8.3,
      volume: 250000000,
      formattedVolume: '$250M',
      timeframe: '24h',
      isPositive: false,
      isSignificant: true,
      message: 'BNB Chain liquidity down 8.3%',
      read: true,
      severity: 'medium',
      playSoundNotification: true,
      sendPushNotification: false,
    }
  ];

  // Get price alert history
  const priceAlertHistory = getPriceAlertHistory() || [];

  // Update analytics data when timeframe changes
  useEffect(() => {
    // Calculate metrics
    const newMetrics = calculateAlertMetrics(mockVolumeAlerts, priceAlertHistory, activeTimeFrame);
    setMetrics(newMetrics);

    // Calculate frequency
    const newFrequencyData = calculateAlertFrequency(mockVolumeAlerts, priceAlertHistory, activeTimeFrame);
    setFrequencyData(newFrequencyData);

    // Generate trend data
    const newTrendData = generateAlertTrendData(mockVolumeAlerts, priceAlertHistory, activeTimeFrame);
    setTrendData(newTrendData);

    // Calculate chain distribution
    const newChainDistribution = calculateChainDistribution(mockVolumeAlerts, priceAlertHistory);
    setChainDistribution(newChainDistribution);

    // Detect anomalies
    const newAnomalies = detectAlertAnomalies(mockVolumeAlerts, priceAlertHistory, activeTimeFrame);
    setAnomalies(newAnomalies);
  }, [activeTimeFrame]);

  // Handle timeframe change
  const handleTimeFrameChange = (timeframeId: string) => {
    const timeframe = ANALYTICS_TIMEFRAMES.find(tf => tf.id === timeframeId);
    if (timeframe) {
      setActiveTimeFrame(timeframe);
    }
  };

  // Render trend chart
  const renderTrendChart = () => {
    const maxCount = Math.max(...trendData.map(d => d.count), 1);

    return (
      <div className="p-4 border border-white/10 mb-6">
        <h3 className="text-sm uppercase font-mono mb-4">Alert Trend</h3>
        <div className="h-48 flex items-end space-x-1">
          {trendData.map((data, index) => (
            <div
              key={index}
              className="flex-1 flex flex-col items-center justify-end"
            >
              <div className="relative w-full">
                <div
                  className="w-full bg-white/20 hover:bg-white/30 transition-colors"
                  style={{ height: `${(data.count / maxCount) * 100}%`, minHeight: '1px' }}
                  title={`${data.count} alerts on ${data.label}`}
                >
                  {/* Create colored sections for different alert categories */}
                  {Object.entries(data.categories).map(([category, count], catIndex) => {
                    const categoryPercentage = count / data.count;
                    const categoryHeight = `${categoryPercentage * 100}%`;

                    let bgColor = 'bg-white/30';
                    switch(category) {
                      case 'volume_change':
                        bgColor = 'bg-blue-500/50';
                        break;
                      case 'price_movement':
                      case 'price':
                        bgColor = 'bg-green-500/50';
                        break;
                      case 'liquidity_change':
                        bgColor = 'bg-purple-500/50';
                        break;
                      case 'network_congestion':
                        bgColor = 'bg-red-500/50';
                        break;
                      case 'slippage_warning':
                        bgColor = 'bg-orange-500/50';
                        break;
                      case 'gas_price':
                        bgColor = 'bg-yellow-500/50';
                        break;
                      case 'trading_opportunity':
                        bgColor = 'bg-teal-500/50';
                        break;
                    }

                    return (
                      <div
                        key={`${index}-${catIndex}`}
                        className={`absolute bottom-0 w-full ${bgColor}`}
                        style={{
                          height: categoryHeight,
                          bottom: `${categoryPercentage * 100 * catIndex}%`
                        }}
                        title={`${count} ${category} alerts`}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="text-[9px] mt-1 opacity-70">{data.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500/50 mr-1"></div>
              <span>Volume</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500/50 mr-1"></div>
              <span>Price</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500/50 mr-1"></div>
              <span>Liquidity</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500/50 mr-1"></div>
              <span>Network</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500/50 mr-1"></div>
              <span>Slippage</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500/50 mr-1"></div>
              <span>Gas</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render metrics cards
  const renderMetricsCards = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map(metric => (
          <div key={metric.id} className="border border-white/10 p-3 bg-black/30">
            <div className="text-xs uppercase opacity-70">{metric.label}</div>
            <div className="flex items-baseline mt-1">
              <div className="text-2xl font-mono">{metric.value}</div>
              <div
                className={`ml-2 text-xs ${metric.isPositive ? 'text-[#4caf50]' : 'text-[#f44336]'}`}
                title={metric.description}
              >
                {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
              </div>
            </div>
            <div className="text-xs mt-1 opacity-50">{metric.description}</div>
          </div>
        ))}
      </div>
    );
  };

  // Render frequency distribution
  const renderFrequencyDistribution = () => {
    if (!frequencyData) return null;

    return (
      <div className="border border-white/10 p-4 mb-6">
        <h3 className="text-sm uppercase font-mono mb-4">Alert Distribution by Category</h3>
        <div className="space-y-2">
          {frequencyData.categories.map(category => (
            <div key={category.category} className="flex items-center">
              <div className="w-24 text-xs">{formatCategory(category.category)}</div>
              <div className="flex-1 mx-2">
                <div className="h-5 w-full bg-white/5 rounded-sm overflow-hidden">
                  <div
                    className={`h-full ${getCategoryColor(category.category)}`}
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="w-20 text-right text-xs">
                {category.count} ({category.percentage.toFixed(1)}%)
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs opacity-70 text-center">
          Total: {frequencyData.total} alerts in the last {frequencyData.timeframe.label.toLowerCase()}
        </div>
      </div>
    );
  };

  // Render chain distribution
  const renderChainDistribution = () => {
    return (
      <div className="border border-white/10 p-4 mb-6">
        <h3 className="text-sm uppercase font-mono mb-4">Alert Distribution by Chain</h3>
        <div className="space-y-2">
          {chainDistribution.map(chain => (
            <div key={chain.chainId} className="flex items-center">
              <div className="w-24 text-xs truncate">{chain.chainName}</div>
              <div className="flex-1 mx-2">
                <div className="h-5 w-full bg-white/5 rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-white/20"
                    style={{ width: `${chain.percentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="w-20 text-right text-xs">
                {chain.count} ({chain.percentage.toFixed(1)}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render anomalies section
  const renderAnomalies = () => {
    if (!anomalies.hasAnomalies) return null;

    return (
      <div className="border border-white/10 border-l-4 border-l-[#f44336] p-4 mb-6">
        <h3 className="text-sm uppercase font-mono mb-2 flex items-center">
          <span className="w-2 h-2 bg-[#f44336] rounded-full mr-2 animate-pulse"></span>
          Detected Anomalies
        </h3>
        <div className="space-y-3 mt-3">
          {anomalies.anomalies.map((anomaly, index) => (
            <div key={index} className="p-2 bg-white/5">
              <div className="flex items-center">
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    anomaly.severity === 'high'
                      ? 'bg-[#f44336]'
                      : anomaly.severity === 'medium'
                        ? 'bg-[#ff9800]'
                        : 'bg-[#4caf50]'
                  }`}
                ></div>
                <div className="font-medium">{anomaly.description}</div>
              </div>
              <div className="mt-1 text-xs opacity-70 pl-4">{anomaly.details}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Format category name for display
  const formatCategory = (category: string): string => {
    switch(category) {
      case 'volume_change': return 'Volume';
      case 'price_movement': return 'Price Move';
      case 'price': return 'Price';
      case 'liquidity_change': return 'Liquidity';
      case 'gas_price': return 'Gas';
      case 'slippage_warning': return 'Slippage';
      case 'network_congestion': return 'Network';
      case 'trading_opportunity': return 'Trading';
      default: return category;
    }
  };

  // Get color for category
  const getCategoryColor = (category: string): string => {
    switch(category) {
      case 'volume_change': return 'bg-blue-500/50';
      case 'price_movement':
      case 'price': return 'bg-green-500/50';
      case 'liquidity_change': return 'bg-purple-500/50';
      case 'gas_price': return 'bg-yellow-500/50';
      case 'slippage_warning': return 'bg-orange-500/50';
      case 'network_congestion': return 'bg-red-500/50';
      case 'trading_opportunity': return 'bg-teal-500/50';
      default: return 'bg-white/20';
    }
  };

  return (
    <div className="dunix-card border border-white/10 p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-lg uppercase font-mono">ALERT ANALYTICS</h2>
        </div>
        <div>
          <Select
            value={activeTimeFrame.id}
            onValueChange={handleTimeFrameChange}
          >
            <SelectTrigger className="bg-black border-white/20 w-32">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent className="bg-black border-white/20">
              {ANALYTICS_TIMEFRAMES.map(tf => (
                <SelectItem key={tf.id} value={tf.id}>
                  {tf.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Anomalies Section */}
      {renderAnomalies()}

      {/* Metrics Cards */}
      {renderMetricsCards()}

      {/* Trend Chart */}
      {renderTrendChart()}

      {/* Two columns for distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div>
          {renderFrequencyDistribution()}
        </div>

        {/* Chain Distribution */}
        <div>
          {renderChainDistribution()}
        </div>
      </div>

      <div className="mt-6 text-center text-xs opacity-60">
        Data based on alerts from the last {activeTimeFrame.label.toLowerCase()}
      </div>
    </div>
  );
}
