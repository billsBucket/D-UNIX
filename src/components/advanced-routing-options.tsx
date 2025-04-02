"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Settings, AlertTriangle, Shield, Zap } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface AdvancedRoutingOptionsProps {
  slippage: number;
  onSlippageChange: (value: number) => void;
  gasPrice: string;
  routeType: 'auto' | 'lowest-gas' | 'lowest-slippage' | 'highest-speed';
  onRouteTypeChange: (type: 'auto' | 'lowest-gas' | 'lowest-slippage' | 'highest-speed') => void;
  deadlineMinutes: number;
  onDeadlineChange: (minutes: number) => void;
}

export default function AdvancedRoutingOptions({
  slippage,
  onSlippageChange,
  gasPrice,
  routeType,
  onRouteTypeChange,
  deadlineMinutes,
  onDeadlineChange
}: AdvancedRoutingOptionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [deadlineValue, setDeadlineValue] = useState(deadlineMinutes.toString());

  // Handle deadline input change
  const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) { // Only allow digits
      setDeadlineValue(value);
      if (value) {
        onDeadlineChange(parseInt(value));
      }
    }
  };

  // Format gas price for display
  const formatGasPrice = (price: string): string => {
    const priceNum = parseFloat(price);
    if (isNaN(priceNum)) return '0';
    return priceNum.toFixed(0);
  };

  return (
    <div className="mt-2 border border-white/10 bg-black/20">
      <div
        className="flex items-center justify-between p-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <Settings size={14} className="text-white/70" />
          <span className="text-xs font-mono">ADVANCED ROUTING</span>
        </div>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>

      {isExpanded && (
        <div className="p-3 border-t border-white/10 space-y-4">
          {/* Route Type Selection */}
          <div className="space-y-2">
            <label className="text-xs opacity-70">ROUTE PREFERENCE:</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                className={`p-1 h-auto border-white/10 ${
                  routeType === 'auto' ? 'bg-white/10' : 'bg-transparent'
                } flex flex-col items-center rounded-none`}
                onClick={() => onRouteTypeChange('auto')}
              >
                <Shield size={14} className="mb-1" />
                <span className="text-xs">Auto</span>
                <span className="text-[10px] text-white/50">Balanced</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className={`p-1 h-auto border-white/10 ${
                  routeType === 'lowest-gas' ? 'bg-white/10' : 'bg-transparent'
                } flex flex-col items-center rounded-none`}
                onClick={() => onRouteTypeChange('lowest-gas')}
              >
                <AlertTriangle size={14} className="mb-1 text-yellow-400" />
                <span className="text-xs">Gas Saver</span>
                <span className="text-[10px] text-white/50">~{formatGasPrice(gasPrice)} GWEI</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className={`p-1 h-auto border-white/10 ${
                  routeType === 'lowest-slippage' ? 'bg-white/10' : 'bg-transparent'
                } flex flex-col items-center rounded-none`}
                onClick={() => onRouteTypeChange('lowest-slippage')}
              >
                <Shield size={14} className="mb-1 text-blue-400" />
                <span className="text-xs">MEV Protected</span>
                <span className="text-[10px] text-white/50">Low Slippage</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className={`p-1 h-auto border-white/10 ${
                  routeType === 'highest-speed' ? 'bg-white/10' : 'bg-transparent'
                } flex flex-col items-center rounded-none`}
                onClick={() => onRouteTypeChange('highest-speed')}
              >
                <Zap size={14} className="mb-1 text-green-400" />
                <span className="text-xs">Max Speed</span>
                <span className="text-[10px] text-white/50">Prioritized</span>
              </Button>
            </div>
          </div>

          {/* Custom Slippage Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs opacity-70">SLIPPAGE TOLERANCE:</label>
              <span className="text-xs font-mono">{slippage.toFixed(1)}%</span>
            </div>
            <Slider
              defaultValue={[slippage]}
              min={0.1}
              max={5}
              step={0.1}
              onValueChange={(values) => onSlippageChange(values[0])}
            />
            <div className="flex justify-between text-[10px] text-white/50">
              <span>Safer (0.1%)</span>
              <span>Flexible (5%)</span>
            </div>
          </div>

          {/* Transaction Deadline */}
          <div className="space-y-2">
            <label className="text-xs opacity-70">TRANSACTION DEADLINE:</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={deadlineValue}
                onChange={handleDeadlineChange}
                className="w-16 bg-transparent border border-white/20 rounded-none p-1 text-sm text-center"
              />
              <span className="text-xs opacity-70">minutes</span>
            </div>
            <div className="text-[10px] text-white/50">
              Transaction will revert if pending for longer than this
            </div>
          </div>

          {/* Description of current routing mode */}
          <div className="border border-white/10 p-2 bg-black/30">
            <div className="text-xs font-medium mb-1">
              {routeType === 'auto' && 'Auto Routing'}
              {routeType === 'lowest-gas' && 'Gas Saver Mode'}
              {routeType === 'lowest-slippage' && 'MEV Protection Mode'}
              {routeType === 'highest-speed' && 'Maximum Speed Mode'}
            </div>
            <div className="text-xs text-white/70">
              {routeType === 'auto' && 'Balanced route that optimizes for price, gas costs, and execution likelihood.'}
              {routeType === 'lowest-gas' && 'Optimizes for lowest gas cost, potentially sacrificing some price efficiency.'}
              {routeType === 'lowest-slippage' && 'Uses protected routing to avoid MEV and front-running, potentially with higher gas costs.'}
              {routeType === 'highest-speed' && 'Prioritizes execution speed with higher gas fees for faster confirmation.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
