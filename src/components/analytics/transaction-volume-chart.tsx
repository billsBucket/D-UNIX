"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRealTimeData } from '@/hooks/use-real-time-data';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TransactionData {
  timestamp: string;
  ethereum: number;
  arbitrum: number;
  polygon: number;
  optimism: number;
  bnbchain: number;
}

export default function TransactionVolumeChart() {
  const [chartData, setChartData] = useState<TransactionData[]>([]);
  const [timeframe, setTimeframe] = useState<'1H' | '24H' | '7D'>('24H');
  const [expanded, setExpanded] = useState(true);
  const componentRef = useRef<HTMLDivElement>(null);

  // Use real-time data hook
  const { data: realTimeData, lastUpdate } = useRealTimeData({
    refreshInterval: 30000, // Refresh every 30 seconds
    metrics: ['transactions'] // We only need transaction data
  });

  // Chain configuration with colors and base TPS values
  const chains = [
    { id: 'ethereum', name: 'Ethereum', color: '#627eea', baseTPS: 15 },
    { id: 'arbitrum', name: 'Arbitrum', color: '#28a0f0', baseTPS: 40 },
    { id: 'polygon', name: 'Polygon', color: '#8247e5', baseTPS: 65 },
    { id: 'optimism', name: 'Optimism', color: '#ff0420', baseTPS: 35 },
    { id: 'bnbchain', name: 'BNB Chain', color: '#f0b90b', baseTPS: 55 }
  ];

  // Generate realistic TPS data with time-based patterns
  const generateTPSData = (baseTPS: number, timeframe: string, dataPoints: number, index: number) => {
    const data: number[] = [];
    const now = new Date();

    // Different patterns based on chain and timeframe
    const hourOfDay = now.getHours();
    const isPeakHours = hourOfDay > 9 && hourOfDay < 20;

    // Multiplier based on time of day (higher during peak hours)
    const timeMultiplier = isPeakHours ? 1.2 : 0.8;

    // Multiplier to give chains different patterns
    const chainOffset = index * 0.15;

    for (let i = 0; i < dataPoints; i++) {
      // Base value with some randomness
      let value = baseTPS * (0.9 + (Math.random() * 0.3)) * timeMultiplier;

      // Add time-based patterns
      if (timeframe === '1H') {
        // For 1H view: More short-term fluctuations
        value *= 1 + (Math.sin(i * 0.5 + chainOffset) * 0.15);
      } else if (timeframe === '24H') {
        // For 24H view: Daily patterns
        const hour = (24 + hourOfDay - (dataPoints - i)) % 24;
        value *= 0.85 + (Math.sin((hour / 24) * Math.PI * 2 + chainOffset) * 0.3);
      } else {
        // For 7D view: Weekly patterns with weekend dips
        const dayOfWeek = (7 + now.getDay() - Math.floor((dataPoints - i) / 24)) % 7;
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        value *= isWeekend ? 0.75 : 1 + (Math.sin((dayOfWeek / 7) * Math.PI * 2 + chainOffset) * 0.2);
      }

      // Occasional spikes or dips
      if (Math.random() > 0.95) {
        value *= Math.random() > 0.5 ? 1.5 : 0.6;
      }

      data.push(Math.round(value));
    }

    return data;
  };

  // Update chart data when timeframe changes
  useEffect(() => {
    if (!realTimeData) return;

    let dataPoints = 24; // Default for 24H view

    // Configure based on selected timeframe
    if (timeframe === '1H') {
      dataPoints = 12; // 5-minute intervals for 1H view
    } else if (timeframe === '7D') {
      dataPoints = 28; // 6-hour intervals for 7D view
    }

    // Generate timestamps
    const now = new Date();
    const timestamps: string[] = [];

    for (let i = dataPoints - 1; i >= 0; i--) {
      const time = new Date(now);

      if (timeframe === '1H') {
        time.setMinutes(now.getMinutes() - (i * 5)); // 5-minute intervals
        timestamps.push(`${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`);
      } else if (timeframe === '24H') {
        time.setHours(now.getHours() - i); // 1-hour intervals
        timestamps.push(`${time.getHours().toString().padStart(2, '0')}:00`);
      } else {
        time.setHours(now.getHours() - (i * 6)); // 6-hour intervals
        timestamps.push(`${(time.getMonth() + 1).toString().padStart(2, '0')}/${time.getDate().toString().padStart(2, '0')} ${time.getHours().toString().padStart(2, '0')}h`);
      }
    }

    // Generate TPS data for each chain
    const transactionData: TransactionData[] = timestamps.map((timestamp, i) => {
      const dataPoint: any = { timestamp };

      chains.forEach((chain, index) => {
        const tpsValues = generateTPSData(chain.baseTPS, timeframe, dataPoints, index);
        dataPoint[chain.id] = tpsValues[i];
      });

      return dataPoint;
    });

    setChartData(transactionData);
  }, [timeframe, realTimeData]);

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white/20 p-3 text-xs">
          <p className="font-bold mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center mb-1 last:mb-0">
              <div className="flex items-center">
                <div
                  className="w-2 h-2 mr-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span>{entry.name}:</span>
              </div>
              <span className="ml-4 font-mono">{entry.value} TPS</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Toggle expanded/collapsed state
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="w-full border border-white/10" ref={componentRef}>
      <div className="flex justify-between items-center p-4 border-b border-white/10">
        <div className="flex items-center">
          <h2 className="text-lg md:text-xl font-mono uppercase">TRANSACTION VOLUME</h2>
          <button
            onClick={toggleExpanded}
            className="ml-2 p-1 hover:bg-white/10 rounded-sm"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        <div className="flex">
          <button
            className={`px-3 py-1 border border-white/20 text-xs ${timeframe === '1H' ? 'bg-white/10' : 'bg-transparent'}`}
            onClick={() => setTimeframe('1H')}
          >
            1H
          </button>
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
        </div>
      </div>

      {expanded && (
        <>
          <div className="p-4 pt-2">
            <div className="text-xs opacity-70 mb-2">
              TRANSACTIONS PER SECOND (TPS) ACROSS MULTIPLE CHAINS
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.7)' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.7)' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    align="right"
                    verticalAlign="top"
                    wrapperStyle={{ fontSize: '10px', marginTop: '-25px' }}
                  />
                  {chains.map(chain => (
                    <Line
                      key={chain.id}
                      type="monotone"
                      dataKey={chain.id}
                      name={chain.name}
                      stroke={chain.color}
                      dot={false}
                      strokeWidth={1.5}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Network Stats Table */}
          <div className="border-t border-white/10 px-4 py-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2">NETWORK</th>
                  <th className="text-right py-2">CURRENT TPS</th>
                  <th className="text-right py-2">PEAK TPS ({timeframe})</th>
                  <th className="text-right py-2">AVG TPS ({timeframe})</th>
                </tr>
              </thead>
              <tbody>
                {chains.map((chain, index) => {
                  // Calculate stats
                  const currentTPS = chartData.length > 0 ? chartData[chartData.length - 1][chain.id as keyof TransactionData] : 0;
                  const allTPS = chartData.map(d => d[chain.id as keyof TransactionData] as number);
                  const peakTPS = allTPS.length > 0 ? Math.max(...allTPS) : 0;
                  const avgTPS = allTPS.length > 0 ? Math.round(allTPS.reduce((sum, val) => sum + val, 0) / allTPS.length) : 0;

                  return (
                    <tr key={chain.id} className="border-b border-white/5">
                      <td className="py-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: chain.color }}></div>
                          {chain.name}
                        </div>
                      </td>
                      <td className="text-right py-2 font-mono">{currentTPS}</td>
                      <td className="text-right py-2 font-mono">{peakTPS}</td>
                      <td className="text-right py-2 font-mono">{avgTPS}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="text-right text-xs opacity-60 p-2 border-t border-white/10">
        DATA REFRESHED AT {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
