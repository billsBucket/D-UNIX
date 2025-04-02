"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useCustomRPC } from '@/lib/custom-rpc';
import { NETWORKS } from '@/lib/ethereum';
import { toast } from 'sonner';

interface RPCConfigurationProps {
  chainId: number;
  children?: React.ReactNode;
  onClose?: () => void;
}

export default function RPCConfiguration({ chainId, children, onClose }: RPCConfigurationProps) {
  const network = NETWORKS[chainId];
  const { customRPCs, setCustomRPC, removeCustomRPC, getCustomRPC, validateRPCUrl } = useCustomRPC();

  const currentCustomRPC = getCustomRPC(chainId);
  const [rpcUrl, setRpcUrl] = useState(currentCustomRPC?.rpcUrl || '');
  const [rpcName, setRpcName] = useState(currentCustomRPC?.name || '');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<boolean | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  if (!network) {
    return null;
  }

  const handleValidateRPC = async () => {
    if (!rpcUrl) {
      toast.error('Please enter an RPC URL');
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const isValid = await validateRPCUrl(rpcUrl);
      setValidationResult(isValid);

      if (isValid) {
        toast.success('RPC URL is valid');
      } else {
        toast.error('RPC URL validation failed');
      }
    } catch (error) {
      console.error('Error validating RPC URL:', error);
      setValidationResult(false);
      toast.error('Error validating RPC URL');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveRPC = () => {
    if (!rpcUrl) {
      toast.error('Please enter an RPC URL');
      return;
    }

    try {
      const success = setCustomRPC(chainId, rpcUrl, rpcName || undefined);

      if (success) {
        toast.success('Custom RPC URL saved');
        setIsOpen(false);
        if (onClose) onClose();
      } else {
        toast.error('Failed to save custom RPC URL');
      }
    } catch (error) {
      console.error('Error saving custom RPC:', error);
      toast.error('Error saving custom RPC configuration');
    }
  };

  const handleResetToDefault = () => {
    removeCustomRPC(chainId);
    setRpcUrl('');
    setRpcName('');
    setValidationResult(null);
    toast.success('Reset to default RPC URL');
    setIsOpen(false);
    if (onClose) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Configure RPC
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-black border border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <img
              src={network.logoUrl}
              alt={network.name}
              className="w-6 h-6 rounded-full mr-2"
            />
            Configure RPC for {network.name}
          </DialogTitle>
          <DialogDescription>
            Set a custom RPC URL for this network to optimize connection speed and reliability.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Default RPC URL</div>
            <div className="bg-white/5 p-2 text-xs font-mono break-all rounded border border-white/10">
              {network.rpcUrl}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Custom RPC Name (Optional)</div>
            <Input
              placeholder="My Fast RPC Endpoint"
              value={rpcName}
              onChange={(e) => setRpcName(e.target.value)}
              className="bg-black border-white/20"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Custom RPC URL</div>
            <Input
              placeholder="https://..."
              value={rpcUrl}
              onChange={(e) => setRpcUrl(e.target.value)}
              className="bg-black border-white/20"
            />
            {validationResult !== null && (
              <div className={`text-xs mt-1 ${validationResult ? 'text-green-400' : 'text-red-400'}`}>
                {validationResult ? '✓ RPC URL is valid' : '✗ RPC URL validation failed'}
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleValidateRPC}
              disabled={isValidating || !rpcUrl}
              className="text-xs flex-1"
            >
              {isValidating ? 'Validating...' : 'Validate RPC'}
            </Button>

            {currentCustomRPC && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetToDefault}
                className="text-xs flex-1 hover:bg-red-900/20 hover:text-red-400"
              >
                Reset to Default
              </Button>
            )}
          </div>
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
            onClick={handleSaveRPC}
            className="text-xs bg-white/10"
            disabled={isValidating}
          >
            Save Custom RPC
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
