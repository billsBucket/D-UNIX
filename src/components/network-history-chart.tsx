"use client";

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { NetworkHistoryEntry } from '@/lib/network-history';
import { NetworkStatus } from '@/lib/ethereum';

interface NetworkHistoryChartProps {
  chainId: number;
  history: NetworkHistoryEntry[];
  timeRange?: '1h' | '24h' | '7d' | '30d' | 'all';
  height?: number;
  showLatency?: boolean;
  showStatus?: boolean;
  showLegend?: boolean;
  darkMode?: boolean;
}

// Status score for charting
const getStatusScore = (status: NetworkStatus): number => {
  switch (status) {
    case 'online': return 100;
    case 'degraded': return 50;
    case 'offline': return 0;
    default: return 0;
  }
};

export default function NetworkHistoryChart({
  chainId,
  history,
  timeRange = '24h',
  height = 200,
  showLatency = true,
  showStatus = true,
  showLegend = true,
  darkMode = true,
}: NetworkHistoryChartProps) {

  // Filter data based on time range
  const filteredData = useMemo(() => {
    if (!history || history.length === 0) return [];

    const now = Date.now();
    let timeFilter: number;

    switch (timeRange) {
      case '1h':
        timeFilter = 60 * 60 * 1000;
        break;
      case '24h':
        timeFilter = 24 * 60 * 60 * 1000;
        break;
      case '7d':
        timeFilter = 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        timeFilter = 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        timeFilter = Number.MAX_SAFE_INTEGER;
    }

    return history
      .filter(entry => now - entry.timestamp <= timeFilter)
      // Create formatted data for charts
      .map(entry => ({
        time: entry.timestamp,
        formattedTime: format(entry.timestamp, 'HH:mm:ss'),
        formattedDate: format(entry.timestamp, 'MMM dd'),
        latency: entry.success ? entry.latency : null,
        status: entry.status,
        statusScore: getStatusScore(entry.status),
        success: entry.success ? 1 : 0, // For uptime calculation
      }))
      // Sort by timestamp (oldest first for proper charting)
      .sort((a, b) => a.time - b.time);
  }, [history, timeRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        avgLatency: 0,
        minLatency: 0,
        maxLatency: 0,
        uptime: 0,
        samples: 0
      };
    }

    const validLatencies = filteredData
      .filter(entry => entry.latency !== null)
      .map(entry => entry.latency || 0);

    const successEntries = filteredData.filter(entry => entry.success === 1);

    return {
      avgLatency: validLatencies.length > 0
        ? Math.round(validLatencies.reduce((sum, val) => sum + val, 0) / validLatencies.length)
        : 0,
      minLatency: validLatencies.length > 0
        ? Math.min(...validLatencies)
        : 0,
      maxLatency: validLatencies.length > 0
        ? Math.max(...validLatencies)
        : 0,
      uptime: filteredData.length > 0
        ? Math.round((successEntries.length / filteredData.length) * 100)
        : 0,
      samples: filteredData.length
    };
  }, [filteredData]);

  // Setting up colors
  const colors = {
    latency: '#3b82f6', // blue
    status: '#10b981', // green
    background: darkMode ? '#111' : '#f9fafb',
    text: darkMode ? '#e5e7eb' : '#374151',
    grid: darkMode ? '#1f2937' : '#e5e7eb',
  };

  // Format for tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      return (
        <div className="bg-black/90 border border-white/20 p-2 text-xs">
          <p className="font-bold mb-1">{`${data.formattedDate} ${data.formattedTime}`}</p>
          {data.latency !== null && (
            <p className="text-blue-400">{`Latency: ${data.latency}ms`}</p>
          )}
          <p className={
            data.status === 'online' ? 'text-green-400' :
            data.status === 'degraded' ? 'text-yellow-400' :
            'text-red-400'
          }>
            {`Status: ${data.status}`}
          </p>
        </div>
      );
    }

    return null;
  };

  // Handle empty state
  if (filteredData.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center border border-white/10 bg-black/30 text-white/50"
        style={{ height }}
      >
        <p>No historical data available</p>
        <p className="text-xs">Run network tests to collect data</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-white">
        <div className="bg-black/30 p-2 border border-white/10">
          <div className="text-white/50">Average Latency</div>
          <div className="text-blue-400 font-bold">{stats.avgLatency}ms</div>
        </div>
        <div className="bg-black/30 p-2 border border-white/10">
          <div className="text-white/50">Min/Max Latency</div>
          <div className="font-bold">
            <span className="text-green-400">{stats.minLatency}ms</span>
            <span className="text-white/30 mx-1">/</span>
            <span className="text-red-400">{stats.maxLatency}ms</span>
          </div>
        </div>
        <div className="bg-black/30 p-2 border border-white/10">
          <div className="text-white/50">Uptime</div>
          <div className={
            stats.uptime > 95 ? 'text-green-400 font-bold' :
            stats.uptime > 80 ? 'text-yellow-400 font-bold' :
            'text-red-400 font-bold'
          }>{stats.uptime}%</div>
        </div>
        <div className="bg-black/30 p-2 border border-white/10">
          <div className="text-white/50">Data Points</div>
          <div className="text-white font-bold">{stats.samples}</div>
        </div>
      </div>

      <div className="border border-white/10 bg-black/30 p-2">
        <ResponsiveContainer width="100%" height={height}>
          {showLatency ? (
            <LineChart
              data={filteredData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis
                dataKey="formattedTime"
                stroke={colors.text}
                tick={{ fontSize: 10 }}
                tickFormatter={(value, index) => {
                  // Show fewer ticks on small screens
                  return index % Math.ceil(filteredData.length / 5) === 0 ? value : '';
                }}
              />
              <YAxis
                stroke={colors.text}
                tick={{ fontSize: 10 }}
                domain={[0, 'dataMax + 100']}
                allowDataOverflow={true}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}

              <Line
                type="monotone"
                dataKey="latency"
                stroke={colors.latency}
                name="Latency (ms)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />

              {showStatus && (
                <Line
                  type="stepAfter"
                  dataKey="statusScore"
                  stroke={colors.status}
                  name="Status"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3 }}
                  strokeDasharray="5 2"
                  yAxisId="right"
                />
              )}
            </LineChart>
          ) : (
            <AreaChart
              data={filteredData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis
                dataKey="formattedTime"
                stroke={colors.text}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                stroke={colors.text}
                tick={{ fontSize: 10 }}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}

              <Area
                type="monotone"
                dataKey="statusScore"
                name="Status"
                stroke={colors.status}
                fill={colors.status}
                fillOpacity={0.2}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
