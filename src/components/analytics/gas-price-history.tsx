"use client";

import React, { useState, useEffect } from 'react';
import { useRealTimeData } from '@/hooks/use-real-time-data';

interface GasDataPoint {
  timestamp: number;
  standard: number;
  fast: number;
  instant: number;
}

interface ChainGasData {
  name: string;
  color: string;
  data: number[];
}

// Chain colors defined outside the component to prevent unnecessary re-renders
const CHAIN_COLORS: Record<string, string> = {
  'ETHEREUM': '#6b8af2',
  'POLYGON': '#8247E5',
  'BNB CHAIN': '#F0B90B',
  'ARBITRUM': '#28A0F0',
  'OPTIMISM': '#FF0420',
};

// Chain to ID mapping
const CHAIN_IDS: Record<string, string> = {
  'ETHEREUM': '1',
  'POLYGON': '137',
  'BNB CHAIN': '56',
  'ARBITRUM': '42161',
  'OPTIMISM': '10',
};

export default function GasPriceHistory() {
  const [activeTimeframe, setActiveTimeframe] = useState('1H');
  const [gasChartData, setGasChartData] = useState<ChainGasData[]>([]);
  const [timeLabels, setTimeLabels] = useState<string[]>([]);

  // Use real-time data hook
  const { data: realTimeData, lastUpdate } = useRealTimeData({
    refreshInterval: 10000, // Refresh every 10 seconds
    metrics: ['gas'] // We only need gas price data for this component
  });

  // Generate more realistic random wave-like gas price data
  const generateRealisticGasData = (points: number, baseValue: number, volatility: number, bias: number) => {
    // Start with a random value around the base
    let currentValue = baseValue + (Math.random() * 10 - 5);
    const values = [currentValue];

    // Generate next values with random walks and occasional spikes/dips
    for (let i = 1; i < points; i++) {
      // Random walk component
      const randomWalk = (Math.random() - 0.5) * volatility;

      // Oscillation component (makes it more wave-like)
      const oscillation = Math.sin(i * 0.5 + bias) * (volatility * 0.8);

      // Occasional spike/dip
      const spike = Math.random() > 0.85 ? (Math.random() - 0.5) * volatility * 2 : 0;

      // Mean reversion (pull toward base value)
      const reversion = (baseValue - currentValue) * 0.1;

      // Combine all factors for next value
      currentValue += randomWalk + oscillation + spike + reversion;

      // Keep values between bounds (15-50 for gas)
      currentValue = Math.max(15, Math.min(50, currentValue));

      values.push(currentValue);
    }

    return values;
  };

  // Update gas price chart data when timeframe changes
  useEffect(() => {
    try {
      // Define chains to display
      const chains = [
        'ETHEREUM',
        'POLYGON',
        'BNB CHAIN',
        'ARBITRUM',
        'OPTIMISM'
      ];

      // Generate timestamps based on active timeframe
      const now = new Date();
      const timestamps: number[] = [];
      let numPoints = 24; // Default for 24H view
      let timeFormat = 'HH:00';
      let timeStep = 1; // hours per step

      // Configure based on selected timeframe
      if (activeTimeframe === '1H') {
        numPoints = 12;
        timeStep = 0.05; // 3-minute intervals for 1H view
        timeFormat = 'HH:mm';
      } else if (activeTimeframe === '7D') {
        numPoints = 24;
        timeStep = 7; // 7-hour intervals for 7D view
        timeFormat = 'MM/DD';
      }

      // Generate timestamps
      for (let i = numPoints - 1; i >= 0; i--) {
        const time = new Date(now);
        if (activeTimeframe === '1H') {
          time.setMinutes(now.getMinutes() - (i * 3)); // 3-minute intervals
        } else if (activeTimeframe === '24H') {
          time.setHours(now.getHours() - i); // 1-hour intervals
        } else if (activeTimeframe === '7D') {
          time.setHours(now.getHours() - (i * 7)); // 7-hour intervals
        }
        timestamps.push(time.getTime());
      }

      // Generate synthetic data for each chain
      const processedData: ChainGasData[] = chains.map((chainName, index) => {
        // Create more varied and realistic gas price data
        const baseValue = 30 + (index * 2 % 10); // Different base values for each chain
        const volatility = 8 + index % 5; // Different volatility per chain
        const bias = index * 1.3; // Different phase for each chain's oscillation

        return {
          name: chainName,
          color: CHAIN_COLORS[chainName], // Use the constant defined outside the component
          data: generateRealisticGasData(numPoints, baseValue, volatility, bias)
        };
      });

      // Format time labels based on timeframe
      const formattedLabels = timestamps.map(ts => {
        const date = new Date(ts);
        if (activeTimeframe === '1H') {
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        } else if (activeTimeframe === '24H') {
          return `${date.getHours().toString().padStart(2, '0')}:00`;
        } else {
          return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
        }
      });

      setGasChartData(processedData);
      setTimeLabels(formattedLabels);
    } catch (error) {
      console.error('Error processing gas price data:', error);
    }
  }, [activeTimeframe]); // Removed chainColors from dependency array

  // Create a more sophisticated SVG path for smoother curves
  const createSmoothPath = (data: number[], maxValue: number, width: number, height: number): string => {
    if (data.length < 2) return '';

    const xStep = width / (data.length - 1);
    const yScale = height / maxValue;

    // Calculate points
    const points = data.map((value, index) => ({
      x: index * xStep,
      y: height - (value * yScale)
    }));

    // Create path with cubic bezier curves for smoothness
    let path = `M${points[0].x},${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];

      // Control points for the curve
      const cp1x = prev.x + (curr.x - prev.x) / 3;
      const cp1y = prev.y;
      const cp2x = prev.x + 2 * (curr.x - prev.x) / 3;
      const cp2y = curr.y;

      path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
    }

    return path;
  };

  // Find the max gas price for scaling
  const maxGasPrice = 60; // Fixed scale

  // Determine if we should show dots on the lines based on timeframe
  const showDots = activeTimeframe === '1H';

  return (
    <div className="w-full border border-white/10">
      <div className="flex justify-between items-center p-4 border-b border-white/10">
        <h2 className="text-base md:text-lg font-mono uppercase">GAS PRICE HISTORY</h2>
        <div className="flex">
          <button
            className={`px-3 py-1 border border-white/20 text-xs ${activeTimeframe === '1H' ? 'bg-white/10' : 'bg-transparent'}`}
            onClick={() => setActiveTimeframe('1H')}
          >
            1H
          </button>
          <button
            className={`px-3 py-1 border border-white/20 text-xs ${activeTimeframe === '24H' ? 'bg-white/10' : 'bg-transparent'}`}
            onClick={() => setActiveTimeframe('24H')}
          >
            24H
          </button>
          <button
            className={`px-3 py-1 border border-white/20 text-xs ${activeTimeframe === '7D' ? 'bg-white/10' : 'bg-transparent'}`}
            onClick={() => setActiveTimeframe('7D')}
          >
            7D
          </button>
        </div>
      </div>

      {/* Chart container with legends below */}
      <div className="relative">
        {/* Chart area */}
        <div className="p-4 relative" style={{ height: '320px' }}>
          <div className="w-full h-full relative">
            {/* Chart area with grid and data */}
            <div className="h-full relative border border-white/10 p-2">
              {/* Grid lines - horizontal */}
              <div className="absolute inset-0">
                {[0, 1, 2, 3, 4].map((_, i) => (
                  <div
                    key={`h-grid-${i}`}
                    className="absolute w-full border-t border-white/10 border-dashed"
                    style={{ top: `${i * 25}%` }}
                  ></div>
                ))}
              </div>

              {/* Y-axis labels - positioned inside */}
              <div className="absolute left-1 top-0 h-full flex flex-col justify-between text-[10px] text-white/60 z-10 pointer-events-none">
                <div>60</div>
                <div>45</div>
                <div>30</div>
                <div>15</div>
                <div>0</div>
              </div>

              {/* Grid lines - vertical */}
              <div className="absolute inset-0">
                {timeLabels.map((_, i, arr) => {
                  // Show more vertical grid lines for clarity
                  if (i % Math.max(1, Math.ceil(arr.length / 12)) !== 0 && i !== arr.length - 1) return null;

                  return (
                    <div
                      key={`v-grid-${i}`}
                      className="absolute h-full border-l border-white/10 border-dashed"
                      style={{ left: `${(i / (arr.length - 1)) * 100}%` }}
                    ></div>
                  );
                })}
              </div>

              {/* Gas price lines */}
              <svg className="absolute inset-0 w-full h-full overflow-visible">
                {gasChartData.map((chain, i) => (
                  <g key={`line-${i}`}>
                    <path
                      d={createSmoothPath(chain.data, maxGasPrice, 100, 100)}
                      fill="none"
                      stroke={chain.color}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />

                    {/* Add dots for data points on 1H view */}
                    {showDots && chain.data.map((value, j) => {
                      const x = (j / (chain.data.length - 1)) * 100;
                      const y = 100 - (value / maxGasPrice * 100);
                      return (
                        <circle
                          key={`dot-${i}-${j}`}
                          cx={`${x}%`}
                          cy={`${y}%`}
                          r="2"
                          fill={chain.color}
                          stroke={chain.color}
                        />
                      );
                    })}
                  </g>
                ))}
              </svg>

              {/* X-axis labels - positioned inside at bottom */}
              <div className="absolute bottom-1 left-0 right-0 flex justify-between text-[10px] text-white/60 z-10 pointer-events-none">
                {timeLabels.map((label, i, arr) => {
                  // Show more time labels, matching the vertical grid lines
                  if (i % Math.max(1, Math.ceil(arr.length / 12)) !== 0 && i !== arr.length - 1) return null;

                  return (
                    <div
                      key={`time-${i}`}
                      style={{ position: 'absolute', left: `${(i / (arr.length - 1)) * 100}%`, transform: 'translateX(-50%)' }}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>

              {/* Gas (gwei) label */}
              <div className="absolute bottom-1 right-2 text-[10px] text-white/60 z-10">
                Gas (gwei)
              </div>
            </div>
          </div>
        </div>

        {/* Legend - outside the chart box */}
        <div className="border-t border-white/10 py-3 px-4 flex justify-center flex-wrap gap-4 md:gap-6 text-[10px] md:text-xs font-mono">
          {gasChartData.map((chain, i) => (
            <div key={`legend-${i}`} className="flex items-center">
              <div className="w-3 h-3 mr-2" style={{ backgroundColor: chain.color }}></div>
              {chain.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
