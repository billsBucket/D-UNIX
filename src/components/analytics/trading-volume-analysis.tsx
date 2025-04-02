"use client";

import React, { useState, useEffect } from 'react';
import { useRealTimeData } from '@/hooks/use-real-time-data';
import { useGSAPAnimations } from '@/hooks/use-gsap-animations';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface VolumeData {
  name: string;
  volume: number;
  percentage: number;
  color: string;
}

export default function TradingVolumeAnalysis() {
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [timeframe, setTimeframe] = useState<'24H' | '7D' | '30D'>('24H');
  const [total, setTotal] = useState(0);
  const { fadeInUp } = useGSAPAnimations();

  // Use real-time data hook
  const { data: realTimeData, lastUpdate } = useRealTimeData({
    refreshInterval: 60000, // Refresh every minute
    metrics: ['volume'] // We only need volume data
  });

  // Update trading volume data when timeframe or realTimeData changes
  useEffect(() => {
    if (!realTimeData) return;

    // Generate mock data for different pairs
    const pairs = [
      { name: 'ETH/USDC', color: '#627eea' },
      { name: 'ETH/USDT', color: '#26a17b' },
      { name: 'WBTC/ETH', color: '#f7931a' },
      { name: 'ARB/USDC', color: '#28a0f0' },
      { name: 'OP/USDC', color: '#ff0420' },
      { name: 'MATIC/USDC', color: '#8247e5' },
      { name: 'BNB/USDC', color: '#f0b90b' },
      { name: 'DAI/USDC', color: '#f5ac37' }
    ];

    // Generate different volume numbers based on timeframe
    const multiplier = timeframe === '24H' ? 1 : timeframe === '7D' ? 7 : 30;

    const volumeValues = pairs.map((pair) => {
      let baseVolume = 0;

      // Set different base volumes for different pairs (more realistic data)
      if (pair.name === 'ETH/USDC') baseVolume = 1450000;
      else if (pair.name === 'ETH/USDT') baseVolume = 980000;
      else if (pair.name === 'WBTC/ETH') baseVolume = 780000;
      else if (pair.name === 'ARB/USDC') baseVolume = 560000;
      else if (pair.name === 'OP/USDC') baseVolume = 420000;
      else if (pair.name === 'MATIC/USDC') baseVolume = 350000;
      else if (pair.name === 'BNB/USDC') baseVolume = 290000;
      else if (pair.name === 'DAI/USDC') baseVolume = 180000;

      // Add some randomness (±10%)
      const randomFactor = 0.9 + (Math.random() * 0.2);

      // Apply timeframe multiplier with some diminishing returns for longer timeframes
      let volume = baseVolume * randomFactor * (multiplier * 0.85);

      // Round to nearest 10k
      volume = Math.round(volume / 10000) * 10000;

      return {
        ...pair,
        volume
      };
    });

    // Calculate total and percentages
    const totalVolume = volumeValues.reduce((sum, item) => sum + item.volume, 0);

    const finalData = volumeValues.map(item => ({
      ...item,
      percentage: (item.volume / totalVolume) * 100
    }));

    // Sort by volume descending
    finalData.sort((a, b) => b.volume - a.volume);

    setVolumeData(finalData);
    setTotal(totalVolume);
  }, [timeframe, realTimeData]);

  // Format large numbers for display
  const formatVolume = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value}`;
  };

  // Custom tooltip for the bar chart
  const CustomTooltip = ({ active, payload }: { active?: boolean, payload?: any[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black border border-white/20 p-2 text-xs">
          <p className="font-bold">{data.name}</p>
          <p>Volume: {formatVolume(data.volume)}</p>
          <p>Share: {data.percentage.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg md:text-xl font-mono uppercase">TRADING VOLUME ANALYSIS</h2>
        <div className="flex">
          <button
            className={`px-3 py-1 border border-white/20 text-xs ${timeframe === '24H' ? 'bg-white/10' : 'bg-transparent'}`}
            onClick={() => setTimeframe('24H')}
          >
            24H
          </button>
          <button
            className={`px-3 py-1 border border-white/20 text-xs ${timeframe === '7D' ? 'bg-white/10' : 'bg-transparent'}`}
            onClick={() => setTimeframe('7D')}
          >
            7D
          </button>
          <button
            className={`px-3 py-1 border border-white/20 text-xs ${timeframe === '30D' ? 'bg-white/10' : 'bg-transparent'}`}
            onClick={() => setTimeframe('30D')}
          >
            30D
          </button>
        </div>
      </div>

      <div className="text-xs font-mono mb-4">
        TOTAL VOLUME: <span className="font-bold">{formatVolume(total)}</span>
      </div>

      {/* Volume Bar Chart */}
      <div className="border border-white/10 h-64 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={volumeData}
            margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
          >
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatVolume}
              tick={{ fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
              {volumeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Trading Pairs Table */}
      <div className="mt-4 border border-white/10">
        <div className="border-b border-white/10 p-2 font-mono text-xs">
          TOP TRADING PAIRS
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-2 text-left">PAIR</th>
                <th className="p-2 text-right">VOLUME</th>
                <th className="p-2 text-right">SHARE</th>
              </tr>
            </thead>
            <tbody>
              {volumeData.map((item, index) => (
                <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-2 font-mono">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                      {item.name}
                    </div>
                  </td>
                  <td className="p-2 text-right font-mono">{formatVolume(item.volume)}</td>
                  <td className="p-2 text-right font-mono">{item.percentage.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-right text-xs opacity-60 mt-4">
        LAST UPDATED: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
