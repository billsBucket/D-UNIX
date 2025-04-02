"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PositionSizeCalculatorProps {
  currentToken?: string;
  currentTokenPrice?: number;
}

export default function PositionSizeCalculator({ currentToken, currentTokenPrice }: PositionSizeCalculatorProps) {
  const [portfolioValue, setPortfolioValue] = useState('10000');
  const [riskPercentage, setRiskPercentage] = useState(2);
  const [stopLossPercentage, setStopLossPercentage] = useState(5);
  const [entryPrice, setEntryPrice] = useState(currentTokenPrice?.toString() || '3000');
  const [tokenSymbol, setTokenSymbol] = useState(currentToken || 'ETH');
  const [positionSize, setPositionSize] = useState('0');
  const [maxLoss, setMaxLoss] = useState('0');
  const [tokenAmount, setTokenAmount] = useState('0');
  const [recalculateFlag, setRecalculateFlag] = useState(false);

  // Update entry price when currentTokenPrice changes
  useEffect(() => {
    if (currentTokenPrice) {
      setEntryPrice(currentTokenPrice.toString());
    }
  }, [currentTokenPrice]);

  // Update token symbol when currentToken changes
  useEffect(() => {
    if (currentToken) {
      setTokenSymbol(currentToken);
    }
  }, [currentToken]);

  // Calculate position size based on inputs
  useEffect(() => {
    try {
      const portfolioValueNum = parseFloat(portfolioValue);
      const entryPriceNum = parseFloat(entryPrice);
      const stopLossPercent = stopLossPercentage / 100;
      const riskPercent = riskPercentage / 100;

      if (
        !isNaN(portfolioValueNum) &&
        !isNaN(entryPriceNum) &&
        stopLossPercent > 0 &&
        riskPercent > 0 &&
        entryPriceNum > 0
      ) {
        // Calculate max loss in dollars
        const maxLossValue = portfolioValueNum * riskPercent;

        // Calculate position size (in dollars)
        const positionSizeValue = maxLossValue / stopLossPercent;

        // Calculate token amount
        const tokenAmountValue = positionSizeValue / entryPriceNum;

        // Update state
        setMaxLoss(maxLossValue.toFixed(2));
        setPositionSize(positionSizeValue.toFixed(2));
        setTokenAmount(tokenAmountValue.toFixed(6));
      }
    } catch (error) {
      console.error('Error calculating position size:', error);
    }
  }, [portfolioValue, riskPercentage, stopLossPercentage, entryPrice, recalculateFlag]);

  const handlePortfolioValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setPortfolioValue(value);
    }
  };

  const handleEntryPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setEntryPrice(value);
    }
  };

  const handleTokenSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTokenSymbol(e.target.value);
  };

  const handleRiskSliderChange = (value: number[]) => {
    setRiskPercentage(value[0]);
  };

  const handleStopLossSliderChange = (value: number[]) => {
    setStopLossPercentage(value[0]);
  };

  const handleCalculate = () => {
    setRecalculateFlag(!recalculateFlag);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs py-1 border-white/10 bg-transparent">
          Position Calculator
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-black text-white border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Position Size Calculator</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="portfolioValue" className="text-xs opacity-70">
              Portfolio Value (USD)
            </label>
            <Input
              id="portfolioValue"
              value={portfolioValue}
              onChange={handlePortfolioValueChange}
              className="dunix-input"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="tokenSymbol" className="text-xs opacity-70">
              Token Symbol
            </label>
            <Input
              id="tokenSymbol"
              value={tokenSymbol}
              onChange={handleTokenSymbolChange}
              className="dunix-input"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="entryPrice" className="text-xs opacity-70">
              Entry Price (USD)
            </label>
            <Input
              id="entryPrice"
              value={entryPrice}
              onChange={handleEntryPriceChange}
              className="dunix-input"
            />
          </div>

          <div className="grid gap-2">
            <div className="flex justify-between">
              <label htmlFor="riskPercentage" className="text-xs opacity-70">
                Risk Percentage
              </label>
              <span className="text-xs font-bold">{riskPercentage}%</span>
            </div>
            <Slider
              id="riskPercentage"
              defaultValue={[2]}
              max={10}
              step={0.5}
              value={[riskPercentage]}
              onValueChange={handleRiskSliderChange}
              className="py-2"
            />
          </div>

          <div className="grid gap-2">
            <div className="flex justify-between">
              <label htmlFor="stopLossPercentage" className="text-xs opacity-70">
                Stop Loss Percentage
              </label>
              <span className="text-xs font-bold">{stopLossPercentage}%</span>
            </div>
            <Slider
              id="stopLossPercentage"
              defaultValue={[5]}
              max={20}
              step={0.5}
              value={[stopLossPercentage]}
              onValueChange={handleStopLossSliderChange}
              className="py-2"
            />
          </div>

          <Button onClick={handleCalculate} className="bg-white text-black hover:bg-white/90">
            Calculate Position Size
          </Button>

          <Card className="bg-black/50 border border-white/20">
            <CardHeader className="p-3">
              <CardTitle className="text-sm">Results</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="grid gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="opacity-70">Max Loss:</span>
                  <span className="font-bold">${maxLoss}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Position Size:</span>
                  <span className="font-bold">${positionSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Token Amount:</span>
                  <span className="font-bold">{tokenAmount} {tokenSymbol}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
