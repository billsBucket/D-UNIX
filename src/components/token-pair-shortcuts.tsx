"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { TOKENS } from '@/lib/ethereum';

interface TokenPairShortcutsProps {
  onSelectPair: (tokenIn: string, tokenOut: string) => void;
  currentPair: {
    tokenIn: string;
    tokenOut: string;
  };
}

// Common token pairs that users frequently swap
const COMMON_PAIRS = [
  { tokenIn: 'ETH', tokenOut: 'USDC', label: 'ETH/USDC' },
  { tokenIn: 'ETH', tokenOut: 'USDT', label: 'ETH/USDT' },
  { tokenIn: 'WBTC', tokenOut: 'ETH', label: 'WBTC/ETH' },
  { tokenIn: 'ETH', tokenOut: 'DAI', label: 'ETH/DAI' },
  { tokenIn: 'LINK', tokenOut: 'ETH', label: 'LINK/ETH' },
  { tokenIn: 'MATIC', tokenOut: 'USDC', label: 'MATIC/USDC' },
];

export default function TokenPairShortcuts({ onSelectPair, currentPair }: TokenPairShortcutsProps) {
  // Function to check if a pair is currently selected
  const isPairSelected = (tokenIn: string, tokenOut: string) => {
    return currentPair.tokenIn === tokenIn && currentPair.tokenOut === tokenOut;
  };

  // Get token logo URL
  const getTokenLogo = (symbol: string) => {
    const tokenInfo = Object.values(TOKENS).find(token => token.symbol === symbol);
    return tokenInfo?.logoUrl || 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png'; // Default to ETH
  };

  return (
    <div className="mb-4">
      <h3 className="text-xs opacity-70 mb-2">POPULAR PAIRS</h3>
      <div className="flex overflow-x-auto gap-2 pb-2 -mx-2 px-2">
        {COMMON_PAIRS.map((pair) => (
          <Button
            key={pair.label}
            variant="outline"
            size="sm"
            className={`py-1 px-2 rounded-none border ${
              isPairSelected(pair.tokenIn, pair.tokenOut)
                ? 'bg-white/10 border-white/30'
                : 'bg-transparent border-white/10 hover:bg-white/5'
            } flex items-center space-x-1 whitespace-nowrap min-w-max`}
            onClick={() => onSelectPair(pair.tokenIn, pair.tokenOut)}
          >
            <div className="relative flex items-center">
              <img
                src={getTokenLogo(pair.tokenIn)}
                alt={pair.tokenIn}
                className="w-4 h-4 rounded-full"
              />
              <img
                src={getTokenLogo(pair.tokenOut)}
                alt={pair.tokenOut}
                className="w-4 h-4 rounded-full -ml-1"
              />
            </div>
            <span className="text-xs">{pair.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
