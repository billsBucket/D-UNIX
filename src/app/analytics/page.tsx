"use client";

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useRealTimeData } from '@/hooks/use-real-time-data';
import { useGSAPAnimations } from '@/hooks/use-gsap-animations';
import Navbar from '@/components/navbar';
import AppSkeleton from '@/components/app-skeleton';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import GlobalErrorBoundary from '@/components/global-error-boundary';
import SuspenseLoading from '@/components/suspense-loading';

// Dynamically import components with better error handling
const BlockchainMetrics = dynamic(() => import('@/components/analytics/blockchain-metrics'), {
  loading: () => <SuspenseLoading variant="panel" label="Loading blockchain metrics..." />,
  ssr: false
});

const GasPriceHistory = dynamic(() => import('@/components/analytics/gas-price-history'), {
  loading: () => <SuspenseLoading variant="panel" label="Loading gas price history..." />,
  ssr: false
});

const TransactionVolumeChart = dynamic(() => import('@/components/analytics/transaction-volume-chart'), {
  loading: () => <SuspenseLoading variant="panel" height="h-64" label="Loading transaction volume chart..." />,
  ssr: false
});

const TradingVolumeAnalysis = dynamic(() => import('@/components/analytics/trading-volume-analysis'), {
  loading: () => <SuspenseLoading variant="panel" label="Loading trading volume analysis..." />,
  ssr: false
});

const LiquidityHealthIndicators = dynamic(() => import('@/components/analytics/liquidity-health-indicators'), {
  loading: () => <SuspenseLoading variant="panel" label="Loading liquidity health indicators..." />,
  ssr: false
});

const AdvancedMarketMetrics = dynamic(() => import('@/components/analytics/advanced-market-metrics'), {
  loading: () => <SuspenseLoading variant="panel" label="Loading advanced market metrics..." />,
  ssr: false
});

