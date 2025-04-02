"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNetworkSpeed, NetworkSpeedResult } from '@/lib/network-speed';
import { useCustomRPC } from '@/lib/custom-rpc';
import { NETWORKS, NetworkStatus } from '@/lib/ethereum';
import { useChainFavorites } from '@/lib/chain-favorites';
import { useRecentChains } from '@/lib/recent-chains';
import { useWalletContext } from './wallet-provider';
import { useNetworkHistory } from '@/lib/network-history';
import { useAutoNetwork } from '@/lib/auto-network';
import { useCustomNetworks } from '@/lib/custom-networks';
import { toast } from 'sonner';
import NetworkHistoryChart from './network-history-chart';
import NetworkComparisonTool from './network-comparison-tool';
import AddCustomNetwork from './add-custom-network';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export default function NetworkStatusDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'favorite' | 'recent'>('all');
  const [activeSort, setActiveSort] = useState<'status' | 'latency' | 'name'>('status');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedChains, setExpandedChains] = useState<number[]>([]);
  const [showAutoSwitchConfig, setShowAutoSwitchConfig] = useState(false);

  const { speedResults, isLoading, testNetworkSpeed, testAllNetworks } = useNetworkSpeed();
  const { customRPCs, hasCustomRPC, getEffectiveRPC } = useCustomRPC();
  const { favoriteChainIds, isFavorite, toggleFavorite } = useChainFavorites();
  const { recentChains, getMostRecentChains, addRecentChain } = useRecentChains();
  const { chainId, switchChain } = useWalletContext();
  const {
    addHistoryEntry,
    getNetworkHistory,
    getNetworkSummary,
    getReliabilityScore
  } = useNetworkHistory();
  const {
    isEnabled: isAutoSwitchEnabled,
    options: autoSwitchOptions,
    toggleAutoSwitching,
    updateOptions,
    findBestNetwork
  } = useAutoNetwork();
  const {
    getAllNetworks,
    customNetworks,
    isCustomNetwork,
    removeCustomNetwork
  } = useCustomNetworks();

  const allNetworks = getAllNetworks();

  // Save test results to history
  useEffect(() => {
    speedResults.forEach(result => {
      if (result.success) {
        addHistoryEntry(result.chainId, {
          latency: result.latency,
          status: result.latency < 200 ? 'online' : result.latency < 800 ? 'degraded' : 'offline',
          success: true
        });
      } else {
        addHistoryEntry(result.chainId, {
          latency: -1,
          status: 'offline',
          success: false,
          error: result.error
        });
      }
    });
  }, [speedResults, addHistoryEntry]);

  // Toggle expanded state for a chain
  const toggleExpanded = (chainId: number) => {
    setExpandedChains(prev => {
      if (prev.includes(chainId)) {
        return prev.filter(id => id !== chainId);
      } else {
        return [...prev, chainId];
      }
    });
  };

  // Handle auto network switching
  useEffect(() => {
    if (!isAutoSwitchEnabled || !chainId) return;

    // Find the best network based on performance
    const bestNetworkId = findBestNetwork(allNetworks, chainId);

    // If a better network is found and it's different from current one, suggest switching
    if (bestNetworkId && bestNetworkId !== chainId) {
      const bestNetwork = allNetworks[bestNetworkId];

      toast.info(
        <div className="space-y-2">
          <div>
            <strong>{bestNetwork.name}</strong> is currently performing better than your current network.
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs bg-green-900/20 text-green-400"
              onClick={() => {
                switchChain(bestNetworkId);
                addRecentChain(bestNetworkId);
                toast.success(`Switched to ${bestNetwork.name}`);
              }}
            >
              Switch Now
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                // Add to excluded list temporarily
                updateOptions({
                  excludedNetworks: [
                    ...(autoSwitchOptions.excludedNetworks || []),
                    bestNetworkId
                  ]
                });
                toast.success(`Will not suggest ${bestNetwork.name} for a while`);
              }}
            >
              Ignore
            </Button>
          </div>
        </div>,
        {
          duration: 10000,
          id: `auto-switch-${bestNetworkId}`, // Prevent duplicates
        }
      );
    }
  }, [isAutoSwitchEnabled, speedResults, chainId, allNetworks, autoSwitchOptions]);

  // Get all networks to display based on filters
  const getNetworksToDisplay = () => {
    let chains = Object.entries(allNetworks).map(([id, network]) => ({
      chainId: parseInt(id),
      ...network
    }));

    // Filter based on search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      chains = chains.filter(chain =>
        chain.name.toLowerCase().includes(term) ||
        chain.chainId.toString().includes(term) ||
        (chain.features && chain.features.some(f => f.toLowerCase().includes(term)))
      );
    }

    // Filter based on selected tab
    if (selectedTab === 'favorite') {
      chains = chains.filter(chain => isFavorite(chain.chainId));
    } else if (selectedTab === 'recent') {
      const recentIds = getMostRecentChains();
      chains = chains.filter(chain => recentIds.includes(chain.chainId));

      // Sort by recency
      chains.sort((a, b) => {
        const aIndex = recentIds.indexOf(a.chainId);
        const bIndex = recentIds.indexOf(b.chainId);
        return aIndex - bIndex;
      });

      // Return early - we want to maintain recency order
      return chains;
    }

    // Sort networks
    chains.sort((a, b) => {
      // Always put custom networks at the top
      const aIsCustom = isCustomNetwork(a.chainId);
      const bIsCustom = isCustomNetwork(b.chainId);

      if (aIsCustom && !bIsCustom) return -1;
      if (!aIsCustom && bIsCustom) return 1;

      // Then sort by favorites
      const aIsFavorite = isFavorite(a.chainId);
      const bIsFavorite = isFavorite(b.chainId);

      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;

      if (activeSort === 'status') {
        // Sort by status
        const statusA = a.status || getDetectedStatus(a.chainId);
        const statusB = b.status || getDetectedStatus(b.chainId);

        const statusPriority = (status: NetworkStatus) => {
          return status === 'online' ? 0 : status === 'degraded' ? 1 : 2;
        };

        const statusDiff = statusPriority(statusA) - statusPriority(statusB);
        if (statusDiff !== 0) return statusDiff;
      }

      if (activeSort === 'latency') {
        // Sort by latency
        const resultA = speedResults.find(r => r.chainId === a.chainId);
        const resultB = speedResults.find(r => r.chainId === b.chainId);

        const latencyA = resultA?.success ? resultA.latency : Number.MAX_SAFE_INTEGER;
        const latencyB = resultB?.success ? resultB.latency : Number.MAX_SAFE_INTEGER;

        if (latencyA !== latencyB) return latencyA - latencyB;
      }

      // Finally sort by name
      return a.name.localeCompare(b.name);
    });

    return chains;
  };

  const networksToDisplay = getNetworksToDisplay();

  // Auto-Switch Configuration UI
  const AutoSwitchConfig = () => (
    <motion.div
      className="border border-white/10 p-4 mb-4 bg-black/30"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      <h3 className="text-sm font-medium mb-3">Auto-Switching Configuration</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs">Maximum acceptable latency (ms)</label>
            <Input
              type="number"
              className="w-20 h-7 text-xs bg-black border-white/20"
              value={autoSwitchOptions.maxLatency}
              onChange={e => updateOptions({ maxLatency: parseInt(e.target.value) || 500 })}
              min={0}
              max={2000}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs">Latency threshold to trigger switch (ms)</label>
            <Input
              type="number"
              className="w-20 h-7 text-xs bg-black border-white/20"
              value={autoSwitchOptions.latencyThreshold}
              onChange={e => updateOptions({ latencyThreshold: parseInt(e.target.value) || 100 })}
              min={0}
              max={1000}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs">Minimum reliability score (%)</label>
            <Input
              type="number"
              className="w-20 h-7 text-xs bg-black border-white/20"
              value={autoSwitchOptions.reliabilityThreshold}
              onChange={e => updateOptions({ reliabilityThreshold: parseInt(e.target.value) || 70 })}
              min={0}
              max={100}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs">Prefer current network if acceptable</label>
            <Switch
              checked={!!autoSwitchOptions.preferCurrentNetwork}
              onCheckedChange={checked => updateOptions({ preferCurrentNetwork: checked })}
            />
          </div>

          <div>
            <label className="text-xs block mb-1">Excluded Networks</label>
            <div className="flex flex-wrap gap-1">
              {autoSwitchOptions.excludedNetworks?.map(id => {
                const network = allNetworks[id];
                if (!network) return null;

                return (
                  <div
                    key={id}
                    className="flex items-center space-x-1 bg-white/5 border border-white/10 px-1 py-0.5 text-[10px] rounded"
                  >
                    <img
                      src={network.logoUrl}
                      alt={network.name}
                      className="w-3 h-3 rounded-full"
                    />
                    <span>{network.name}</span>
                    <button
                      className="text-white/50 hover:text-white/80"
                      onClick={() => {
                        updateOptions({
                          excludedNetworks: autoSwitchOptions.excludedNetworks?.filter(n => n !== id)
                        });
                      }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              {(!autoSwitchOptions.excludedNetworks || autoSwitchOptions.excludedNetworks.length === 0) && (
                <span className="text-white/50 text-[10px]">No excluded networks</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const handleRefreshAll = async () => {
    if (refreshing) return;

    setRefreshing(true);
    toast.info('Testing network connections...');

    try {
      await testAllNetworks();
      toast.success('Network speed tests completed');
    } catch (error) {
      toast.error('Failed to complete all network tests');
      console.error('Network test error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefreshSingle = async (id: number) => {
    if (isLoading[id]) return;

    try {
      const result = await testNetworkSpeed(id);
      if (result.success) {
        toast.success(`${allNetworks[id].name} test completed: ${result.latency}ms`);
      } else {
        toast.error(`${allNetworks[id].name} test failed: ${result.error}`);
      }
    } catch (error) {
      toast.error(`Failed to test ${allNetworks[id].name}`);
      console.error('Network test error:', error);
    }
  };

  // Detect status from speed test results
  const getDetectedStatus = (chainId: number): NetworkStatus => {
    const speedResult = speedResults.find(r => r.chainId === chainId);

    if (!speedResult) return 'offline';
    if (!speedResult.success) return 'offline';

    // Classify based on latency
    if (speedResult.latency < 200) return 'online';
    if (speedResult.latency < 800) return 'degraded';
    return 'offline';
  };

  // Format latency display
  const formatLatency = (result?: NetworkSpeedResult) => {
    if (!result) return 'Not tested';
    if (!result.success) return 'Failed';
    return `${result.latency}ms`;
  };

  // Status indicator component
  const StatusIndicator = ({ status }: { status: NetworkStatus }) => {
    const colors = {
      online: 'bg-green-500',
      degraded: 'bg-yellow-500',
      offline: 'bg-red-500'
    };

    return (
      <div className="flex items-center">
        <span className={`relative flex h-2.5 w-2.5 mr-2`}>
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[status]} opacity-75`}></span>
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors[status]}`}></span>
        </span>
        <span className="capitalize text-xs">
          {status}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-wrap gap-3 justify-between items-start">
        <div className="space-y-2">
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              className={`text-xs ${selectedTab === 'all' ? 'bg-white/10' : 'bg-transparent'}`}
              onClick={() => setSelectedTab('all')}
            >
              All Networks
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`text-xs ${selectedTab === 'favorite' ? 'bg-white/10' : 'bg-transparent'}`}
              onClick={() => setSelectedTab('favorite')}
            >
              Favorites
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`text-xs ${selectedTab === 'recent' ? 'bg-white/10' : 'bg-transparent'}`}
              onClick={() => setSelectedTab('recent')}
            >
              Recently Used
            </Button>
          </div>

          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              className={`text-xs ${activeSort === 'status' ? 'bg-white/10' : 'bg-transparent'}`}
              onClick={() => setActiveSort('status')}
            >
              Sort by Status
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`text-xs ${activeSort === 'latency' ? 'bg-white/10' : 'bg-transparent'}`}
              onClick={() => setActiveSort('latency')}
            >
              Sort by Speed
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`text-xs ${activeSort === 'name' ? 'bg-white/10' : 'bg-transparent'}`}
              onClick={() => setActiveSort('name')}
            >
              Sort by Name
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Switch
              checked={isAutoSwitchEnabled}
              onCheckedChange={toggleAutoSwitching}
              id="auto-switch"
            />
            <label
              htmlFor="auto-switch"
              className="text-xs cursor-pointer"
            >
              Auto-switch to fastest network
            </label>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => setShowAutoSwitchConfig(!showAutoSwitchConfig)}
            >
              ⚙️
            </Button>
          </div>

          <NetworkComparisonTool>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Compare Networks
            </Button>
          </NetworkComparisonTool>

          <AddCustomNetwork
            onNetworkAdded={chainId => {
              toast.success('New network added');
              // Expand the new network card
              setExpandedChains(prev => [...prev, chainId]);
            }}
          >
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Add Network
            </Button>
          </AddCustomNetwork>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={refreshing}
            className="text-xs"
          >
            {refreshing ? 'Testing...' : 'Test All Networks'}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Input
          placeholder="Search networks by name, ID, or features..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full h-9 pl-9 bg-black border-white/20"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">
          🔍
        </div>
      </div>

      {/* Auto-Switch Config Panel */}
      <AnimatePresence>
        {showAutoSwitchConfig && <AutoSwitchConfig />}
      </AnimatePresence>

      {/* Network Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {networksToDisplay.map(network => {
            const isActive = network.chainId === chainId;
            const speedResult = speedResults.find(r => r.chainId === network.chainId);
            const hasCustom = hasCustomRPC(network.chainId);
            const effectiveStatus = network.status || getDetectedStatus(network.chainId);
            const isExpanded = expandedChains.includes(network.chainId);
            const isCustom = isCustomNetwork(network.chainId);

            // Get history and calculate metrics
            const history = getNetworkHistory(network.chainId);
            const summary = getNetworkSummary(network.chainId);

            return (
              <motion.div
                key={network.chainId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`border p-4 ${
                  isActive ? 'border-white/40 bg-white/5' : 'border-white/10'
                } ${
                  isFavorite(network.chainId) ? 'border-l-2 border-l-yellow-400' : ''
                } ${
                  isCustom ? 'border-t-2 border-t-blue-400' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <img
                      src={network.logoUrl}
                      alt={network.name}
                      className="w-6 h-6 rounded-full mr-2"
                    />
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-medium">
                          {network.name}
                        </h3>
                        {isCustom && (
                          <span className="ml-2 text-[10px] px-1 py-0.5 bg-blue-900/30 text-blue-400 rounded">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white/50">ID: {network.chainId}</div>
                    </div>
                  </div>

                  <div className="flex space-x-1">
                    <button
                      onClick={() => toggleFavorite(network.chainId)}
                      className="text-lg"
                      title={isFavorite(network.chainId) ? "Remove from favorites" : "Add to favorites"}
                    >
                      {isFavorite(network.chainId) ? (
                        <span className="text-yellow-400">★</span>
                      ) : (
                        <span className="text-white/40 hover:text-yellow-400">☆</span>
                      )}
                    </button>

                    <button
                      onClick={() => toggleExpanded(network.chainId)}
                      className="text-white/60 hover:text-white/90 text-sm"
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-2 mb-4 text-sm">
                  <div className="text-white/60">Status:</div>
                  <div>
                    <StatusIndicator status={effectiveStatus} />
                  </div>

                  <div className="text-white/60">Latency:</div>
                  <div className="text-right">
                    {isLoading[network.chainId] ? (
                      <span className="text-white/50">Testing...</span>
                    ) : (
                      <span className={
                        !speedResult?.success ? 'text-red-400' :
                        speedResult.latency < 200 ? 'text-green-400' :
                        speedResult.latency < 500 ? 'text-yellow-400' :
                        'text-red-400'
                      }>
                        {formatLatency(speedResult)}
                      </span>
                    )}
                  </div>

                  <div className="text-white/60">Gas Price:</div>
                  <div className="text-right">{network.gasPrice || 'Unknown'}</div>

                  <div className="text-white/60">RPC:</div>
                  <div className="text-right text-xs truncate" title={getEffectiveRPC(network.chainId)}>
                    {hasCustom ? (
                      <span className="text-blue-400">Custom</span>
                    ) : (
                      <span>Default</span>
                    )}
                  </div>
                </div>

                {/* Expanded section with history chart */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mb-4 overflow-hidden"
                    >
                      <div className="border-t border-white/10 pt-3 mb-3">
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div className="bg-black/30 p-2 border border-white/10">
                            <div className="text-white/50">Reliability Score</div>
                            <div className={`font-bold ${
                              summary.reliability24h > 80 ? 'text-green-400' :
                              summary.reliability24h > 50 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {summary.reliability24h}/100
                            </div>
                          </div>

                          <div className="bg-black/30 p-2 border border-white/10">
                            <div className="text-white/50">24h Uptime</div>
                            <div className={`font-bold ${
                              summary.uptime24h > 95 ? 'text-green-400' :
                              summary.uptime24h > 80 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {summary.uptime24h}%
                            </div>
                          </div>
                        </div>

                        <NetworkHistoryChart
                          chainId={network.chainId}
                          history={history}
                          height={120}
                          showLegend={false}
                        />
                      </div>

                      {isCustom && (
                        <div className="flex justify-end mb-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 px-2 hover:bg-red-900/20 hover:text-red-400"
                            onClick={() => {
                              removeCustomNetwork(network.chainId);
                              toast.success(`Removed network ${network.name}`);
                            }}
                          >
                            Remove Custom Network
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex space-x-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs flex-1"
                    onClick={() => handleRefreshSingle(network.chainId)}
                    disabled={isLoading[network.chainId]}
                  >
                    {isLoading[network.chainId] ? 'Testing...' : 'Test Connection'}
                  </Button>

                  {network.chainId !== chainId ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs flex-1 bg-white/5"
                      onClick={() => {
                        switchChain(network.chainId);
                        addRecentChain(network.chainId);
                      }}
                    >
                      Switch Network
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs flex-1 bg-green-900/20 text-green-400 border-green-900/50"
                      disabled
                    >
                      Current Network
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {networksToDisplay.length === 0 && (
        <div className="text-center py-12 text-white/50 border border-white/10 bg-black/30">
          No networks match your search criteria
        </div>
      )}
    </div>
  );
}
