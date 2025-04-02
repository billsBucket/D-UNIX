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
import { useSecurityRatings, SecurityFactor, SecurityRating, RiskLevel } from '@/lib/security-ratings';
import { useCustomNetworks } from '@/lib/custom-networks';
import { NETWORKS } from '@/lib/ethereum';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip
} from 'recharts';

interface NetworkSecurityRatingsProps {
  children?: React.ReactNode;
  initialChainIds?: number[];
}

export default function NetworkSecurityRatings({ children, initialChainIds }: NetworkSecurityRatingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChainIds, setSelectedChainIds] = useState<number[]>(initialChainIds || []);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'factors' | 'audits' | 'attacks'>('overview');

  const {
    securityRatings,
    generateRating,
    generateRatingsForNetworks,
    getRiskLevelDisplay,
    getFactorDescription
  } = useSecurityRatings();

  const { getAllNetworks } = useCustomNetworks();
  const allNetworks = getAllNetworks();

  // Generate ratings for all networks on component mount
  useEffect(() => {
    generateRatingsForNetworks(allNetworks);
  }, [allNetworks]);

  // Filter networks based on search term
  const filteredNetworks = Object.entries(allNetworks)
    .filter(([_, network]) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        network.name.toLowerCase().includes(term) ||
        network.chainId.toString().includes(term)
      );
    })
    .map(([id, network]) => ({
      chainId: parseInt(id),
      ...network
    }));

  // Toggle chain selection for comparison
  const toggleChainSelection = (chainId: number) => {
    setSelectedChainIds(prev => {
      if (prev.includes(chainId)) {
        return prev.filter(id => id !== chainId);
      } else {
        return [...prev, chainId];
      }
    });
  };

  // Format factor name for display
  const formatFactorName = (factor: string): string => {
    return factor.charAt(0).toUpperCase() + factor.slice(1);
  };

  // Prepare radar chart data for security factors
  const prepareRadarData = (chainIds: number[]) => {
    if (chainIds.length === 0 || !securityRatings) return [];

    const factorKeys = Object.values(SecurityFactor);

    // Create data points for each factor
    return factorKeys.map(factor => {
      const dataPoint: any = {
        factor: formatFactorName(factor),
      };

      // Add a data point for each chain
      chainIds.forEach(chainId => {
        const rating = securityRatings[chainId];
        if (rating) {
          const networkName = allNetworks[chainId]?.name || `Chain ${chainId}`;
          dataPoint[networkName] = rating.factors[factor];
        }
      });

      return dataPoint;
    });
  };

  // Get color for risk level
  const getRiskLevelColor = (riskLevel: RiskLevel): string => {
    switch (riskLevel) {
      case 'very_low': return '#4ade80'; // green-400
      case 'low': return '#a3e635'; // lime-400
      case 'medium': return '#facc15'; // yellow-400
      case 'high': return '#fb923c'; // orange-400
      case 'very_high': return '#f87171'; // red-400
      default: return '#94a3b8'; // slate-400
    }
  };

  // Get color for factor score
  const getFactorScoreColor = (score: number): string => {
    if (score >= 90) return '#4ade80'; // green-400
    if (score >= 70) return '#a3e635'; // lime-400
    if (score >= 50) return '#facc15'; // yellow-400
    if (score >= 30) return '#fb923c'; // orange-400
    return '#f87171'; // red-400
  };

  // Format date strings
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Network comparison colors for the radar chart
  const COMPARISON_COLORS = [
    '#8884d8', // purple
    '#82ca9d', // green
    '#ffc658', // yellow
    '#ff8042', // orange
    '#0088fe', // blue
  ];

  // Get security rating for a chain
  const getRating = (chainId: number): SecurityRating | undefined => {
    return securityRatings[chainId];
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="text-xs">
            Security Ratings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-black border border-white/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Network Security Risk Assessment</DialogTitle>
          <DialogDescription>
            View detailed security ratings and risk assessments for blockchain networks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Controls */}
          <div className="flex flex-wrap gap-2 justify-between">
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder="Search networks..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 bg-black border-white/20"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">
                🔍
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className={`text-xs ${comparisonMode ? 'bg-white/10' : 'bg-transparent'}`}
                onClick={() => setComparisonMode(!comparisonMode)}
              >
                {comparisonMode ? 'Exit Comparison' : 'Compare Networks'}
              </Button>

              {comparisonMode && selectedChainIds.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setSelectedChainIds([])}
                >
                  Clear ({selectedChainIds.length})
                </Button>
              )}
            </div>
          </div>

          {/* Network Comparison Mode */}
          {comparisonMode && (
            <div className="border border-white/10 bg-black/30 p-4 rounded-sm">
              <h3 className="text-sm font-medium mb-3">
                {selectedChainIds.length > 0 ? 'Network Security Comparison' : 'Select Networks to Compare'}
              </h3>

              {selectedChainIds.length > 0 ? (
                <div className="space-y-4">
                  {/* Radar Chart for Factor Comparison */}
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        cx="50%"
                        cy="50%"
                        outerRadius="80%"
                        data={prepareRadarData(selectedChainIds)}
                      >
                        <PolarGrid />
                        <PolarAngleAxis dataKey="factor" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />

                        {selectedChainIds.map((chainId, index) => {
                          const networkName = allNetworks[chainId]?.name || `Chain ${chainId}`;
                          return (
                            <Radar
                              key={chainId}
                              name={networkName}
                              dataKey={networkName}
                              stroke={COMPARISON_COLORS[index % COMPARISON_COLORS.length]}
                              fill={COMPARISON_COLORS[index % COMPARISON_COLORS.length]}
                              fillOpacity={0.2}
                            />
                          );
                        })}

                        <Legend />
                        <RechartsTooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Comparison Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="border-b border-white/10">
                        <tr>
                          <th className="py-2 px-3 text-left">Network</th>
                          <th className="py-2 px-3 text-right">Overall Score</th>
                          <th className="py-2 px-3 text-center">Risk Level</th>
                          <th className="py-2 px-3 text-right">Decentralization</th>
                          <th className="py-2 px-3 text-right">Attack History</th>
                          <th className="py-2 px-3 text-right">Audit Score</th>
                          <th className="py-2 px-3 text-right">TVL Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedChainIds.map(chainId => {
                          const rating = securityRatings[chainId];
                          if (!rating) return null;

                          const riskDisplay = getRiskLevelDisplay(rating.riskLevel);

                          return (
                            <tr key={chainId} className="border-b border-white/5">
                              <td className="py-2 px-3">
                                <div className="flex items-center">
                                  <img
                                    src={allNetworks[chainId]?.logoUrl || ''}
                                    alt={allNetworks[chainId]?.name || ''}
                                    className="w-5 h-5 rounded-full mr-2"
                                  />
                                  <span>{allNetworks[chainId]?.name || `Chain ${chainId}`}</span>
                                </div>
                              </td>
                              <td className="py-2 px-3 text-right font-medium">
                                {rating.overallScore}/100
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span
                                  className="px-2 py-0.5 rounded-sm text-[10px]"
                                  style={{ backgroundColor: getRiskLevelColor(rating.riskLevel) + '30', color: getRiskLevelColor(rating.riskLevel) }}
                                >
                                  {riskDisplay.label}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right">
                                <span style={{ color: getFactorScoreColor(rating.factors.decentralization) }}>
                                  {rating.factors.decentralization}/100
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right">
                                <span style={{ color: getFactorScoreColor(rating.factors.attacks) }}>
                                  {rating.factors.attacks}/100
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right">
                                <span style={{ color: getFactorScoreColor(rating.factors.audit) }}>
                                  {rating.factors.audit}/100
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right">
                                <span style={{ color: getFactorScoreColor(rating.factors.tvl) }}>
                                  {rating.factors.tvl}/100
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-white/50">
                  Select networks below to compare their security profiles
                </div>
              )}
            </div>
          )}

          {/* Network Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNetworks.map(network => {
              const rating = securityRatings[network.chainId];
              const isSelected = selectedChainIds.includes(network.chainId);

              if (!rating) return null;

              const riskDisplay = getRiskLevelDisplay(rating.riskLevel);

              return (
                <motion.div
                  key={network.chainId}
                  className={`border p-4 ${
                    isSelected ? 'border-white/40 bg-white/10' : 'border-white/10'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <img
                        src={network.logoUrl}
                        alt={network.name}
                        className="w-6 h-6 rounded-full mr-2"
                      />
                      <div>
                        <h3 className="font-medium">{network.name}</h3>
                        <div className="text-xs text-white/50">ID: {network.chainId}</div>
                      </div>
                    </div>

                    {comparisonMode && (
                      <button
                        onClick={() => toggleChainSelection(network.chainId)}
                        className={`text-xs px-2 py-1 border rounded-sm ${
                          isSelected
                            ? 'bg-white/20 border-white/30 text-white'
                            : 'border-white/10 text-white/60 hover:text-white/90'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Compare'}
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {/* Security Score */}
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-white/60">Security Score:</div>
                      <div className="text-lg font-bold">
                        {rating.overallScore}
                        <span className="text-xs text-white/60">/100</span>
                      </div>
                    </div>

                    {/* Risk Level */}
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-white/60">Risk Level:</div>
                      <div>
                        <span
                          className="px-2 py-0.5 rounded-sm text-xs"
                          style={{ backgroundColor: getRiskLevelColor(rating.riskLevel) + '30', color: getRiskLevelColor(rating.riskLevel) }}
                        >
                          {riskDisplay.label}
                        </span>
                      </div>
                    </div>

                    {/* Top Factors */}
                    <div className="text-xs space-y-2 mt-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-black/30 p-2 border border-white/10 rounded-sm">
                          <div className="text-white/50 truncate">Decentralization</div>
                          <div className="font-bold" style={{ color: getFactorScoreColor(rating.factors.decentralization) }}>
                            {rating.factors.decentralization}/100
                          </div>
                        </div>

                        <div className="bg-black/30 p-2 border border-white/10 rounded-sm">
                          <div className="text-white/50 truncate">Validators</div>
                          <div className="font-bold" style={{ color: getFactorScoreColor(rating.factors.validators) }}>
                            {rating.factors.validators}/100
                          </div>
                        </div>

                        <div className="bg-black/30 p-2 border border-white/10 rounded-sm">
                          <div className="text-white/50 truncate">Attacks</div>
                          <div className="font-bold" style={{ color: getFactorScoreColor(rating.factors.attacks) }}>
                            {rating.factors.attacks}/100
                          </div>
                        </div>
                      </div>

                      {/* Additional metrics */}
                      <div className="bg-black/30 p-2 border border-white/10 rounded-sm">
                        <div className="flex justify-between">
                          <div>
                            <span className="text-white/50">TVL: </span>
                            <span>${(rating.tvlUSD / 1e9).toFixed(2)}B</span>
                          </div>
                          <div>
                            <span className="text-white/50">Audits: </span>
                            <span>{rating.securityAudits.length}</span>
                          </div>
                          <div>
                            <span className="text-white/50">Incidents: </span>
                            <span>{rating.attackHistory.length}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* View Details Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs mt-2"
                      onClick={() => {
                        // Show details in a modal or expand this card
                        // For simplicity, we're just adding to comparison
                        if (comparisonMode && !isSelected) {
                          toggleChainSelection(network.chainId);
                        }
                      }}
                    >
                      View Full Security Report
                    </Button>

                    {/* Risk Description */}
                    <div className="text-xs text-white/60 mt-1">
                      {riskDisplay.description}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredNetworks.length === 0 && (
            <div className="text-center py-12 text-white/50 border border-white/10 bg-black/30">
              No networks match your search criteria
            </div>
          )}

          {/* Risk Level Legend */}
          <div className="border border-white/10 bg-black/30 p-4 rounded-sm">
            <h3 className="text-sm font-medium mb-3">Risk Level Explanation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
              {['very_low', 'low', 'medium', 'high', 'very_high'].map(risk => {
                const riskLevel = risk as RiskLevel;
                const riskDisplay = getRiskLevelDisplay(riskLevel);

                return (
                  <div key={risk} className="border border-white/10 p-2 rounded-sm">
                    <div className="flex items-center mb-1">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: getRiskLevelColor(riskLevel) }}
                      />
                      <div className="text-sm font-medium">{riskDisplay.label}</div>
                    </div>
                    <div className="text-xs text-white/60">
                      {riskDisplay.description.split('. ')[0] + '.'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
