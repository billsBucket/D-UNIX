"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { TOKENS } from '@/lib/ethereum';
import { useWalletContext } from './wallet-provider';
import { getTokenBalance, TokenBalance } from '@/lib/ethereum';

export interface TokenOption {
  symbol: string;
  name: string;
  address: string;
  logoUrl: string;
  decimals: number;
  category: string;
  balance?: string;
}

// Convert the TOKENS object to a TokenOption array
const tokenList: TokenOption[] = Object.entries(TOKENS).map(([symbol, details]) => ({
  symbol,
  name: details.name,
  address: details.address,
  logoUrl: details.logoUrl,
  decimals: details.decimals,
  category: details.category,
}));

interface TokenSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  excludeToken?: string;
}

export default function TokenSelector({ value, onChange, className, excludeToken }: TokenSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredTokens, setFilteredTokens] = useState<TokenOption[]>(tokenList);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Get user context for wallet
  const { isConnected, address } = useWalletContext();

  // Define token categories
  const categories = [
    { id: 'all', name: 'All' },
    { id: 'base', name: 'Base' },
    { id: 'stablecoin', name: 'Stables' },
    { id: 'defi', name: 'DeFi' },
    { id: 'layer2', name: 'L2' },
    { id: 'meme', name: 'Meme' },
  ];

  // Filter tokens based on search, excluded token, and active category
  useEffect(() => {
    let tokens = [...tokenList];

    // Remove excluded token
    if (excludeToken) {
      tokens = tokens.filter(token => token.symbol !== excludeToken);
    }

    // Apply category filter
    if (activeCategory !== 'all') {
      tokens = tokens.filter(token => token.category === activeCategory);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      tokens = tokens.filter(token =>
        token.symbol.toLowerCase().includes(searchLower) ||
        token.name.toLowerCase().includes(searchLower) ||
        token.address.toLowerCase().includes(searchLower)
      );
    }

    // Sort by balance (if connected) and then by symbol
    tokens.sort((a, b) => {
      if (isConnected) {
        const balanceA = parseFloat(balances[a.symbol] || '0');
        const balanceB = parseFloat(balances[b.symbol] || '0');
        if (balanceB !== balanceA) {
          return balanceB - balanceA; // Higher balances first
        }
      }
      return a.symbol.localeCompare(b.symbol);
    });

    setFilteredTokens(tokens);
  }, [search, excludeToken, activeCategory, balances, isConnected]);

  // Fetch token balances when connected and dialog opens
  useEffect(() => {
    const fetchBalances = async () => {
      if (!isConnected || !address || !open) return;

      setIsLoadingBalances(true);
      const newBalances: Record<string, string> = {};

      try {
        // Fetch in parallel for faster loading, but limit to 5 at a time to prevent rate limiting
        const batchSize = 5;
        const tokens = tokenList.filter(token => token.symbol !== excludeToken);

        for (let i = 0; i < tokens.length; i += batchSize) {
          const batch = tokens.slice(i, i + batchSize);
          const results = await Promise.allSettled(
            batch.map(token =>
              getTokenBalance(token.address === 'native' ? 'ETH' : token.address, address)
            )
          );

          results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              const tokenSymbol = batch[index].symbol;
              const formattedBalance = result.value.formattedBalance;
              // Only store non-zero balances
              if (parseFloat(formattedBalance) > 0) {
                newBalances[tokenSymbol] = formattedBalance;
              }
            }
          });
        }

        setBalances(newBalances);
      } catch (error) {
        console.error('Error fetching token balances:', error);
      } finally {
        setIsLoadingBalances(false);
      }
    };

    fetchBalances();
  }, [isConnected, address, open, excludeToken]);

  // Get the selected token
  const selectedToken = tokenList.find(token => token.symbol === value);

  // Handle token selection
  const handleSelectToken = (token: TokenOption) => {
    onChange(token.symbol);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={`flex justify-between items-center bg-black text-white border border-white/20 px-4 rounded-none w-full h-full ${className}`}
        >
          {selectedToken ? (
            <div className="flex items-center space-x-2">
              <img
                src={selectedToken.logoUrl}
                alt={selectedToken.symbol}
                className="w-5 h-5 rounded-full"
              />
              <span>{selectedToken.symbol}</span>
            </div>
          ) : (
            <span>Select Token</span>
          )}
          <span>▼</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border border-white/20 bg-black text-white">
        <DialogHeader>
          <DialogTitle>Select Token</DialogTitle>
          <DialogDescription>
            Choose a token to swap
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Input
            placeholder="Search by name or address"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="dunix-input"
          />

          {/* Category tabs */}
          <div className="flex overflow-x-auto pb-2 space-x-1">
            {categories.map(category => (
              <Button
                key={category.id}
                variant="outline"
                size="sm"
                className={`rounded-full px-3 py-1 text-xs ${
                  activeCategory === category.id
                    ? 'bg-white/10 border-white/30'
                    : 'bg-transparent border-white/10'
                }`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>

          {isConnected && (
            <div className="text-xs text-white/50 flex items-center">
              {isLoadingBalances ? (
                "Loading balances..."
              ) : (
                Object.keys(balances).length > 0
                  ? "Showing tokens with balance first"
                  : "No token balances found"
              )}
            </div>
          )}

          <div className="h-60 overflow-y-auto pr-2">
            {filteredTokens.length === 0 ? (
              <div className="text-center text-white/50 py-8">
                No tokens found
              </div>
            ) : (
              <div className="grid gap-2">
                {filteredTokens.map((token) => {
                  const hasBalance = balances[token.symbol] && parseFloat(balances[token.symbol]) > 0;

                  return (
                    <Button
                      key={token.symbol}
                      variant="outline"
                      className={`flex justify-between items-center h-12 bg-transparent hover:bg-white/5 border ${
                        hasBalance ? 'border-white/20' : 'border-white/10'
                      } rounded-none ${
                        token.symbol === value ? 'bg-white/10 border-l-2 border-l-green-500' : ''
                      }`}
                      onClick={() => handleSelectToken(token)}
                    >
                      <div className="flex items-center space-x-2">
                        <img
                          src={token.logoUrl}
                          alt={token.symbol}
                          className="w-6 h-6 rounded-full"
                        />
                        <div className="flex flex-col items-start">
                          <span className={token.symbol === value ? 'font-bold' : ''}>{token.symbol}</span>
                          <span className="text-xs text-white/50">{token.name}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        {hasBalance && (
                          <span className="text-sm">{balances[token.symbol]}</span>
                        )}
                        <span className="text-xs opacity-50">
                          {token.category}
                        </span>
                        {token.symbol === value && (
                          <div className="w-2 h-2 rounded-full bg-green-500 ml-1 mt-1"></div>
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
