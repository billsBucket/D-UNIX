"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  PriceAlert,
  PriceAlertCondition,
  TokenInfo,
  getPriceAlerts,
  deletePriceAlert,
  createPriceAlert,
  getTokenInfo,
  formatPriceAlertMessage
} from '@/lib/token-price-alert';
import { AlertSeverity } from '@/lib/real-time-data';

// Common token addresses
const POPULAR_TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', chainId: 1 },
  { symbol: 'USDC', name: 'USD Coin', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', chainId: 1 },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', chainId: 1 },
  { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', chainId: 1 },
];

export default function TokenPriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [tokenSearch, setTokenSearch] = useState('');
  const [searchResults, setSearchResults] = useState<TokenInfo[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  // Alert creation form state
  const [alertCondition, setAlertCondition] = useState<PriceAlertCondition>(PriceAlertCondition.Above);
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [percentage, setPercentage] = useState<string>('');
  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d'>('24h');
  const [repeatable, setRepeatable] = useState(false);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [volatilityThreshold, setVolatilityThreshold] = useState<string>('');
  const [notifyDiscord, setNotifyDiscord] = useState(false);
  const [notifyTelegram, setNotifyTelegram] = useState(false);

  // Get price alerts
  useEffect(() => {
    const updateAlerts = () => {
      const alerts = getPriceAlerts();
      setAlerts(alerts);
    };

    // Initial update
    updateAlerts();

    // Set up interval to update alerts
    const intervalId = setInterval(updateAlerts, 10000);

    return () => clearInterval(intervalId);
  }, []);

  // Handle token search
  const handleTokenSearch = (query: string) => {
    setTokenSearch(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Search for tokens
    const results: TokenInfo[] = [];

    // First check popular tokens
    POPULAR_TOKENS.forEach(token => {
      if (
        token.symbol.toLowerCase().includes(query.toLowerCase()) ||
        token.name.toLowerCase().includes(query.toLowerCase())
      ) {
        const tokenInfo = getTokenInfo(token.address, token.chainId);
        if (tokenInfo) {
          results.push(tokenInfo);
        }
      }
    });

    // Set search results
    setSearchResults(results);
    setSearchOpen(true);
  };

  // Handle selecting a token
  const handleSelectToken = (token: TokenInfo) => {
    setSelectedToken(token);
    setSearchOpen(false);
  };

  // Handle creating a new alert
  const handleCreateAlert = () => {
    if (!selectedToken) return;

    // Build options object based on condition
    const options: any = {
      timeframe,
      repeatable,
      notificationChannels: {
        discord: notifyDiscord,
        telegram: notifyTelegram
      }
    };

    // Add condition-specific parameters
    switch (alertCondition) {
      case PriceAlertCondition.Above:
      case PriceAlertCondition.Below:
      case PriceAlertCondition.PriceTarget:
        options.targetPrice = parseFloat(targetPrice);
        break;
      case PriceAlertCondition.PercentageIncrease:
      case PriceAlertCondition.PercentageDecrease:
        options.percentage = parseFloat(percentage);
        break;
      case PriceAlertCondition.PriceRange:
        options.minPrice = parseFloat(minPrice);
        options.maxPrice = parseFloat(maxPrice);
        break;
      case PriceAlertCondition.VolatilitySpike:
        options.volatilityThreshold = parseFloat(volatilityThreshold);
        break;
    }

    // Create alert
    const newAlert = createPriceAlert(
      selectedToken.address,
      selectedToken.chainId,
      alertCondition,
      options
    );

    if (newAlert) {
      // Update alerts list
      setAlerts([...alerts, newAlert]);

      // Reset form
      resetForm();
    }
  };

  // Reset creation form
  const resetForm = () => {
    setShowCreateForm(false);
    setTargetPrice('');
    setPercentage('');
    setTimeframe('24h');
    setRepeatable(false);
    setMinPrice('');
    setMaxPrice('');
    setVolatilityThreshold('');
    setNotifyDiscord(false);
    setNotifyTelegram(false);
  };

  // Handle deleting an alert
  const handleDeleteAlert = (alertId: string) => {
    if (deletePriceAlert(alertId)) {
      setAlerts(alerts.filter(alert => alert.id !== alertId));
    }
  };

  // Format time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Render condition-specific form inputs
  const renderConditionInputs = () => {
    switch (alertCondition) {
      case PriceAlertCondition.Above:
      case PriceAlertCondition.Below:
      case PriceAlertCondition.PriceTarget:
        return (
          <div className="mb-4">
            <label className="block text-xs mb-2">Target Price (USD)</label>
            <Input
              type="number"
              min="0"
              step="0.000001"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="bg-black border-white/20"
            />
          </div>
        );
      case PriceAlertCondition.PercentageIncrease:
      case PriceAlertCondition.PercentageDecrease:
        return (
          <div className="mb-4">
            <label className="block text-xs mb-2">Percentage Change (%)</label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              className="bg-black border-white/20"
            />
          </div>
        );
      case PriceAlertCondition.PriceRange:
        return (
          <>
            <div className="mb-4">
              <label className="block text-xs mb-2">Minimum Price (USD)</label>
              <Input
                type="number"
                min="0"
                step="0.000001"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="bg-black border-white/20"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs mb-2">Maximum Price (USD)</label>
              <Input
                type="number"
                min="0"
                step="0.000001"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="bg-black border-white/20"
              />
            </div>
          </>
        );
      case PriceAlertCondition.VolatilitySpike:
        return (
          <div className="mb-4">
            <label className="block text-xs mb-2">Volatility Threshold (%)</label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={volatilityThreshold}
              onChange={(e) => setVolatilityThreshold(e.target.value)}
              className="bg-black border-white/20"
            />
          </div>
        );
      default:
        return null;
    }
  };

  // Format price as currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(value);
  };

  // Get the severity level indicator based on the condition
  const getAlertSeverityIndicator = (alert: PriceAlert) => {
    let bgColor = 'bg-white/50';

    switch (alert.condition) {
      case PriceAlertCondition.VolatilitySpike:
        bgColor = 'bg-[#f44336]'; // Red
        break;
      case PriceAlertCondition.PriceTarget:
        bgColor = 'bg-[#ff9800]'; // Orange
        break;
      case PriceAlertCondition.PercentageIncrease:
      case PriceAlertCondition.PercentageDecrease:
        if (alert.percentage && alert.percentage >= 15) {
          bgColor = 'bg-[#f44336]'; // Red
        } else if (alert.percentage && alert.percentage >= 5) {
          bgColor = 'bg-[#ff9800]'; // Orange
        } else {
          bgColor = 'bg-[#4caf50]'; // Green
        }
        break;
      case PriceAlertCondition.Above:
      case PriceAlertCondition.Below:
        bgColor = 'bg-[#ff9800]'; // Orange
        break;
      case PriceAlertCondition.PriceRange:
        bgColor = 'bg-[#4caf50]'; // Green
        break;
    }

    return <div className={`w-2 h-2 rounded-full mr-2 ${bgColor}`}></div>;
  };

  return (
    <div className="dunix-card border border-white/10 p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-lg uppercase font-mono">TOKEN PRICE ALERTS</h2>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            className="px-2 py-1 text-xs font-mono"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'CANCEL' : 'NEW ALERT'}
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <div className="mb-6 p-4 border border-white/10 bg-black/30">
          <h3 className="text-sm uppercase font-mono mb-4">Create New Price Alert</h3>

          {/* Token Selection */}
          <div className="mb-4">
            <label className="block text-xs mb-2">Token</label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search for a token..."
                value={tokenSearch}
                onChange={(e) => handleTokenSearch(e.target.value)}
                className="bg-black border-white/20"
                onFocus={() => setSearchOpen(true)}
              />

              {searchOpen && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-black border border-white/20 shadow-lg max-h-64 overflow-y-auto">
                  {searchResults.map((token) => (
                    <div
                      key={`${token.chainId}-${token.address}`}
                      className="p-2 hover:bg-white/10 cursor-pointer flex items-center"
                      onClick={() => handleSelectToken(token)}
                    >
                      <div className="flex-1">
                        <div className="font-mono">{token.symbol}</div>
                        <div className="text-xs opacity-70">{token.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono">{formatCurrency(token.currentPrice)}</div>
                        <div className={`text-xs ${token.priceChange24h >= 0 ? 'text-[#4caf50]' : 'text-[#f44336]'}`}>
                          {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedToken && (
              <div className="mt-2 p-2 border border-white/20 flex items-center justify-between">
                <div>
                  <div className="font-mono">{selectedToken.symbol}</div>
                  <div className="text-xs opacity-70">{selectedToken.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono">{formatCurrency(selectedToken.currentPrice)}</div>
                  <div className={`text-xs ${selectedToken.priceChange24h >= 0 ? 'text-[#4caf50]' : 'text-[#f44336]'}`}>
                    {selectedToken.priceChange24h >= 0 ? '+' : ''}{selectedToken.priceChange24h.toFixed(2)}%
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Condition Selection */}
          <div className="mb-4">
            <label className="block text-xs mb-2">Alert Condition</label>
            <Select
              value={alertCondition}
              onValueChange={(value) => setAlertCondition(value as PriceAlertCondition)}
            >
              <SelectTrigger className="bg-black border-white/20">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent className="bg-black border-white/20">
                <SelectItem value={PriceAlertCondition.Above}>Price Above</SelectItem>
                <SelectItem value={PriceAlertCondition.Below}>Price Below</SelectItem>
                <SelectItem value={PriceAlertCondition.PercentageIncrease}>Price Increase (%)</SelectItem>
                <SelectItem value={PriceAlertCondition.PercentageDecrease}>Price Decrease (%)</SelectItem>
                <SelectItem value={PriceAlertCondition.PriceTarget}>Specific Price Target</SelectItem>
                <SelectItem value={PriceAlertCondition.PriceRange}>Price Range</SelectItem>
                <SelectItem value={PriceAlertCondition.VolatilitySpike}>Volatility Spike</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Condition-specific inputs */}
          {renderConditionInputs()}

          {/* Timeframe Selection */}
          <div className="mb-4">
            <label className="block text-xs mb-2">Timeframe</label>
            <Select
              value={timeframe}
              onValueChange={(value) => setTimeframe(value as '1h' | '24h' | '7d')}
            >
              <SelectTrigger className="bg-black border-white/20">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent className="bg-black border-white/20">
                <SelectItem value="1h">1 Hour</SelectItem>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Repeatable Toggle */}
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="repeatable"
              checked={repeatable}
              onChange={(e) => setRepeatable(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="repeatable" className="text-xs cursor-pointer">
              Repeatable Alert (trigger multiple times)
            </label>
          </div>

          {/* External Notifications */}
          <div className="mb-4 space-y-2">
            <h4 className="text-xs uppercase opacity-70">External Notifications</h4>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifyDiscord"
                checked={notifyDiscord}
                onChange={(e) => setNotifyDiscord(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="notifyDiscord" className="text-xs cursor-pointer">
                Send to Discord
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifyTelegram"
                checked={notifyTelegram}
                onChange={(e) => setNotifyTelegram(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="notifyTelegram" className="text-xs cursor-pointer">
                Send to Telegram
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="px-2 py-1 text-xs"
              onClick={resetForm}
            >
              CANCEL
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-2 py-1 text-xs"
              onClick={handleCreateAlert}
              disabled={!selectedToken}
            >
              CREATE ALERT
            </Button>
          </div>
        </div>
      )}

      {/* Alerts List */}
      {alerts.length > 0 ? (
        <div className="space-y-2">
          {alerts.slice(0, expanded ? undefined : 5).map((alert) => (
            <div
              key={alert.id}
              className="border border-white/10 p-3 bg-black/40"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  {getAlertSeverityIndicator(alert)}
                  <div className="font-mono">{alert.tokenSymbol}</div>
                </div>
                <div className="text-xs opacity-70">{formatTime(alert.createdAt)}</div>
              </div>

              <div className="mt-2">
                <div className="text-xs font-mono opacity-70">{alert.tokenName}</div>
                <div className="mt-1 text-sm">
                  {formatPriceAlertMessage(alert, getTokenInfo(alert.tokenAddress, alert.chainId)?.currentPrice || 0)}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <div className="px-2 py-0.5 bg-white/10 text-xs rounded-sm">
                  {alert.condition}
                </div>
                <div className="px-2 py-0.5 bg-white/10 text-xs rounded-sm">
                  {alert.timeframe}
                </div>
                {alert.repeatable && (
                  <div className="px-2 py-0.5 bg-white/10 text-xs rounded-sm">
                    REPEATABLE
                  </div>
                )}
                {alert.notificationChannels.discord && (
                  <div className="px-2 py-0.5 bg-[#5865F2]/20 text-xs rounded-sm">
                    DISCORD
                  </div>
                )}
                {alert.notificationChannels.telegram && (
                  <div className="px-2 py-0.5 bg-[#0088cc]/20 text-xs rounded-sm">
                    TELEGRAM
                  </div>
                )}
              </div>

              <div className="mt-3 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="px-2 py-0.5 text-xs"
                  onClick={() => handleDeleteAlert(alert.id)}
                >
                  DELETE
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-sm opacity-70">
          No price alerts configured
        </div>
      )}

      {/* Show more/less controls */}
      {alerts.length > 5 && (
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            size="sm"
            className="px-2 py-1 text-xs font-mono"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'SHOW LESS' : `SHOW ${alerts.length - 5} MORE`}
          </Button>
        </div>
      )}
    </div>
  );
}
