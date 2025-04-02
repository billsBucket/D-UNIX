"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChainStatus } from './chain-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface ChainComparisonProps {
  chainsData: ChainStatus[];
}

// Define tooltip props interface
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      unit: string;
      color: string;
    }
  }>;
  label?: string;
}

// Define chart data interface
interface ChartDataItem {
  name: string;
  value: number;
  color: string;
  unit: string;
}

export default function ChainComparison({ chainsData }: ChainComparisonProps) {
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [metricType, setMetricType] = useState<'gas' | 'tps' | 'time'>('time');
  const [comparisonData, setComparisonData] = useState<{
    id: string;
    name: string;
    image: string;
    color: string;
    value: number;
    percentage: number;
    unit: string;
  }[]>([]);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [viewMode, setViewMode] = useState<'bars' | 'chart'>('bars');

  // Max number of chains that can be selected
  const MAX_SELECTED_CHAINS = 4;

  // Initialize with some default selected chains if data is available
  useEffect(() => {
    if (chainsData.length > 0 && selectedChains.length === 0) {
      // Default to first 4 chains or less if fewer are available
      const initialSelected = chainsData
        .slice(0, Math.min(MAX_SELECTED_CHAINS, chainsData.length))
        .map(chain => chain.id);
      setSelectedChains(initialSelected);
    }
  }, [chainsData, selectedChains.length]);

  // Update comparison data when selected chains or metric type changes
  useEffect(() => {
    if (selectedChains.length === 0 || chainsData.length === 0) return;

    const filteredChains = chainsData.filter(chain => selectedChains.includes(chain.id));

    // Get metric value based on selected type
    const getMetricValue = (chain: ChainStatus) => {
      switch (metricType) {
        case 'gas': return chain.gas;
        case 'tps': return chain.tps;
        case 'time': return parseFloat(chain.time.replace('s', ''));
        default: return chain.gas;
      }
    };

    // Get unit based on selected metric
    const getUnit = () => {
      switch (metricType) {
        case 'gas': return 'gwei';
        case 'tps': return 'tx/s';
        case 'time': return 's';
        default: return 'gwei';
      }
    };

    // Sort chains based on metric
    const sortedChains = [...filteredChains].sort((a, b) => {
      // For gas and time, lower is better, for TPS higher is better
      const aValue = getMetricValue(a);
      const bValue = getMetricValue(b);

      return metricType === 'tps'
        ? bValue - aValue // Higher TPS is better
        : aValue - bValue; // Lower gas/time is better
    });

    // Calculate the maximum value for scale
    const maxValue = Math.max(...sortedChains.map(chain => getMetricValue(chain)));
    const baseUnit = getUnit();

    // Create comparison data objects
    const data = sortedChains.map(chain => {
      const value = getMetricValue(chain);
      // For TPS, higher is better so reverse the percentage
      const percentage = metricType === 'tps'
        ? (value / maxValue) * 100
        : (1 - (value / maxValue)) * 100;

      return {
        id: chain.id,
        name: chain.name,
        image: chain.image,
        color: chain.color,
        value,
        percentage: Math.max(5, percentage), // Ensure at least 5% width for visibility
        unit: baseUnit
      };
    });

    setComparisonData(data);

    // Update chart data
    const chartItems: ChartDataItem[] = data.map(item => ({
      name: item.name,
      value: item.value,
      color: item.color,
      unit: item.unit
    }));

    setChartData(chartItems);
  }, [selectedChains, metricType, chainsData]);

  // Toggle chain selection
  const toggleChainSelection = (chainId: string) => {
    if (selectedChains.includes(chainId)) {
      // Remove from selection
      setSelectedChains(prev => prev.filter(id => id !== chainId));
    } else if (selectedChains.length < MAX_SELECTED_CHAINS) {
      // Add to selection if under max limit
      setSelectedChains(prev => [...prev, chainId]);
    }
  };

  // Handle metric type change
  const handleMetricChange = (metric: 'gas' | 'tps' | 'time') => {
    setMetricType(metric);
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white/20 p-2 text-xs">
          <p className="font-mono">{`${payload[0].name}: ${payload[0].value} ${payload[0].payload.unit}`}</p>
        </div>
      );
    }
    return null;
  };

  // Get unit label
  const getUnitLabel = () => {
    switch (metricType) {
      case 'gas': return 'gwei';
      case 'tps': return 'tx/s';
      case 'time': return 's';
      default: return 'gwei';
    }
  };

  // Get metric type display name
  const getMetricDisplayName = () => {
    switch (metricType) {
      case 'gas': return 'GAS PRICE';
      case 'tps': return 'TRANSACTION SPEED';
      case 'time': return 'BLOCK TIME';
      default: return 'GAS PRICE';
    }
  };

  return (
    <div className="border border-white/20 bg-black/50 mb-6">
      <div className="border-b border-white/20 px-4 py-3 flex justify-between items-center">
        <h2 className="font-mono uppercase text-white">CHAIN COMPARISON</h2>
        <div className="flex">
          <button
            onClick={() => setViewMode('bars')}
            className={`px-4 py-1 border border-white/20 text-xs ${viewMode === 'bars' ? 'bg-white/20' : 'bg-black/50'}`}
          >
            BARS
          </button>
          <button
            onClick={() => setViewMode('chart')}
            className={`px-4 py-1 border-l-0 border border-white/20 text-xs ${viewMode === 'chart' ? 'bg-white/20' : 'bg-black/50'}`}
          >
            CHART
          </button>
        </div>
      </div>

      {/* Chain Selection */}
      <div className="border-b border-white/20 p-3">
        <div className="text-xs text-white/70 mb-3 font-mono">
          SELECT CHAINS TO COMPARE (MAX {MAX_SELECTED_CHAINS})
        </div>

        <div className="flex flex-wrap gap-2">
          {chainsData.map(chain => (
            <button
              key={chain.id}
              onClick={() => toggleChainSelection(chain.id)}
              className={`
                flex items-center gap-2 px-3 py-2 border border-white/20 text-xs
                ${selectedChains.includes(chain.id) ? 'bg-white/20' : 'bg-black/50'}
                hover:bg-white/10 transition-colors
              `}
            >
              <Image
                src={chain.image}
                alt={chain.name}
                width={16}
                height={16}
                className="w-4 h-4"
              />
              {chain.name}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Selection */}
      <div className="border-b border-white/20 p-3">
        <div className="flex justify-end">
          <select
            value={metricType}
            onChange={(e) => handleMetricChange(e.target.value as 'gas' | 'tps' | 'time')}
            className="bg-black border border-white/20 text-white text-xs p-1 px-3"
          >
            <option value="gas">GAS PRICE</option>
            <option value="tps">TRANSACTION SPEED</option>
            <option value="time">BLOCK TIME</option>
          </select>
        </div>
      </div>

      {/* Comparison Results */}
      <div className="p-4">
        <div className="text-xs text-white/70 mb-1 font-mono text-right">
          UNIT: {getUnitLabel()}
        </div>

        {viewMode === 'bars' ? (
          // Bar visualization view
          <div className="space-y-5">
            {comparisonData.map(item => (
              <div key={item.id} className="mb-1">
                <div className="flex items-center gap-2 mb-1">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                  <div className="text-sm">{item.name}</div>
                  <div className="ml-auto text-sm font-mono">{item.value} {item.unit}</div>
                </div>
                <div className="h-2 bg-gray-900 w-full">
                  <div
                    className="h-full"
                    style={{
                      width: `${metricType === 'tps' ?
                        (item.value / Math.max(...comparisonData.map(d => d.value)) * 100) :
                        (1 - (item.value / Math.max(...comparisonData.map(d => d.value))) + 0.05) * 95}%`,
                      backgroundColor: item.color
                    }}
                  ></div>
                </div>
              </div>
            ))}
            <div className="text-xs text-white/60 mt-3 text-center font-mono">
              {metricType === 'gas' || metricType === 'time' ? 'LOWER IS BETTER' : 'HIGHER IS BETTER'}
            </div>
          </div>
        ) : (
          // Chart view using recharts
          <div className="mt-4" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                <XAxis
                  type="number"
                  domain={metricType === 'tps' ? [0, 'dataMax'] : [0, 'dataMax']}
                  tick={{ fill: '#FFFFFF80', fontSize: 10 }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: '#FFFFFF80', fontSize: 10 }}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="value"
                  isAnimationActive={true}
                  animationDuration={500}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
