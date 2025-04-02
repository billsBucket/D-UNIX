"use client";

import React from 'react';
import { Card } from '@/components/ui/card';

interface MultiHopVisualizationProps {
  route: string[];
  selected?: boolean;
  routeType?: string;
  routeFees?: number;
  gasEstimate?: string;
  priceImpact?: string;
  minimumOutput?: string;
  onClick?: () => void;
}

export default function MultiHopVisualization({
  route = [],
  selected = false,
  routeType = '',
  routeFees = 0,
  gasEstimate = '0',
  priceImpact = '0%',
  minimumOutput = '0',
  onClick
}: MultiHopVisualizationProps) {
  // Skip if no route is provided
  if (!route || route.length <= 1) {
    return null;
  }

  const getRouteTypeLabel = () => {
    switch (routeType) {
      case 'lowest-gas':
        return 'Lowest Gas';
      case 'lowest-slippage':
        return 'Lowest Slippage';
      case 'highest-speed':
        return 'Highest Speed';
      case 'auto':
      default:
        return 'Auto (Recommended)';
    }
  };

  // Get the background color based on route type
  const getRouteColor = () => {
    switch (routeType) {
      case 'lowest-gas':
        return 'from-emerald-900/20 to-emerald-800/10';
      case 'lowest-slippage':
        return 'from-blue-900/20 to-blue-800/10';
      case 'highest-speed':
        return 'from-purple-900/20 to-purple-800/10';
      case 'auto':
      default:
        return 'from-gray-900/20 to-gray-800/10';
    }
  };

  // Get border color for selected route
  const getBorderStyle = () => {
    if (!selected) return 'border-white/10';

    switch (routeType) {
      case 'lowest-gas':
        return 'border-emerald-500/50';
      case 'lowest-slippage':
        return 'border-blue-500/50';
      case 'highest-speed':
        return 'border-purple-500/50';
      case 'auto':
      default:
        return 'border-white/30';
    }
  };

  return (
    <Card
      className={`p-3 border ${getBorderStyle()} bg-gradient-to-b ${getRouteColor()} hover:bg-black/50 transition-all cursor-pointer`}
      onClick={onClick}
    >
      <div className="space-y-2">
        {/* Route type and fees */}
        <div className="flex justify-between items-center">
          <div className="text-xs font-bold">{getRouteTypeLabel()}</div>
          <div className="text-xs text-white/70">Fee: {routeFees}%</div>
        </div>

        {/* Route visualization */}
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

        {/* Performance metrics */}
        <div className="grid grid-cols-3 gap-2 text-[10px] pt-1 border-t border-white/10">
          <div>
            <div className="text-white/50">Gas</div>
            <div>{gasEstimate}</div>
          </div>
          <div>
            <div className="text-white/50">Impact</div>
            <div className={parseFloat(priceImpact) > 5 ? "text-red-400" : "text-green-400"}>
              {priceImpact}
            </div>
          </div>
          <div>
            <div className="text-white/50">Min Out</div>
            <div>{minimumOutput}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
