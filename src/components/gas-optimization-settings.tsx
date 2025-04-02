"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getGasPrice } from '@/lib/ethereum';

interface GasOptimizationSettingsProps {
  onGasSettingsChange: (settings: GasSettings) => void;
  initialGasSettings?: GasSettings;
}

export interface GasSettings {
  gasMode: 'auto' | 'basic' | 'advanced';
  gasPrice: string; // in GWEI
  gasLimit: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  customNonce?: string;
}

export default function GasOptimizationSettings({
  onGasSettingsChange,
  initialGasSettings
}: GasOptimizationSettingsProps) {
  // Default gas settings
  const defaultGasSettings: GasSettings = {
    gasMode: 'auto',
    gasPrice: '0',
    gasLimit: '200000',
  };

  // State for gas settings
  const [gasSettings, setGasSettings] = useState<GasSettings>(initialGasSettings || defaultGasSettings);
  const [currentGasPrice, setCurrentGasPrice] = useState('0');
  const [gasSpeedFactor, setGasSpeedFactor] = useState(1);
  const [showGasLimit, setShowGasLimit] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Fetch current gas price on mount
  useEffect(() => {
    const fetchGasPrice = async () => {
      try {
        const price = await getGasPrice();
        setCurrentGasPrice(price);

        // Update gas price in settings if in auto mode
        if (gasSettings.gasMode === 'auto') {
          const newGasSettings = {
            ...gasSettings,
            gasPrice: price
          };
          setGasSettings(newGasSettings);
          onGasSettingsChange(newGasSettings);
        }
      } catch (error) {
        console.error('Failed to fetch gas price:', error);
      }
    };

    fetchGasPrice();
    const interval = setInterval(fetchGasPrice, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, []);

  // Update gas price when speed factor changes
  useEffect(() => {
    if (gasSettings.gasMode === 'basic' && currentGasPrice) {
      const baseGasPrice = parseFloat(currentGasPrice);
      const newGasPrice = (baseGasPrice * gasSpeedFactor).toFixed(2);

      const newGasSettings = {
        ...gasSettings,
        gasPrice: newGasPrice
      };

      setGasSettings(newGasSettings);
      onGasSettingsChange(newGasSettings);
    }
  }, [gasSpeedFactor, currentGasPrice, gasSettings.gasMode]);

  // Handle mode change
  const handleModeChange = (mode: 'auto' | 'basic' | 'advanced') => {
    let newGasSettings: GasSettings;

    if (mode === 'auto') {
      newGasSettings = {
        ...gasSettings,
        gasMode: mode,
        gasPrice: currentGasPrice
      };
    } else if (mode === 'basic') {
      newGasSettings = {
        ...gasSettings,
        gasMode: mode,
        gasPrice: currentGasPrice
      };
      setGasSpeedFactor(1);
    } else {
      newGasSettings = {
        ...gasSettings,
        gasMode: mode,
        maxFeePerGas: gasSettings.maxFeePerGas || currentGasPrice,
        maxPriorityFeePerGas: gasSettings.maxPriorityFeePerGas || '1.5'
      };
    }

    setGasSettings(newGasSettings);
    onGasSettingsChange(newGasSettings);

    // Show advanced settings if advanced mode is selected
    setShowAdvancedSettings(mode === 'advanced');
  };

  // Handle gas limit change
  const handleGasLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      const newGasSettings = {
        ...gasSettings,
        gasLimit: value
      };
      setGasSettings(newGasSettings);
      onGasSettingsChange(newGasSettings);
    }
  };

  // Handle max fee per gas change
  const handleMaxFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      const newGasSettings = {
        ...gasSettings,
        maxFeePerGas: value
      };
      setGasSettings(newGasSettings);
      onGasSettingsChange(newGasSettings);
    }
  };

  // Handle max priority fee change
  const handleMaxPriorityFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      const newGasSettings = {
        ...gasSettings,
        maxPriorityFeePerGas: value
      };
      setGasSettings(newGasSettings);
      onGasSettingsChange(newGasSettings);
    }
  };

  // Handle custom nonce change
  const handleNonceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      const newGasSettings = {
        ...gasSettings,
        customNonce: value
      };
      setGasSettings(newGasSettings);
      onGasSettingsChange(newGasSettings);
    }
  };

  // Get transaction speed description
  const getSpeedDescription = () => {
    if (gasSpeedFactor < 0.8) return 'Slower (Might Take Longer)';
    if (gasSpeedFactor >= 0.8 && gasSpeedFactor < 1.2) return 'Standard (Recommended)';
    if (gasSpeedFactor >= 1.2 && gasSpeedFactor < 1.7) return 'Fast';
    return 'Rapid (Higher Cost)';
  };

  // Get estimated time based on speed factor
  const getEstimatedTime = () => {
    if (gasSpeedFactor < 0.8) return '5-10+ min';
    if (gasSpeedFactor >= 0.8 && gasSpeedFactor < 1.2) return '1-3 min';
    if (gasSpeedFactor >= 1.2 && gasSpeedFactor < 1.7) return '30-60 sec';
    return '< 30 sec';
  };

  return (
    <Card className="border border-white/10 bg-black/30">
      <CardHeader className="p-3">
        <CardTitle className="text-sm flex justify-between">
          Gas Settings
          <span className="text-white/70 font-normal">Network: {parseFloat(currentGasPrice).toFixed(1)} GWEI</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-4">
        {/* Mode selection */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant={gasSettings.gasMode === 'auto' ? 'default' : 'outline'}
            className={`text-xs ${gasSettings.gasMode === 'auto' ? 'bg-white text-black' : 'bg-black/30 border-white/20'}`}
            onClick={() => handleModeChange('auto')}
          >
            Auto
          </Button>
          <Button
            size="sm"
            variant={gasSettings.gasMode === 'basic' ? 'default' : 'outline'}
            className={`text-xs ${gasSettings.gasMode === 'basic' ? 'bg-white text-black' : 'bg-black/30 border-white/20'}`}
            onClick={() => handleModeChange('basic')}
          >
            Basic
          </Button>
          <Button
            size="sm"
            variant={gasSettings.gasMode === 'advanced' ? 'default' : 'outline'}
            className={`text-xs ${gasSettings.gasMode === 'advanced' ? 'bg-white text-black' : 'bg-black/30 border-white/20'}`}
            onClick={() => handleModeChange('advanced')}
          >
            Advanced
          </Button>
        </div>

        {/* Basic mode settings */}
        {gasSettings.gasMode === 'basic' && (
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs font-medium">{getSpeedDescription()}</span>
                <span className="text-xs text-white/70">{getEstimatedTime()}</span>
              </div>
              <Slider
                value={[gasSpeedFactor]}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={(value) => setGasSpeedFactor(value[0])}
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-white/70">Slower</span>
                <span className="text-xs text-white/70">Faster</span>
              </div>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-white/70">Gas Price:</span>
              <span>{parseFloat(gasSettings.gasPrice).toFixed(2)} GWEI</span>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs bg-black/30 border-white/20"
              onClick={() => setShowGasLimit(!showGasLimit)}
            >
              {showGasLimit ? 'Hide Gas Limit' : 'Show Gas Limit'}
            </Button>

            {showGasLimit && (
              <div className="grid gap-2">
                <label htmlFor="gasLimit" className="text-xs text-white/70">
                  Gas Limit
                </label>
                <Input
                  id="gasLimit"
                  value={gasSettings.gasLimit}
                  onChange={handleGasLimitChange}
                  className="dunix-input"
                  placeholder="200000"
                />
              </div>
            )}
          </div>
        )}

        {/* Advanced mode settings */}
        {gasSettings.gasMode === 'advanced' && (
          <div className="space-y-3">
            <div className="grid gap-2">
              <label htmlFor="maxFee" className="text-xs text-white/70">
                Max Fee (GWEI)
              </label>
              <Input
                id="maxFee"
                value={gasSettings.maxFeePerGas}
                onChange={handleMaxFeeChange}
                className="dunix-input"
                placeholder={currentGasPrice}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="maxPriorityFee" className="text-xs text-white/70">
                Max Priority Fee (GWEI)
              </label>
              <Input
                id="maxPriorityFee"
                value={gasSettings.maxPriorityFeePerGas}
                onChange={handleMaxPriorityFeeChange}
                className="dunix-input"
                placeholder="1.5"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="gasLimit" className="text-xs text-white/70">
                Gas Limit
              </label>
              <Input
                id="gasLimit"
                value={gasSettings.gasLimit}
                onChange={handleGasLimitChange}
                className="dunix-input"
                placeholder="200000"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="nonce" className="text-xs text-white/70">
                Custom Nonce (Optional)
              </label>
              <Input
                id="nonce"
                value={gasSettings.customNonce || ''}
                onChange={handleNonceChange}
                className="dunix-input"
                placeholder="Leave blank for auto"
              />
            </div>
          </div>
        )}

        {/* Auto mode description */}
        {gasSettings.gasMode === 'auto' && (
          <div className="text-xs text-white/70 space-y-2">
            <p>Using network-recommended gas price: {parseFloat(currentGasPrice).toFixed(2)} GWEI</p>
            <p>Gas limit: {gasSettings.gasLimit}</p>

            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs bg-black/30 border-white/20"
              onClick={() => setShowGasLimit(!showGasLimit)}
            >
              {showGasLimit ? 'Hide Gas Limit' : 'Show Gas Limit'}
            </Button>

            {showGasLimit && (
              <div className="grid gap-2 mt-2">
                <label htmlFor="gasLimit" className="text-xs text-white/70">
                  Gas Limit
                </label>
                <Input
                  id="gasLimit"
                  value={gasSettings.gasLimit}
                  onChange={handleGasLimitChange}
                  className="dunix-input"
                  placeholder="200000"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
