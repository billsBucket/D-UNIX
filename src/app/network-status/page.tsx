"use client";

import React, { Suspense } from 'react';
import { Card } from "@/components/ui/card";
import dynamic from 'next/dynamic';
import AppSkeleton from '@/components/app-skeleton';
import GlobalErrorBoundary from '@/components/global-error-boundary';
import SuspenseLoading from '@/components/suspense-loading';
import Navbar from '@/components/navbar';

// Dynamically import components with better error handling
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

export default function NetworkStatusPage() {
  return (
    <GlobalErrorBoundary componentName="Network Status Page">
      <div className="min-h-screen bg-black">
        <Navbar />
        <AppSkeleton>
          <div className="container py-6 mt-16">
            <div className="mb-8 border-b border-white/10 pb-2">
              <h1 className="text-3xl font-bold">Network Status</h1>
              <p className="text-white/60">Monitor blockchain network performance, security, and ecosystem data.</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              <div className="w-full md:w-1/2 mb-4">
                <ErrorBoundaryWrapper componentName="Blockchain Ecosystem Map">
                  <Suspense fallback={<SuspenseLoading variant="panel" height="h-72" />}>
                    <BlockchainEcosystemMap />
                  </Suspense>
                </ErrorBoundaryWrapper>
              </div>

              <div className="w-full md:w-1/2 mb-4">
                <ErrorBoundaryWrapper componentName="Transaction Cost Estimator">
                  <Suspense fallback={<SuspenseLoading variant="panel" height="h-60" />}>
                    <TransactionCostEstimator />
                  </Suspense>
                </ErrorBoundaryWrapper>
              </div>

              <div className="w-full md:w-1/2 mb-4">
                <ErrorBoundaryWrapper componentName="Network Security Ratings">
                  <Suspense fallback={<SuspenseLoading variant="panel" height="h-60" />}>
                    <NetworkSecurityRatings />
                  </Suspense>
                </ErrorBoundaryWrapper>
              </div>

              <div className="w-full md:w-1/2 mb-4">
                <ErrorBoundaryWrapper componentName="Multi-Chain Router">
                  <Suspense fallback={<SuspenseLoading variant="panel" height="h-60" />}>
                    <MultiChainRouter />
                  </Suspense>
                </ErrorBoundaryWrapper>
              </div>
            </div>

            <ErrorBoundaryWrapper componentName="Network Status Dashboard">
              <Suspense fallback={<SuspenseLoading variant="panel" height="h-96" />}>
                <NetworkStatusDashboard />
              </Suspense>
            </ErrorBoundaryWrapper>
          </div>
        </AppSkeleton>
      </div>
    </GlobalErrorBoundary>
  );
}
