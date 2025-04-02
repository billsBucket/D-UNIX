"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ImpermanentLossCalculatorProps {
  tokenA?: string;
  tokenB?: string;
}

export default function ImpermanentLossCalculator({
  tokenA = 'ETH',
  tokenB = 'USDC'
}: ImpermanentLossCalculatorProps) {
  const [initialPriceA, setInitialPriceA] = useState('3000');
  const [initialPriceB, setInitialPriceB] = useState('1');
  const [newPriceA, setNewPriceA] = useState('3000');
  const [newPriceB, setNewPriceB] = useState('1');
  const [initialInvestment, setInitialInvestment] = useState('10000');
  const [priceChangePercentA, setPriceChangePercentA] = useState(0);
  const [tokenASymbol, setTokenASymbol] = useState(tokenA);
  const [tokenBSymbol, setTokenBSymbol] = useState(tokenB);

  // Results
  const [impermanentLoss, setImpermanentLoss] = useState('0');
  const [impermanentLossPercent, setImpermanentLossPercent] = useState('0');
  const [hodlValue, setHodlValue] = useState('0');
  const [poolValue, setPoolValue] = useState('0');
  const [recalculateFlag, setRecalculateFlag] = useState(false);

  // Update when props change
  useEffect(() => {
    setTokenASymbol(tokenA);
    setTokenBSymbol(tokenB);
  }, [tokenA, tokenB]);

  // Calculate impermanent loss when inputs change
  useEffect(() => {
    try {
      const initialPriceANum = parseFloat(initialPriceA);
      const initialPriceBNum = parseFloat(initialPriceB);
      const newPriceANum = parseFloat(newPriceA);
      const newPriceBNum = parseFloat(newPriceB);
      const initialInvestmentNum = parseFloat(initialInvestment);

      if (
        !isNaN(initialPriceANum) &&
        !isNaN(initialPriceBNum) &&
        !isNaN(newPriceANum) &&
        !isNaN(newPriceBNum) &&
        !isNaN(initialInvestmentNum) &&
        initialPriceANum > 0 &&
        initialPriceBNum > 0 &&
        newPriceANum > 0 &&
        newPriceBNum > 0 &&
        initialInvestmentNum > 0
      ) {
        // Calculate price ratios
        const priceRatioA = newPriceANum / initialPriceANum;
        const priceRatioB = newPriceBNum / initialPriceBNum;

        // Calculate relative price ratio
        const relativePriceRatio = priceRatioA / priceRatioB;

        // Calculate impermanent loss
        const impermanentLossRatio = (2 * Math.sqrt(relativePriceRatio)) / (1 + relativePriceRatio) - 1;

        // Calculate values
        const impermanentLossValue = impermanentLossRatio * initialInvestmentNum;
        const impermanentLossPercentValue = impermanentLossRatio * 100;

        // Calculate HODL value
        const initialTokenAAmount = initialInvestmentNum / 2 / initialPriceANum;
        const initialTokenBAmount = initialInvestmentNum / 2 / initialPriceBNum;
        const hodlValueNum = (initialTokenAAmount * newPriceANum) + (initialTokenBAmount * newPriceBNum);

        // Calculate pool value (HODL value plus impermanent loss)
        const poolValueNum = hodlValueNum + impermanentLossValue;

        // Update state
        setImpermanentLoss(Math.abs(impermanentLossValue).toFixed(2));
        setImpermanentLossPercent(impermanentLossPercentValue.toFixed(2));
        setHodlValue(hodlValueNum.toFixed(2));
        setPoolValue(poolValueNum.toFixed(2));
      }
    } catch (error) {
      console.error('Error calculating impermanent loss:', error);
    }
  }, [initialPriceA, initialPriceB, newPriceA, newPriceB, initialInvestment, recalculateFlag]);

  // Update new price based on slider
  useEffect(() => {
    if (initialPriceA && !isNaN(parseFloat(initialPriceA))) {
      const initialPriceANum = parseFloat(initialPriceA);
      const newPrice = initialPriceANum * (1 + priceChangePercentA / 100);
      setNewPriceA(newPrice.toFixed(2));
    }
  }, [priceChangePercentA, initialPriceA]);

  const handleInitialPriceAChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setInitialPriceA(value);
    }
  };

  const handleInitialPriceBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setInitialPriceB(value);
    }
  };

  const handleNewPriceAChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setNewPriceA(value);

      // Update slider value
      if (initialPriceA && !isNaN(parseFloat(initialPriceA)) && value && !isNaN(parseFloat(value))) {
        const initialPriceANum = parseFloat(initialPriceA);
        const newPriceANum = parseFloat(value);
        const percentChange = ((newPriceANum / initialPriceANum) - 1) * 100;
        setPriceChangePercentA(percentChange);
      }
    }
  };

  const handleNewPriceBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setNewPriceB(value);
    }
  };

  const handleInitialInvestmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setInitialInvestment(value);
    }
  };

  const handlePriceChangeSlider = (value: number[]) => {
    setPriceChangePercentA(value[0]);
  };

  const handleCalculate = () => {
    setRecalculateFlag(!recalculateFlag);
  };

  const getPriceChangeColor = () => {
    if (priceChangePercentA > 0) return 'text-green-500';
    if (priceChangePercentA < 0) return 'text-red-500';
    return 'text-white';
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs py-1 border-white/10 bg-transparent">
          IL Calculator
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] bg-black text-white border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Impermanent Loss Calculator</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label htmlFor="tokenASymbol" className="text-xs opacity-70">
                Token A
              </label>
              <Input
                id="tokenASymbol"
                value={tokenASymbol}
                onChange={(e) => setTokenASymbol(e.target.value)}
                className="dunix-input"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="tokenBSymbol" className="text-xs opacity-70">
                Token B
              </label>
              <Input
                id="tokenBSymbol"
                value={tokenBSymbol}
                onChange={(e) => setTokenBSymbol(e.target.value)}
                className="dunix-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label htmlFor="initialPriceA" className="text-xs opacity-70">
                Initial {tokenASymbol} Price
              </label>
              <Input
                id="initialPriceA"
                value={initialPriceA}
                onChange={handleInitialPriceAChange}
                className="dunix-input"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="initialPriceB" className="text-xs opacity-70">
                Initial {tokenBSymbol} Price
              </label>
              <Input
                id="initialPriceB"
                value={initialPriceB}
                onChange={handleInitialPriceBChange}
                className="dunix-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label htmlFor="newPriceA" className="text-xs opacity-70">
                New {tokenASymbol} Price
              </label>
              <Input
                id="newPriceA"
                value={newPriceA}
                onChange={handleNewPriceAChange}
                className="dunix-input"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="newPriceB" className="text-xs opacity-70">
                New {tokenBSymbol} Price
              </label>
              <Input
                id="newPriceB"
                value={newPriceB}
                onChange={handleNewPriceBChange}
                className="dunix-input"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex justify-between">
              <label htmlFor="priceChangePercent" className="text-xs opacity-70">
                {tokenASymbol} Price Change
              </label>
              <span className={`text-xs font-bold ${getPriceChangeColor()}`}>
                {priceChangePercentA > 0 ? '+' : ''}{priceChangePercentA.toFixed(2)}%
              </span>
            </div>
            <Slider
              id="priceChangePercent"
              min={-100}
              max={200}
              step={1}
              value={[priceChangePercentA]}
              onValueChange={handlePriceChangeSlider}
              className="py-2"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="initialInvestment" className="text-xs opacity-70">
              Initial Investment (USD)
            </label>
            <Input
              id="initialInvestment"
              value={initialInvestment}
              onChange={handleInitialInvestmentChange}
              className="dunix-input"
            />
          </div>

          <Button onClick={handleCalculate} className="bg-white text-black hover:bg-white/90">
            Calculate Impermanent Loss
          </Button>

          <Card className="bg-black/50 border border-white/20">
            <CardHeader className="p-3">
              <CardTitle className="text-sm">Results</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="grid gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="opacity-70">Impermanent Loss:</span>
                  <span className="font-bold text-red-400">
                    ${impermanentLoss} ({impermanentLossPercent}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">HODL Value:</span>
                  <span className="font-bold">${hodlValue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">LP Pool Value:</span>
                  <span className="font-bold">${poolValue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Difference:</span>
                  <span className="font-bold">
                    ${Math.abs(parseFloat(poolValue) - parseFloat(hodlValue)).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
