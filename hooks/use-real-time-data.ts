import { useState, useEffect } from 'react';
import {
  initializeRealTimeData,
  getRealTimeData,
  RealTimeData,
  GasPriceData,
  VolumeData,
  ProtocolData
} from '@/lib/real-time-data';

interface UseRealTimeDataOptions {
  refreshInterval?: number; // Default interval in ms for refreshing data
  includedChains?: string[]; // Chain IDs to include
  metrics?: ('gas' | 'volume' | 'protocols' | 'all')[]; // Metrics to track
}

export function useRealTimeData(options: UseRealTimeDataOptions = {}) {
  const {
    refreshInterval = 10000,
    includedChains = [],
    metrics = ['all']
  } = options;

  const [data, setData] = useState<RealTimeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Initialize real-time data
    const cleanupRealTime = initializeRealTimeData();

    // Function to update component with latest data
    const updateData = () => {
      try {
        const realTimeData = getRealTimeData();

        // Filter data if necessary
        if (includedChains.length > 0) {
          // Create a filtered copy of the data
          const filteredData = {...realTimeData};

          // Filter gas prices
          if (metrics.includes('gas') || metrics.includes('all')) {
            filteredData.gasPrices = Object.entries(realTimeData.gasPrices)
              .filter(([chainId]) => includedChains.includes(chainId))
              .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
              }, {} as Record<string, GasPriceData>);
          }

          // Filter volumes
          if (metrics.includes('volume') || metrics.includes('all')) {
            filteredData.volumes = Object.entries(realTimeData.volumes)
              .filter(([chainId]) => includedChains.includes(chainId))
              .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
              }, {} as Record<string, VolumeData>);
          }

          // Filter protocols
          if (metrics.includes('protocols') || metrics.includes('all')) {
            filteredData.protocols = Object.entries(realTimeData.protocols)
              .filter(([chainId]) => includedChains.includes(chainId))
              .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
              }, {} as Record<string, ProtocolData[]>);
          }

          setData(filteredData);
        } else {
          setData(realTimeData);
        }

        setLastUpdate(new Date());
        setIsLoading(false);
      } catch (err) {
        console.error('Error updating real-time data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error updating real-time data'));
        setIsLoading(false);
      }
    };

    // Initial update
    updateData();

    // Set interval for periodic updates
    const intervalId = setInterval(updateData, refreshInterval);

    // Cleanup function
    return () => {
      clearInterval(intervalId);
      cleanupRealTime();
    };
  }, [refreshInterval, includedChains.join(','), metrics.join(',')]);

  return {
    data,
    isLoading,
    error,
    lastUpdate,
    refresh: () => {
      setIsLoading(true);
      const realTimeData = getRealTimeData();
      setData(realTimeData);
      setLastUpdate(new Date());
      setIsLoading(false);
    }
  };
}
