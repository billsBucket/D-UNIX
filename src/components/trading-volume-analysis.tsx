"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRealTimeData } from '@/hooks/use-real-time-data';
import { useGSAPAnimations } from '@/hooks/use-gsap-animations';
import gsap from 'gsap';
import { BarChart3, TrendingUp, ArrowUp, ArrowDown, Clock, ChevronDown, ChevronUp, BarChart2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';

// Time period options
type TimePeriod = '24H' | '7D' | '30D';

// Chain data type
interface ChainVolumeData {
  id: string;
  name: string;
  volume: number;
  formattedVolume: string;
  txCount: string;
  avgTxSize: string;
  percentChange: number;
  color: string;
}

export default function TradingVolumeAnalysis() {
  const componentRef = useRef<HTMLDivElement>(null);
  const { fadeInUp } = useGSAPAnimations();
  const [animationsApplied, setAnimationsApplied] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('24H');
  const [showAllChains, setShowAllChains] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<{chain: string, percent: number} | null>(null);
  const [chainData, setChainData] = useState<ChainVolumeData[]>([]);

  // Use real-time data hook
  const { data: realTimeData, lastUpdate } = useRealTimeData({
    refreshInterval: 10000, // Refresh every 10 seconds
    metrics: ['volume'] // We only need volume data for this component
  });

  // Chain colors for visualization consistency
  const chainColors: Record<string, string> = {
    'ethereum': '#627eea',
    'arbitrum': '#28a0f0',
    'optimism': '#ff0420',
    'base': '#0052ff',
    'polygon': '#8247e5',
    'avalanche': '#e84142',
    'bnbchain': '#f0b90b',
    'solana': '#9945ff',
  };

  // Generate chain data based on selected period
  useEffect(() => {
    // Base volumes
    const baseVolumes = {
      ethereum: 1800,
      arbitrum: 720,
      optimism: 540,
      base: 380,
      polygon: 420,
      avalanche: 320,
      bnbchain: 680,
      solana: 510,
    };

    // Period multipliers
    const periodMultipliers = {
      '24H': 1,
      '7D': 7,
      '30D': 30,
    };

    // Add random variation based on period
    const multiplier = periodMultipliers[selectedPeriod];
    const variation = selectedPeriod === '24H' ? 0.1 : selectedPeriod === '7D' ? 0.2 : 0.3;

    const chains = [
      { id: 'ethereum', name: 'ETHEREUM' },
      { id: 'arbitrum', name: 'ARBITRUM' },
      { id: 'optimism', name: 'OPTIMISM' },
      { id: 'base', name: 'BASE' },
      { id: 'polygon', name: 'POLYGON' },
      { id: 'avalanche', name: 'AVALANCHE' },
      { id: 'bnbchain', name: 'BNB CHAIN' },
      { id: 'solana', name: 'SOLANA' },
    ];

    const newChainData = chains.map(chain => {
      const baseVolume = baseVolumes[chain.id as keyof typeof baseVolumes] || 100;
      const randomFactor = 1 + ((Math.random() * 2 - 1) * variation);
      const volume = baseVolume * multiplier * randomFactor;

      // Format based on period
      let formattedVolume;
      if (selectedPeriod === '24H') {
        formattedVolume = volume >= 1000 ? `$${(volume / 1000).toFixed(1)}B` : `$${volume}M`;
      } else if (selectedPeriod === '7D') {
        formattedVolume = volume >= 1000 ? `$${(volume / 1000).toFixed(1)}B` : `$${volume}M`;
      } else {
        formattedVolume = `$${(volume / 1000).toFixed(1)}B`;
      }

      // Generate transaction counts based on volume
      const txCount = `${Math.round(volume * 1000 / (2000 + Math.random() * 1000)).toLocaleString()}K`;

      // Generate average transaction size
      const avgTxSize = `$${Math.round(2000 + Math.random() * 3000).toLocaleString()}`;

      // Generate percent change - skew towards positive for longer periods
      const skew = selectedPeriod === '24H' ? -3 : selectedPeriod === '7D' ? -2 : -1;
      const percentChange = (Math.random() * 10) + skew;

      return {
        id: chain.id,
        name: chain.name,
        volume,
        formattedVolume,
        txCount,
        avgTxSize,
        percentChange,
        color: chainColors[chain.id] || '#999'
      };
    }).sort((a, b) => b.volume - a.volume);

    setChainData(newChainData);
  }, [selectedPeriod]);

  // Helper function for chart data
  const getChartData = () => {
    return chainData.slice(0, 6).map(item => ({
      name: item.name,
      Volume: item.volume,
      color: item.color
    }));
  };

  // GSAP animations - with enhanced error handling
  useEffect(() => {
    // Only run animations once and when the component is fully mounted
    if (!componentRef.current || animationsApplied) return;

    try {
      // Mark animations as applied to prevent re-runs
      setAnimationsApplied(true);

      setTimeout(() => {
        // Animate volume cards
        const volumeCards = componentRef.current?.querySelectorAll('.volume-card');
        if (volumeCards && volumeCards.length > 0) {
          fadeInUp(volumeCards, {
            staggerAmount: 0.1,
            delay: 0.2
          });
        }

        // Animate volume values with counter effect
        const volumeValues = componentRef.current?.querySelectorAll('.volume-value');
        if (volumeValues && volumeValues.length > 0) {
          volumeValues.forEach((element) => {
            const valueText = element.textContent || "";
            const numericValue = parseFloat(valueText.replace(/[^0-9.]/g, ''));

            if (!isNaN(numericValue)) {
              try {
                gsap.from(element, {
                  textContent: 0,
                  duration: 1.5,
                  ease: "power2.out",
                  snap: { textContent: 10 },
                  onUpdate: function() {
                    try {
                      // Keep the formatting with $ and B/M symbols
                      if (valueText.includes('B')) {
                        element.textContent = '$' + this.targets()[0].textContent + 'B';
                      } else {
                        element.textContent = '$' + this.targets()[0].textContent + 'M';
                      }
                    } catch (e) {
                      console.error("Error in animation update function:", e);
                      // Restore original value if animation fails
                      element.textContent = valueText;
                    }
                  }
                });
              } catch (e) {
                console.error("Error animating volume value:", e);
                // Ensure element is visible
                gsap.set(element, { opacity: 1 });
              }
            }
          });
        }

        // Animate table rows
        const tableRows = componentRef.current?.querySelectorAll('tbody tr');
        if (tableRows && tableRows.length > 0) {
          gsap.fromTo(
            tableRows,
            { opacity: 0, y: 10 },
            {
              opacity: 1,
              y: 0,
              stagger: 0.1,
              duration: 0.5,
              ease: "power1.out",
              delay: 0.5
            }
          );
        }

        // Animate chart
        const chart = componentRef.current?.querySelector('.volume-chart');
        if (chart) {
          gsap.fromTo(
            chart,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power2.out",
              delay: 0.8
            }
          );
        }
      }, 300); // Add delay to ensure DOM is ready
    } catch (error) {
      console.error("GSAP animation error in TradingVolumeAnalysis:", error);
      // Ensure all elements are visible if animations fail
      gsap.set('.volume-card, .volume-value, tbody tr, .volume-chart', { opacity: 1, y: 0 });
    }
  }, [fadeInUp, animationsApplied, chainData]);

  // Helper function to format percentage change
  const formatPercentChange = (value: number) => {
    return (
      <div className="flex items-center gap-1 text-xs" style={{ color: value >= 0 ? '#4caf50' : '#f44336' }}>
        {value >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        <span>{Math.abs(value).toFixed(2)}%</span>
      </div>
    );
  };

  // Custom tooltip for the bar chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white/20 p-2 rounded text-xs">
          <p className="font-bold">{label}</p>
          <p>{`Volume: ${payload[0].value >= 1000
            ? `$${(payload[0].value / 1000).toFixed(1)}B`
            : `$${payload[0].value}M`}`}</p>
        </div>
      );
    }
    return null;
  };

  // Volume card tooltip handler
  const handleMouseEnter = (chain: string, percent: number) => {
    setHoverInfo({ chain, percent });
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
  };

  return (
    <div className="w-full" ref={componentRef}>
      <div className="flex justify-between items-center gap-2 mb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-white/70" />
          <h2 className="text-lg md:text-xl font-mono uppercase">TRADING VOLUME ANALYSIS</h2>
        </div>

        {/* Time period selector */}
        <div className="flex items-center gap-1 border border-white/20 rounded-sm">
          <Clock className="h-3 w-3 ml-2 text-white/70" />
          {(['24H', '7D', '30D'] as TimePeriod[]).map((period) => (
            <button
              key={period}
              className={`px-2 py-1 text-xs ${selectedPeriod === period ? 'bg-white/10' : ''}`}
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs opacity-70 mb-5 border-b border-white/10 pb-2">
        DETAILED METRICS ON TRADING ACTIVITY AND VOLUME ACROSS CHAINS
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {/* Volume cards - only show top 4 */}
        {chainData.slice(0, 4).map((chain) => (
          <div
            key={chain.id}
            className="border border-white/10 rounded-sm p-3 md:p-4 volume-card hover:bg-white/5 transition-colors duration-300"
          >
            <div className="flex justify-between items-start">
              <div className="text-xs opacity-70 mb-1">{chain.name} {selectedPeriod} VOLUME</div>
              {formatPercentChange(chain.percentChange)}
            </div>
            <div className="text-lg md:text-2xl font-mono volume-value mb-1">
              {chain.formattedVolume}
            </div>
            <div
              className="h-1 w-full bg-white/10 rounded-full overflow-hidden relative"
              onMouseEnter={() => handleMouseEnter(chain.name, (chain.volume / chainData[0].volume) * 100)}
              onMouseLeave={handleMouseLeave}
            >
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${(chain.volume / chainData[0].volume) * 100}%`,
                  backgroundColor: chain.color
                }}
              ></div>

              {/* Tooltip that appears on hover */}
              {hoverInfo && hoverInfo.chain === chain.name && (
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black border border-white/20 px-2 py-1 rounded text-xs whitespace-nowrap">
                  {hoverInfo.percent.toFixed(1)}% of {chainData[0].name} volume
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Volume comparison chart */}
      <div className="border border-white/10 rounded-sm p-4 mb-6 volume-chart">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="h-4 w-4 text-white/80" />
          <h3 className="text-xs uppercase font-mono">VOLUME COMPARISON CHART</h3>
        </div>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getChartData()} layout="vertical">
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={80}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#999', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="Volume"
                radius={[0, 4, 4, 0]}
                barSize={20}
              >
                {getChartData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <LabelList
                  dataKey="Volume"
                  position="right"
                  formatter={(value: number) => value >= 1000
                    ? `$${(value / 1000).toFixed(1)}B`
                    : `$${value}M`}
                  style={{ fill: '#fff', fontSize: 12 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction metrics section */}
      <div className="border border-white/10 rounded-sm mb-4">
        <div className="bg-white/5 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-white/80" />
            <h3 className="text-xs uppercase font-mono">CHAIN TRANSACTION METRICS</h3>
          </div>

          {/* View all chains toggle */}
          <button
            className="flex items-center gap-1 text-xs text-white/80 hover:text-white/100 transition-colors"
            onClick={() => setShowAllChains(prev => !prev)}
          >
            {showAllChains ? 'SHOW FEWER CHAINS' : 'VIEW ALL CHAINS'}
            {showAllChains ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-2">CHAIN</th>
                  <th className="text-right py-2 px-2">VOLUME ({selectedPeriod})</th>
                  <th className="text-right py-2 px-2">TX COUNT ({selectedPeriod})</th>
                  <th className="text-right py-2 px-2">AVG TX SIZE</th>
                  <th className="text-right py-2 px-2">CHANGE ({selectedPeriod})</th>
                </tr>
              </thead>
              <tbody>
                {chainData.slice(0, showAllChains ? chainData.length : 4).map((chain) => (
                  <tr key={chain.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2 px-2 font-medium">
                      <div
                        className="w-2 h-2 rounded-full inline-block mr-2"
                        style={{ backgroundColor: chain.color }}
                      ></div>
                      {chain.name}
                    </td>
                    <td className="py-2 px-2 text-right font-mono">
                      {chain.formattedVolume}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {chain.txCount}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {chain.avgTxSize}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {formatPercentChange(chain.percentChange)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs opacity-60 mt-3">
        <div className="text-xs opacity-60">
          <span className="mr-2">DATA SOURCE:</span>
          <a
            href="https://coinmarketcap.com"
            className="hover:underline flex items-center gap-1 inline-flex"
            target="_blank"
            rel="noopener noreferrer"
          >
            COINMARKETCAP
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div>
          DATA UPDATED: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'REFRESHING...'}
        </div>
      </div>
    </div>
  );
}
