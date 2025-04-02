"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Protocol,
  ProtocolCategory,
  PROTOCOLS,
  getChainEcosystem,
  getEcosystemRichnessScore,
  searchProtocols
} from '@/lib/ecosystem-map';
import { NETWORKS, NetworkInfo } from '@/lib/ethereum';
import { useCustomNetworks } from '@/lib/custom-networks';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface BlockchainEcosystemMapProps {
  children?: React.ReactNode;
}

// Colors for different protocol categories
const CATEGORY_COLORS: Record<ProtocolCategory, string> = {
  [ProtocolCategory.DeFi]: '#8884d8',
  [ProtocolCategory.DEX]: '#83a6ed',
  [ProtocolCategory.Lending]: '#8dd1e1',
  [ProtocolCategory.Yield]: '#82ca9d',
  [ProtocolCategory.NFT]: '#a4de6c',
  [ProtocolCategory.Gaming]: '#d0ed57',
  [ProtocolCategory.Social]: '#ffc658',
  [ProtocolCategory.Infrastructure]: '#ff8042',
  [ProtocolCategory.Bridge]: '#ff5252',
  [ProtocolCategory.Oracle]: '#da70d6',
  [ProtocolCategory.DAO]: '#6a5acd',
  [ProtocolCategory.Derivatives]: '#20b2aa',
  [ProtocolCategory.Payment]: '#9370db',
  [ProtocolCategory.Analytics]: '#48d1cc',
  [ProtocolCategory.Other]: '#778899',
};

// Display name for categories
const CATEGORY_NAMES: Record<ProtocolCategory, string> = {
  [ProtocolCategory.DeFi]: 'General DeFi',
  [ProtocolCategory.DEX]: 'Decentralized Exchanges',
  [ProtocolCategory.Lending]: 'Lending Protocols',
  [ProtocolCategory.Yield]: 'Yield Farming',
  [ProtocolCategory.NFT]: 'NFT Platforms',
  [ProtocolCategory.Gaming]: 'Gaming & Metaverse',
  [ProtocolCategory.Social]: 'Social Platforms',
  [ProtocolCategory.Infrastructure]: 'Infrastructure',
  [ProtocolCategory.Bridge]: 'Bridge Protocols',
  [ProtocolCategory.Oracle]: 'Oracle Networks',
  [ProtocolCategory.DAO]: 'DAO & Governance',
  [ProtocolCategory.Derivatives]: 'Derivatives & Options',
  [ProtocolCategory.Payment]: 'Payment Solutions',
  [ProtocolCategory.Analytics]: 'Analytics Tools',
  [ProtocolCategory.Other]: 'Other Protocols',
};

