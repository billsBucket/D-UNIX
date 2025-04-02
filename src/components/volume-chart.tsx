"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getRealTimeData } from '@/lib/real-time-data';

export default function VolumeChart() {
  const [volumeData, setVolumeData] = useState<any>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [selectedChain, setSelectedChain] = useState<{ name: string; volume: string; } | null>(null);

  useEffect(() => {
    // Function to update volume data from real-time data
    const updateVolumeData = () => {
      try {
        // Get real-time data
        const realTimeData = getRealTimeData();

        // Format data for the chart
        const formattedData: any = {};

        // Get all volumes data
        const volumes = realTimeData.volumes;

        // Process each chain's volume data
        Object.keys(volumes).forEach(chainId => {
          const chainData = volumes[chainId];
          const chainName =
            chainId === '1' ? 'Ethereum' :
            chainId === '42161' ? 'Arbitrum' :
            chainId === '137' ? 'Polygon' :
            chainId === '10' ? 'Optimism' :
            chainId === '56' ? 'BNB Chain' :
            chainId === '8453' ? 'Base' :
            `Chain ${chainId}`;

          // Get the relevant volume based on timeframe
          const volume =
            timeframe === '24h' ? chainData.daily :
            timeframe === '7d' ? chainData.weekly :
            chainData.monthly;

          // Get formatted volume
          const formattedVolume =
            timeframe === '24h' ? chainData.formatted.daily :
            timeframe === '7d' ? chainData.formatted.weekly :
            chainData.formatted.monthly;

          formattedData[chainName] = {
            volume,
            formattedVolume,
            dailyChange: chainData.dailyChange,
            formattedChange: chainData.formatted.dailyChange,
            color:
              chainName === 'Ethereum' ? '#6b8af2' :
              chainName === 'Arbitrum' ? '#28A0F0' :
              chainName === 'Polygon' ? '#8247E5' :
              chainName === 'Optimism' ? '#FF0420' :
              chainName === 'BNB Chain' ? '#F0B90B' :
              chainName === 'Base' ? '#0052FF' :
              '#cccccc'
          };
        });

        // Update state
        setVolumeData(formattedData);
        setLastUpdated(new Date(realTimeData.lastUpdated));

        // Set default selected chain to Ethereum if not already set
        if (!selectedChain) {
          setSelectedChain({
            name: 'ETHEREUM',
            volume: formattedData['Ethereum']?.formattedVolume || '$7.3B'
          });
        }
      } catch (error) {
        console.error('Error updating volume data:', error);
      }
    };

    // Initialize data
    updateVolumeData();

    // Set up interval to update data
    const intervalId = setInterval(updateVolumeData, 10000);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [timeframe, selectedChain]);

  // Calculate max volume for scaling the bars
  const maxVolume = React.useMemo(() => {
    if (Object.keys(volumeData).length === 0) return 10000000000; // Default 10B
    return Math.max(...Object.values(volumeData).map((data: any) => data.volume), 10000000000);
  }, [volumeData]);

  // Function to handle clicking a chain
  const handleChainClick = (chainName: string) => {
    const chain = volumeData[chainName];
    if (chain) {
      setSelectedChain({
        name: chainName.toUpperCase(),
        volume: chain.formattedVolume
      });
    }
  };

  // Order of chains to display in the chart (matching screenshot)
  const chainOrder = ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Base', 'BNB Chain'];

  return (
    <div className="dunix-card border border-white/10 p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-mono uppercase">TRANSACTION VOLUME ANALYSIS</h2>
        <div className="flex items-center space-x-2">
          <div className="text-xs font-mono opacity-70 flex items-center mr-2">
            <div className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></div>
            LIVE DATA ({lastUpdated ? lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '--:--:--'})
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className={`px-2 py-1 text-xs ${timeframe === '24h' ? 'bg-white/20' : 'bg-black'}`}
              onClick={() => setTimeframe('24h')}
            >
              24H
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`px-2 py-1 text-xs ${timeframe === '7d' ? 'bg-white/20' : 'bg-black'}`}
              onClick={() => setTimeframe('7d')}
            >
              7D
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`px-2 py-1 text-xs ${timeframe === '30d' ? 'bg-white/20' : 'bg-black'}`}
              onClick={() => setTimeframe('30d')}
            >
              30D
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-2 py-1 text-xs bg-black"
            >
              EXPORT
            </Button>
          </div>
        </div>
      </div>

      {/* Volume Chart */}
      <div className="h-64 flex flex-col justify-between relative">
        {/* Y-axis labels on the left */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-white/60 pb-8">
          <div>$8,725,197K</div>
          <div>$6,543,898K</div>
          <div>$4,362,598K</div>
          <div>$2,181,299K</div>
          <div>0</div>
        </div>

        {/* Chart Bars */}
        <div className="ml-24 h-full flex items-end space-x-4 pt-6 pb-8">
          {chainOrder.map(chainName => {
            const chainData = volumeData[chainName];
            if (!chainData) return null;

            const barHeight = `${(chainData.volume / maxVolume) * 100}%`;

            return (
              <div
                key={chainName}
                className="flex-1 flex flex-col items-center h-full"
                onClick={() => handleChainClick(chainName)}
              >
                <div className="w-full h-full flex items-end cursor-pointer">
                  <div
                    className="w-full transition-all duration-300"
                    style={{
                      height: barHeight,
                      backgroundColor: chainData.color || '#cccccc'
                    }}
                  />
                </div>
                <div className="mt-2 uppercase text-xs font-mono">{chainName}</div>
              </div>
            );
          })}
        </div>

        {/* X-axis label */}
        <div className="text-center text-xs text-white/60 mt-4">
          DAILY TRADING VOLUME BY CHAIN (MILLIONS USD)
        </div>
      </div>

      {/* Selected Chain Info */}
      {selectedChain && (
        <div className="absolute right-8 top-32 z-10">
          <div className="bg-black border border-white/20 p-6 inline-block">
            <div className="uppercase font-mono text-lg">{selectedChain.name}</div>
            <div className="text-blue-400 text-3xl font-mono mt-2">{selectedChain.volume}</div>
          </div>
        </div>
      )}
    </div>
  );
}
