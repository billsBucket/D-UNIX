"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { NETWORKS, NetworkInfo } from '@/lib/ethereum';
import { useNetworkSpeed, NetworkSpeedResult } from '@/lib/network-speed';
import { useNetworkHistory } from '@/lib/network-history';
import { useCustomNetworks } from '@/lib/custom-networks';
import { useCustomRPC } from '@/lib/custom-rpc';
import { toast } from 'sonner';
import NetworkHistoryChart from './network-history-chart';
import { motion } from 'framer-motion';

interface NetworkComparisonToolProps {
  children?: React.ReactNode;
  initialChainIds?: number[];
}

interface NetworkMetrics {
  chainId: number;
  name: string;
  logoUrl: string;
  latency: number;
  reliability: number;
  uptime: number;
  gasPrice: string;
  customRPC: boolean;
  testResult?: NetworkSpeedResult;
}

export default function NetworkComparisonTool({
  children,
  initialChainIds
}: NetworkComparisonToolProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChains, setSelectedChains] = useState<number[]>(initialChainIds || []);
  const [metrics, setMetrics] = useState<Record<number, NetworkMetrics>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [comparisonType, setComparisonType] = useState<'speed' | 'reliability' | 'cost'>('speed');

  const { speedResults, testNetworkSpeed } = useNetworkSpeed();
  const { getNetworkHistory, getAverageLatency, getUptimePercentage, getReliabilityScore } = useNetworkHistory();
  const { getAllNetworks } = useCustomNetworks();
  const { hasCustomRPC } = useCustomRPC();

  const availableNetworks = getAllNetworks();

  // If no chains are selected initially, select the first three
  useEffect(() => {
    if (selectedChains.length === 0) {
      const chainIds = Object.keys(availableNetworks).map(Number);
      setSelectedChains(chainIds.slice(0, 3));
    }
  }, [availableNetworks]);

  // Fetch metrics for selected chains
  useEffect(() => {
    calculateMetrics();
  }, [selectedChains, speedResults]);

  // Toggle chain selection
  const toggleChain = (chainId: number) => {
    setSelectedChains(prev => {
      if (prev.includes(chainId)) {
        return prev.filter(id => id !== chainId);
      } else {
        return [...prev, chainId];
      }
    });
  };

  // Calculate metrics for each chain
  const calculateMetrics = () => {
    const newMetrics: Record<number, NetworkMetrics> = {};

    selectedChains.forEach(chainId => {
      const network = availableNetworks[chainId];
      if (!network) return;

      const speedResult = speedResults.find(r => r.chainId === chainId);
      const history = getNetworkHistory(chainId);
      const avgLatency = getAverageLatency(chainId);
      const uptime = getUptimePercentage(chainId);
      const reliability = getReliabilityScore(chainId);

      newMetrics[chainId] = {
        chainId,
        name: network.name,
        logoUrl: network.logoUrl,
        latency: speedResult?.success ? speedResult.latency : avgLatency,
        reliability,
        uptime,
        gasPrice: network.gasPrice || 'Unknown',
        customRPC: hasCustomRPC(chainId),
        testResult: speedResult
      };
    });

    setMetrics(newMetrics);
  };

  // Test all selected chains
  const testSelectedChains = async () => {
    setIsLoading(true);
    toast.info('Testing selected networks...');

    try {
      await Promise.all(selectedChains.map(chainId => testNetworkSpeed(chainId)));
      toast.success('Network tests completed');
    } catch (error) {
      toast.error('Some network tests failed');
      console.error('Network test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine which chain is best for a specific use case
  const getBestChainForUseCase = (useCase: 'defi' | 'nft' | 'gaming' | 'staking'): number | null => {
    if (selectedChains.length === 0) return null;

    // Create scores based on the use case
    const scores: Record<number, number> = {};

    selectedChains.forEach(chainId => {
      const metric = metrics[chainId];
      if (!metric) return;

      let score = 0;

      switch (useCase) {
        case 'defi':
          // For DeFi, prioritize reliability and low latency, with gas price important
          score += metric.reliability * 0.4; // 40% weight on reliability
          score += (1000 - Math.min(metric.latency, 1000)) * 0.3 / 10; // 30% weight on latency
          // 30% weight on gas price (lower is better)
          const gasPrice = parseFloat(metric.gasPrice.replace(/[^0-9.]/g, '') || '0');
          score += gasPrice ? (100 - Math.min(gasPrice * 10, 100)) * 0.3 : 0;
          break;

        case 'nft':
          // For NFTs, gas price is more important, reliability still matters
          score += metric.reliability * 0.3; // 30% weight on reliability
          score += (1000 - Math.min(metric.latency, 1000)) * 0.2 / 10; // 20% weight on latency
          // 50% weight on gas price (lower is better)
          const nftGasPrice = parseFloat(metric.gasPrice.replace(/[^0-9.]/g, '') || '0');
          score += nftGasPrice ? (100 - Math.min(nftGasPrice * 10, 100)) * 0.5 : 0;
          break;

        case 'gaming':
          // For gaming, latency is critical, reliability matters
          score += metric.reliability * 0.3; // 30% weight on reliability
          score += (1000 - Math.min(metric.latency, 1000)) * 0.6 / 10; // 60% weight on latency
          // 10% weight on gas price
          const gamingGasPrice = parseFloat(metric.gasPrice.replace(/[^0-9.]/g, '') || '0');
          score += gamingGasPrice ? (100 - Math.min(gamingGasPrice * 10, 100)) * 0.1 : 0;
          break;

        case 'staking':
          // For staking, reliability is critical, gas price matters, latency less so
          score += metric.reliability * 0.6; // 60% weight on reliability
          score += (1000 - Math.min(metric.latency, 1000)) * 0.1 / 10; // 10% weight on latency
          // 30% weight on gas price
          const stakingGasPrice = parseFloat(metric.gasPrice.replace(/[^0-9.]/g, '') || '0');
          score += stakingGasPrice ? (100 - Math.min(stakingGasPrice * 10, 100)) * 0.3 : 0;
          break;
      }

      scores[chainId] = score;
    });

    // Find the chain with the highest score
    const entries = Object.entries(scores).map(([chainId, score]) => ({
      chainId: parseInt(chainId),
      score
    }));

    if (entries.length === 0) return null;

    entries.sort((a, b) => b.score - a.score);
    return entries[0].chainId;
  };

  // Determine best chain for each use case
  const bestForDeFi = getBestChainForUseCase('defi');
  const bestForNFT = getBestChainForUseCase('nft');
  const bestForGaming = getBestChainForUseCase('gaming');
  const bestForStaking = getBestChainForUseCase('staking');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="text-xs">
            Compare Networks
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-black border border-white/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Network Comparison Tool</DialogTitle>
          <DialogDescription>
            Compare performance, reliability, and cost across different networks to find the best for your needs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Network Selection */}
          <div className="border border-white/10 bg-white/5 p-3 rounded-sm">
            <h3 className="text-sm font-medium mb-2">Select Networks to Compare</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {Object.entries(availableNetworks).map(([id, network]) => {
                const chainId = parseInt(id);
                const isSelected = selectedChains.includes(chainId);

                return (
                  <Button
                    key={id}
                    variant="outline"
                    size="sm"
                    className={`text-xs flex items-center justify-start space-x-2 ${
                      isSelected ? 'bg-white/10 border-white/30' : 'bg-transparent'
                    }`}
                    onClick={() => toggleChain(chainId)}
                  >
                    <img
                      src={network.logoUrl}
                      alt={network.name}
                      className="w-4 h-4 rounded-full"
                    />
                    <span className="truncate">{network.name}</span>
                    {isSelected && <span className="ml-auto text-green-400">✓</span>}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                className={`text-xs ${comparisonType === 'speed' ? 'bg-white/10' : 'bg-transparent'}`}
                onClick={() => setComparisonType('speed')}
              >
                Speed
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`text-xs ${comparisonType === 'reliability' ? 'bg-white/10' : 'bg-transparent'}`}
                onClick={() => setComparisonType('reliability')}
              >
                Reliability
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`text-xs ${comparisonType === 'cost' ? 'bg-white/10' : 'bg-transparent'}`}
                onClick={() => setComparisonType('cost')}
              >
                Cost
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={testSelectedChains}
              disabled={isLoading || selectedChains.length === 0}
            >
              {isLoading ? 'Testing...' : 'Test Selected Networks'}
            </Button>
          </div>

          {/* Comparison Table */}
          {selectedChains.length > 0 ? (
            <div className="overflow-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-2 px-3 text-left">Network</th>
                    <th className="py-2 px-3 text-right">Latency</th>
                    <th className="py-2 px-3 text-right">Reliability</th>
                    <th className="py-2 px-3 text-right">Uptime</th>
                    <th className="py-2 px-3 text-right">Gas Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedChains.map(chainId => {
                    const metric = metrics[chainId];
                    if (!metric) return null;

                    return (
                      <tr key={chainId} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2 px-3">
                          <div className="flex items-center space-x-2">
                            <img
                              src={metric.logoUrl}
                              alt={metric.name}
                              className="w-5 h-5 rounded-full"
                            />
                            <span>{metric.name}</span>
                            {metric.customRPC && (
                              <span className="text-blue-400 text-[10px] ml-1">(Custom RPC)</span>
                            )}
                          </div>
                        </td>
                        <td className={`py-2 px-3 text-right ${
                          metric.latency < 200 ? 'text-green-400' :
                          metric.latency < 500 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {metric.latency > 0 ? `${metric.latency}ms` : 'Unknown'}
                        </td>
                        <td className={`py-2 px-3 text-right ${
                          metric.reliability > 80 ? 'text-green-400' :
                          metric.reliability > 50 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {metric.reliability}%
                        </td>
                        <td className={`py-2 px-3 text-right ${
                          metric.uptime > 95 ? 'text-green-400' :
                          metric.uptime > 80 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {metric.uptime}%
                        </td>
                        <td className="py-2 px-3 text-right">
                          {metric.gasPrice}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-white/50">
              Select networks to compare
            </div>
          )}

          {/* Performance Charts */}
          {comparisonType === 'speed' && selectedChains.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Latency Comparison</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedChains.map(chainId => {
                  const network = availableNetworks[chainId];
                  const history = getNetworkHistory(chainId);

                  return (
                    <div key={chainId} className="border border-white/10 bg-black/30 p-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <img
                          src={network.logoUrl}
                          alt={network.name}
                          className="w-5 h-5 rounded-full"
                        />
                        <span className="font-medium">{network.name}</span>
                      </div>
                      <NetworkHistoryChart
                        chainId={chainId}
                        history={history}
                        height={150}
                        showLegend={false}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommended Networks */}
          <div className="border border-white/10 bg-white/5 p-3 rounded-sm">
            <h3 className="text-sm font-medium mb-2">Recommended Networks by Use Case</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { useCase: 'DeFi', chainId: bestForDeFi, icon: '💰' },
                { useCase: 'NFTs', chainId: bestForNFT, icon: '🖼️' },
                { useCase: 'Gaming', chainId: bestForGaming, icon: '🎮' },
                { useCase: 'Staking', chainId: bestForStaking, icon: '📈' }
              ].map(({ useCase, chainId, icon }) => {
                if (!chainId) return null;
                const network = availableNetworks[chainId];
                if (!network) return null;

                return (
                  <motion.div
                    key={useCase}
                    className="flex items-center space-x-2 border border-white/10 p-2 bg-black/30"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-2xl">{icon}</div>
                    <div>
                      <div className="text-xs text-white/60">Best for {useCase}</div>
                      <div className="flex items-center space-x-1">
                        <img
                          src={network.logoUrl}
                          alt={network.name}
                          className="w-4 h-4 rounded-full"
                        />
                        <span className="font-medium">{network.name}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
