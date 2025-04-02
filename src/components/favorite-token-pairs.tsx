"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Star, Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { useWalletContext } from './wallet-provider';
import { TOKENS } from '@/lib/ethereum';
import {
  getFavoritePairs,
  addFavoritePair,
  removeFavoritePair,
  isPairFavorited,
  FavoriteTokenPair
} from '@/lib/utils';
import TokenSelector from './token-selector';

interface FavoriteTokenPairsProps {
  onSelectPair: (tokenIn: string, tokenOut: string) => void;
  currentPair: {
    tokenIn: string;
    tokenOut: string;
  };
}

export default function FavoriteTokenPairs({ onSelectPair, currentPair }: FavoriteTokenPairsProps) {
  const [favoritePairs, setFavoritePairs] = useState<FavoriteTokenPair[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'manage'>('add');
  const [newPairTokenIn, setNewPairTokenIn] = useState('ETH');
  const [newPairTokenOut, setNewPairTokenOut] = useState('USDC');
  const [customLabel, setCustomLabel] = useState('');
  const { address, isConnected } = useWalletContext();

  // Load favorite pairs when connected
  useEffect(() => {
    if (isConnected && address) {
      const pairs = getFavoritePairs(address);
      setFavoritePairs(pairs);
    } else {
      setFavoritePairs([]);
    }
  }, [address, isConnected]);

  // Check if current pair is favorited
  const isCurrentPairFavorited = () => {
    if (!isConnected || !address) return false;
    return isPairFavorited(address, currentPair.tokenIn, currentPair.tokenOut);
  };

  // Add current pair to favorites
  const addCurrentPairToFavorites = () => {
    if (!isConnected || !address) return;

    try {
      const label = `${currentPair.tokenIn}/${currentPair.tokenOut}`;
      const newPair = addFavoritePair({
        tokenIn: currentPair.tokenIn,
        tokenOut: currentPair.tokenOut,
        label,
        account: address
      });

      // Update local state
      setFavoritePairs(prevPairs => [newPair, ...prevPairs]);
    } catch (error) {
      console.error('Failed to add favorite pair:', error);
    }
  };

  // Remove pair from favorites
  const removePairFromFavorites = (pairId: string) => {
    try {
      removeFavoritePair(pairId);

      // Update local state
      setFavoritePairs(prevPairs => prevPairs.filter(pair => pair.id !== pairId));
    } catch (error) {
      console.error('Failed to remove favorite pair:', error);
    }
  };

  // Add new pair from dialog
  const addNewPair = () => {
    if (!isConnected || !address) return;

    try {
      const label = customLabel || `${newPairTokenIn}/${newPairTokenOut}`;
      const newPair = addFavoritePair({
        tokenIn: newPairTokenIn,
        tokenOut: newPairTokenOut,
        label,
        account: address
      });

      // Update local state
      setFavoritePairs(prevPairs => [newPair, ...prevPairs]);

      // Close dialog and reset form
      setIsOpen(false);
      setCustomLabel('');
    } catch (error) {
      console.error('Failed to add new favorite pair:', error);
    }
  };

  // Get token logo URL
  const getTokenLogo = (symbol: string) => {
    const tokenInfo = Object.values(TOKENS).find(token => token.symbol === symbol);
    return tokenInfo?.logoUrl || 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png'; // Default to ETH
  };

  // Open add dialog
  const openAddDialog = () => {
    setDialogMode('add');
    setNewPairTokenIn('ETH');
    setNewPairTokenOut('USDC');
    setCustomLabel('');
    setIsOpen(true);
  };

  // Open manage dialog
  const openManageDialog = () => {
    setDialogMode('manage');
    setIsOpen(true);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs opacity-70">FAVORITES</h3>
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0 border-white/10"
            onClick={isCurrentPairFavorited() ? undefined : addCurrentPairToFavorites}
            disabled={!isConnected || isCurrentPairFavorited()}
            title={isCurrentPairFavorited() ? "Already in favorites" : "Add current pair to favorites"}
          >
            <Star className={`h-3 w-3 ${isCurrentPairFavorited() ? 'fill-yellow-400 text-yellow-400' : 'text-white/70'}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0 border-white/10"
            onClick={openAddDialog}
            disabled={!isConnected}
            title="Add new favorite pair"
          >
            <Plus className="h-3 w-3 text-white/70" />
          </Button>
          {favoritePairs.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 w-6 p-0 border-white/10"
              onClick={openManageDialog}
              title="Manage favorites"
            >
              <span className="text-xs font-mono">...</span>
            </Button>
          )}
        </div>
      </div>

      {isConnected ? (
        <div className="flex overflow-x-auto gap-2 pb-2 -mx-2 px-2">
          {favoritePairs.length === 0 ? (
            <div className="text-xs text-white/50 py-1">
              No favorite pairs yet. Add some using the + button.
            </div>
          ) : (
            favoritePairs.map((pair) => (
              <Button
                key={pair.id}
                variant="outline"
                size="sm"
                className={`py-1 px-2 rounded-none border ${
                  currentPair.tokenIn === pair.tokenIn && currentPair.tokenOut === pair.tokenOut
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
                <span className="text-xs">{pair.label || `${pair.tokenIn}/${pair.tokenOut}`}</span>
              </Button>
            ))
          )}
        </div>
      ) : (
        <div className="text-xs text-white/50 py-1">
          Connect your wallet to use favorites.
        </div>
      )}

      {/* Dialog for adding or managing favorites */}
      <Dialog
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <DialogContent className="bg-black border border-white/20 text-white p-4 max-w-md">
          <DialogTitle className="text-lg font-mono">
            {dialogMode === 'add' ? 'Add New Favorite Pair' : 'Manage Favorites'}
          </DialogTitle>

          <DialogDescription className="text-white/70">
            {dialogMode === 'add'
              ? 'Select token pair to add to your favorites'
              : 'Remove pairs you no longer need'}
          </DialogDescription>

          {dialogMode === 'add' ? (
            <div className="space-y-4 my-4">
              <div className="space-y-2">
                <label className="text-xs opacity-70">TOKEN IN:</label>
                <TokenSelector
                  value={newPairTokenIn}
                  onChange={setNewPairTokenIn}
                  excludeToken={newPairTokenOut}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs opacity-70">TOKEN OUT:</label>
                <TokenSelector
                  value={newPairTokenOut}
                  onChange={setNewPairTokenOut}
                  excludeToken={newPairTokenIn}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs opacity-70">CUSTOM LABEL (OPTIONAL):</label>
                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder={`${newPairTokenIn}/${newPairTokenOut}`}
                  className="w-full bg-transparent border border-white/20 rounded-none p-2 text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="my-4 max-h-[300px] overflow-y-auto">
              {favoritePairs.length === 0 ? (
                <div className="text-center text-white/50 py-4">
                  No favorite pairs to manage.
                </div>
              ) : (
                <div className="space-y-2">
                  {favoritePairs.map((pair) => (
                    <div
                      key={pair.id}
                      className="flex items-center justify-between border border-white/10 p-2 hover:bg-white/5"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="relative flex items-center">
                          <img
                            src={getTokenLogo(pair.tokenIn)}
                            alt={pair.tokenIn}
                            className="w-5 h-5 rounded-full"
                          />
                          <img
                            src={getTokenLogo(pair.tokenOut)}
                            alt={pair.tokenOut}
                            className="w-5 h-5 rounded-full -ml-1"
                          />
                        </div>
                        <span>{pair.label || `${pair.tokenIn}/${pair.tokenOut}`}</span>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePairFromFavorites(pair.id)}
                        className="h-7 w-7 p-0 hover:bg-red-900/20 hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-white/20"
            >
              Cancel
            </Button>

            {dialogMode === 'add' && (
              <Button
                onClick={addNewPair}
                disabled={newPairTokenIn === newPairTokenOut}
                className="bg-white text-black hover:bg-white/90"
              >
                Add to Favorites
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
