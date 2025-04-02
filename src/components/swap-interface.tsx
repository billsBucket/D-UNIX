"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import SwapForm from './swap-form';
import LimitForm from './limit-form';
import BridgeForm from './bridge-form';
import TransactionHistory from './transaction-history';
import { useWalletContext } from './wallet-provider';
import { NETWORKS, NetworkStatus } from '@/lib/ethereum';
import ChainTooltip from './chain-tooltip';

export default function SwapInterface() {
  const [activeTab, setActiveTab] = useState('swap');
  const [isMobile, setIsMobile] = useState(false);

  const {
    isConnected,
    connect,
    address,
    formatAddress,
    balance,
    chainId
  } = useWalletContext();

  // Get network info based on connected chain id
  const networkInfo = chainId ? NETWORKS[chainId] : NETWORKS[1]; // Default to Ethereum

  // Network Status Indicator component (internal to this component)
  const NetworkStatusIndicator = ({ status }: { status?: NetworkStatus }) => {
    let bgColor = "bg-gray-500";
    let statusText = "Unknown";

    if (status === 'online') {
      bgColor = "bg-green-500";
      statusText = "Online";
    } else if (status === 'degraded') {
      bgColor = "bg-yellow-500";
      statusText = "Degraded";
    } else if (status === 'offline') {
      bgColor = "bg-red-500";
      statusText = "Offline";
    }

    return (
      <div className="flex items-center">
        <span className={`relative flex h-2 w-2 mr-2`}>
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${bgColor} opacity-75`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${bgColor}`}></span>
        </span>
        <span className="text-xs opacity-70">{statusText}</span>
      </div>
    );
  };

  // Check if we're on a mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    // Set initial value
    checkIfMobile();

    // Add event listener
    window.addEventListener('resize', checkIfMobile);

    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="dunix-card">
      <Tabs
        defaultValue="swap"
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div className="mobile-scroll-container">
          <TabsList className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} mb-4 md:mb-6 bg-transparent min-w-[300px]`}>
            <TabsTrigger
              value="swap"
              className={`
                border border-white/20
                ${activeTab === 'swap' ? 'bg-white/10' : 'bg-transparent'}
                text-white uppercase rounded-none text-xs py-2
              `}
            >
              Swap
            </TabsTrigger>
            <TabsTrigger
              value="limit"
              className={`
                border border-white/20
                ${activeTab === 'limit' ? 'bg-white/10' : 'bg-transparent'}
                text-white uppercase rounded-none text-xs py-2
              `}
            >
              Limit
            </TabsTrigger>

            {/* On mobile, put the other tabs on the second row */}
            {isMobile && <div className="col-span-2 h-1"></div>}

            <TabsTrigger
              value="bridge"
              className={`
                border border-white/20
                ${activeTab === 'bridge' ? 'bg-white/10' : 'bg-transparent'}
                text-white uppercase rounded-none text-xs py-2
              `}
            >
              Bridge
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className={`
                border border-white/20
                ${activeTab === 'history' ? 'bg-white/10' : 'bg-transparent'}
                text-white uppercase rounded-none text-xs py-2
              `}
            >
              History
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="swap" className="mt-0">
          <SwapForm />
        </TabsContent>

        <TabsContent value="limit" className="mt-0">
          <LimitForm />
        </TabsContent>

        <TabsContent value="bridge" className="mt-0">
          <BridgeForm />
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <TransactionHistory />
        </TabsContent>
      </Tabs>

      <div className="mt-4">
        {isConnected ? (
          <motion.div
            className="border border-white/20 p-3 md:p-4 bg-black/50 rounded-none"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-2 gap-y-2 md:gap-y-3 text-xs">
              <div className="uppercase opacity-70">WALLET</div>
              <div className="text-right font-mono overflow-hidden text-ellipsis">
                {formatAddress(address)}
              </div>
              <div className="uppercase opacity-70">BALANCE</div>
              <div className="text-right">
                {balance} {networkInfo.symbol}
              </div>
              <div className="uppercase opacity-70">NETWORK</div>
              <ChainTooltip network={networkInfo}>
                <div className="text-right flex items-center justify-end cursor-help">
                  <motion.div
                    className="flex items-center mr-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <NetworkStatusIndicator status={networkInfo.status} />
                  </motion.div>
                  <motion.img
                    src={networkInfo.logoUrl}
                    alt={networkInfo.name}
                    className="w-4 h-4 mr-1 rounded-full"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  />
                  <motion.span
                    className="font-bold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    {networkInfo.name}
                  </motion.span>
                </div>
              </ChainTooltip>
              <div className="uppercase opacity-70">GAS PRICE</div>
              <div className="text-right">
                {networkInfo.gasPrice || "Unknown"}
              </div>
            </div>
          </motion.div>
        ) : (
          <Button
            className="w-full py-4 md:py-6 bg-white hover:bg-white/90 text-black rounded-none"
            onClick={connect}
          >
            CONNECT WALLET TO VIEW BALANCES
          </Button>
        )}
      </div>
    </div>
  );
}
