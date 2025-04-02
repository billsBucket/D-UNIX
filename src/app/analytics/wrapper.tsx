"use client";

import React, { useState, useEffect } from 'react';
import Navbar from "@/components/navbar";
import AppSkeleton from "@/components/app-skeleton";
import { Button } from '@/components/ui/button';
import { useRealTimeData } from '@/hooks/use-real-time-data';
import TransactionVolumeChart from '@/components/transaction-volume-chart';

// Interface for gas chart data
interface GasChartData {
  ethereum: number[];
  polygon: number[];
  bnb: number[];
  arbitrum: number[];
  optimism: number[];
  timestamps: string[];
}

export default function AnalyticsWrapper() {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTimeframe, setActiveTimeframe] = useState('24h');
  const [gasChartData, setGasChartData] = useState<GasChartData>({
    ethereum: [],
    polygon: [],
    bnb: [],
    arbitrum: [],
    optimism: [],
    timestamps: []
  });

  // Use real-time data hook instead of manual initialization
  const { data: realTimeData, lastUpdate, refresh } = useRealTimeData({
    refreshInterval: 10000, // Refresh every 10 seconds
    metrics: ['all'] // We need all metrics for this page
  });

  // Update lastUpdated whenever we get new data
  useEffect(() => {
    if (lastUpdate) {
      setLastUpdated(lastUpdate);
    }
  }, [lastUpdate]);

  // Check if we're on a mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Set initial value
    checkIfMobile();

    // Add event listener
    window.addEventListener('resize', checkIfMobile);

    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Process gas price data for charts
  useEffect(() => {
    if (!realTimeData) return;

    try {
      // Extract gas price history for the main chains
      const ethereum = realTimeData.gasPrices["1"]?.history || [];
      const polygon = realTimeData.gasPrices["137"]?.history || [];
      const bnb = realTimeData.gasPrices["56"]?.history || [];
      const arbitrum = realTimeData.gasPrices["42161"]?.history || [];
      const optimism = realTimeData.gasPrices["10"]?.history || [];

      // If we have no data, return
      if (ethereum.length === 0) return;

      // Format for the chart - we'll use the last 24 data points (24 hours if 1 hour intervals)
      const lastEntries = 24;
      const formattedData: GasChartData = {
        ethereum: [],
        polygon: [],
        bnb: [],
        arbitrum: [],
        optimism: [],
        timestamps: []
      };

      // Calculate the start index to get the last entries
      const startIndex = Math.max(0, ethereum.length - lastEntries);

      // Process the data
      for (let i = startIndex; i < ethereum.length; i++) {
        formattedData.ethereum.push(ethereum[i].standard);
        formattedData.polygon.push(polygon[i]?.standard || 0);
        formattedData.bnb.push(bnb[i]?.standard || 0);
        formattedData.arbitrum.push(arbitrum[i]?.standard || 0);
        formattedData.optimism.push(optimism[i]?.standard || 0);

        // Format timestamp as hour:minute
        const date = new Date(ethereum[i].timestamp);
        formattedData.timestamps.push(
          `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
        );
      }

      setGasChartData(formattedData);
    } catch (error) {
      console.error('Error processing gas chart data:', error);
    }
  }, [realTimeData]);

  // Helper function to generate SVG path for charts
  const generateChartPath = (dataPoints: number[]): string => {
    if (!dataPoints || dataPoints.length < 2) return '';

    // Normalize values to fit in our chart height (0-100 range)
    const max = Math.max(...dataPoints);
    const normalizedPoints = dataPoints.map(point => 100 - (point / max * 80)); // Leave room at top/bottom

    // Calculate width between points
    const width = 900 / (normalizedPoints.length - 1);

    // Start with the first point
    let path = `M0,${normalizedPoints[0]}`;

    // Add the rest as cubic bezier curves for smoothness
    for (let i = 1; i < normalizedPoints.length; i++) {
      const x = i * width;
      const y = normalizedPoints[i];

      // For simplicity, use basic cubic bezier with control points at 1/3 and 2/3 distances
      const prevX = (i - 1) * width;
      const prevY = normalizedPoints[i - 1];

      const cp1x = prevX + width / 3;
      const cp1y = prevY;
      const cp2x = prevX + 2 * width / 3;
      const cp2y = y;

      path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${x},${y}`;
    }

    return path;
  };

  return (
    <AppSkeleton>
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <div className="container mx-auto px-3 md:px-4 pt-16 md:pt-20 pb-8">
          {/* Page Title */}
          <h1 className="text-2xl md:text-4xl font-mono uppercase tracking-widest border-b border-white/10 pb-3 mb-4 md:mb-6">
            CHAIN ANALYTICS
          </h1>

          {/* Transaction Volume Chart - Full Width */}
          <div className="dunix-card border border-white/10 p-3 md:p-4 mb-6">
            <div className="flex justify-between items-start md:items-center mb-4 flex-col md:flex-row gap-2 md:gap-0">
              <h2 className="text-lg md:text-xl font-mono uppercase">TRANSACTION VOLUME ANALYSIS</h2>
              <div className="mobile-scroll-container w-full md:w-auto">
                <div className="flex gap-1 min-w-[250px] justify-end">
                  <button
                    className={`px-2 py-1 border border-white/20 text-xs ${activeTimeframe === '24h' ? 'bg-white/10' : ''}`}
                    onClick={() => setActiveTimeframe('24h')}
                  >
                    24H
                  </button>
                  <button
                    className={`px-2 py-1 border border-white/20 text-xs ${activeTimeframe === '7d' ? 'bg-white/10' : ''}`}
                    onClick={() => setActiveTimeframe('7d')}
                  >
                    7D
                  </button>
                  <button
                    className={`px-2 py-1 border border-white/20 text-xs ${activeTimeframe === '30d' ? 'bg-white/10' : ''}`}
                    onClick={() => setActiveTimeframe('30d')}
                  >
                    30D
                  </button>
                  <button
                    className={`px-2 py-1 border border-white/20 text-xs ${activeTimeframe === 'txs' ? 'bg-white/10' : ''}`}
                    onClick={() => setActiveTimeframe('txs')}
                  >
                    TXs
                  </button>
                  <button
                    className={`px-2 py-1 border border-white/20 text-xs ${activeTimeframe === 'avg' ? 'bg-white/10' : ''}`}
                    onClick={() => setActiveTimeframe('avg')}
                  >
                    AVG
                  </button>
                </div>
              </div>
            </div>

            {/* Replace the empty chart with our new component */}
            <TransactionVolumeChart />
          </div>

          {/* Footer - Data Refresh Indicator */}
          <div className="text-xs text-right mt-6 opacity-70">
            DATA REFRESHED: {lastUpdated ? lastUpdated.toISOString().replace('T', ' ').substring(0, 19) + ' UTC' : '2025-03-24 19:05:32 UTC'}
          </div>
        </div>
      </main>
    </AppSkeleton>
  );
}
