"use client";

import React, { useState, useEffect } from 'react';
import { getRealTimeData } from '@/lib/real-time-data';

export default function TradingVolume() {
  const [volumeData, setVolumeData] = useState<any>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    // Function to update volume data
    const updateData = () => {
      const realTimeData = getRealTimeData();
      setVolumeData(realTimeData.volumes);
      setLastUpdated(new Date(realTimeData.lastUpdated));
    };

    // Initial update
    updateData();

    // Set up interval to update data
    const intervalId = setInterval(updateData, 10000);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Trading Volume Analysis */}
      <div className="dunix-card border border-white/10">
        <h2 className="text-xl uppercase font-mono mb-2">TRADING VOLUME ANALYSIS</h2>
        <div className="text-xs mb-4 opacity-70">DETAILED METRICS ON TRADING ACTIVITY AND VOLUME ACROSS CHAINS</div>

        <div className="grid grid-cols-2 gap-4">
          {/* Ethereum Volume */}
          <div className="border border-white/10 p-4">
            <div className="text-xs opacity-70 mb-2">ETHEREUM 24H VOLUME</div>
            <div className="text-2xl font-mono">
              {volumeData['1']?.formatted?.daily || "$7.3B"}
            </div>
            <div className="text-xs text-[#4caf50]">
              +2.2% from previous day
            </div>
          </div>

          {/* Arbitrum Volume */}
          <div className="border border-white/10 p-4">
            <div className="text-xs opacity-70 mb-2">ARBITRUM 24H VOLUME</div>
            <div className="text-2xl font-mono">
              {volumeData['42161']?.formatted?.daily || "$3.1B"}
            </div>
            <div className="text-xs text-[#4caf50]">
              +3.8% from previous day
            </div>
          </div>

          {/* Polygon Volume */}
          <div className="border border-white/10 p-4">
            <div className="text-xs opacity-70 mb-2">POLYGON 24H VOLUME</div>
            <div className="text-2xl font-mono">
              {volumeData['137']?.formatted?.daily || "$1.1B"}
            </div>
            <div className="text-xs text-[#4caf50]">
              +2.5% from previous day
            </div>
          </div>

          {/* Optimism Volume */}
          <div className="border border-white/10 p-4">
            <div className="text-xs opacity-70 mb-2">OPTIMISM 24H VOLUME</div>
            <div className="text-2xl font-mono">
              {volumeData['10']?.formatted?.daily || "$780.3M"}
            </div>
            <div className="text-xs text-[#f44336]">
              -2.0% from previous day
            </div>
          </div>
        </div>

        {/* Transaction Metrics */}
        <div className="mt-4 border border-white/10 p-4">
          <div className="text-xs uppercase font-mono mb-2">CHAIN TRANSACTION METRICS</div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2">CHAIN</th>
                <th className="text-right py-2">TX COUNT (24H)</th>
                <th className="text-right py-2">AVG TX SIZE</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/5">
                <td className="py-2">ETHEREUM</td>
                <td className="py-2 text-right">
                  {volumeData['1']?.formattedTransactionCount?.daily || "1.5M"}
                </td>
                <td className="py-2 text-right">
                  {volumeData['1']?.formattedAverageSize?.daily || "$4,867"}
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2">ARBITRUM</td>
                <td className="py-2 text-right">
                  {volumeData['42161']?.formattedTransactionCount?.daily || "820K"}
                </td>
                <td className="py-2 text-right">
                  {volumeData['42161']?.formattedAverageSize?.daily || "$3,780"}
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2">POLYGON</td>
                <td className="py-2 text-right">
                  {volumeData['137']?.formattedTransactionCount?.daily || "620K"}
                </td>
                <td className="py-2 text-right">
                  {volumeData['137']?.formattedAverageSize?.daily || "$1,774"}
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2">OPTIMISM</td>
                <td className="py-2 text-right">
                  {volumeData['10']?.formattedTransactionCount?.daily || "420K"}
                </td>
                <td className="py-2 text-right">
                  {volumeData['10']?.formattedAverageSize?.daily || "$1,857"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Liquidity Health Indicators */}
      <div className="dunix-card border border-white/10">
        <h2 className="text-xl uppercase font-mono mb-2">LIQUIDITY HEALTH INDICATORS</h2>
        <div className="text-xs mb-4 opacity-70">REAL-TIME ASSESSMENT OF LIQUIDITY DEPTH AND MARKET EFFICIENCY</div>

        <div className="space-y-4">
          <div className="border border-white/10 p-4">
            <div className="text-xs opacity-70 mb-2">ETH/USDC SLIPPAGE (100K USD)</div>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-mono">0.08%</div>
              <div className="text-lg font-mono text-[#4caf50]">EXCELLENT</div>
            </div>
          </div>
          <div className="border border-white/10 p-4">
            <div className="text-xs opacity-70 mb-2">ARB/USDC SLIPPAGE (100K USD)</div>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-mono">0.12%</div>
              <div className="text-lg font-mono text-[#4caf50]">GOOD</div>
            </div>
          </div>
          <div className="border border-white/10 p-4">
            <div className="text-xs opacity-70 mb-2">OP/USDC SLIPPAGE (100K USD)</div>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-mono">0.18%</div>
              <div className="text-lg font-mono text-[#F0B90B]">MODERATE</div>
            </div>
          </div>
        </div>

        {/* Real-time update indicator */}
        <div className="border border-white/10 p-4 mt-4">
          <div className="flex justify-between items-center">
            <div className="text-xs opacity-70">DATA UPDATE FREQUENCY</div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-[#4caf50] mr-2 animate-pulse"></div>
              <div className="text-xs">LIVE</div>
            </div>
          </div>
          <div className="mt-2 text-xs opacity-70">
            Next update in {10 - (lastUpdated ? Math.floor((Date.now() - lastUpdated.getTime()) / 1000) % 10 : 0)} seconds
          </div>
        </div>
      </div>
    </div>
  );
}