export default function BlockchainEcosystemMap({ children }: BlockchainEcosystemMapProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProtocolCategory | null>(null);
  const [filteredProtocols, setFilteredProtocols] = useState<Protocol[]>([]);

  const { getAllNetworks } = useCustomNetworks();
  const allNetworks = getAllNetworks();

  useEffect(() => {
    if (!selectedChainId && Object.keys(allNetworks).length > 0) {
      // Default to Ethereum
      setSelectedChainId(1);
    }
  }, [allNetworks]);

  // Filter protocols based on search and selected chain/category
  useEffect(() => {
    if (!selectedChainId) {
      setFilteredProtocols([]);
      return;
    }

    let protocols = PROTOCOLS.filter(p => p.chainIds.includes(selectedChainId));

    if (selectedCategory) {
      protocols = protocols.filter(p => p.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      protocols = protocols.filter(
        p => p.name.toLowerCase().includes(query) ||
             p.description.toLowerCase().includes(query) ||
             p.tokenSymbol?.toLowerCase().includes(query)
      );
    }

    setFilteredProtocols(protocols);
  }, [selectedChainId, selectedCategory, searchQuery]);

  const handleChainChange = (chainId: number) => {
    setSelectedChainId(chainId);
    setSelectedCategory(null); // Reset category when changing chains
  };

  const handleCategorySelect = (category: ProtocolCategory | null) => {
    setSelectedCategory(category === selectedCategory ? null : category);
  };

  // If no chain selected, show nothing
  if (!selectedChainId) return null;

  // Get ecosystem data for the selected chain
  const ecosystemData = selectedChainId ? getChainEcosystem(selectedChainId) : null;
  const ecosystemScore = selectedChainId ? getEcosystemRichnessScore(selectedChainId) : 0;

  // Format category data for pie chart
  const categoryData = ecosystemData ? Object.entries(ecosystemData.protocolsByCategory)
    .map(([category, count]) => ({
      name: CATEGORY_NAMES[category as ProtocolCategory] || category,
      value: count,
      category: category as ProtocolCategory
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value) : [];

  // Get score rating text
  const getScoreRating = (score: number) => {
    if (score >= 70) return { text: 'Very Rich', color: 'text-green-400' };
    if (score >= 50) return { text: 'Rich', color: 'text-green-300' };
    if (score >= 30) return { text: 'Moderate', color: 'text-yellow-400' };
    if (score >= 15) return { text: 'Developing', color: 'text-yellow-300' };
    return { text: 'Limited', color: 'text-red-400' };
  };

  const scoreRating = getScoreRating(ecosystemScore);

  // Format TVL for display
  const formatTVL = (tvl: number) => {
    if (tvl >= 1e9) return `$${(tvl / 1e9).toFixed(2)}B`;
    if (tvl >= 1e6) return `$${(tvl / 1e6).toFixed(2)}M`;
    if (tvl >= 1e3) return `$${(tvl / 1e3).toFixed(2)}K`;
    return `$${tvl.toFixed(2)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="text-xs">
            Blockchain Ecosystem Map
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-black border border-white/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Blockchain Ecosystem Map</DialogTitle>
          <DialogDescription>
            Explore protocols, dApps, and platforms available on different blockchain networks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Network Selection */}
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
            {Object.entries(allNetworks).map(([id, network]) => {
              const chainId = parseInt(id);
              const isSelected = chainId === selectedChainId;

              return (
                <Button
                  key={id}
                  variant="outline"
                  size="sm"
                  className={`text-xs flex items-center justify-start px-2 ${
                    isSelected ? 'bg-white/10 border-white/30' : 'bg-transparent'
                  }`}
                  onClick={() => handleChainChange(chainId)}
                >
                  <img
                    src={network.logoUrl}
                    alt={network.name}
                    className="w-4 h-4 rounded-full mr-1"
                  />
                  <span className="truncate">{network.name}</span>
                </Button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Input
              placeholder="Search protocols by name or token..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 bg-black border-white/20"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">
              🔍
            </div>
          </div>

          {/* Ecosystem Overview */}
          {ecosystemData && (
            <div className="border border-white/10 bg-black/30 p-4 rounded-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium">
                    {allNetworks[selectedChainId]?.name} Ecosystem
                  </h3>
                  <p className="text-white/60 text-sm">
                    {ecosystemData.totalProtocols} protocols tracked
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white/60">Total Value Locked</div>
                  <div className="text-lg font-medium">
                    {formatTVL(ecosystemData.totalTVL)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Ecosystem Score */}
                <div className="bg-white/5 border border-white/10 p-3 rounded-sm">
                  <h4 className="text-xs text-white/60 mb-1">Ecosystem Richness</h4>
                  <div className="flex items-baseline">
                    <span className="text-xl font-bold mr-2">{ecosystemScore}/100</span>
                    <span className={`text-sm ${scoreRating.color}`}>
                      {scoreRating.text}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 mt-1">
                    Based on diversity, unique protocols, and total value locked
                  </p>
                </div>

                {/* Unique Protocols */}
                <div className="bg-white/5 border border-white/10 p-3 rounded-sm">
                  <h4 className="text-xs text-white/60 mb-1">Unique Protocols</h4>
                  <div className="text-xl font-bold">
                    {ecosystemData.uniqueProtocols.length}
                  </div>
                  <p className="text-xs text-white/60 mt-1">
                    Protocols available exclusively on this chain
                  </p>
                </div>

                {/* Categories */}
                <div className="bg-white/5 border border-white/10 p-3 rounded-sm">
                  <h4 className="text-xs text-white/60 mb-1">Protocol Categories</h4>
                  <div className="text-xl font-bold">
                    {Object.values(ecosystemData.protocolsByCategory).filter(count => count > 0).length}
                  </div>
                  <p className="text-xs text-white/60 mt-1">
                    Different types of protocols available
                  </p>
                </div>
              </div>

              {/* Protocol Category Distribution */}
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-3">Protocol Categories</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pie Chart */}
                  <div className="flex justify-center h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          nameKey="name"
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={40}
                          paddingAngle={2}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CATEGORY_COLORS[entry.category]}
                              cursor="pointer"
                              onClick={() => handleCategorySelect(entry.category)}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value, name) => [`${value} protocols`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Category List */}
                  <div className="flex flex-col space-y-1 max-h-[200px] overflow-y-auto">
                    {categoryData.map(item => (
                      <button
                        key={item.category}
                        className={`flex items-center justify-between text-xs p-1.5 rounded-sm ${
                          selectedCategory === item.category
                            ? 'bg-white/20'
                            : 'hover:bg-white/10'
                        }`}
                        onClick={() => handleCategorySelect(item.category)}
                      >
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
                          />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-bold">{item.value}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Protocol List */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium">
                {selectedCategory
                  ? `${CATEGORY_NAMES[selectedCategory]} on ${allNetworks[selectedChainId]?.name}`
                  : `Protocols on ${allNetworks[selectedChainId]?.name}`
                }
              </h3>
              {selectedCategory && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setSelectedCategory(null)}
                >
                  Clear Filter
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredProtocols.length > 0 ? (
                filteredProtocols.map(protocol => (
                  <motion.div
                    key={protocol.id}
                    className="border border-white/10 bg-black/30 p-3 rounded-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-start">
                      <img
                        src={protocol.logoUrl}
                        alt={protocol.name}
                        className="w-8 h-8 rounded-md mr-3"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium truncate">{protocol.name}</h4>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a
                                  href={protocol.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-white/60 hover:text-white/90"
                                >
                                  🔗
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Visit project website</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        <p className="text-xs text-white/60 mt-1 line-clamp-2">
                          {protocol.description}
                        </p>

                        <div className="flex items-center mt-2 text-xs space-x-2">
                          <span
                            className="px-1.5 py-0.5 rounded-sm text-[10px]"
                            style={{ backgroundColor: CATEGORY_COLORS[protocol.category] + '30' }}
                          >
                            {CATEGORY_NAMES[protocol.category]}
                          </span>

                          {protocol.tokenSymbol && (
                            <span className="text-white/60">
                              Token: {protocol.tokenSymbol}
                            </span>
                          )}

                          {protocol.tvlUSD !== undefined && (
                            <span className="text-white/60">
                              TVL: {formatTVL(protocol.tvlUSD)}
                            </span>
                          )}
                        </div>

                        {/* Only show "Available on" if it's on multiple chains */}
                        {protocol.chainIds.length > 1 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            <span className="text-[10px] text-white/50">Available on:</span>
                            {protocol.chainIds
                              .filter(id => id !== selectedChainId) // Don't show current chain
                              .slice(0, 3) // Show max 3 others
                              .map(id => {
                                const network = allNetworks[id];
                                if (!network) return null;

                                return (
                                  <img
                                    key={id}
                                    src={network.logoUrl}
                                    alt={network.name}
                                    title={network.name}
                                    className="w-3 h-3 rounded-full"
                                  />
                                );
                              })}
                            {protocol.chainIds.length > 4 && (
                              <span className="text-[10px] text-white/50">
                                +{protocol.chainIds.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-white/50 border border-white/10">
                  {searchQuery
                    ? `No protocols matching "${searchQuery}" found on ${allNetworks[selectedChainId]?.name}`
                    : `No protocols found for the selected filters`
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
