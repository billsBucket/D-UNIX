"use client";

import React, { useState, useEffect } from 'react';
import { getTransactionHistory, formatRelativeTime, Transaction } from '@/lib/utils';
import { useWalletContext } from './wallet-provider';
import { TOKENS } from '@/lib/ethereum';

export default function TransactionHistorySummary() {
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const { isConnected, address } = useWalletContext();

  // Load recent transactions when wallet is connected
  useEffect(() => {
    if (!isConnected || !address) {
      setRecentTransactions([]);
      return;
    }

    // Get recent transactions
    const history = getTransactionHistory(address);
    // Only show the most recent 3 completed transactions
    const recent = history
      .filter(tx => tx.status === 'completed')
      .slice(0, 3);

    setRecentTransactions(recent);
  }, [address, isConnected]);

  // Get token logo URL
  const getTokenLogo = (symbol: string) => {
    const tokenInfo = Object.values(TOKENS).find(token => token.symbol === symbol);
    return tokenInfo?.logoUrl || 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png'; // Default to ETH
  };

  // If not connected or no transactions, return null
  if (!isConnected || recentTransactions.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h3 className="text-xs opacity-70 mb-2">RECENT TRANSACTIONS</h3>
      <div className="border border-white/10 bg-black/20 divide-y divide-white/10">
        {recentTransactions.map((tx) => (
          <div key={tx.id} className="p-2 hover:bg-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <img
                  src={getTokenLogo(tx.tokenIn)}
                  alt={tx.tokenIn}
                  className="w-4 h-4 rounded-full"
                />
                <span className="text-xs">{tx.tokenIn}</span>
                <span className="text-white/50">→</span>
                <img
                  src={getTokenLogo(tx.tokenOut)}
                  alt={tx.tokenOut}
                  className="w-4 h-4 rounded-full"
                />
                <span className="text-xs">{tx.tokenOut}</span>
              </div>
            </div>
            <div className="text-xs text-white/70">
              {formatRelativeTime(tx.timestamp)}
            </div>
          </div>
        ))}

        {/* Link to full history */}
        <div
          className="p-2 text-center text-xs text-white/70 hover:bg-white/5 cursor-pointer"
          onClick={() => document.querySelector('[value="history"]')?.dispatchEvent(new Event('click'))}
        >
          View All Transactions
        </div>
      </div>
    </div>
  );
}
