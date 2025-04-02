import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format addresses for display
export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

// Format number with commas
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

// Transaction history types
export interface Transaction {
  id: string;
  type: 'swap' | 'limit' | 'bridge';
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  txHash: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  account: string;
  chainId: number;
}

// Favorite token pairs type
export interface FavoriteTokenPair {
  id: string;
  tokenIn: string;
  tokenOut: string;
  label?: string;
  account: string;
  timestamp: number;
}

// Transaction history localStorage management
export const TRANSACTION_HISTORY_KEY = 'dunix-transactions';
export const FAVORITE_PAIRS_KEY = 'dunix-favorite-pairs';

// Get transaction history from localStorage
export function getTransactionHistory(account: string): Transaction[] {
  if (typeof window === 'undefined') return [];

  try {
    const storedTransactions = localStorage.getItem(TRANSACTION_HISTORY_KEY);
    if (!storedTransactions) return [];

    const allTransactions: Transaction[] = JSON.parse(storedTransactions);
    // Filter transactions for the current account
    return allTransactions.filter(tx => tx.account === account);
  } catch (error) {
    console.error('Error retrieving transaction history:', error);
    return [];
  }
}

// Add transaction to history
export function addTransaction(transaction: Transaction): void {
  if (typeof window === 'undefined') return;

  try {
    const storedTransactions = localStorage.getItem(TRANSACTION_HISTORY_KEY);
    const transactions: Transaction[] = storedTransactions
      ? JSON.parse(storedTransactions)
      : [];

    // Add new transaction at the beginning of the array
    transactions.unshift(transaction);

    // Store at most 50 transactions
    const limitedTransactions = transactions.slice(0, 50);

    localStorage.setItem(TRANSACTION_HISTORY_KEY, JSON.stringify(limitedTransactions));
  } catch (error) {
    console.error('Error adding transaction to history:', error);
  }
}

// Update transaction status
export function updateTransactionStatus(
  txId: string,
  status: 'pending' | 'completed' | 'failed'
): void {
  if (typeof window === 'undefined') return;

  try {
    const storedTransactions = localStorage.getItem(TRANSACTION_HISTORY_KEY);
    if (!storedTransactions) return;

    const transactions: Transaction[] = JSON.parse(storedTransactions);
    const updatedTransactions = transactions.map(tx => {
      if (tx.id === txId) {
        return { ...tx, status };
      }
      return tx;
    });

    localStorage.setItem(TRANSACTION_HISTORY_KEY, JSON.stringify(updatedTransactions));
  } catch (error) {
    console.error('Error updating transaction status:', error);
  }
}

// Format relative time (e.g., "5 mins ago")
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} sec${diffInSeconds !== 1 ? 's' : ''} ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min${diffInMinutes !== 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
}

// Generate a unique ID for transactions
export function generateTransactionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Get favorite token pairs
export function getFavoritePairs(account: string): FavoriteTokenPair[] {
  if (typeof window === 'undefined') return [];

  try {
    const storedPairs = localStorage.getItem(FAVORITE_PAIRS_KEY);
    if (!storedPairs) return [];

    const allPairs: FavoriteTokenPair[] = JSON.parse(storedPairs);
    // Filter pairs for the current account
    return allPairs.filter(pair => pair.account === account);
  } catch (error) {
    console.error('Error retrieving favorite pairs:', error);
    return [];
  }
}

// Add favorite token pair
export function addFavoritePair(pair: Omit<FavoriteTokenPair, 'id' | 'timestamp'>): FavoriteTokenPair {
  if (typeof window === 'undefined') {
    throw new Error('Cannot add favorite pair in server-side context');
  }

  try {
    const storedPairs = localStorage.getItem(FAVORITE_PAIRS_KEY);
    const pairs: FavoriteTokenPair[] = storedPairs
      ? JSON.parse(storedPairs)
      : [];

    // Check if pair already exists
    const existingPair = pairs.find(p =>
      p.account === pair.account &&
      p.tokenIn === pair.tokenIn &&
      p.tokenOut === pair.tokenOut
    );

    if (existingPair) {
      return existingPair;
    }

    // Create new pair with ID and timestamp
    const newPair: FavoriteTokenPair = {
      ...pair,
      id: generateTransactionId(),
      timestamp: Date.now()
    };

    // Add new pair
    pairs.push(newPair);

    // Store in localStorage
    localStorage.setItem(FAVORITE_PAIRS_KEY, JSON.stringify(pairs));

    return newPair;
  } catch (error) {
    console.error('Error adding favorite pair:', error);
    throw error;
  }
}

// Remove favorite token pair
export function removeFavoritePair(pairId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const storedPairs = localStorage.getItem(FAVORITE_PAIRS_KEY);
    if (!storedPairs) return;

    const pairs: FavoriteTokenPair[] = JSON.parse(storedPairs);
    const updatedPairs = pairs.filter(pair => pair.id !== pairId);

    localStorage.setItem(FAVORITE_PAIRS_KEY, JSON.stringify(updatedPairs));
  } catch (error) {
    console.error('Error removing favorite pair:', error);
  }
}

// Check if a pair is favorited
export function isPairFavorited(account: string, tokenIn: string, tokenOut: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const favorites = getFavoritePairs(account);
    return favorites.some(pair =>
      pair.tokenIn === tokenIn &&
      pair.tokenOut === tokenOut
    );
  } catch (error) {
    console.error('Error checking if pair is favorited:', error);
    return false;
  }
}
