"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TokenSelector from './token-selector';
import { useWalletContext } from './wallet-provider';
import { toast } from 'sonner';
import { addTransaction, generateTransactionId } from '@/lib/utils';

interface ChainOption {
  id: number;
  name: string;
  icon: string;
  estimatedTime: string;
  fee: string;
}

const CHAIN_OPTIONS: ChainOption[] = [
  { id: 1, name: 'ETHEREUM', icon: 'E', estimatedTime: '15-20 min', fee: '0.001 ETH' },
  { id: 10, name: 'OPTIMISM', icon: 'O', estimatedTime: '1-2 min', fee: '0.0005 ETH' },
  { id: 42161, name: 'ARBITRUM', icon: 'A', estimatedTime: '1-3 min', fee: '0.0008 ETH' },
  { id: 137, name: 'POLYGON', icon: 'P', estimatedTime: '10-15 min', fee: '0.1 MATIC' },
  { id: 8453, name: 'BASE', icon: 'B', estimatedTime: '1-2 min', fee: '0.0004 ETH' },
];

export default function BridgeForm() {
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState('');
  const [sourceChain, setSourceChain] = useState<number>(1); // Default to Ethereum
  const [destinationChain, setDestinationChain] = useState<number>(42161); // Default to Arbitrum
  const [isLoading, setIsLoading] = useState(false);
  const { address, isConnected, connect, chainId, switchChain } = useWalletContext(); // Fixed extraction

  // Update source chain based on connected wallet's chain
  React.useEffect(() => {
    if (isConnected && chainId) {
      setSourceChain(chainId);
    }
  }, [isConnected, chainId]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[0-9]*\\.?[0-9]*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleSourceChainChange = async (chainId: number) => {
    // If wallet is connected, switch the chain
    if (isConnected) {
      try {
        await switchChain(chainId);
      } catch (error) {
        console.error('Failed to switch chain:', error);
        toast.error('Failed to switch chain');
      }
    } else {
      setSourceChain(chainId);
    }

    // If source and destination are the same, change destination
    if (chainId === destinationChain) {
      // Pick a different chain
      const otherChainId = CHAIN_OPTIONS.find(c => c.id !== chainId)?.id || 1;
      setDestinationChain(otherChainId);
    }
  };

  const handleDestinationChainChange = (chainId: number) => {
    setDestinationChain(chainId);
    // If source and destination are the same, change source
    if (chainId === sourceChain) {
      // Pick a different chain
      const otherChainId = CHAIN_OPTIONS.find(c => c.id !== chainId)?.id || 1;
      setSourceChain(otherChainId);
    }
  };

  const handleBridge = async () => {
    if (!isConnected) {
      await connect();
      return;
    }

    if (!amount || !token) {
      toast.error('Please enter an amount and select a token');
      return;
    }

    setIsLoading(true);
    toast.info(`Initiating bridge from ${CHAIN_OPTIONS.find(c => c.id === sourceChain)?.name} to ${CHAIN_OPTIONS.find(c => c.id === destinationChain)?.name}...`);

    // Simulate bridging process with a timer
    setTimeout(() => {
      // Record the transaction in history
      if (address) {
        const sourceName = CHAIN_OPTIONS.find(c => c.id === sourceChain)?.name || 'Unknown';
        const destName = CHAIN_OPTIONS.find(c => c.id === destinationChain)?.name || 'Unknown';

        addTransaction({
          id: generateTransactionId(),
          type: 'bridge',
          tokenIn: token,
          tokenOut: token, // Same token for bridges
          amountIn: amount,
          amountOut: amount, // Usually same amount minus fees
          txHash: `bridge-${Date.now()}`, // Simulated tx hash
          timestamp: Date.now(),
          status: 'pending', // Bridges typically take time to complete
          account: address,
          chainId: sourceChain,
        });
      }

      toast.success(`Successfully initiated bridge of ${amount} ${token}`);
      setIsLoading(false);
      // In a real implementation, you would get a transaction hash and status
    }, 2000);
  };

  // Get selected chain details
  const selectedSourceChain = CHAIN_OPTIONS.find(c => c.id === sourceChain);
  const selectedDestChain = CHAIN_OPTIONS.find(c => c.id === destinationChain);

  return (
    <div className="space-y-6">
      <div className="border border-white/10 bg-black/30 p-3 text-xs opacity-70">
        Bridge your tokens securely across different blockchains. DUNIX uses decentralized bridges with the highest security standards.
      </div>

      {/* Chain selectors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs mb-2">FROM CHAIN</div>
          <div className="grid grid-cols-1 gap-2">
            {CHAIN_OPTIONS.map(chain => (
              <Button
                key={chain.id}
                variant="outline"
                className={`h-10 justify-start rounded-none border ${
                  sourceChain === chain.id
                    ? 'border-white bg-white/10'
                    : 'border-white/20 bg-black'
                }`}
                onClick={() => handleSourceChainChange(chain.id)}
                disabled={isLoading}
              >
                <div className="w-6 h-6 rounded-full border border-white/50 flex items-center justify-center text-xs mr-2">
                  {chain.icon}
                </div>
                {chain.name}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs mb-2">TO CHAIN</div>
          <div className="grid grid-cols-1 gap-2">
            {CHAIN_OPTIONS.map(chain => (
              <Button
                key={chain.id}
                variant="outline"
                className={`h-10 justify-start rounded-none border ${
                  destinationChain === chain.id
                    ? 'border-white bg-white/10'
                    : 'border-white/20 bg-black'
                } ${sourceChain === chain.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => handleDestinationChainChange(chain.id)}
                disabled={sourceChain === chain.id || isLoading}
              >
                <div className="w-6 h-6 rounded-full border border-white/50 flex items-center justify-center text-xs mr-2">
                  {chain.icon}
                </div>
                {chain.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Token and amount */}
      <div className="pt-4">
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-3">
            <div className="text-xs mb-2">AMOUNT</div>
            <Input
              type="text"
              placeholder="0.00"
              value={amount}
              onChange={handleAmountChange}
              className="dunix-input h-12"
              disabled={isLoading}
            />
          </div>
          <div className="col-span-2">
            <div className="text-xs mb-2">TOKEN</div>
            <TokenSelector
              value={token}
              onChange={setToken}
              className="h-12"
            />
          </div>
        </div>
      </div>

      {/* Bridge info */}
      {selectedSourceChain && selectedDestChain && token && amount && (
        <div className="border border-white/10 p-3 bg-black/30">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="opacity-70 mb-1">ESTIMATED TIME:</div>
              <div>{selectedDestChain.estimatedTime}</div>
            </div>
            <div>
              <div className="opacity-70 mb-1">BRIDGE FEE:</div>
              <div>{selectedDestChain.fee}</div>
            </div>
            <div>
              <div className="opacity-70 mb-1">BRIDGING FROM:</div>
              <div>{selectedSourceChain.name}</div>
            </div>
            <div>
              <div className="opacity-70 mb-1">BRIDGING TO:</div>
              <div>{selectedDestChain.name}</div>
            </div>
          </div>
        </div>
      )}

      {/* Action button */}
      <Button
        className="w-full py-6 bg-white text-black hover:bg-white/90 rounded-none"
        onClick={handleBridge}
        disabled={isLoading || (!amount && isConnected) || sourceChain === destinationChain}
      >
        {isLoading ? (
          <span className="flex items-center">
            BRIDGING
            <span className="loading ml-2 h-1 w-6"></span>
          </span>
        ) : !isConnected ? (
          'CONNECT WALLET'
        ) : !amount ? (
          'ENTER AMOUNT'
        ) : !token ? (
          'SELECT TOKEN'
        ) : sourceChain === destinationChain ? (
          'SELECT DIFFERENT CHAINS'
        ) : (
          `BRIDGE TO ${selectedDestChain?.name}`
        )}
      </Button>
    </div>
  );
}
