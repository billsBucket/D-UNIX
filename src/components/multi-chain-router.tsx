"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCrossChainRouter, BridgeProtocol, BridgeStep, CrossChainRoute } from '@/lib/cross-chain-router';
import { useTransactionEstimator, PriorityLevel } from '@/lib/transaction-estimator';
import { useCustomNetworks } from '@/lib/custom-networks';
import { useSecurityRatings } from '@/lib/security-ratings';

interface MultiChainRouterProps {
  children?: React.ReactNode;
}

export default function MultiChainRouter({ children }: MultiChainRouterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sourceChainId, setSourceChainId] = useState<number | null>(null);
  const [destinationChainId, setDestinationChainId] = useState<number | null>(null);
  const [amount, setAmount] = useState<number>(100);
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [routeCriteria, setRouteCriteria] = useState<'balanced' | 'security' | 'cost' | 'speed'>('balanced');
  const [routes, setRoutes] = useState<CrossChainRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<CrossChainRoute | null>(null);

  const { getAllNetworks } = useCustomNetworks();
  const allNetworks = getAllNetworks();

  const {
    generateRoutes,
    findOptimalRoute,
    validateRoute,
    setAmount: setRouterAmount,
    setPriority: setRouterPriority,
    formatRouteStep,
    formatTime,
    BRIDGE_PROTOCOLS
  } = useCrossChainRouter();

  const { securityRatings } = useSecurityRatings();

  // Memoize the route generation function to prevent unnecessary recalculations
  const generateAndSetRoutes = useCallback(() => {
    if (sourceChainId && destinationChainId) {
      const generatedRoutes = generateRoutes(sourceChainId, destinationChainId, allNetworks);
      setRoutes(generatedRoutes);

      // Find optimal route based on criteria
      const optimal = findOptimalRoute(generatedRoutes, routeCriteria);
      setSelectedRoute(optimal);
    }
  }, [sourceChainId, destinationChainId, allNetworks, generateRoutes, findOptimalRoute, routeCriteria]);

  // Handle network selection changes
  useEffect(() => {
    if (sourceChainId && !destinationChainId) {
      // Auto-select a destination if source is selected but destination isn't
      const otherChains = Object.keys(allNetworks)
        .map(Number)
        .filter(id => id !== sourceChainId);

      if (otherChains.length > 0) {
        setDestinationChainId(otherChains[0]);
      }
    }
  }, [allNetworks, sourceChainId, destinationChainId]);

  // Update router amount
  useEffect(() => {
    if (setRouterAmount) {
      setRouterAmount(amount);
    }
  }, [amount, setRouterAmount]);

  // Update router priority
  useEffect(() => {
    if (setRouterPriority) {
      setRouterPriority(priority);
    }
  }, [priority, setRouterPriority]);

  // Generate routes when necessary inputs change
  useEffect(() => {
    generateAndSetRoutes();
  }, [generateAndSetRoutes]);

  // No need to continue if there are no networks
  if (Object.keys(allNetworks).length === 0) {
    return null;
  }

  // Format dollar amounts
  const formatUSD = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  // Get route risk color
  const getRouteRiskColor = (risk: 'low' | 'medium' | 'high'): string => {
    switch (risk) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-white';
    }
  };

  // Protocol info tooltips
  const ProtocolInfo = ({ protocol }: { protocol: BridgeProtocol }) => {
    const protocolInfo = BRIDGE_PROTOCOLS[protocol];

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="text-xs underline text-blue-400 cursor-help">
            {protocolInfo.name}
          </TooltipTrigger>
          <TooltipContent className="max-w-md">
            <div className="space-y-2">
              <p>{protocolInfo.description}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div>Security Score:</div>
                <div className={protocolInfo.securityScore >= 80 ? 'text-green-400' :
                  protocolInfo.securityScore >= 60 ? 'text-yellow-400' : 'text-red-400'}>
                  {protocolInfo.securityScore}/100
                </div>

                <div>Reliability Score:</div>
                <div className={protocolInfo.reliabilityScore >= 80 ? 'text-green-400' :
                  protocolInfo.reliabilityScore >= 60 ? 'text-yellow-400' : 'text-red-400'}>
                  {protocolInfo.reliabilityScore}/100
                </div>

                <div>Base Fee:</div>
                <div>${protocolInfo.baseFeeUSD.toFixed(2)}</div>

                <div>Variable Fee:</div>
                <div>{(protocolInfo.variableFeePercentage * 100).toFixed(2)}%</div>
              </div>
              <p className="text-xs text-white/60">Trust Assumptions:</p>
              <ul className="list-disc list-inside text-xs">
                {protocolInfo.trustAssumptions.map((assumption, i) => (
                  <li key={i}>{assumption}</li>
                ))}
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="text-xs">
            Multi-Chain Router
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-black border border-white/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Multi-Chain Transaction Router</DialogTitle>
          <DialogDescription>
            Plan optimal cross-chain transfers across multiple blockchain networks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Network Selection */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="source-chain">Source Network</Label>
                <Select
                  value={sourceChainId?.toString() || ''}
                  onValueChange={(value) => {
                    // Make sure we handle this safely
                    if (value) {
                      try {
                        const chainId = parseInt(value);
                        setSourceChainId(chainId);

                        // Don't allow same source and destination
                        if (chainId === destinationChainId) {
                          // Find another chain to set as destination
                          const otherChains = Object.keys(allNetworks)
                            .map(Number)
                            .filter(id => id !== chainId);

                          if (otherChains.length > 0) {
                            setDestinationChainId(otherChains[0]);
                          } else {
                            setDestinationChainId(null);
                          }
                        }
                      } catch (error) {
                        console.error("Error parsing chain ID:", error);
                      }
                    }
                  }}
                >
                  <SelectTrigger id="source-chain" className="bg-black border-white/20">
                    <SelectValue placeholder="Select source network" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20 text-white">
                    {Object.entries(allNetworks).map(([id, network]) => (
                      <SelectItem key={id} value={id} className="text-white">
                        <div className="flex items-center">
                          <img
                            src={network.logoUrl}
                            alt={network.name}
                            className="w-4 h-4 rounded-full mr-2"
                          />
                          {network.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination-chain">Destination Network</Label>
                <Select
                  value={destinationChainId?.toString() || ''}
                  onValueChange={(value) => {
                    // Make sure we handle this safely
                    if (value) {
                      try {
                        const chainId = parseInt(value);
                        setDestinationChainId(chainId);

                        // Don't allow same source and destination
                        if (chainId === sourceChainId) {
                          // Find another chain to set as source
                          const otherChains = Object.keys(allNetworks)
                            .map(Number)
                            .filter(id => id !== chainId);

                          if (otherChains.length > 0) {
                            setSourceChainId(otherChains[0]);
                          } else {
                            setSourceChainId(null);
                          }
                        }
                      } catch (error) {
                        console.error("Error parsing chain ID:", error);
                      }
                    }
                  }}
                >
                  <SelectTrigger id="destination-chain" className="bg-black border-white/20">
                    <SelectValue placeholder="Select destination network" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20 text-white">
                    {Object.entries(allNetworks).map(([id, network]) => (
                      <SelectItem key={id} value={id} className="text-white">
                        <div className="flex items-center">
                          <img
                            src={network.logoUrl}
                            alt={network.name}
                            className="w-4 h-4 rounded-full mr-2"
                          />
                          {network.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Transaction Parameters */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Transaction Amount (USD)</Label>
                <div className="flex items-center">
                  <span className="text-sm mr-2">$</span>
                  <Input
                    id="amount"
                    type="number"
                    min={1}
                    max={1000000}
                    value={amount}
                    onChange={e => setAmount(parseInt(e.target.value) || 100)}
                    className="bg-black border-white/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Transaction Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(value) => {
                    if (value) {
                      setPriority(value as PriorityLevel);
                    }
                  }}
                >
                  <SelectTrigger id="priority" className="bg-black border-white/20">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20 text-white">
                    <SelectItem value="low" className="text-white">Low (Cheapest)</SelectItem>
                    <SelectItem value="medium" className="text-white">Medium (Balanced)</SelectItem>
                    <SelectItem value="high" className="text-white">High (Faster)</SelectItem>
                    <SelectItem value="urgent" className="text-white">Urgent (Fastest)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="route-criteria">Optimization Criteria</Label>
                <Select
                  value={routeCriteria}
                  onValueChange={(value) => {
                    if (value) {
                      setRouteCriteria(value as any);
                    }
                  }}
                >
                  <SelectTrigger id="route-criteria" className="bg-black border-white/20">
                    <SelectValue placeholder="Select criteria" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20 text-white">
                    <SelectItem value="balanced" className="text-white">Balanced (All Factors)</SelectItem>
                    <SelectItem value="security" className="text-white">Security (Safest Route)</SelectItem>
                    <SelectItem value="cost" className="text-white">Cost (Cheapest Route)</SelectItem>
                    <SelectItem value="speed" className="text-white">Speed (Fastest Route)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Route Results */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">
              {routes.length > 0
                ? 'Optimized Cross-Chain Routes'
                : 'No Available Routes Found'}
            </h3>

            {routes.length === 0 ? (
              <div className="border border-white/10 bg-black/30 p-4 rounded-sm text-center text-white/60">
                {sourceChainId && destinationChainId
                  ? `No available routes found between ${allNetworks[sourceChainId]?.name} and ${allNetworks[destinationChainId]?.name}.`
                  : 'Select source and destination networks to find routes.'}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Rest of the component - routes display, etc. */}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
