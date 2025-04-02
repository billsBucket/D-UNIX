"use client";

import React from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface SlippageProtectionAlertsProps {
  priceImpact: string;
  slippage: number;
  expectedOutput: string;
  minimumOutput: string;
  outputToken: string;
  route: string[];
}

export default function SlippageProtectionAlerts({
  priceImpact,
  slippage,
  expectedOutput,
  minimumOutput,
  outputToken,
  route
}: SlippageProtectionAlertsProps) {
  const priceImpactValue = parseFloat(priceImpact.replace('%', ''));

  // Determine alert type based on price impact
  const getAlertType = () => {
    if (priceImpactValue <= 1) return 'safe';
    if (priceImpactValue > 1 && priceImpactValue <= 3) return 'warning';
    if (priceImpactValue > 3 && priceImpactValue <= 5) return 'caution';
    return 'danger';
  };

  const alertType = getAlertType();

  // Get appropriate icon by alert type
  const getAlertIcon = () => {
    switch (alertType) {
      case 'safe':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'caution':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'danger':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  // Get appropriate background by alert type
  const getAlertBackground = () => {
    switch (alertType) {
      case 'safe':
        return 'bg-green-900/20 border-green-500/30';
      case 'warning':
        return 'bg-yellow-900/20 border-yellow-500/30';
      case 'caution':
        return 'bg-orange-900/20 border-orange-500/30';
      case 'danger':
        return 'bg-red-900/20 border-red-500/30';
      default:
        return 'bg-gray-900/20 border-gray-500/30';
    }
  };

  // Determine if slippage is too low compared to price impact
  const isSlippageTooLow = slippage < priceImpactValue;

  // Determine if slippage is too high (potentially wasting funds)
  const isSlippageTooHigh = slippage > priceImpactValue * 2 && slippage > 1;

  // Get slippage recommendation
  const getSlippageRecommendation = () => {
    if (isSlippageTooLow) {
      return Math.max(priceImpactValue * 1.2, 0.5).toFixed(1);
    }
    if (isSlippageTooHigh) {
      return Math.max(priceImpactValue * 1.2, 0.5).toFixed(1);
    }
    return slippage.toFixed(1);
  };

  // Get title of alert
  const getAlertTitle = () => {
    if (alertType === 'danger') return 'High Price Impact';
    if (alertType === 'caution') return 'Significant Price Impact';
    if (alertType === 'warning') return 'Moderate Price Impact';
    return 'Low Price Impact';
  };

  // Get description of alert
  const getAlertDescription = () => {
    if (alertType === 'danger') {
      return 'This trade has a very high price impact. Consider using a smaller amount or a different route.';
    }
    if (alertType === 'caution') {
      return 'This trade has a high price impact. You might lose value due to market slippage.';
    }
    if (alertType === 'warning') {
      return 'This trade has a moderate price impact. The larger the amount, the higher the slippage.';
    }
    return 'This trade has a low price impact. It should execute near your expected output.';
  };

  const getRouteDescription = () => {
    if (!route || route.length <= 1) return 'Direct swap';
    if (route.length === 2) return 'Direct swap';
    if (route.length === 3) return 'One-hop route';
    return `Multi-hop route (${route.length - 2} hops)`;
  };

  // If no price impact or invalid values, don't show anything
  if (!priceImpact || isNaN(priceImpactValue)) {
    return null;
  }

  return (
    <div className={`border ${getAlertBackground()} p-3 rounded-sm text-sm`}>
      <div className="flex items-start gap-2">
        <div className="mt-0.5">{getAlertIcon()}</div>
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">{getAlertTitle()}</h4>
            <span
              className={`
                font-mono text-xs px-1.5 py-0.5 rounded
                ${alertType === 'danger' ? 'bg-red-900/30 text-red-400' :
                  alertType === 'caution' ? 'bg-orange-900/30 text-orange-400' :
                  alertType === 'warning' ? 'bg-yellow-900/30 text-yellow-400' :
                  'bg-green-900/30 text-green-400'}
              `}
            >
              {priceImpact}
            </span>
          </div>
          <p className="text-xs opacity-80 mt-0.5 mb-1">{getAlertDescription()}</p>

          {/* Slippage warnings */}
          {isSlippageTooLow && (
            <div className="text-xs bg-red-900/20 border border-red-500/30 p-1.5 rounded-sm mt-1">
              <span className="font-medium text-red-400">⚠️ Warning:</span> Your slippage tolerance ({slippage}%) is lower than the price impact.
              Consider setting it to at least {getSlippageRecommendation()}% to ensure the trade executes.
            </div>
          )}

          {isSlippageTooHigh && (
            <div className="text-xs bg-yellow-900/20 border border-yellow-500/30 p-1.5 rounded-sm mt-1">
              <span className="font-medium text-yellow-400">ℹ️ Note:</span> Your slippage tolerance ({slippage}%) is much higher than needed.
              Consider lowering it to around {getSlippageRecommendation()}% to avoid potential losses.
            </div>
          )}

          {/* Show details in a collapsible section */}
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-xs underline opacity-70 hover:opacity-100 transition-opacity mt-1">
                View details
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-black text-white border border-white/20">
              <DialogHeader>
                <DialogTitle className="text-base">Transaction Details</DialogTitle>
              </DialogHeader>

              <div className="text-xs space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-1">
                  <div className="opacity-70">Price Impact:</div>
                  <div className={`font-mono ${priceImpactValue > 3 ? 'text-red-400' : priceImpactValue > 1 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {priceImpact}
                  </div>

                  <div className="opacity-70">Slippage Tolerance:</div>
                  <div className="font-mono">{slippage}%</div>

                  <div className="opacity-70">Expected Output:</div>
                  <div className="font-mono">{expectedOutput} {outputToken}</div>

                  <div className="opacity-70">Minimum Output:</div>
                  <div className="font-mono">{minimumOutput} {outputToken}</div>

                  <div className="opacity-70">Route Type:</div>
                  <div>{getRouteDescription()}</div>
                </div>

                {/* Only show route visualization if there are multiple tokens */}
                {route && route.length > 1 && (
                  <div className="border-t border-white/10 pt-2">
                    <div className="opacity-70 mb-1">Routing Path:</div>
                    <div className="flex items-center flex-wrap gap-1">
                      {route.map((token, index) => (
                        <React.Fragment key={index}>
                          <div className="text-xs font-mono bg-black/30 px-2 py-1 rounded">{token}</div>
                          {index < route.length - 1 && (
                            <div className="text-white/50">→</div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {/* Explanation of price impact */}
                <div className="border-t border-white/10 pt-2">
                  <div className="opacity-70 mb-1">What is Price Impact?</div>
                  <p className="leading-snug">
                    Price impact shows how much your trade affects the market price.
                    Higher values mean your trade is significantly moving the market,
                    resulting in a worse price than the current market price.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
