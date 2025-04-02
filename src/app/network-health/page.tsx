"use client";

import React, { Suspense, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from 'next/dynamic';
import AppSkeleton from '@/components/app-skeleton';
import GlobalErrorBoundary from '@/components/global-error-boundary';
import SuspenseLoading from '@/components/suspense-loading';
import Navbar from '@/components/navbar';
import NetworkDashboard from '@/components/health/network-dashboard';
import ChainComparison from '@/components/health/chain-comparison';
import { ChainStatus, generateChainsData, createProblemChains } from '@/components/health/chain-data';

// Dynamically import heavy components with better error handling
const NetworkStatusDashboard = dynamic(() => import("@/components/network-status-dashboard"), {
  loading: () => <SuspenseLoading variant="panel" height="h-96" label="Loading network status dashboard..." />,
  ssr: false
});

const BlockchainEcosystemMap = dynamic(() => import("@/components/blockchain-ecosystem-map"), {
  loading: () => <SuspenseLoading variant="panel" height="h-72" label="Loading blockchain ecosystem map..." />,
  ssr: false
});

const TransactionCostEstimator = dynamic(() => import("@/components/transaction-cost-estimator"), {
  loading: () => <SuspenseLoading variant="panel" height="h-60" label="Loading transaction cost estimator..." />,
  ssr: false
});

const NetworkSecurityRatings = dynamic(() => import("@/components/network-security-ratings"), {
  loading: () => <SuspenseLoading variant="panel" height="h-60" label="Loading network security ratings..." />,
  ssr: false
});

const MultiChainRouter = dynamic(() => import("@/components/multi-chain-router"), {
  loading: () => <SuspenseLoading variant="panel" height="h-60" label="Loading multi-chain router..." />,
  ssr: false
});

// Component wrapper with error handling for each panel
const ErrorBoundaryWrapper = ({ children, componentName }: { children: React.ReactNode, componentName: string }) => (
  <GlobalErrorBoundary
    componentName={componentName}
    fallback={
      <div className="border border-red-500/20 bg-red-950/20 rounded-md p-4 text-white min-h-[200px] flex flex-col items-center justify-center">
        <p className="text-sm text-red-300 mb-2">Error loading {componentName}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-xs px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-sm"
        >
          Reload
        </button>
      </div>
    }
  >
    {children}
  </GlobalErrorBoundary>
);

export default function NetworkHealthPage() {
  // Generate chain data for the comparison section
  const chainsData: ChainStatus[] = generateChainsData(createProblemChains());
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <GlobalErrorBoundary componentName="Network Health Page">
      <div className="min-h-screen bg-black">
        <Navbar />
        <AppSkeleton>
          <div className="container py-6 mt-16">
            <div className="mb-8 border-b border-white/10 pb-2">
              <h1 className="text-3xl font-bold">Network Health</h1>
              <p className="text-white/60">Monitor blockchain network performance, health metrics, and system status across all supported chains.</p>
            </div>

            <Tabs defaultValue="overview" className="mb-8" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="overview">OVERVIEW</TabsTrigger>
                <TabsTrigger value="advanced">ADVANCED</TabsTrigger>
                <TabsTrigger value="system">SYSTEM</TabsTrigger>
              </TabsList>

              {/* OVERVIEW TAB - Shows the main dashboards */}
              <TabsContent value="overview" className="space-y-6">
                {/* Network Health Dashboard */}
                <ErrorBoundaryWrapper componentName="Network Dashboard">
                  <NetworkDashboard />
                </ErrorBoundaryWrapper>

                {/* Network Status Dashboard */}
                <ErrorBoundaryWrapper componentName="Network Status Dashboard">
                  <Suspense fallback={<SuspenseLoading variant="panel" height="h-96" />}>
                    <NetworkStatusDashboard />
                  </Suspense>
                </ErrorBoundaryWrapper>
              </TabsContent>

              {/* ADVANCED TAB - Shows detailed tools and maps */}
              <TabsContent value="advanced" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="w-full mb-4">
                    <ErrorBoundaryWrapper componentName="Blockchain Ecosystem Map">
                      <Suspense fallback={<SuspenseLoading variant="panel" height="h-72" />}>
                        <BlockchainEcosystemMap />
                      </Suspense>
                    </ErrorBoundaryWrapper>
                  </div>

                  <div className="w-full mb-4">
                    <ErrorBoundaryWrapper componentName="Transaction Cost Estimator">
                      <Suspense fallback={<SuspenseLoading variant="panel" height="h-60" />}>
                        <TransactionCostEstimator />
                      </Suspense>
                    </ErrorBoundaryWrapper>
                  </div>

                  <div className="w-full mb-4">
                    <ErrorBoundaryWrapper componentName="Network Security Ratings">
                      <Suspense fallback={<SuspenseLoading variant="panel" height="h-60" />}>
                        <NetworkSecurityRatings />
                      </Suspense>
                    </ErrorBoundaryWrapper>
                  </div>

                  <div className="w-full mb-4">
                    <ErrorBoundaryWrapper componentName="Multi-Chain Router">
                      <Suspense fallback={<SuspenseLoading variant="panel" height="h-60" />}>
                        <MultiChainRouter />
                      </Suspense>
                    </ErrorBoundaryWrapper>
                  </div>
                </div>

                {/* Chain Comparison */}
                <ErrorBoundaryWrapper componentName="Chain Comparison">
                  <div className="mt-8">
                    <h2 className="text-2xl font-mono uppercase tracking-widest border-b border-white/10 pb-3 mb-6">CHAIN COMPARISON</h2>
                    <ChainComparison chainsData={chainsData} />
                  </div>
                </ErrorBoundaryWrapper>
              </TabsContent>

              {/* SYSTEM TAB - Shows system health metrics */}
              <TabsContent value="system" className="space-y-6">
                {/* System Health Section */}
                <div>
                  <h2 className="text-2xl font-mono uppercase tracking-widest border-b border-white/10 pb-3 mb-6">SYSTEM HEALTH</h2>

                  {/* Resource utilization */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 mb-6">
                    {/* Recent incidents */}
                    <div className="dunix-card border border-white/10 p-3 md:p-4">
                      <div className="flex justify-between items-center mb-3 md:mb-4">
                        <h2 className="text-lg md:text-xl font-mono uppercase">RECENT INCIDENTS</h2>
                        <Button variant="outline" size="sm" className="text-xs py-1 px-2 h-auto">VIEW ALL</Button>
                      </div>

                      <div className="space-y-3">
                        <div className="border border-white/10 p-3">
                          <div className="flex justify-between mb-2">
                            <h3 className="text-xs font-semibold">Polygon Node Degradation</h3>
                            <span className="text-xs text-yellow-500">DEGRADED</span>
                          </div>
                          <p className="text-xs opacity-70 mb-2">Several RPC nodes experiencing high latency affecting transaction processing time</p>
                          <div className="flex justify-between">
                            <span className="text-xs opacity-50">Started: 2h ago</span>
                            <span className="text-xs opacity-50">Ongoing</span>
                          </div>
                        </div>

                        <div className="border border-white/10 p-3">
                          <div className="flex justify-between mb-2">
                            <h3 className="text-xs font-semibold">Avalanche Network Disruption</h3>
                            <span className="text-xs text-red-500">OFFLINE</span>
                          </div>
                          <p className="text-xs opacity-70 mb-2">Major outage affecting all Avalanche C-Chain operations</p>
                          <div className="flex justify-between">
                            <span className="text-xs opacity-50">Started: 45m ago</span>
                            <span className="text-xs opacity-50">Ongoing</span>
                          </div>
                        </div>

                        <div className="border border-white/10 p-3">
                          <div className="flex justify-between mb-2">
                            <h3 className="text-xs font-semibold">Arbitrum Indexer Synchronization</h3>
                            <span className="text-xs text-green-500">RESOLVED</span>
                          </div>
                          <p className="text-xs opacity-70 mb-2">Temporary delay in transaction indexing for block explorers</p>
                          <div className="flex justify-between">
                            <span className="text-xs opacity-50">Duration: 35m</span>
                            <span className="text-xs opacity-50">Resolved: 3h ago</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Resource utilization */}
                    <div className="dunix-card border border-white/10 p-3 md:p-4">
                      <h2 className="text-lg md:text-xl font-mono uppercase mb-3 md:mb-4">RESOURCE UTILIZATION</h2>

                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs">CPU</span>
                            <span className="text-xs text-green-500">42%</span>
                          </div>
                          <div className="h-2 bg-white/10 w-full">
                            <div className="h-full bg-green-500" style={{ width: '42%' }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs">MEMORY</span>
                            <span className="text-xs text-yellow-500">68%</span>
                          </div>
                          <div className="h-2 bg-white/10 w-full">
                            <div className="h-full bg-yellow-500" style={{ width: '68%' }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs">STORAGE</span>
                            <span className="text-xs text-green-500">35%</span>
                          </div>
                          <div className="h-2 bg-white/10 w-full">
                            <div className="h-full bg-green-500" style={{ width: '35%' }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs">NETWORK</span>
                            <span className="text-xs text-green-500">28%</span>
                          </div>
                          <div className="h-2 bg-white/10 w-full">
                            <div className="h-full bg-green-500" style={{ width: '28%' }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/10">
                        <h3 className="text-xs font-semibold mb-2">SYSTEM STATUS</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="border border-white/10 p-3">
                            <p className="text-xs opacity-70 mb-1">UPTIME</p>
                            <p className="text-lg md:text-xl font-mono">99.98%</p>
                          </div>
                          <div className="border border-white/10 p-3">
                            <p className="text-xs opacity-70 mb-1">SINCE RESTART</p>
                            <p className="text-lg md:text-xl font-mono">14d 6h 32m</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Status footer */}
            <div className="flex justify-between items-center text-xs mt-8 pt-4 border-t border-white/10">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                <span className="opacity-70">ALL SYSTEMS OPERATIONAL</span>
              </div>
              <div className="opacity-70">
                LAST UPDATE: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </div>
            </div>
          </div>
        </AppSkeleton>
      </div>
    </GlobalErrorBoundary>
  );
}
