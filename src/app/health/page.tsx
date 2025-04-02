"use client";

import React from 'react';
import Navbar from "@/components/navbar";
import AppSkeleton from "@/components/app-skeleton";
import { Button } from '@/components/ui/button';
import NetworkDashboard from '@/components/health/network-dashboard';
import ChainComparison from '@/components/health/chain-comparison';
import { ChainStatus, generateChainsData, createProblemChains } from '@/components/health/chain-data';

export default function HealthPage() {
  // Generate chain data just for the comparison section
  // In a real app, this would come from the same data source as NetworkDashboard
  const chainsData: ChainStatus[] = generateChainsData(createProblemChains());

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <AppSkeleton>
        <main className="min-h-screen bg-black text-white">
          <div className="container mx-auto px-4 pt-16 md:pt-20 pb-8 max-w-6xl">
            {/* Network Health Monitor Dashboard */}
            <NetworkDashboard />

            {/* Divider */}
            <div className="h-px bg-white/20 my-8"></div>

            {/* Chain Comparison Section */}
            <h2 className="text-2xl font-mono uppercase tracking-widest border-b border-white/10 pb-3 mb-6">CHAIN COMPARISON</h2>
            <ChainComparison chainsData={chainsData} />

            {/* Divider */}
            <div className="h-px bg-white/20 my-8"></div>

            {/* System Health Section */}
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

            {/* Status footer */}
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                <span className="opacity-70">ALL SYSTEMS OPERATIONAL</span>
              </div>
              <div className="opacity-70">
                LAST UPDATE: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </div>
            </div>
          </div>
        </main>
      </AppSkeleton>
    </div>
  );
}
