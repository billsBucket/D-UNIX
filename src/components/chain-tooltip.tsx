"use client"

import React, { useState } from 'react';
import { NetworkInfo, NetworkStatus } from '@/lib/ethereum';

interface ChainTooltipProps {
  network: NetworkInfo;
  children: React.ReactNode;
}

// Helper function to get status badge
const getStatusBadge = (status?: NetworkStatus) => {
  if (!status) return null;

  const colors = {
    online: 'bg-green-500/20 text-green-400 border-green-500/30',
    degraded: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    offline: 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  const labels = {
    online: 'Online',
    degraded: 'Degraded',
    offline: 'Offline'
  };

  return (
    <div className={`px-1.5 py-0.5 rounded-sm text-[10px] border ${colors[status]}`}>
      {labels[status]}
    </div>
  );
};

export default function ChainTooltip({ network, children }: ChainTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div
          className="absolute z-50 bottom-full mb-2 left-1/2 transform -translate-x-1/2 max-w-[250px] bg-black border border-white/20 p-3 rounded shadow-lg text-white"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <img
                  src={network.logoUrl}
                  alt={network.name}
                  className="w-5 h-5 rounded-full mr-2"
                />
                <span className="font-bold">{network.name}</span>
              </div>
              <div className="px-1.5 py-0.5 bg-white/10 rounded-sm text-[10px]">
                ID: {network.chainId}
              </div>
            </div>

            <div className="flex items-center justify-between">
              {getStatusBadge(network.status)}
              {network.gasPrice && (
                <div className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-sm text-[10px]">
                  Gas: {network.gasPrice}
                </div>
              )}
            </div>

            <div className="text-[10px] space-y-1 text-white/70">
              <div className="flex justify-between">
                <span>Currency:</span>
                <span className="text-white">{network.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span>Decimals:</span>
                <span className="text-white">{network.decimals}</span>
              </div>
              {network.features && network.features.length > 0 && (
                <div>
                  <div className="mb-1">Features:</div>
                  <div className="flex flex-wrap gap-1">
                    {network.features.map((feature, index) => (
                      <span
                        key={index}
                        className="px-1 py-0.5 bg-white/10 rounded-sm text-[9px]"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="truncate pt-1">
                <a
                  href={network.blockExplorer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline truncate"
                >
                  Explorer: {network.blockExplorer.replace('https://', '')}
                </a>
              </div>
            </div>
          </div>

          {/* Add a little arrow */}
          <div className="absolute w-3 h-3 bg-black border-r border-b border-white/20 transform rotate-45 left-1/2 -ml-1.5 -bottom-1.5"></div>
        </div>
      )}
    </div>
  );
}
