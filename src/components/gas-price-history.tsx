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

export default function GasPriceHistory() {
  const [activeTimeframe, setActiveTimeframe] = useState('1H');
  const [gasChartData, setGasChartData] = useState<ChainGasData[]>([]);
  const [timeLabels, setTimeLabels] = useState<string[]>([]);

  // Use real-time data hook
  const { data: realTimeData, lastUpdate } = useRealTimeData({
    refreshInterval: 10000, // Refresh every 10 seconds
    metrics: ['gas'] // We only need gas price data for this component
  });

  // Chain colors matching the design
  const chainColors: Record<string, string> = {
    'ETHEREUM': '#6b8af2',
    'POLYGON': '#8247E5',
    'BNB CHAIN': '#F0B90B',
    'ARBITRUM': '#28A0F0',
    'OPTIMISM': '#FF0420',
  };

  // Chain to ID mapping
  const chainIds: Record<string, string> = {
    'ETHEREUM': '1',
    'POLYGON': '137',
    'BNB CHAIN': '56',
    'ARBITRUM': '42161',
    'OPTIMISM': '10',
  };

  // Generate sine-wave like data for demo
  const generateSineWaveData = (baseValue: number, amplitude: number, phaseShift: number, points: number) => {
    return Array.from({ length: points }, (_, i) => {
      const value = baseValue + amplitude * Math.sin((i / points) * Math.PI * 4 + phaseShift);
      return value;
    });
  };

  // Update gas price chart data when realTimeData changes
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

      // Generate consistent timestamps for the chart - hourly timestamps
      const now = new Date();
      const timestamps: number[] = [];
      const numHours = 12;

      // Generate timestamps for the last 12 hours
      for (let i = numHours - 1; i >= 0; i--) {
        const time = new Date(now);
        time.setHours(now.getHours() - i);
        time.setMinutes(0);
        time.setSeconds(0);
        time.setMilliseconds(0);
        timestamps.push(time.getTime());
      }

      // Generate synthetic data for each chain to match the image
      const processedData: ChainGasData[] = chains.map((chainName, index) => {
        // Create sine-wave data with different phases and amplitudes for each chain
        const baseValue = 40;
        const amplitude = 5 + index;
        const phaseShift = index * 0.5;

        return {
          name: chainName,
          color: chainColors[chainName],
          data: generateSineWaveData(baseValue, amplitude, phaseShift, timestamps.length)
        };
      });

      // Format time labels as HH:MM
      const formattedLabels = timestamps.map(ts => {
        const date = new Date(ts);
        return `${date.getHours().toString().padStart(2, '0')}:00`;
      });

      setGasChartData(processedData);
      setTimeLabels(formattedLabels);
    } catch (error) {
      console.error('Error processing gas price data:', error);
    }
  }, [activeTimeframe]);

  // Helper function to calculate the SVG path for each line
  const createLinePath = (data: number[], maxValue: number, width: number, height: number): string => {
    if (data.length < 2) return '';

    const xStep = width / (data.length - 1);
    const points = data.map((value, index) => {
      const x = index * xStep;
      const y = height - (value / maxValue * height);
      return `${x},${y}`;
    });

    // Create path
    let path = `M${points[0]}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L${points[i]}`;
    }

    return path;
  };

  // Find the max gas price for scaling - using 60 as in the reference
  const maxGasPrice = 60;

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

      <div className="p-4 relative" style={{ height: '320px' }}>
        {/* Chart container */}
        <div className="w-full h-full relative">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] md:text-xs text-white/60">
            <div>60</div>
            <div>45</div>
            <div>30</div>
            <div>15</div>
            <div>0</div>
          </div>

          {/* Chart area with padding for labels */}
          <div className="ml-8 h-full relative">
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

            {/* Grid lines - vertical */}
            <div className="absolute inset-0">
              {timeLabels.map((_, i, arr) => (
                <div
                  key={`v-grid-${i}`}
                  className="absolute h-full border-l border-white/10 border-dashed"
                  style={{ left: `${(i / (arr.length - 1)) * 100}%` }}
                ></div>
              ))}
            </div>

            {/* Gas price lines */}
            <svg className="absolute inset-0 w-full h-full overflow-visible">
              {gasChartData.map((chain, i) => (
                <path
                  key={`line-${i}`}
                  d={createLinePath(chain.data, maxGasPrice, 100, 100)}
                  fill="none"
                  stroke={chain.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  style={{ transform: 'scale(1, 0.95)' }}
                />
              ))}
            </svg>

            {/* X-axis labels */}
            <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[10px] md:text-xs text-white/60">
              {timeLabels.map((label, i, arr) => (
                <div
                  key={`time-${i}`}
                  style={{ position: 'absolute', left: `${(i / (arr.length - 1)) * 100}%`, transform: 'translateX(-50%)' }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center flex-wrap gap-4 md:gap-6 mt-4 text-[10px] md:text-xs font-mono">
          {gasChartData.map((chain, i) => (
            <div key={`legend-${i}`} className="flex items-center">
              <div className="w-3 h-3 mr-2" style={{ backgroundColor: chain.color }}></div>
              {chain.name}
            </div>
          ))}
        </div>

        <div className="absolute bottom-4 right-4 text-xs text-white/60">
          Gas (gwei)
        </div>
      </div>
    </div>
  );
}
