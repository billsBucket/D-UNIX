"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getTransactionHistory,
  formatRelativeTime,
  formatAddress,
  Transaction
} from '@/lib/utils';
import { useWalletContext } from './wallet-provider';
import { TOKENS } from '@/lib/ethereum';

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'swap' | 'limit' | 'bridge'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'time' | 'value'>('time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { address, isConnected } = useWalletContext();

  // Load transaction history when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      const history = getTransactionHistory(address);
      setTransactions(history);
      setFilteredTransactions(history);
    } else {
      setTransactions([]);
      setFilteredTransactions([]);
    }
  }, [address, isConnected]);

  // Apply filters and sorting
  useEffect(() => {
    if (!transactions.length) return;

    let filtered = [...transactions];

    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(tx => tx.type === filter);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.tokenIn.toLowerCase().includes(query) ||
        tx.tokenOut.toLowerCase().includes(query) ||
        tx.txHash.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'time') {
        return sortDirection === 'desc'
          ? b.timestamp - a.timestamp
          : a.timestamp - b.timestamp;
      } else {
        // Sort by value (amountIn converted to number)
        const aValue = parseFloat(a.amountIn);
        const bValue = parseFloat(b.amountIn);
        return sortDirection === 'desc'
          ? bValue - aValue
          : aValue - bValue;
      }
    });

    setFilteredTransactions(filtered);
  }, [transactions, filter, searchQuery, sortBy, sortDirection]);

  // Toggle sort direction
  const toggleSort = (sortType: 'time' | 'value') => {
    if (sortBy === sortType) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(sortType);
      setSortDirection('desc'); // Default to descending when changing sort type
    }
  };

  // Get token logo URL
  const getTokenLogo = (symbol: string) => {
    const tokenInfo = Object.values(TOKENS).find(token => token.symbol === symbol);
    return tokenInfo?.logoUrl || 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png'; // Default to ETH
  };

  // Handle status color and icon
  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-white/50';
    }
  };

  // Status icons
  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'pending':
        return '⏳';
      case 'failed':
        return '✕';
      default:
        return '?';
    }
  };

  if (!isConnected) {
    return (
      <div className="border border-white/20 rounded-none p-6 text-center">
        <div className="text-lg mb-4">CONNECT WALLET TO VIEW HISTORY</div>
        <div className="text-white/50 text-sm">
          Your transaction history will appear here once you connect your wallet.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl uppercase font-mono">TRANSACTION HISTORY</h2>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-3">
          <Input
            type="text"
            placeholder="SEARCH BY TOKEN OR TX HASH"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="dunix-input w-full"
          />
        </div>
        <div className="md:col-span-2 grid grid-cols-4 gap-1">
          <Button
            onClick={() => setFilter('all')}
            variant="outline"
            className={`px-2 py-1 text-xs ${
              filter === 'all' ? 'bg-white/10 border-white/30' : 'bg-transparent'
            } rounded-none`}
          >
            ALL
          </Button>
          <Button
            onClick={() => setFilter('swap')}
            variant="outline"
            className={`px-2 py-1 text-xs ${
              filter === 'swap' ? 'bg-white/10 border-white/30' : 'bg-transparent'
            } rounded-none`}
          >
            SWAPS
          </Button>
          <Button
            onClick={() => setFilter('limit')}
            variant="outline"
            className={`px-2 py-1 text-xs ${
              filter === 'limit' ? 'bg-white/10 border-white/30' : 'bg-transparent'
            } rounded-none`}
          >
            LIMITS
          </Button>
          <Button
            onClick={() => setFilter('bridge')}
            variant="outline"
            className={`px-2 py-1 text-xs ${
              filter === 'bridge' ? 'bg-white/10 border-white/30' : 'bg-transparent'
            } rounded-none`}
          >
            BRIDGES
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="border border-white/20 rounded-none overflow-hidden">
        {filteredTransactions.length > 0 ? (
          <div>
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 bg-black/50 p-2 border-b border-white/20">
              <div className="col-span-1 text-xs font-mono opacity-70">TYPE</div>
              <div
                className="col-span-3 text-xs font-mono opacity-70 cursor-pointer flex items-center"
                onClick={() => toggleSort('time')}
              >
                TIME {sortBy === 'time' && (sortDirection === 'desc' ? '↓' : '↑')}
              </div>
              <div className="col-span-4 text-xs font-mono opacity-70">TOKENS</div>
              <div
                className="col-span-2 text-xs font-mono opacity-70 cursor-pointer flex items-center"
                onClick={() => toggleSort('value')}
              >
                AMOUNT {sortBy === 'value' && (sortDirection === 'desc' ? '↓' : '↑')}
              </div>
              <div className="col-span-2 text-xs font-mono opacity-70">STATUS</div>
            </div>

            {/* Transactions */}
            <div className="divide-y divide-white/10 max-h-80 overflow-auto">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="grid grid-cols-12 gap-2 p-3 hover:bg-white/5">
                  {/* Type */}
                  <div className="col-span-1">
                    <span className="uppercase text-xs font-mono px-2 py-1 bg-white/10 rounded-sm">
                      {tx.type.substring(0, 3)}
                    </span>
                  </div>

                  {/* Time */}
                  <div className="col-span-3 text-sm flex flex-col justify-center">
                    <div>{formatRelativeTime(tx.timestamp)}</div>
                    <div className="text-xs opacity-50">
                      {new Date(tx.timestamp).toLocaleString()}
                    </div>
                  </div>

                  {/* Tokens */}
                  <div className="col-span-4 flex items-center space-x-1">
                    <img
                      src={getTokenLogo(tx.tokenIn)}
                      alt={tx.tokenIn}
                      className="w-5 h-5 rounded-full"
                    />
                    <span>{tx.tokenIn}</span>
                    <span className="text-white/50 mx-1">→</span>
                    <img
                      src={getTokenLogo(tx.tokenOut)}
                      alt={tx.tokenOut}
                      className="w-5 h-5 rounded-full"
                    />
                    <span>{tx.tokenOut}</span>
                  </div>

                  {/* Amount */}
                  <div className="col-span-2 text-sm">
                    <div>{tx.amountIn} {tx.tokenIn}</div>
                    <div className="text-white/50 text-xs">
                      {tx.amountOut} {tx.tokenOut}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <div className={`flex items-center ${getStatusColor(tx.status)}`}>
                      <span className="mr-1">{getStatusIcon(tx.status)}</span>
                      <span className="capitalize">{tx.status}</span>
                    </div>
                    <a
                      href={`https://etherscan.io/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-white/50 hover:text-white underline"
                    >
                      {formatAddress(tx.txHash)}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-white/50 mb-2">NO TRANSACTIONS FOUND</div>
            <div className="text-xs text-white/30">
              {filter !== 'all'
                ? `No ${filter} transactions found. Try changing the filter.`
                : searchQuery
                  ? "No transactions match your search query."
                  : "Your transactions will appear here after you make them."}
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-white/50 mt-2">
        Transaction history is stored locally in your browser.
      </div>
    </div>
  );
}
