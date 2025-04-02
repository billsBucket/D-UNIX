"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  PriceAlertCondition,
  addPriceAlert,
  getPriceAlerts,
  removePriceAlert,
  createSystemNotification
} from '@/lib/notification-manager';
import { createAndMonitorPriceAlert, getTokenPrice } from '@/lib/price-monitoring-service';

export default function PriceAlertForm() {
  const [selectedToken, setSelectedToken] = useState('ETH');
  const [alertType, setAlertType] = useState<'above' | 'below' | 'percent-change'>('above');
  const [priceValue, setPriceValue] = useState('');
  const [percentChangeValue, setPercentChangeValue] = useState('5');
  const [timeframe, setTimeframe] = useState('24h');
  const [direction, setDirection] = useState('up');
  const [existingAlerts, setExistingAlerts] = useState<PriceAlertCondition[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTokenPrice, setCurrentTokenPrice] = useState<number | null>(null);

  // Common token list for selections
  const commonTokens = [
    'ETH', 'WETH', 'WBTC', 'USDC', 'USDT', 'DAI',
    'MATIC', 'UNI', 'LINK', 'AAVE', 'SNX', 'CRV'
  ];

  // Load existing alerts when component mounts
  useEffect(() => {
    loadExistingAlerts();
  }, []);

  // Load current token price when token changes
  useEffect(() => {
    const price = getTokenPrice(selectedToken);
    setCurrentTokenPrice(price);

    // Set a default price value based on current price
    if (price) {
      if (alertType === 'above') {
        setPriceValue((price * 1.05).toFixed(2)); // 5% above current price
      } else if (alertType === 'below') {
        setPriceValue((price * 0.95).toFixed(2)); // 5% below current price
      }
    }
  }, [selectedToken, alertType]);

  const loadExistingAlerts = () => {
    const alerts = getPriceAlerts();
    setExistingAlerts(alerts);
  };

  const handleTokenChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedToken(event.target.value);
  };

  const handleAlertTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setAlertType(event.target.value as 'above' | 'below' | 'percent-change');
  };

  const handlePriceValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setPriceValue(value);
    }
  };

  const handlePercentChangeValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setPercentChangeValue(value);
    }
  };

  const handleTimeframeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeframe(event.target.value);
  };

  const handleDirectionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setDirection(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedToken) {
      createSystemNotification(
        'Invalid Alert',
        'Please select a token for your price alert.',
        'medium'
      );
      return;
    }

    // Create alert based on type
    let newAlert: PriceAlertCondition;

    if (alertType === 'percent-change') {
      if (!percentChangeValue || isNaN(parseFloat(percentChangeValue))) {
        createSystemNotification(
          'Invalid Alert',
          'Please enter a valid percentage value.',
          'medium'
        );
        return;
      }

      // Set percent change value based on direction
      const percentValue = parseFloat(percentChangeValue);
      const finalPercentValue = direction === 'up' ? percentValue : -percentValue;

      newAlert = {
        token: selectedToken,
        type: 'percent-change',
        value: 0, // Not used for percent change alerts
        timeframe,
        percentChange: finalPercentValue
      };
    } else {
      // For above/below alerts
      if (!priceValue || isNaN(parseFloat(priceValue))) {
        createSystemNotification(
          'Invalid Alert',
          'Please enter a valid price value.',
          'medium'
        );
        return;
      }

      newAlert = {
        token: selectedToken,
        type: alertType,
        value: parseFloat(priceValue)
      };
    }

    // Add the alert and start monitoring
    createAndMonitorPriceAlert(newAlert);

    // Show confirmation notification
    createSystemNotification(
      'Price Alert Created',
      `You'll be notified when ${selectedToken} ${getAlertDescription(newAlert)}`,
      'low'
    );

    // Reset form
    if (alertType === 'above' || alertType === 'below') {
      setPriceValue('');
    } else {
      setPercentChangeValue('5');
    }

    // Reload alerts
    loadExistingAlerts();

    // Close dialog if open
    setIsDialogOpen(false);
  };

  const handleDeleteAlert = (index: number) => {
    removePriceAlert(index);
    loadExistingAlerts();

    createSystemNotification(
      'Price Alert Removed',
      'The selected price alert has been removed.',
      'low'
    );
  };

  // Helper function to describe an alert in plain text
  const getAlertDescription = (alert: PriceAlertCondition): string => {
    switch (alert.type) {
      case 'above':
        return `price rises above $${alert.value.toLocaleString()}`;
      case 'below':
        return `price falls below $${alert.value.toLocaleString()}`;
      case 'percent-change':
        const direction = alert.percentChange && alert.percentChange > 0 ? 'increases' : 'decreases';
        const percentage = alert.percentChange ? Math.abs(alert.percentChange) : 0;
        return `${direction} by ${percentage}% within ${alert.timeframe || '24h'}`;
      default:
        return '';
    }
  };

  return (
    <Card className="bg-black/30 border border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex justify-between items-center">
          <span>Price Alerts</span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" />
                New Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-black border border-white/20 text-white">
              <DialogHeader>
                <DialogTitle>Create Price Alert</DialogTitle>
                <DialogDescription className="text-white/60">
                  Set up notifications for price movements.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/70 mb-1 block">Token</label>
                    <select
                      value={selectedToken}
                      onChange={handleTokenChange}
                      className="w-full bg-black text-white border border-white/20 rounded-sm p-2 text-sm"
                    >
                      {commonTokens.map(token => (
                        <option key={token} value={token}>{token}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/70 mb-1 block">Alert Type</label>
                    <select
                      value={alertType}
                      onChange={handleAlertTypeChange}
                      className="w-full bg-black text-white border border-white/20 rounded-sm p-2 text-sm"
                    >
                      <option value="above">Price Above</option>
                      <option value="below">Price Below</option>
                      <option value="percent-change">Percent Change</option>
                    </select>
                  </div>
                </div>

                {/* Show price input for above/below alerts */}
                {(alertType === 'above' || alertType === 'below') && (
                  <div>
                    <label className="text-xs text-white/70 mb-1 block">
                      {alertType === 'above' ? 'Target Price (Above)' : 'Target Price (Below)'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-white/50">$</span>
                      <Input
                        value={priceValue}
                        onChange={handlePriceValueChange}
                        className="pl-6 bg-black/50 border-white/20"
                        placeholder={currentTokenPrice ? currentTokenPrice.toString() : '0.00'}
                      />
                    </div>
                    {currentTokenPrice && (
                      <div className="text-xs text-white/50 mt-1">
                        Current price: ${currentTokenPrice.toLocaleString()}
                      </div>
                    )}
                  </div>
                )}

                {/* Show percent change inputs */}
                {alertType === 'percent-change' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-white/70 mb-1 block">Change Direction</label>
                        <select
                          value={direction}
                          onChange={handleDirectionChange}
                          className="w-full bg-black text-white border border-white/20 rounded-sm p-2 text-sm"
                        >
                          <option value="up">Price Increase</option>
                          <option value="down">Price Decrease</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-white/70 mb-1 block">Timeframe</label>
                        <select
                          value={timeframe}
                          onChange={handleTimeframeChange}
                          className="w-full bg-black text-white border border-white/20 rounded-sm p-2 text-sm"
                        >
                          <option value="1h">Last 1 Hour</option>
                          <option value="24h">Last 24 Hours</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-white/70 mb-1 block">Percentage Change</label>
                      <div className="relative">
                        <Input
                          value={percentChangeValue}
                          onChange={handlePercentChangeValueChange}
                          className="pr-6 bg-black/50 border-white/20"
                          placeholder="5"
                        />
                        <span className="absolute right-3 top-2.5 text-white/50">%</span>
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    type="submit"
                    className="w-full bg-white text-black hover:bg-white/90"
                  >
                    Create Price Alert
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Get notified when prices hit your targets
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        {existingAlerts.length === 0 ? (
          <div className="text-sm text-white/50 text-center py-4 border border-dashed border-white/10 rounded-sm">
            <AlertTriangle className="h-4 w-4 mx-auto mb-2 text-white/30" />
            <p>No price alerts set</p>
            <p className="text-xs mt-1">Create alerts to get notified about price movements</p>
          </div>
        ) : (
          <div className="space-y-2">
            {existingAlerts.map((alert, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-black/50 border border-white/10 p-2 rounded-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-500/20 p-1.5 rounded-full flex-shrink-0">
                    <span className="font-mono text-xs">{alert.token}</span>
                  </div>
                  <span className="text-xs text-white/80">
                    {getAlertDescription(alert)}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteAlert(index)}
                  className="text-white/50 hover:text-white"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