// Component wrapper with error handling for each analytics panel
const ErrorBoundaryWrapper = ({ children, componentName }: { children: React.ReactNode, componentName: string }) => (
  <GlobalErrorBoundary
    componentName={componentName}
    fallback={
      <div className="border border-red-500/20 bg-red-950/20 rounded-md p-4 text-white min-h-[150px] flex flex-col items-center justify-center">
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

export default function AnalyticsPage() {
  // Main container ref for animations
  const pageRef = useRef<HTMLDivElement>(null);
  const { fadeInUp, staggeredReveal } = useGSAPAnimations();
  const [componentsLoaded, setComponentsLoaded] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // Use real-time data hook with 2-minute refresh interval
  const { data: realTimeData, lastUpdate, refresh, isLoading } = useRealTimeData({
    refreshInterval: 120000, // 2 minutes in milliseconds
    metrics: ['all']
  });

  // Force refresh data periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      refresh();
    }, 120000); // 2 minutes

    return () => clearInterval(intervalId);
  }, [refresh]);

  // Set components as loaded after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setComponentsLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Initialize GSAP animations when page loads and components are ready
  useEffect(() => {
    if (!pageRef.current || !componentsLoaded) return;

    try {
      // Initial page entrance animation
      gsap.fromTo(
        ".page-title",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );

      // Staggered entrance of panels
      const panels = pageRef.current.querySelectorAll('.analytics-panel');
      if (panels.length > 0) {
        gsap.fromTo(
          panels,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.15,
            delay: 0.3
          }
        );
      }

      // Animate data refresh indicator
      const dataRefresh = pageRef.current.querySelector(".data-refresh");
      if (dataRefresh) {
        gsap.fromTo(
          dataRefresh,
          { opacity: 0 },
          { opacity: 0.7, duration: 0.5, delay: 1.5 }
        );
      }
    } catch (error) {
      console.error("GSAP animation error:", error);
      // If animations fail, ensure content is still visible
      gsap.set(".page-title, .analytics-panel, .data-refresh", { opacity: 1 });
    }
  }, [componentsLoaded]);

  // Handle global page errors
  const handleGlobalError = (error: Error) => {
    setPageError(`Application error: ${error.message}`);
    console.error("Global error in analytics page:", error);
  };

  return (
    <GlobalErrorBoundary onError={handleGlobalError}>
      <AppSkeleton>
        <main className="min-h-screen bg-black text-white overflow-x-hidden" ref={pageRef}>
          <Navbar />

          <div className="container mx-auto px-4 pt-20 pb-8">
            {/* Page Title */}
            <h1 className="text-4xl font-mono uppercase tracking-widest border-b border-white/10 pb-3 mb-6 page-title">
              CHAIN ANALYTICS
            </h1>

            {pageError && (
              <div className="bg-red-900/50 border border-red-500 text-white p-4 mb-6 rounded">
                {pageError}
                <button
                  className="ml-4 bg-white/10 px-2 py-1 rounded text-sm"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </button>
              </div>
            )}

            {isLoading && !realTimeData ? (
              <SuspenseLoading variant="fullscreen" label="Loading analytics data..." />
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Blockchain Metrics Panel */}
                  <div className="border border-white/10 p-4 bg-black analytics-panel">
                    <ErrorBoundaryWrapper componentName="Blockchain Metrics">
                      <Suspense fallback={<SuspenseLoading variant="panel" />}>
                        <BlockchainMetrics />
                      </Suspense>
                    </ErrorBoundaryWrapper>
                  </div>

                  {/* Gas Price History */}
                  <div className="border border-white/10 p-4 bg-black analytics-panel">
                    <ErrorBoundaryWrapper componentName="Gas Price History">
                      <Suspense fallback={<SuspenseLoading variant="panel" />}>
                        <GasPriceHistory />
                      </Suspense>
                    </ErrorBoundaryWrapper>
                  </div>
                </div>

                {/* Transaction Volume Chart */}
                <div className="mb-6 border border-white/10 p-4 bg-black analytics-panel">
                  <ErrorBoundaryWrapper componentName="Transaction Volume Chart">
                    <Suspense fallback={<SuspenseLoading variant="panel" height="h-64" />}>
                      <TransactionVolumeChart />
                    </Suspense>
                  </ErrorBoundaryWrapper>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Trading Volume Analysis */}
                  <div className="border border-white/10 p-4 bg-black analytics-panel">
                    <ErrorBoundaryWrapper componentName="Trading Volume Analysis">
                      <Suspense fallback={<SuspenseLoading variant="panel" />}>
                        <TradingVolumeAnalysis />
                      </Suspense>
                    </ErrorBoundaryWrapper>
                  </div>

                  {/* Liquidity Health Indicators */}
                  <div className="border border-white/10 p-4 bg-black analytics-panel">
                    <ErrorBoundaryWrapper componentName="Liquidity Health Indicators">
                      <Suspense fallback={<SuspenseLoading variant="panel" />}>
                        <LiquidityHealthIndicators />
                      </Suspense>
                    </ErrorBoundaryWrapper>
                  </div>
                </div>

                {/* Advanced Market Metrics - New Section */}
                <div className="border border-white/10 p-4 mb-6 bg-black analytics-panel">
                  <ErrorBoundaryWrapper componentName="Advanced Market Metrics">
                    <Suspense fallback={<SuspenseLoading variant="panel" />}>
                      <AdvancedMarketMetrics />
                    </Suspense>
                  </ErrorBoundaryWrapper>
                </div>

                {/* Footer - Data Refresh Indicator */}
                <div className="text-xs text-right opacity-70 font-mono data-refresh flex justify-end items-center">
                  <span>
                    DATA REFRESHED: {lastUpdate ? new Date(lastUpdate).toISOString().replace('T', ' ').substring(0, 19) + ' UTC' : 'LOADING...'}
                  </span>
                  <button
                    onClick={() => refresh()}
                    className="ml-3 text-xs px-2 py-1 bg-white/5 hover:bg-white/10 rounded transition-colors"
                  >
                    Refresh Data
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </AppSkeleton>
    </GlobalErrorBoundary>
  );
}
