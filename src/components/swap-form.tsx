"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import TokenSelector from './token-selector';
import { useWalletContext } from './wallet-provider';
import { getGasPrice, getTokenBalance } from '@/lib/ethereum';
import { getSwapQuote, executeSwap, predictSwapRoute, SwapQuote } from '@/lib/swap';
import { addTransaction, generateTransactionId } from '@/lib/utils';
import TokenPairShortcuts from './token-pair-shortcuts';
import FavoriteTokenPairs from './favorite-token-pairs';
import NetworkStatus from './network-status';
import AdvancedRoutingOptions from './advanced-routing-options';
import TransactionHistorySummary from './transaction-history-summary';
import TransactionNotifications from './transaction-notifications';
import PositionSizeCalculator from './position-size-calculator';
import ImpermanentLossCalculator from './impermanent-loss-calculator';
import MultiHopVisualization from './multi-hop-visualization';
import GasOptimizationSettings, { GasSettings } from './gas-optimization-settings';
import SlippageProtectionAlerts from './slippage-protection-alerts';
import TransactionNotificationHandler from './transaction-notification-handler';

const SLIPPAGE_PRESETS = [0.5, 1, 3];

export default function SwapForm() {
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  const [inputToken, setInputToken] = useState('ETH');
  const [outputToken, setOutputToken] = useState('USDC');
  const [slippage, setSlippage] = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState('0.5');
  const [route, setRoute] = useState<string[]>([]);
  const [priceImpact, setPriceImpact] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [swapQuote, setSwapQuote] = useState<SwapQuote | null>(null);
  const [gasEstimate, setGasEstimate] = useState('200000');
  const [currentGasPrice, setCurrentGasPrice] = useState('0');
  const [errorMessage, setErrorMessage] = useState('');
  const [maxInputAmount, setMaxInputAmount] = useState('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [routeType, setRouteType] = useState<'auto' | 'lowest-gas' | 'lowest-slippage' | 'highest-speed'>('auto');
  const [deadlineMinutes, setDeadlineMinutes] = useState(20); // Default 20 minutes

  // Add these new state variables after the existing ones
  const [alternativeRoutes, setAlternativeRoutes] = useState<Array<{
    route: string[];
    routeType: 'auto' | 'lowest-gas' | 'lowest-slippage' | 'highest-speed';
    gasEstimate: string;
    priceImpact: string;
    minimumOutput: string;
    routeFees: number;
  }>>([]);
  const [showAlternativeRoutes, setShowAlternativeRoutes] = useState(false);
  const [gasSettings, setGasSettings] = useState<GasSettings>({
    gasMode: 'auto',
    gasPrice: '0',
    gasLimit: '200000',
  });
  const [showGasSettings, setShowGasSettings] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  // Use our wallet context
  const { isConnected, connect, address, chainId } = useWalletContext();

  // Fetch gas price on component mount
  useEffect(() => {
    const fetchGasPrice = async () => {
      try {
        const price = await getGasPrice();
        setCurrentGasPrice(price);
      } catch (error) {
        console.error('Failed to fetch gas price:', error);
      }
    };

    fetchGasPrice();
    const interval = setInterval(fetchGasPrice, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, []);

  // Set initial token pair based on network
  useEffect(() => {
    if (chainId === 1) {
      // ETH Mainnet defaults
      if (inputToken !== 'ETH') setInputToken('ETH');
      if (outputToken !== 'USDC') setOutputToken('USDC');
    } else if (chainId === 137) {
      // Polygon defaults
      if (inputToken !== 'MATIC') setInputToken('MATIC');
      if (outputToken !== 'USDC') setOutputToken('USDC');
    } else if (chainId === 42161) {
      // Arbitrum defaults
      if (inputToken !== 'ETH') setInputToken('ETH');
      if (outputToken !== 'USDC') setOutputToken('USDC');
    }
  }, [chainId, inputToken, outputToken]);

  // Fetch max input amount when token changes
  useEffect(() => {
    const fetchMaxInputAmount = async () => {
      if (!isConnected || !address) {
        setMaxInputAmount('0');
        return;
      }

      setIsLoadingBalance(true);
      try {
        // Get token balance with proper address mapping
        const tokenAddress = inputToken === 'ETH' ? 'ETH' : inputToken;
        const tokenBalance = await getTokenBalance(tokenAddress, address);

        // Subtract a small amount from ETH to ensure gas costs can be covered
        if (inputToken === 'ETH') {
          const balanceInEth = parseFloat(tokenBalance.formattedBalance);
          const adjustedBalance = Math.max(0, balanceInEth - 0.01); // Reserve 0.01 ETH for gas
          setMaxInputAmount(adjustedBalance.toString());
        } else {
          setMaxInputAmount(tokenBalance.formattedBalance);
        }
      } catch (error) {
        console.error('Error fetching token balance:', error);
        setMaxInputAmount('0');
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchMaxInputAmount();
  }, [isConnected, address, inputToken]);

  // Fetch token price for position calculator
  useEffect(() => {
    const fetchTokenPrice = async () => {
      try {
        // In a real app, this would be fetched from an API
        // For now, we'll just use the mock price mapping
        const prices: Record<string, number> = {
          'ETH': 3000,
          'WETH': 3000,
          'USDC': 1,
          'USDT': 1,
          'DAI': 1,
          'WBTC': 60000,
          'MATIC': 0.8,
        };

        setCurrentPrice(prices[inputToken] || null);
      } catch (error) {
        console.error('Error fetching token price:', error);
      }
    };

    fetchTokenPrice();
  }, [inputToken]);

  // Calculate swap output when input values change
  useEffect(() => {
    // Reset error message on new inputs
    setErrorMessage('');

    if (!inputAmount || parseFloat(inputAmount) <= 0 || !inputToken || !outputToken) {
      setOutputAmount('');
      setSwapQuote(null);
      setRoute([]);
      setPriceImpact('');
      setAlternativeRoutes([]); // Reset alternative routes as well
      return;
    }

    // Don't fetch if user is entering values too quickly
    const timer = setTimeout(async () => {
      try {
        setIsCalculating(true);

        // Predict routing path while waiting for actual quote
        const predictedRoute = predictSwapRoute(inputToken, outputToken);
        setRoute(predictedRoute);

        // Only fetch real quote if user is connected
        if (isConnected && address) {
          // Get main quote with selected routing type
          const quote = await getSwapQuote({
            inputToken,
            outputToken,
            inputAmount,
            slippage,
            userAddress: address,
            routeType,
            deadlineMinutes,
          });

          setOutputAmount(quote.outputAmount);
          setPriceImpact(quote.priceImpact);
          setRoute(quote.path);
          setSwapQuote(quote);
          setGasEstimate(quote.gas);

          // Generate alternative routes if input amount is significant enough
          if (parseFloat(inputAmount) >= 0.01) {
            const routeTypes: Array<'auto' | 'lowest-gas' | 'lowest-slippage' | 'highest-speed'> =
              ['lowest-gas', 'lowest-slippage', 'highest-speed'];

            // Filter out the currently selected route type to avoid duplication
            const alternativeRouteTypes = routeTypes.filter(rt => rt !== routeType);

            // Get quotes for alternative routing options
            const alternativeQuotes = await Promise.all(
              alternativeRouteTypes.map(async (rt) => {
                try {
                  const altQuote = await getSwapQuote({
                    inputToken,
                    outputToken,
                    inputAmount,
                    slippage,
                    userAddress: address,
                    routeType: rt,
                    deadlineMinutes,
                  });

                  return {
                    route: altQuote.path,
                    routeType: rt,
                    gasEstimate: altQuote.gas,
                    priceImpact: altQuote.priceImpact,
                    minimumOutput: altQuote.minimumOutputAmount,
                    routeFees: altQuote.fees || 0.3,
                  };
                } catch (error) {
                  console.error(`Error fetching alternative route (${rt}):`, error);
                  return null;
                }
              })
            );

            // Filter out any failed quotes
            setAlternativeRoutes(alternativeQuotes.filter(q => q !== null) as any);
          } else {
            setAlternativeRoutes([]);
          }
        } else {
          // For non-connected users, we don't show output
          setOutputAmount('');
          setPriceImpact('');
          setAlternativeRoutes([]);
        }
      } catch (error) {
        console.error('Error calculating swap:', error);
        setErrorMessage(`Failed to calculate swap: ${error instanceof Error ? error.message : 'Unknown error'}`);
        toast.error('Failed to calculate swap rate');
        setOutputAmount('');
      } finally {
        setIsCalculating(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputAmount, inputToken, outputToken, slippage, isConnected, address, routeType, deadlineMinutes]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (/^[0-9]*\.?[0-9]*$/.test(value)) {
      setInputAmount(value);
    }
  };

  const handleSlippageChange = (value: number) => {
    setSlippage(value);
    setCustomSlippage(value.toString());
  };

  const handleSlippagePreset = (value: number) => {
    setSlippage(value);
    setCustomSlippage(value.toString());
  };

  const handleCustomSlippageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[0-9]*\.?[0-9]*$/.test(value)) {
      setCustomSlippage(value);
      setSlippage(parseFloat(value) || 0);
    }
  };

  const handleSwapTokens = () => {
    // Don't swap if calculation is in progress
    if (isCalculating) return;

    setInputToken(outputToken);
    setOutputToken(inputToken);

    // If we have values, also swap the amounts
    if (inputAmount && outputAmount) {
      setInputAmount(outputAmount);
      setOutputAmount(inputAmount);
    }
  };

  // Handle token pair selection
  const handleTokenPairSelection = (tokenIn: string, tokenOut: string) => {
    setInputToken(tokenIn);
    setOutputToken(tokenOut);
  };

  // Handle setting percentage of max balance
  const handlePercentageClick = (percentage: number) => {
    if (isLoadingBalance || !isConnected) return;

    try {
      // Make sure maxInputAmount is treated as a number
      const maxAmount = parseFloat(maxInputAmount);

      // Ensure we have a valid balance
      if (isNaN(maxAmount) || maxAmount <= 0) {
        console.log('No valid balance to calculate percentage from', maxAmount);
        toast.error('No available balance');
        return;
      }

      console.log(`Calculating ${percentage}% of ${maxAmount} ${inputToken}`);

      let amount: number;
      if (percentage === 100) {
        // Use exact max amount for 100%
        amount = maxAmount;
      } else {
        // Calculate percentage of max
        amount = (maxAmount * percentage) / 100;
      }

      // Format to proper number of decimals based on token
      let decimals = 6; // Default for most tokens

      // Adjust decimals based on token
      if (inputToken === 'USDC' || inputToken === 'USDT') {
        decimals = 6;
      } else if (inputToken === 'WBTC') {
        decimals = 8;
      } else {
        decimals = 18; // ETH and most ERC-20 tokens
      }

      // Ensure amount is not greater than max (could happen due to floating point errors)
      amount = Math.min(amount, maxAmount);

      // Format to proper number of decimals
      const formatted = amount.toFixed(decimals);

      // Remove trailing zeros and decimal point if needed
      const cleanAmount = formatted.replace(/\.?0+$/, '');
      console.log(`Setting input amount to: ${cleanAmount}`);

      // Update input field
      setInputAmount(cleanAmount);
    } catch (error) {
      console.error('Error calculating percentage amount:', error);
      toast.error('Failed to calculate amount');
    }
  };

  const handleSwap = async () => {
    // Reset error message
    setErrorMessage('');

    if (!isConnected) {
      // Prompt wallet connection
      try {
        await connect();
        return;
      } catch (error) {
        console.error('Connection error:', error);
        return;
      }
    }

    if (!inputAmount || !outputAmount || !inputToken || !outputToken) {
      toast.error('Please enter an amount and select tokens');
      return;
    }

    if (!swapQuote && isConnected) {
      toast.error('Please wait for swap quote to be calculated');
      return;
    }

    // Check if input amount exceeds balance
    if (parseFloat(inputAmount) > parseFloat(maxInputAmount)) {
      toast.error(`Insufficient ${inputToken} balance`);
      return;
    }

    // Start transaction process
    setIsLoading(true);
    toast.info('Processing transaction...');

    try {
      if (swapQuote && address) {
        // Create a transaction ID for tracking
        const txId = generateTransactionId();

        // Record the pending transaction
        addTransaction({
          id: txId,
          type: 'swap',
          tokenIn: inputToken,
          tokenOut: outputToken,
          amountIn: inputAmount,
          amountOut: outputAmount,
          txHash: 'pending', // Will update when we have the actual hash
          timestamp: Date.now(),
          status: 'pending',
          account: address,
          chainId: chainId || 1,
        });

        // Execute the actual swap
        const txHash = await executeSwap(swapQuote, {
          inputToken,
          outputToken,
          inputAmount,
          slippage,
          userAddress: address,
          routeType,
          deadlineMinutes,
        });

        // Update the transaction with the hash and completed status
        addTransaction({
          id: txId,
          type: 'swap',
          tokenIn: inputToken,
          tokenOut: outputToken,
          amountIn: inputAmount,
          amountOut: outputAmount,
          txHash: txHash,
          timestamp: Date.now(),
          status: 'completed',
          account: address,
          chainId: chainId || 1,
        });

        toast.success(
          <div>
            Swap executed successfully!
            <br />
            <a
              href={`https://etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View on Etherscan
            </a>
          </div>
        );

        // Clear form after successful swap
        setInputAmount('');
        setOutputAmount('');
        setSwapQuote(null);
      }
    } catch (error: any) {
      console.error('Swap error:', error);

      // Format error message
      let errorMsg = 'Failed to execute swap';

      if (error.code === 4001) {
        errorMsg = 'Transaction rejected by user';
      } else if (error.message) {
        // Try to extract useful information from error message
        if (error.message.includes('insufficient funds')) {
          errorMsg = 'Insufficient funds for this transaction';
        } else if (error.message.includes('gas required exceeds allowance')) {
          errorMsg = 'Gas required exceeds your ETH balance';
        } else {
          errorMsg = `Error: ${error.message.split('\n')[0]}`;
        }
      }

      setErrorMessage(errorMsg);
      toast.error(errorMsg);

      // Record the failed transaction if we have an address
      if (address) {
        addTransaction({
          id: generateTransactionId(),
          type: 'swap',
          tokenIn: inputToken,
          tokenOut: outputToken,
          amountIn: inputAmount,
          amountOut: outputAmount,
          txHash: 'failed',
          timestamp: Date.now(),
          status: 'failed',
          account: address,
          chainId: chainId || 1,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate estimated USD value
  const getUsdValue = (amount: string, token: string): string => {
    if (!amount || parseFloat(amount) <= 0) return '0.00';

    // Simplified price mapping - in a real app, these would come from an Oracle
    const prices: Record<string, number> = {
      'ETH': 3000,
      'WETH': 3000,
      'USDC': 1,
      'USDT': 1,
      'DAI': 1,
      'WBTC': 60000,
      'MATIC': 0.8,
    };

    const price = prices[token] || 0;
    return (parseFloat(amount) * price).toFixed(2);
  };

  // Calculate exchange rate
  const exchangeRate = inputAmount && outputAmount && parseFloat(inputAmount) > 0
    ? (parseFloat(outputAmount) / parseFloat(inputAmount)).toFixed(6)
    : '0';

  // Check if input token equals output token
  const isSameToken = inputToken === outputToken;

  // Add handler for gas settings changes
  const handleGasSettingsChange = (settings: GasSettings) => {
    setGasSettings(settings);
  };

  // Add handler for selecting an alternative route
  const handleRouteSelect = (routeType: 'auto' | 'lowest-gas' | 'lowest-slippage' | 'highest-speed') => {
    setRouteType(routeType);
  };

  return (
    <div className="space-y-4">
      {/* Network status bar */}
      <NetworkStatus />

      {/* Add calculators row */}
      <div className="flex justify-between">
        <PositionSizeCalculator
          currentToken={inputToken}
          currentTokenPrice={currentPrice}
        />
        <ImpermanentLossCalculator
          tokenA={inputToken}
          tokenB={outputToken}
        />
      </div>

      {/* Favorites and popular pairs */}
      <div className="space-y-3">
        <FavoriteTokenPairs
          onSelectPair={handleTokenPairSelection}
          currentPair={{ tokenIn: inputToken, tokenOut: outputToken }}
        />

        <TokenPairShortcuts
          onSelectPair={handleTokenPairSelection}
          currentPair={{ tokenIn: inputToken, tokenOut: outputToken }}
        />
      </div>

      {/* Input token */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3">
          <div className="relative">
            <Input
              type="text"
              placeholder="0.00"
              value={inputAmount}
              onChange={handleInputChange}
              className="dunix-input h-14 text-lg"
              disabled={isLoading}
            />
            {isConnected && (
              <div className="absolute top-2 right-2 flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-1 py-0 text-xs bg-black/50 border-white/10 hover:bg-white/10"
                  onClick={() => handlePercentageClick(25)}
                  disabled={isLoading || isLoadingBalance}
                >
                  25%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-1 py-0 text-xs bg-black/50 border-white/10 hover:bg-white/10"
                  onClick={() => handlePercentageClick(50)}
                  disabled={isLoading || isLoadingBalance}
                >
                  50%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-1 py-0 text-xs bg-black/50 border-white/10 hover:bg-white/10"
                  onClick={() => handlePercentageClick(75)}
                  disabled={isLoading || isLoadingBalance}
                >
                  75%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-1 py-0 text-xs bg-black/50 border-white/10 hover:bg-white/10"
                  onClick={() => handlePercentageClick(100)}
                  disabled={isLoading || isLoadingBalance}
                >
                  MAX
                </Button>
              </div>
            )}
          </div>
          <div className="mt-1 flex justify-between text-xs">
            <div className="text-white/50">
              {inputAmount && parseFloat(inputAmount) > 0 && (
                <span>≈ ${getUsdValue(inputAmount, inputToken)} USD</span>
              )}
            </div>
            {isConnected && (
              <div className="text-white/50">
                Balance: {isLoadingBalance ? 'Loading...' : maxInputAmount}
              </div>
            )}
          </div>
        </div>
        <div className="col-span-2">
          <TokenSelector
            value={inputToken}
            onChange={setInputToken}
            className="h-14"
            excludeToken={outputToken}
          />
        </div>
      </div>

      {/* Swap direction button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={handleSwapTokens}
          className="border border-white/20 bg-black rounded-none w-10 h-10"
          disabled={isLoading || isCalculating}
        >
          ↓
        </Button>
      </div>

      {/* Output token */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3">
          <Input
            type="text"
            placeholder="0.00"
            value={outputAmount}
            readOnly
            className="dunix-input h-14 text-lg"
          />
          {outputAmount && parseFloat(outputAmount) > 0 && (
            <div className="text-xs text-white/50 mt-1">
              ≈ ${getUsdValue(outputAmount, outputToken)} USD
            </div>
          )}
        </div>
        <div className="col-span-2">
          <TokenSelector
            value={outputToken}
            onChange={setOutputToken}
            className="h-14"
            excludeToken={inputToken}
          />
        </div>
      </div>

      {/* Exchange rate */}
      {inputToken && outputToken && parseFloat(exchangeRate) > 0 && !isSameToken && (
        <div className="text-xs text-white/50 text-right">
          1 {inputToken} = {exchangeRate} {outputToken}
        </div>
      )}

      {/* Add Slippage Protection Alert */}
      {isConnected && outputAmount && priceImpact && !isCalculating && !isSameToken && (
        <SlippageProtectionAlerts
          priceImpact={priceImpact}
          slippage={slippage}
          expectedOutput={outputAmount}
          minimumOutput={swapQuote?.minimumOutputAmount || (parseFloat(outputAmount) * (1 - slippage/100)).toFixed(6)}
          outputToken={outputToken}
          route={route}
        />
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="text-red-400 text-sm border border-red-400/30 bg-red-400/10 p-2">
          {errorMessage}
        </div>
      )}

      {/* Gas settings toggle */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="text-xs py-1 border-white/10 bg-transparent"
          onClick={() => setShowGasSettings(!showGasSettings)}
        >
          {showGasSettings ? 'Hide Gas Settings' : 'Gas Settings'}
        </Button>
      </div>

      {/* Gas optimization settings */}
      {showGasSettings && (
        <GasOptimizationSettings
          onGasSettingsChange={handleGasSettingsChange}
          initialGasSettings={gasSettings}
        />
      )}

      {/* Advanced Routing Options */}
      <AdvancedRoutingOptions
        slippage={slippage}
        onSlippageChange={handleSlippageChange}
        gasPrice={currentGasPrice}
        routeType={routeType}
        onRouteTypeChange={setRouteType}
        deadlineMinutes={deadlineMinutes}
        onDeadlineChange={setDeadlineMinutes}
      />

      {/* Toggle Alternative Routes button */}
      {isConnected && alternativeRoutes.length > 0 && !isCalculating && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="text-xs py-1 border-white/10 bg-transparent"
            onClick={() => setShowAlternativeRoutes(!showAlternativeRoutes)}
          >
            {showAlternativeRoutes ? 'Hide Routing Options' : 'Show Routing Options'}
          </Button>
        </div>
      )}

      {/* Alternative Routes */}
      {isConnected && showAlternativeRoutes && alternativeRoutes.length > 0 && !isCalculating && !isSameToken && (
        <div className="space-y-2">
          <h4 className="text-xs opacity-70 uppercase">Alternative Routes</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Current selected route */}
            <MultiHopVisualization
              route={route}
              selected={true}
              routeType={routeType}
              routeFees={swapQuote?.fees || 0.3}
              gasEstimate={gasEstimate}
              priceImpact={priceImpact}
              minimumOutput={swapQuote?.minimumOutputAmount || (parseFloat(outputAmount) * (1 - slippage/100)).toFixed(6)}
              onClick={() => {}}
            />

            {/* Alternative routes */}
            {alternativeRoutes.map((altRoute, index) => (
              <MultiHopVisualization
                key={index}
                route={altRoute.route}
                selected={false}
                routeType={altRoute.routeType}
                routeFees={altRoute.routeFees}
                gasEstimate={altRoute.gasEstimate}
                priceImpact={altRoute.priceImpact}
                minimumOutput={altRoute.minimumOutput}
                onClick={() => handleRouteSelect(altRoute.routeType)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Transaction details */}
      {isConnected && outputAmount && route.length > 0 && !isCalculating && !isSameToken && !showAlternativeRoutes && (
        <div className="border border-white/10 p-3 mt-4 bg-black/30 space-y-3">
          {/* Routing information */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs opacity-70">ROUTING</span>
            </div>
            <div className="flex items-center space-x-2">
              {route.map((token, index) => (
                <React.Fragment key={index}>
                  <div className="font-mono text-xs">{token}</div>
                  {index < route.length - 1 && (
                    <div className="text-white/50">→</div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Price impact & Gas estimate */}
          <div className="grid grid-cols-2 text-xs gap-x-4 gap-y-2 border-t border-white/10 pt-3">
            <div className="flex justify-between">
              <span className="opacity-70">PRICE IMPACT:</span>
              <span className={parseFloat(priceImpact) > 5 ? "text-red-400" : "text-green-400"}>
                {priceImpact || '0.00%'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">GAS PRICE:</span>
              <span>{currentGasPrice} GWEI</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">MIN RECEIVED:</span>
              <span>
                {swapQuote?.minimumOutputAmount || (parseFloat(outputAmount) * (1 - slippage/100)).toFixed(6)} {outputToken}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">GAS ESTIMATE:</span>
              <span>{gasEstimate}</span>
            </div>
          </div>
        </div>
      )}

      {/* Transaction notifications and swap button */}
      <div className="flex items-center justify-between mt-6">
        <TransactionNotifications />

        <Button
          className="w-full max-w-[85%] py-6 bg-white text-black hover:bg-white/90 rounded-none"
          onClick={handleSwap}
          disabled={
            isLoading ||
            (!inputAmount && isConnected) ||
            isCalculating ||
            isSameToken ||
            (inputAmount && parseFloat(inputAmount) <= 0) ||
            (isConnected && parseFloat(inputAmount) > parseFloat(maxInputAmount))
          }
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <span className="mr-2">SWAPPING</span>
              <span className="loading">...</span>
            </span>
          ) : isCalculating ? (
            'CALCULATING...'
          ) : !isConnected ? (
            'CONNECT WALLET'
          ) : !inputAmount || parseFloat(inputAmount) <= 0 ? (
            'ENTER AMOUNT'
          ) : parseFloat(inputAmount) > parseFloat(maxInputAmount) ? (
            `INSUFFICIENT ${inputToken} BALANCE`
          ) : isSameToken ? (
            'SELECT DIFFERENT TOKENS'
          ) : !outputAmount ? (
            'CALCULATING...'
          ) : (
            `SWAP ${parseFloat(inputAmount).toFixed(4)} ${inputToken} → ${parseFloat(outputAmount).toFixed(4)} ${outputToken}`
          )}
        </Button>
      </div>

      {/* Recent Transaction Summary */}
      <TransactionHistorySummary />

      {/* Transaction notification handler */}
      <TransactionNotificationHandler />
    </div>
  );
}
