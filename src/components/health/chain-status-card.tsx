"use client";

import React from 'react';
import Image from 'next/image';

interface ChainStatusCardProps {
  chain: {
    id: string;
    name: string;
    status: 'OPERATIONAL' | 'CONGESTED' | 'DEGRADED' | 'OUTAGE';
    image: string;
    color: string;
    gas: number;
    block: string;
    tps: number;
    time: string;
  };
  onStatusClick?: (status: 'OPERATIONAL' | 'CONGESTED' | 'DEGRADED' | 'OUTAGE') => void;
}

export default function ChainStatusCard({ chain, onStatusClick }: ChainStatusCardProps) {
  // Get status indicator color
  const getStatusColor = (status: string): string => {
    if (status === 'OPERATIONAL') return '#1ee921'; // Bright green
    if (status === 'CONGESTED') return '#FFBB00';   // Yellow/orange
    if (status === 'DEGRADED') return '#FF5500';    // Orange/red
    if (status === 'OUTAGE') return '#FF0000';      // Red
    return '#FFFFFF';
  };

  // Get status text color class
  const getStatusTextClass = (status: string): string => {
    if (status === 'OPERATIONAL') return 'text-[#1ee921]';
    if (status === 'CONGESTED') return 'text-[#FFBB00]';
    if (status === 'DEGRADED') return 'text-[#FF5500]';
    if (status === 'OUTAGE') return 'text-[#FF0000]';
    return 'text-white';
  };

  // Handle card click
  const handleClick = () => {
    if (onStatusClick) {
      onStatusClick(chain.status);
    }
  };

  return (
    <div
      className="border-r border-b border-white/20 hover:bg-black/30 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex py-2 px-3">
        {/* Left side with status indicator */}
        <div className="mr-2 flex items-center">
          <div
            className="h-2 w-2 rounded-full animate-pulse"
            style={{ backgroundColor: getStatusColor(chain.status) }}
          ></div>
        </div>

        {/* Chain logo and name */}
        <div className="flex items-center">
          <div className="mr-2">
            <Image
              src={chain.image}
              alt={chain.name}
              width={32}
              height={32}
              className="w-8 h-8"
            />
          </div>

          <div className="mr-3">
            <div className="text-sm font-bold uppercase">{chain.name}</div>
            <div className={`text-xs ${getStatusTextClass(chain.status)}`}>
              {chain.status}
            </div>
          </div>
        </div>

        {/* Stats - Right aligned */}
        <div className="ml-auto grid grid-cols-2 gap-x-8 text-right">
          <div>
            <div className="text-white/60 text-xs mb-1">Gas:</div>
            <div className="text-white text-xs font-mono">{chain.gas} Gwei</div>
          </div>
          <div>
            <div className="text-white/60 text-xs mb-1">Block:</div>
            <div className="text-white text-xs font-mono">{chain.block}</div>
          </div>
          <div>
            <div className="text-white/60 text-xs mb-1">TPS:</div>
            <div className="text-white text-xs font-mono">{chain.tps}</div>
          </div>
          <div>
            <div className="text-white/60 text-xs mb-1">Time:</div>
            <div className="text-white text-xs font-mono">{chain.time}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
