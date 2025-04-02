"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TokenSelector from './token-selector';
import { useWalletContext } from './wallet-provider';
import { toast } from 'sonner';
import { addTransaction, generateTransactionId } from '@/lib/utils';

export default function LimitForm() {
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  const [inputToken, setInputToken] = useState('');
  const [outputToken, setOutputToken] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [expiryTime, setExpiryTime] = useState('24');
  const [isLoading, setIsLoading] = useState(false);

  // Use our wallet context
  const { isConnected, connect, address, chainId } = useWalletContext();

  const handleInputAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[0-9]*\\.?[0-9]*$/.test(value)) {
      setInputAmount(value);
      if (limitPrice && !isNaN(parseFloat(limitPrice))) {
        const outputValue = parseFloat(value) * parseFloat(limitPrice);
        setOutputAmount(outputValue.toString());
      }
    }
  };

  const handleLimitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[0-9]*\\.?[0-9]*$/.test(value)) {
      setLimitPrice(value);
      if (inputAmount && !isNaN(parseFloat(inputAmount))) {
        const outputValue = parseFloat(inputAmount) * parseFloat(value || '0');
        setOutputAmount(outputValue.toString());
      }
    }
  };

  const handleOutputAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[0-9]*\\.?[0-9]*$/.test(value)) {
      setOutputAmount(value);
      if (inputAmount && !isNaN(parseFloat(inputAmount)) && parseFloat(inputAmount) > 0) {
        const price = parseFloat(value) / parseFloat(inputAmount);
        setLimitPrice(price.toString());
      }
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\\d*$/.test(value)) {
      setExpiryTime(value);
    }
  };

  const handleSwapTokens = () => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
    // When swapping tokens in limit orders, we invert the price
    if (limitPrice && parseFloat(limitPrice) > 0) {
      const invertedPrice = (1 / parseFloat(limitPrice)).toString();
      setLimitPrice(invertedPrice);
      // Recalculate output amount
      if (inputAmount) {
        const newOutputAmount = parseFloat(inputAmount) * parseFloat(invertedPrice);
        setOutputAmount(newOutputAmount.toString());
      }
    }
  };

  const handleCreateLimitOrder = async () => {
    if (!isConnected) {
      await connect();
      return;
    }

    if (!inputAmount || !outputAmount || !inputToken || !outputToken || !limitPrice) {
      toast.error('Please fill in all fields to create a limit order');
      return;
    }

    setIsLoading(true);
    toast.info('Creating limit order...');

    // Simulate API call for limit order creation
    setTimeout(() => {
      // Record the transaction
      if (address) {
        addTransaction({
          id: generateTransactionId(),
          type: 'limit',
          tokenIn: inputToken,
          tokenOut: outputToken,
          amountIn: inputAmount,
          amountOut: outputAmount,
          txHash: `limit-${Date.now()}`, // Simulated ID for limit order
          timestamp: Date.now(),
          status: 'pending', // Limit orders start as pending
          account: address,
          chainId: chainId || 1,
        });
      }

      toast.success(`Limit order created successfully! Order will execute when ${inputToken} reaches the target price.`);
      setIsLoading(false);
      // Reset form or keep it for editing - depends on UX preference
    }, 2000);
  };

  // Calculate current market price (for demo purposes)
  const currentMarketPrice = '1.02';  // This would come from a price oracle in a real app
  const isPriceAboveMarket = limitPrice && parseFloat(limitPrice) > parseFloat(currentMarketPrice);

  return (
    <div className="space-y-4">
      {/* Limit price */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="col-span-3">
          <div className="text-xs mb-2">LIMIT PRICE</div>
          <Input
            type="text"
            placeholder="0.00"
            value={limitPrice}
            onChange={handleLimitPriceChange}
            className="dunix-input h-12"
            disabled={isLoading}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs opacity-70">CURRENT: {currentMarketPrice}</span>
            {limitPrice && (
              <span className={`text-xs ${isPriceAboveMarket ? 'text-red-400' : 'text-green-400'}`}>
                {isPriceAboveMarket ? 'ABOVE MARKET' : 'BELOW MARKET'}
              </span>
            )}
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-xs mb-2">EXPIRES IN</div>
          <div className="flex">
            <Input
              type="text"
              value={expiryTime}
              onChange={handleExpiryChange}
              className="dunix-input h-12"
              disabled={isLoading}
            />
            <div className="ml-2 flex items-center">
              <span>HRS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Input token */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3">
          <div className="text-xs mb-2">YOU PAY</div>
          <Input
            type="text"
            placeholder="0.00"
            value={inputAmount}
            onChange={handleInputAmountChange}
            className="dunix-input h-12"
            disabled={isLoading}
          />
        </div>
        <div className="col-span-2">
          <div className="text-xs mb-2">TOKEN</div>
          <TokenSelector
            value={inputToken}
            onChange={setInputToken}
            className="h-12"
          />
        </div>
      </div>

      {/* Swap direction button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={handleSwapTokens}
          className="border border-white/20 bg-black rounded-none w-10 h-10"
          disabled={isLoading}
        >
          ↓
        </Button>
      </div>

      {/* Output token */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3">
          <div className="text-xs mb-2">YOU RECEIVE</div>
          <Input
            type="text"
            placeholder="0.00"
            value={outputAmount}
            onChange={handleOutputAmountChange}
            className="dunix-input h-12"
            disabled={isLoading}
          />
        </div>
        <div className="col-span-2">
          <div className="text-xs mb-2">TOKEN</div>
          <TokenSelector
            value={outputToken}
            onChange={setOutputToken}
            className="h-12"
          />
        </div>
      </div>

      {/* Info box */}
      <div className="border border-white/10 p-3 mt-4 bg-black/30 text-xs">
        <p className="opacity-70 mb-2">
          Limit orders allow you to specify a price at which you want to trade. The order will execute when the market price reaches your limit price.
        </p>
        <p className="opacity-70">
          Orders expire after the specified time unless cancelled. There is no gas cost until the order is executed.
        </p>
      </div>

      {/* Action button */}
      <Button
        className="w-full py-6 mt-6 bg-white text-black hover:bg-white/90 rounded-none"
        onClick={handleCreateLimitOrder}
        disabled={isLoading || (!inputAmount && isConnected)}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <span className="mr-2">CREATING ORDER</span>
            <span className="loading">...</span>
          </span>
        ) : !isConnected ? (
          'CONNECT WALLET'
        ) : !inputAmount || !outputAmount || !limitPrice ? (
          'ENTER AMOUNT AND PRICE'
        ) : !inputToken || !outputToken ? (
          'SELECT TOKENS'
        ) : (
          'CREATE LIMIT ORDER'
        )}
      </Button>
    </div>
  );
}
