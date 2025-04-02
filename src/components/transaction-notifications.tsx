"use client";

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bell, BellOff, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWalletContext } from './wallet-provider';
import { getTransactionHistory, Transaction } from '@/lib/utils';

interface TransactionNotificationsProps {
  enabled?: boolean;
}

export default function TransactionNotifications({ enabled = true }: TransactionNotificationsProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(enabled);
  const [lastNotifiedTxId, setLastNotifiedTxId] = useState<string | null>(null);
  const { address, isConnected } = useWalletContext();

  // Check for new completed transactions periodically
  useEffect(() => {
    if (!notificationsEnabled || !isConnected || !address) return;

    const checkForNewTransactions = () => {
      const transactions = getTransactionHistory(address);

      // Filter for completed transactions that have not been notified yet
      const completedTransactions = transactions.filter(
        tx => tx.status === 'completed' && (!lastNotifiedTxId || tx.id !== lastNotifiedTxId)
      );

      if (completedTransactions.length > 0) {
        // Sort by timestamp to get the most recent one
        const latestTx = completedTransactions.sort((a, b) => b.timestamp - a.timestamp)[0];

        // Show notification
        showTransactionNotification(latestTx);

        // Update the last notified transaction ID
        setLastNotifiedTxId(latestTx.id);
      }
    };

    // Check immediately and then set up interval
    checkForNewTransactions();
    const interval = setInterval(checkForNewTransactions, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [notificationsEnabled, address, isConnected, lastNotifiedTxId]);

  // Show notification for a transaction
  const showTransactionNotification = (transaction: Transaction) => {
    const { type, tokenIn, tokenOut, amountIn, amountOut, txHash } = transaction;

    const formattedType = type.charAt(0).toUpperCase() + type.slice(1);
    const explorerLink = `https://etherscan.io/tx/${txHash}`;

    toast(
      <div className="flex flex-col space-y-1">
        <div className="flex items-center font-medium">
          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
          {formattedType} Completed
        </div>
        <div className="text-sm">
          {amountIn} {tokenIn} → {amountOut} {tokenOut}
        </div>
        <a
          href={explorerLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs underline hover:text-blue-400"
        >
          View on Etherscan
        </a>
      </div>,
      {
        duration: 6000,
        position: 'bottom-right',
      }
    );

    // Also try to play a sound notification if supported
    try {
      const audio = new Audio('/notification.mp3'); // You would need to add this file
      audio.volume = 0.5;
      audio.play().catch(err => {
        console.log('Audio notification failed:', err);
      });
    } catch (error) {
      console.log('Audio notification not supported:', error);
    }
  };

  // Toggle notifications on/off
  const toggleNotifications = () => {
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);

    if (newState) {
      toast.success('Transaction notifications enabled');
    } else {
      toast.info('Transaction notifications disabled');
    }
  };

  // Function to manually show test notifications for development
  const showTestNotification = () => {
    const testTransaction: Transaction = {
      id: 'test-' + Date.now(),
      type: 'swap',
      tokenIn: 'ETH',
      tokenOut: 'USDC',
      amountIn: '1.0',
      amountOut: '3000',
      txHash: '0x123456789abcdef',
      timestamp: Date.now(),
      status: 'completed',
      account: address || '',
      chainId: 1,
    };

    showTransactionNotification(testTransaction);
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        className={`p-1 h-7 w-7 rounded-none ${
          notificationsEnabled ? 'bg-white/10 border-white/30' : 'bg-black/20 border-white/10'
        }`}
        onClick={toggleNotifications}
        title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
      >
        {notificationsEnabled ? (
          <Bell className="h-4 w-4 text-green-400" />
        ) : (
          <BellOff className="h-4 w-4 text-white/50" />
        )}
      </Button>

      {/* Remove the test button that was here */}
    </div>
  );
}
