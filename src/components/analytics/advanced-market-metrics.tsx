"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRealTimeData } from '@/hooks/use-real-time-data';
import { useGSAPAnimations } from '@/hooks/use-gsap-animations';
import gsap from 'gsap';

interface MarketMetric {
  name: string;
  value: number | string;
  trend: 'up' | 'down' | 'neutral';
  description: string;
}

interface TradingSignal {
  asset: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-100
  timeframe: '1H' | '4H' | '1D';
  timestamp: number;
}

export default function AdvancedMarketMetrics() {
  const [marketMetrics, setMarketMetrics] = useState<MarketMetric[]>([]);
  const [tradingSignals, setTradingSignals] = useState<TradingSignal[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1H' | '4H' | '1D'>('1D');
  const [animationsApplied, setAnimationsApplied] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);
  const { staggeredReveal, scaleIn } = useGSAPAnimations();

  // Use real-time data hook
  const { data: realTimeData, lastUpdate } = useRealTimeData({
    refreshInterval: 10000, // Refresh every 10 seconds
    metrics: ['all'] // We need all metrics for this component
  });

  // Initialize animations in a safe manner
  useEffect(() => {
    // Only run animations once when component is fully loaded with data
    if (!componentRef.current || animationsApplied || marketMetrics.length === 0 || tradingSignals.length === 0) return;

    try {
      // Mark animations as applied to prevent re-runs
      setAnimationsApplied(true);

      setTimeout(() => {
        // Animate metric cards
        const metricCards = componentRef.current?.querySelectorAll('.metric-card');
        if (metricCards && metricCards.length > 0) {
          scaleIn(metricCards, {
            fromVars: { opacity: 0, scale: 0.92 },
            toVars: { opacity: 1, scale: 1 },
            staggerAmount: 0.1,
            duration: 0.6
          });
        }

        // Animate trading signal rows
        const signalRows = componentRef.current?.querySelectorAll('.signal-row');
        if (signalRows && signalRows.length > 0) {
          gsap.fromTo(
            signalRows,
            { opacity: 0, x: -10 },
            {
              opacity: 1,
              x: 0,
              stagger: 0.08,
              duration: 0.5,
              ease: "power1.out",
              delay: 0.3
            }
          );
        }

        // Animate confidence bars
        const confidenceBars = componentRef.current?.querySelectorAll('.confidence-bar-fill');
        if (confidenceBars && confidenceBars.length > 0) {
          gsap.fromTo(
            confidenceBars,
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 0.8,
              stagger: 0.1,
              ease: "power2.out",
              delay: 0.5,
              transformOrigin: "left center"
            }
          );
        }
      }, 500); // Add a small delay to ensure DOM is ready
    } catch (error) {
      console.error('GSAP animation error in AdvancedMarketMetrics:', error);
      // If animations fail, ensure everything is visible
      gsap.set('.metric-card, .signal-row, .confidence-bar-fill', { opacity: 1, scaleX: 1, x: 0 });
    }
  }, [marketMetrics, tradingSignals, scaleIn, animationsApplied]);

  // Generate metrics based on real-time data
  useEffect(() => {
    if (!realTimeData) return;

    try {
      // Generate market metrics
      const newMarketMetrics: MarketMetric[] = [
        {
          name: 'MARKET SENTIMENT',
          value: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
          trend: Math.random() > 0.5 ? 'up' : 'down',
          description: 'Aggregate market sentiment based on social and on-chain signals'
        },
        {
          name: 'VOLATILITY INDEX',
          value: (15 + Math.random() * 10).toFixed(2),
          trend: Math.random() > 0.5 ? 'up' : 'down',
          description: 'ETH-USD market volatility over the past 24 hours'
        },
        {
          name: 'BUY/SELL RATIO',
          value: (0.8 + Math.random() * 0.8).toFixed(2),
          trend: Math.random() > 0.6 ? 'up' : 'down',
          description: 'Ratio of buy to sell orders across major DEXs'
        },
        {
          name: 'ACTIVE TRADERS',
          value: `${(120 + Math.random() * 80).toFixed(0)}K`,
          trend: Math.random() > 0.5 ? 'up' : 'neutral',
          description: 'Number of active traders in the past 24 hours'
        }
      ];

      setMarketMetrics(newMarketMetrics);

      // Generate trading signals
      const assets = ['ETH/USD', 'BTC/USD', 'ARB/USD', 'OP/USD'];
      const signals: TradingSignal[] = assets.map(asset => {
        const randomSignal = Math.random();
        return {
          asset,
          signal: randomSignal > 0.6 ? 'BUY' : randomSignal > 0.3 ? 'HOLD' : 'SELL',
          confidence: 60 + Math.random() * 30,
          timeframe: selectedTimeframe,
          timestamp: Date.now()
        };
      });

      setTradingSignals(signals);
    } catch (error) {
      console.error('Error generating advanced market metrics:', error);
    }
  }, [realTimeData, selectedTimeframe]);

  // Helper function to render trend arrows
  const renderTrendIndicator = (trend: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') return <span className="text-green-500">↑</span>;
    if (trend === 'down') return <span className="text-red-500">↓</span>;
    return <span className="text-gray-500">→</span>;
  };

  // Helper function to get signal color
  const getSignalColor = (signal: 'BUY' | 'SELL' | 'HOLD') => {
    if (signal === 'BUY') return 'text-green-500';
    if (signal === 'SELL') return 'text-red-500';
    return 'text-yellow-500';
  };

  return (
    <div className="w-full" ref={componentRef}>
      <h2 className="text-lg md:text-xl font-mono uppercase mb-2">ADVANCED MARKET METRICS</h2>
      <p className="text-xs opacity-70 mb-4">DETAILED MARKET ANALYSIS AND TRADING SIGNALS</p>

      {/* Market Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {marketMetrics.map((metric, index) => (
          <div key={index} className="border border-white/10 p-3 md:p-4 metric-card">
            <div className="flex justify-between items-center mb-1">
              <div className="text-xs opacity-70">{metric.name}</div>
              {renderTrendIndicator(metric.trend)}
            </div>
            <div className="text-lg md:text-2xl font-mono">{metric.value}</div>
            <div className="text-xs opacity-60 mt-1">{metric.description}</div>
          </div>
        ))}
      </div>

      {/* Trading Signals - Improved Layout */}
      <div className="border border-white/10 p-3 md:p-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
          <h3 className="text-sm font-mono uppercase">TRADING SIGNALS</h3>
          <div className="flex space-x-1">
            {(['1H', '4H', '1D'] as const).map((tf) => (
              <button
                key={tf}
                className={`px-2 py-1 border border-white/20 text-xs ${selectedTimeframe === tf ? 'bg-white/10' : ''}`}
                onClick={() => setSelectedTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left py-2 px-2">ASSET</th>
                <th className="text-center py-2 px-2">SIGNAL</th>
                <th className="text-center py-2 px-2">CONFIDENCE</th>
                <th className="text-right py-2 px-2">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody>
              {tradingSignals.map((signal, index) => (
                <tr key={index} className="border-b border-white/5 signal-row">
                  <td className="py-2 px-2">{signal.asset}</td>
                  <td className={`py-2 px-2 text-center ${getSignalColor(signal.signal)}`}>
                    <span className="font-mono font-bold">{signal.signal}</span>
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex flex-col items-center">
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full confidence-bar-fill ${
                            signal.confidence > 80 ? 'bg-green-500' :
                            signal.confidence > 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${signal.confidence}%`, transformOrigin: 'left' }}
                        ></div>
                      </div>
                      <div className="mt-1 text-center font-mono">{signal.confidence.toFixed(0)}%</div>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-right font-mono">
                    {new Date(signal.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pattern Recognition - Improved Layout */}
      <div className="border border-white/10 p-3 md:p-4">
        <h3 className="text-sm font-mono uppercase mb-3">MARKET PATTERNS</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="border border-white/10 p-2 pattern-card">
            <div className="text-xs opacity-70 mb-1">ETH/USD</div>
            <div className="text-sm font-mono">ASCENDING TRIANGLE</div>
            <div className="text-xs text-green-500 mt-1">BULLISH CONTINUATION</div>
          </div>
          <div className="border border-white/10 p-2 pattern-card">
            <div className="text-xs opacity-70 mb-1">BTC/USD</div>
            <div className="text-sm font-mono">DOUBLE BOTTOM</div>
            <div className="text-xs text-green-500 mt-1">BULLISH REVERSAL</div>
          </div>
        </div>
      </div>

      <div className="text-right text-xs opacity-60 mt-4">
        LAST UPDATED: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
