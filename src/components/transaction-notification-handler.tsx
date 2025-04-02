"use client";

import React, { useEffect } from 'react';
import { useWalletContext } from './wallet-provider';
import { addTransaction, generateTransactionId } from '@/lib/utils';
import { createTransactionNotification } from '@/lib/notification-manager';

interface TransactionNotificationHandlerProps {
  onTransaction?: (txHash: string, success: boolean) => void;
}

export default function TransactionNotificationHandler({
  onTransaction
}: TransactionNotificationHandlerProps) {
  const { chainId } = useWalletContext();

  // Listen to transaction events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleTransactionHash = (event: CustomEvent) => {
      const { detail } = event;
      if (!detail || !detail.txHash || !detail.transaction) return;

      const { txHash, transaction, success = true } = detail;

      // Call the onTransaction callback if provided
      if (onTransaction) {
        onTransaction(txHash, success);
      }

      // Create a notification for the transaction
      handleTransactionNotification(txHash, transaction, success);
    };

    // Add event listener for transaction hash events
    window.addEventListener('transaction-hash' as any, handleTransactionHash);

    return () => {
      window.removeEventListener('transaction-hash' as any, handleTransactionHash);
    };
  }, [onTransaction]);

  // Handle creating a notification for the transaction
  const handleTransactionNotification = (
    txHash: string,
    transaction: any,
    success: boolean
  ) => {
    const { type, tokenIn, tokenOut, amountIn, amountOut } = transaction;

    // Add to transaction history
    addTransaction({
      id: transaction.id || generateTransactionId(),
      type,
      tokenIn,
      tokenOut,
      amountIn,
      amountOut,
      txHash,
      timestamp: Date.now(),
      status: success ? 'completed' : 'failed',
      account: transaction.account,
      chainId: chainId || 1,
    });

    // Create notification based on transaction type
    if (type === 'swap') {
      if (success) {
        createTransactionNotification(
          txHash,
          'Swap Successful',
          `Swapped ${parseFloat(amountIn).toFixed(4)} ${tokenIn} for ${parseFloat(amountOut).toFixed(4)} ${tokenOut}`,
          {
            tokenPair: `${tokenIn}/${tokenOut}`,
            amount: amountIn,
            chain: getChainName(chainId)
          }
        );
      } else {
        createTransactionNotification(
          txHash,
          'Swap Failed',
          `Failed to swap ${tokenIn} for ${tokenOut}. Please try again.`,
          {
            tokenPair: `${tokenIn}/${tokenOut}`,
            chain: getChainName(chainId)
          }
        );
      }
    } else if (type === 'limit') {
      if (success) {
        createTransactionNotification(
          txHash,
          'Limit Order Placed',
          `Limit order to swap ${parseFloat(amountIn).toFixed(4)} ${tokenIn} for ${tokenOut} has been placed`,
          {
            tokenPair: `${tokenIn}/${tokenOut}`,
            amount: amountIn,
            chain: getChainName(chainId)
          }
        );
      } else {
        createTransactionNotification(
          txHash,
          'Limit Order Failed',
          `Failed to place limit order for ${tokenIn}/${tokenOut}. Please try again.`,
          {
            tokenPair: `${tokenIn}/${tokenOut}`,
            chain: getChainName(chainId)
          }
        );
      }
    } else if (type === 'bridge') {
      if (success) {
        createTransactionNotification(
          txHash,
          'Bridge Transaction Initiated',
          `Started bridging ${parseFloat(amountIn).toFixed(4)} ${tokenIn} to ${getChainName(transaction.destinationChainId)}`,
          {
            token: tokenIn,
            amount: amountIn,
            chain: getChainName(chainId)
          }
        );
      } else {
        createTransactionNotification(
          txHash,
          'Bridge Transaction Failed',
          `Failed to bridge ${tokenIn} to ${getChainName(transaction.destinationChainId)}. Please try again.`,
          {
            token: tokenIn,
            chain: getChainName(chainId)
          }
        );
      }
    }
  };

  // Helper function to get chain name from ID
  const getChainName = (id?: number): string => {
    if (!id) return 'Ethereum';

    const chainMap: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      42161: 'Arbitrum',
      10: 'Optimism',
      56: 'BNB Chain',
      43114: 'Avalanche',
      8453: 'Base',
      59144: 'Linea',
      324: 'zkSync Era',
      100: 'Gnosis Chain'
    };

    return chainMap[id] || 'Unknown Network';
  };

  // This component doesn't render anything - it just attaches event listeners
  return null;
}
