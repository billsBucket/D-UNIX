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
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { useTransactionEstimator, TransactionType, PriorityLevel } from '@/lib/transaction-estimator';
import { useCustomNetworks } from '@/lib/custom-networks';
import { useNetworkSpeed } from '@/lib/network-speed';
import { useNetworkHistory } from '@/lib/network-history';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface TransactionCostEstimatorProps {
  children?: React.ReactNode;
}

export default function TransactionCostEstimator({ children }: TransactionCostEstimatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('transfer');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [customGas, setCustomGas] = useState(100000);
  const [transactionAmount, setTransactionAmount] = useState(100); // in USD
  const [activeTab, setActiveTab] = useState('cost');

  const { getAllNetworks } = useCustomNetworks();
  const { speedResults } = useNetworkSpeed();
  const { getReliabilityScore } = useNetworkHistory();
  const {
    estimateTransactionAcrossNetworks,
    setCustomGasAmount,
    updateTokenPrice,
    setAmount,
    setPriority: setEstimatorPriority
  } = useTransactionEstimator();

  const allNetworks = getAllNetworks();

  // Get estimates across networks
  const estimates = estimateTransactionAcrossNetworks(
    allNetworks,
    transactionType,
    priority,
    transactionType === 'custom' ? customGas : undefined
  );

  // Format data for charts
  const costChartData = estimates.map(estimate => ({
    name: estimate.networkName,
    cost: estimate.estimatedCostUSD,
    gasPrice: estimate.gasPriceValue
  }));

  const timeChartData = estimates.map(estimate => ({
    name: estimate.networkName,
    time: estimate.estimatedTimeSeconds / 60, // convert to minutes
  }));

  const scoreChartData = estimates.map(estimate => ({
    name: estimate.networkName,
    score: estimate.recommendationScore,
    reliability: estimate.reliability
  }));

  useEffect(() => {
    if (transactionType === 'custom') {
      setCustomGasAmount(customGas);
    }
  }, [customGas, transactionType]);

  useEffect(() => {
    setEstimatorPriority(priority);
  }, [priority]);

  useEffect(() => {
    setAmount(transactionAmount);
  }, [transactionAmount]);

  // Formatting functions
  const formatTime = (minutes: number) => {
    if (minutes < 1) return `${Math.round(minutes * 60)} sec`;
    if (minutes < 60) return `${minutes.toFixed(1)} min`;
    return `${(minutes / 60).toFixed(1)} hr`;
  };

  const formatUSD = (amount: number) => {
    return `$${amount.toFixed(4)}`;
  };

  // Transaction type options with descriptions
  const transactionTypes: { type: TransactionType; label: string; description: string; gasEstimate: number }[] = [
    { type: 'transfer', label: 'Transfer', description: 'Simple token transfer', gasEstimate: 21000 },
    { type: 'swap', label: 'Swap', description: 'Token exchange on DEX', gasEstimate: 150000 },
    { type: 'mint', label: 'NFT Mint', description: 'Mint an NFT', gasEstimate: 200000 },
    { type: 'stake', label: 'Stake', description: 'Stake tokens', gasEstimate: 100000 },
    { type: 'lending', label: 'Lending', description: 'Lending operation', gasEstimate: 180000 },
    { type: 'bridge', label: 'Bridge', description: 'Cross-chain bridge', gasEstimate: 250000 },
    { type: 'custom', label: 'Custom', description: 'Custom gas amount', gasEstimate: customGas },
  ];

  // Priority level options
  const priorityLevels: { level: PriorityLevel; label: string; description: string }[] = [
    { level: 'low', label: 'Low', description: 'Lowest fee, longer confirmation time' },
    { level: 'medium', label: 'Medium', description: 'Balanced fee and confirmation time' },
    { level: 'high', label: 'High', description: 'Higher fee, faster confirmation' },
    { level: 'urgent', label: 'Urgent', description: 'Highest fee, fastest confirmation' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="text-xs">
            Transaction Cost Estimator
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-black border border-white/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaction Cost Estimator</DialogTitle>
          <DialogDescription>
            Compare transaction costs, times, and efficiency across different networks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Configuration Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Transaction Type */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Transaction Type</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {transactionTypes.map(({ type, label }) => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    className={`text-xs ${transactionType === type ? 'bg-white/10 border-white/30' : 'bg-transparent'}`}
                    onClick={() => setTransactionType(type)}
                  >
                    {label}
                  </Button>
                ))}
              </div>

              {/* Transaction type description */}
              <div className="text-xs text-white/60">
                {transactionTypes.find(t => t.type === transactionType)?.description || ''}
                {transactionType !== 'custom' && (
                  <span> (~{transactionTypes.find(t => t.type === transactionType)?.gasEstimate.toLocaleString()} gas)</span>
                )}
              </div>

              {/* Custom Gas Input (only show for 'custom' type) */}
              {transactionType === 'custom' && (
                <div className="pt-2">
                  <Label htmlFor="custom-gas" className="text-xs">Custom Gas Units</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="custom-gas"
                      type="number"
                      min={21000}
                      max={10000000}
                      value={customGas}
                      onChange={e => setCustomGas(parseInt(e.target.value) || 100000)}
                      className="h-8 bg-black border-white/20"
                    />
                    <span className="text-xs text-white/60">gas units</span>
                  </div>
                </div>
              )}
            </div>

            {/* Priority Level */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Priority Level</h3>
              <div className="grid grid-cols-2 gap-2">
                {priorityLevels.map(({ level, label }) => (
                  <Button
                    key={level}
                    variant="outline"
                    size="sm"
                    className={`text-xs ${priority === level ? 'bg-white/10 border-white/30' : 'bg-transparent'}`}
                    onClick={() => setPriority(level)}
                  >
                    {label}
                  </Button>
                ))}
              </div>

              {/* Priority level description */}
              <div className="text-xs text-white/60">
                {priorityLevels.find(p => p.level === priority)?.description || ''}
              </div>

              {/* Transaction Amount */}
              <div className="pt-2">
                <Label htmlFor="tx-amount" className="text-xs">Transaction Amount (for fee calculation)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs">$</span>
                  <Input
                    id="tx-amount"
                    type="number"
                    min={1}
                    max={1000000}
                    value={transactionAmount}
                    onChange={e => setTransactionAmount(parseInt(e.target.value) || 100)}
                    className="h-8 bg-black border-white/20"
                  />
                  <span className="text-xs text-white/60">USD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Tabs */}
          <Tabs defaultValue="cost" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="cost">Cost Comparison</TabsTrigger>
              <TabsTrigger value="time">Time Comparison</TabsTrigger>
              <TabsTrigger value="overall">Overall Score</TabsTrigger>
            </TabsList>

            {/* Cost Comparison Tab */}
            <TabsContent value="cost" className="pt-2">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={costChartData.sort((a, b) => a.cost - b.cost)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 'auto']} />
                    <YAxis type="category" dataKey="name" width={70} />
                    <RechartsTooltip
                      formatter={(value, name) => [
                        name === 'cost' ? formatUSD(value as number) : `${value} gwei`,
                        name === 'cost' ? 'Estimated Cost' : 'Gas Price'
                      ]}
                    />
                    <Legend />
                    <Bar
                      dataKey="cost"
                      name="Estimated Cost (USD)"
                      fill="#8884d8"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed Cost Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="py-2 px-3 text-left">Network</th>
                      <th className="py-2 px-3 text-right">Gas Price</th>
                      <th className="py-2 px-3 text-right">Gas Units</th>
                      <th className="py-2 px-3 text-right">Cost (Gwei)</th>
                      <th className="py-2 px-3 text-right">Cost (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estimates.map(estimate => (
                      <tr key={estimate.chainId} className="border-b border-white/5">
                        <td className="py-2 px-3">{estimate.networkName}</td>
                        <td className="py-2 px-3 text-right">{estimate.gasPrice}</td>
                        <td className="py-2 px-3 text-right">{estimate.gasUnits.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right">{estimate.estimatedCostGwei}</td>
                        <td className="py-2 px-3 text-right font-medium">${estimate.estimatedCostUSD.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Time Comparison Tab */}
            <TabsContent value="time" className="pt-2">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={timeChartData.sort((a, b) => a.time - b.time)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 'auto']} />
                    <YAxis type="category" dataKey="name" width={70} />
                    <RechartsTooltip
                      formatter={(value, name) => [
                        formatTime(value as number),
                        'Estimated Time'
                      ]}
                    />
                    <Bar
                      dataKey="time"
                      name="Estimated Time (mins)"
                      fill="#82ca9d"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed Time Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="py-2 px-3 text-left">Network</th>
                      <th className="py-2 px-3 text-right">Estimated Time</th>
                      <th className="py-2 px-3 text-right">Network Congestion</th>
                      <th className="py-2 px-3 text-right">Block Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estimates.map(estimate => (
                      <tr key={estimate.chainId} className="border-b border-white/5">
                        <td className="py-2 px-3">{estimate.networkName}</td>
                        <td className="py-2 px-3 text-right font-medium">{estimate.estimatedTimeFormatted}</td>
                        <td className="py-2 px-3 text-right">
                          <span className={
                            estimate.congestion === 'low' ? 'text-green-400' :
                            estimate.congestion === 'medium' ? 'text-yellow-400' :
                            estimate.congestion === 'high' ? 'text-orange-400' :
                            'text-red-400'
                          }>
                            {estimate.congestion.charAt(0).toUpperCase() + estimate.congestion.slice(1)}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          {/* This is a placeholder - we would need actual block times */}
                          {estimate.networkName === 'Ethereum' ? '12s' :
                            estimate.networkName === 'Arbitrum' ||
                            estimate.networkName === 'Optimism' ||
                            estimate.networkName === 'Base' ? '< 1s' :
                            estimate.networkName === 'Polygon' ? '2s' :
                            'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Overall Score Tab */}
            <TabsContent value="overall" className="pt-2">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={scoreChartData.sort((a, b) => b.score - a.score)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" width={70} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar
                      dataKey="score"
                      name="Overall Score"
                      fill="#8884d8"
                    />
                    <Bar
                      dataKey="reliability"
                      name="Reliability"
                      fill="#82ca9d"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Recommendations */}
              <div className="mt-6 space-y-4">
                <h3 className="text-sm font-medium">Recommended Networks</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Best Overall */}
                  {estimates.length > 0 && (
                    <div className="border border-white/10 bg-white/5 p-3 rounded-sm">
                      <div className="text-xs text-white/60">Best Overall</div>
                      <div className="text-lg font-medium">{estimates[0].networkName}</div>
                      <div className="text-xs mt-1">Score: {estimates[0].recommendationScore}/100</div>
                      <div className="text-xs text-white/60 mt-2">
                        Balanced for cost, speed, and reliability
                      </div>
                    </div>
                  )}

                  {/* Lowest Cost */}
                  {estimates.length > 0 && (
                    <div className="border border-white/10 bg-white/5 p-3 rounded-sm">
                      <div className="text-xs text-white/60">Lowest Cost</div>
                      <div className="text-lg font-medium">
                        {estimates.sort((a, b) => a.estimatedCostUSD - b.estimatedCostUSD)[0].networkName}
                      </div>
                      <div className="text-xs mt-1">
                        ${estimates.sort((a, b) => a.estimatedCostUSD - b.estimatedCostUSD)[0].estimatedCostUSD.toFixed(4)}
                      </div>
                      <div className="text-xs text-white/60 mt-2">
                        Best for cost-sensitive transactions
                      </div>
                    </div>
                  )}

                  {/* Fastest */}
                  {estimates.length > 0 && (
                    <div className="border border-white/10 bg-white/5 p-3 rounded-sm">
                      <div className="text-xs text-white/60">Fastest Confirmation</div>
                      <div className="text-lg font-medium">
                        {estimates.sort((a, b) => a.estimatedTimeSeconds - b.estimatedTimeSeconds)[0].networkName}
                      </div>
                      <div className="text-xs mt-1">
                        {estimates.sort((a, b) => a.estimatedTimeSeconds - b.estimatedTimeSeconds)[0].estimatedTimeFormatted}
                      </div>
                      <div className="text-xs text-white/60 mt-2">
                        Best for time-sensitive transactions
                      </div>
                    </div>
                  )}
                </div>

                {/* Advanced Analysis */}
                <div className="border border-white/10 bg-black/30 p-4 rounded-sm mt-6">
                  <h3 className="text-sm font-medium mb-3">Analysis</h3>
                  <p className="text-sm text-white/80">
                    For this {transactionType} transaction with {priority} priority:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1 mt-2 text-white/80">
                    <li>
                      Layer 2 networks like {['Arbitrum', 'Optimism', 'Base'].filter(name =>
                        estimates.some(e => e.networkName === name)
                      ).join(', ')} offer significantly lower costs compared to Ethereum mainnet.
                    </li>
                    <li>
                      {estimates.sort((a, b) => a.estimatedTimeSeconds - b.estimatedTimeSeconds)[0].networkName} has the fastest estimated confirmation time, but {estimates.sort((a, b) => a.estimatedCostUSD - b.estimatedCostUSD)[0].networkName} offers the lowest cost.
                    </li>
                    <li>
                      Network congestion levels are currently {
                        (() => {
                          const congestionCounts = estimates.reduce((acc, curr) => {
                            acc[curr.congestion] = (acc[curr.congestion] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>);

                          const mostCommon = Object.entries(congestionCounts).sort((a, b) => b[1] - a[1])[0];
                          return `${mostCommon[0]} for most networks`;
                        })()
                      }
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
