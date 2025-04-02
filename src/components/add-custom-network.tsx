"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useCustomNetworks } from '@/lib/custom-networks';
import { useNetworkSpeed } from '@/lib/network-speed';
import { useCustomRPC } from '@/lib/custom-rpc';
import { toast } from 'sonner';

interface AddCustomNetworkProps {
  children?: React.ReactNode;
  onNetworkAdded?: (chainId: number) => void;
}

export default function AddCustomNetwork({ children, onNetworkAdded }: AddCustomNetworkProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const { isChainIdInUse, addCustomNetwork } = useCustomNetworks();
  const { validateRPCUrl } = useCustomRPC();

  // Form state
  const [formData, setFormData] = useState({
    chainId: '',
    name: '',
    symbol: '',
    decimals: '18',
    rpcUrl: '',
    blockExplorer: '',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png', // Default logo
  });

  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user modifies the field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Clear test result when RPC URL changes
    if (name === 'rpcUrl') {
      setTestResult(null);
    }
  };

  // Test RPC URL
  const handleTestRPC = async () => {
    if (!formData.rpcUrl) {
      setErrors(prev => ({ ...prev, rpcUrl: 'RPC URL is required' }));
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const isValid = await validateRPCUrl(formData.rpcUrl);

      if (isValid) {
        setTestResult({ success: true, message: 'RPC URL is valid' });
        toast.success('RPC URL connection successful');
      } else {
        setTestResult({ success: false, message: 'Failed to connect to RPC URL' });
        toast.error('Failed to connect to RPC URL');
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      toast.error('Error testing RPC URL');
    } finally {
      setIsTesting(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Chain ID
    if (!formData.chainId) {
      newErrors.chainId = 'Chain ID is required';
    } else {
      const chainId = parseInt(formData.chainId);
      if (isNaN(chainId) || chainId <= 0) {
        newErrors.chainId = 'Chain ID must be a positive number';
      } else if (isChainIdInUse(chainId)) {
        newErrors.chainId = 'Chain ID is already in use';
      }
    }

    // Name
    if (!formData.name.trim()) {
      newErrors.name = 'Network name is required';
    }

    // Symbol
    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Currency symbol is required';
    }

    // Decimals
    if (!formData.decimals) {
      newErrors.decimals = 'Decimals are required';
    } else {
      const decimals = parseInt(formData.decimals);
      if (isNaN(decimals) || decimals < 0 || decimals > 18) {
        newErrors.decimals = 'Decimals must be a number between 0 and 18';
      }
    }

    // RPC URL
    if (!formData.rpcUrl.trim()) {
      newErrors.rpcUrl = 'RPC URL is required';
    } else if (!formData.rpcUrl.startsWith('http')) {
      newErrors.rpcUrl = 'RPC URL must start with http:// or https://';
    }

    // Block Explorer
    if (!formData.blockExplorer.trim()) {
      newErrors.blockExplorer = 'Block explorer URL is required';
    } else if (!formData.blockExplorer.startsWith('http')) {
      newErrors.blockExplorer = 'Block explorer URL must start with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Test RPC URL one last time if not already tested
      if (!testResult) {
        const isValid = await validateRPCUrl(formData.rpcUrl);
        if (!isValid) {
          setErrors(prev => ({ ...prev, rpcUrl: 'RPC URL is not valid' }));
          toast.error('RPC URL validation failed');
          setIsSubmitting(false);
          return;
        }
      } else if (!testResult.success) {
        setErrors(prev => ({ ...prev, rpcUrl: testResult.message }));
        toast.error('RPC URL validation failed');
        setIsSubmitting(false);
        return;
      }

      // Add the custom network
      const chainId = parseInt(formData.chainId);
      const decimals = parseInt(formData.decimals);

      const [success, validationErrors] = addCustomNetwork({
        chainId,
        name: formData.name,
        symbol: formData.symbol,
        decimals,
        rpcUrl: formData.rpcUrl,
        blockExplorer: formData.blockExplorer,
        logoUrl: formData.logoUrl,
      });

      if (success) {
        toast.success(`Network "${formData.name}" added successfully`);

        // Reset form
        setFormData({
          chainId: '',
          name: '',
          symbol: '',
          decimals: '18',
          rpcUrl: '',
          blockExplorer: '',
          logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
        });
        setTestResult(null);

        // Close dialog
        setIsOpen(false);

        // Notify parent component
        if (onNetworkAdded) {
          onNetworkAdded(chainId);
        }
      } else {
        // Display validation errors
        const errorMap: Record<string, string> = {};
        validationErrors.forEach(error => {
          const field = error.toLowerCase().split(' ')[0];
          errorMap[field] = error;
        });
        setErrors(errorMap);
        toast.error('Failed to add network');
      }
    } catch (error) {
      console.error('Error adding network:', error);
      toast.error('Failed to add network');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to render form field
  const renderField = (
    label: string,
    name: string,
    placeholder: string,
    type: string = 'text',
    required: boolean = true
  ) => (
    <div className="space-y-1">
      <div className="flex justify-between">
        <label className="text-sm font-medium">{label}</label>
        {errors[name] && (
          <span className="text-xs text-red-400">{errors[name]}</span>
        )}
      </div>
      <Input
        type={type}
        name={name}
        placeholder={placeholder}
        value={formData[name as keyof typeof formData]}
        onChange={handleChange}
        className={`bg-black border ${errors[name] ? 'border-red-600' : 'border-white/20'}`}
        required={required}
      />
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="text-xs">
            Add Custom Network
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-black border border-white/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Add Custom Network</DialogTitle>
          <DialogDescription>
            Enter the details of the network you want to add.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {renderField('Chain ID', 'chainId', '1', 'number')}
            {renderField('Network Name', 'name', 'Ethereum')}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {renderField('Currency Symbol', 'symbol', 'ETH')}
            {renderField('Decimals', 'decimals', '18', 'number')}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-sm font-medium">RPC URL</label>
              {errors.rpcUrl && (
                <span className="text-xs text-red-400">{errors.rpcUrl}</span>
              )}
            </div>
            <div className="flex space-x-2">
              <Input
                name="rpcUrl"
                placeholder="https://mainnet.infura.io/v3/your-api-key"
                value={formData.rpcUrl}
                onChange={handleChange}
                className={`flex-1 bg-black border ${errors.rpcUrl ? 'border-red-600' : 'border-white/20'}`}
                required
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestRPC}
                disabled={isTesting || !formData.rpcUrl}
                className="text-xs whitespace-nowrap"
              >
                {isTesting ? 'Testing...' : 'Test URL'}
              </Button>
            </div>
            {testResult && (
              <div className={`text-xs mt-1 ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                {testResult.message}
              </div>
            )}
          </div>

          {renderField('Block Explorer', 'blockExplorer', 'https://etherscan.io')}
          {renderField('Logo URL', 'logoUrl', 'https://example.com/logo.png', 'text', false)}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleSubmit}
            className="text-xs bg-white/10"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding Network...' : 'Add Network'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
