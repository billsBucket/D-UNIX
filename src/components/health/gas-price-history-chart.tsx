"use client";

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ChainStatus } from './chain-data';

interface GasPriceHistoryProps {
  chainsData: ChainStatus[];
  selectedChains: string[];
}

export default function GasPriceHistoryChart({ chainsData, selectedChains }: GasPriceHistoryProps) {
  const [timeframe, setTimeframe] = useState<'1H' | '24H' | '7D'>('24H');
  const [chartData, setChartData] = useState<any[]>([]);

  // Generate chart data when timeframe or selected chains change
  useEffect(() => {
    if (selectedChains.length === 0 || chainsData.length === 0) return;

    const selectedChainsData = chainsData.filter(chain =>
      selectedChains.includes(chain.id)
    );

    // Set different data points depending on timeframe
    const getDataPoints = () => {
      switch (timeframe) {
        case '1H': return 12; // 5 min intervals
        case '24H': return 24; // 1 hour intervals
        case '7D': return 28; // 6 hour intervals
        default: return 24;
      }
    };

    const points = getDataPoints();
    const now = new Date();

    // Generate time labels based on timeframe
    const timeLabels = Array.from({ length: points }, (_, i) => {
      const time = new Date(now);

      if (timeframe === '1H') {
        // Go back by 5-minute intervals
        time.setMinutes(time.getMinutes() - (points - 1 - i) * 5);
        const hours = time.getHours().toString().padStart(2, '0');
        const mins = time.getMinutes().toString().padStart(2, '0');
        return `${hours}:${mins}`;
      } else if (timeframe === '24H') {
        // Go back by hour intervals
        time.setHours(time.getHours() - (points - 1 - i));
        return `${time.getHours().toString().padStart(2, '0')}:00`;
      } else {
        // Go back by 6-hour intervals for 7D
        time.setHours(time.getHours() - (points - 1 - i) * 6);
        const month = (time.getMonth() + 1).toString().padStart(2, '0');
        const day = time.getDate().toString().padStart(2, '0');
        const hour = time.getHours().toString().padStart(2, '0');
        return `${month}/${day} ${hour}:00`;
      }
    });

    // Generate synthetic gas price data for each chain
    const chainGasData: Record<string, number[]> = {};

    selectedChainsData.forEach(chain => {
      const baseValue = chain.gas;
      const volatility = baseValue * 0.4; // 40% volatility

      // Create a wave-like pattern with some randomness
      const data = Array.from({ length: points }, (_, i) => {
        // Create a sine wave with different offsets for each chain
        const offset = selectedChains.indexOf(chain.id) * 2;
        const wave = Math.sin((i / points) * Math.PI * 4 + offset) * (volatility * 0.5);

        // Add some random noise
        const noise = (Math.random() - 0.5) * volatility;

        // Calculate final value with base, wave and noise
        let value = baseValue + wave + noise;

        // Ensure we don't go below 1 gwei
        value = Math.max(1, value);

        return Math.round(value * 10) / 10; // Round to 1 decimal place
      });

      chainGasData[chain.id] = data;
    });

    // Combine timestamps and data into chart data format
    const data = timeLabels.map((label, i) => {
      const entry: any = { timestamp: label };

      // Add gas price data for each selected chain
      selectedChainsData.forEach(chain => {
        entry[chain.id] = chainGasData[chain.id][i];
      });

      return entry;
    });

    setChartData(data);
  }, [timeframe, selectedChains, chainsData]);

  // Find chart Y axis range
  const getYAxisDomain = () => {
    if (chartData.length === 0) return [0, 60];

    // Find min and max values across all selected chains
    let min = Number.MAX_SAFE_INTEGER;
    let max = 0;

    chartData.forEach(entry => {
      selectedChains.forEach(chainId => {
        if (entry[chainId] !== undefined) {
          min = Math.min(min, entry[chainId]);
          max = Math.max(max, entry[chainId]);
        }
      });
    });

    // Add some padding to the max
    min = Math.max(0, Math.floor(min * 0.8));
    max = Math.ceil(max * 1.2);

    return [min, max];
  };

  // Get selected chain data
  const getSelectedChainData = () => {
    return chainsData.filter(chain => selectedChains.includes(chain.id));
  };

  return (
    <div className="border border-white/10 bg-black mb-6">
      <div className="flex justify-between items-center border-b border-white/10 p-3">
        <h2 className="font-mono uppercase text-white">GAS PRICE HISTORY</h2>

        <div className="flex">
          {['1H', '24H', '7D'].map((option) => (
            <button
              key={option}
              onClick={() => setTimeframe(option as any)}
              className={`
                px-3 py-1 text-xs border border-white/20
                ${timeframe === option ? 'bg-white/10' : 'bg-transparent'}
              `}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              stroke="rgba(255, 255, 255, 0.3)"
              tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 10 }}
            />
            <YAxis
              domain={getYAxisDomain()}
              stroke="rgba(255, 255, 255, 0.3)"
              tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 10 }}
            />

            {getSelectedChainData().map((chain) => (
              <Line
                key={chain.id}
                type="monotone"
                dataKey={chain.id}
                stroke={chain.color}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center items-center gap-4 border-t border-white/10 p-2">
        {getSelectedChainData().map((chain) => (
          <div key={chain.id} className="flex items-center gap-2 text-xs">
            <div
              className="w-3 h-1"
              style={{ backgroundColor: chain.color }}
            ></div>
            <span>{chain.name}</span>
          </div>
        ))}
      </div>

      <div className="text-center text-xs text-white/60 p-2 border-t border-white/10">
        Gas (gwei)
      </div>
    </div>
  );
}
