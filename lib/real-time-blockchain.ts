/**
 * real-time-blockchain.ts
 *
 * This module implements real-time connections to blockchain nodes using WebSockets
 * and polling to provide up-to-date blockchain metrics across multiple networks.
 */

import { ethers } from 'ethers';
import { NETWORKS, NetworkStatus } from './ethereum';
import { getDefaultDexRouter, getDexRoutersForChain } from './dex-routers';
import { playSound } from './sound-manager';

// Types
export interface BlockchainStats {
  chainId: number;
  blockNumber: number;
  gasPrice: string;
  baseFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  transactionsPerSecond: number;
  lastBlockTimestamp: number;
  status: NetworkStatus;
  responseTime: number;
  nodesUp: number;
  totalNodes: number;
  lastUpdated: number;
}

export interface BlockInfo {
  number: number;
  timestamp: number;
  gasUsed: string;
  gasLimit: string;
  baseFeePerGas?: string;
  transactions: number;
}

export interface NetworkPriceInfo {
  nativeTokenPriceUSD: number;
  gasPrice: string;
  transactionCostUSD: number;
  lastUpdated: number;
}

// State management
const providers: Record<number, {
  http: ethers.providers.JsonRpcProvider;
  ws?: ethers.providers.WebSocketProvider;
}> = {};

const statistics: Record<number, BlockchainStats> = {};
const priceInfo: Record<number, NetworkPriceInfo> = {};
const blockHistory: Record<number, BlockInfo[]> = {};

let listeners: Array<(stats: Record<number, BlockchainStats>) => void> = [];
let priceListeners: Array<(prices: Record<number, NetworkPriceInfo>) => void> = [];
let blockListeners: Array<(chainId: number, blockInfo: BlockInfo) => void> = [];

// Maximum number of blocks to keep in history for each chain
const MAX_BLOCK_HISTORY = 100;

// Helper to get network status based on response time and other factors
function determineNetworkStatus(
  responseTime: number,
  lastBlockAge: number,
  nodesUp: number,
  totalNodes: number
): NetworkStatus {
  if (responseTime > 5000 || lastBlockAge > 120 || nodesUp < totalNodes * 0.5) {
    return 'offline';
  } else if (responseTime > 2000 || lastBlockAge > 60 || nodesUp < totalNodes * 0.7) {
    return 'degraded';
  } else {
    return 'online';
  }
}

/**
 * Initialize providers for all networks
 * @returns Promise that resolves when all providers are initialized
 */
export async function initializeProviders(): Promise<void> {
  try {
    // Create providers for each network
    Object.entries(NETWORKS).forEach(([chainIdStr, network]) => {
      const chainId = parseInt(chainIdStr);
      if (!providers[chainId]) {
        try {
          // HTTP provider
          const httpProvider = new ethers.providers.JsonRpcProvider(network.rpcUrl);

          // WebSocket provider (if available)
          let wsProvider: ethers.providers.WebSocketProvider | undefined = undefined;
          const wsUrl = network.rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://');

          try {
            if (wsUrl !== network.rpcUrl) { // Only try WebSocket if URL changed
              wsProvider = new ethers.providers.WebSocketProvider(wsUrl);
            }
          } catch (wsError) {
            console.warn(`WebSocket connection failed for ${network.name}. Falling back to HTTP polling.`);
          }

          providers[chainId] = {
            http: httpProvider,
            ws: wsProvider
          };

          // Initialize statistics object
          statistics[chainId] = {
            chainId,
            blockNumber: 0,
            gasPrice: '0',
            transactionsPerSecond: 0,
            lastBlockTimestamp: 0,
            status: 'offline', // Will be updated after first fetch
            responseTime: 0,
            nodesUp: 0,
            totalNodes: 1,
            lastUpdated: Date.now()
          };

          // Initialize price info object
          priceInfo[chainId] = {
            nativeTokenPriceUSD: 0,
            gasPrice: '0',
            transactionCostUSD: 0,
            lastUpdated: Date.now()
          };

          // Initialize block history array
          blockHistory[chainId] = [];

          // Subscribe to new blocks if WebSocket is available
          if (wsProvider) {
            wsProvider.on('block', (blockNumber) => {
              fetchBlockInfo(chainId, blockNumber);
            });

            // Add error handler and reconnection logic
            wsProvider._websocket.on('error', () => {
              console.warn(`WebSocket error for ${network.name}. Reconnecting in 10s...`);
              setTimeout(() => reconnectWebSocket(chainId), 10000);
            });

            wsProvider._websocket.on('close', () => {
              console.warn(`WebSocket closed for ${network.name}. Reconnecting in 10s...`);
              setTimeout(() => reconnectWebSocket(chainId), 10000);
            });
          }
        } catch (error) {
          console.error(`Failed to initialize provider for ${network.name}:`, error);
        }
      }
    });

    // Start polling for all networks
    startPolling();

    // Start price polling
    startPricePolling();
  } catch (error) {
    console.error('Error initializing blockchain providers:', error);
  }
}

/**
 * Reconnect WebSocket for a specific chain
 * @param chainId Chain ID to reconnect WebSocket for
 */
async function reconnectWebSocket(chainId: number): Promise<void> {
  const network = NETWORKS[chainId];
  if (!network) return;

  try {
    const wsUrl = network.rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    if (wsUrl === network.rpcUrl) return; // No WebSocket URL available

    const wsProvider = new ethers.providers.WebSocketProvider(wsUrl);

    // Update provider
    if (providers[chainId]) {
      providers[chainId].ws = wsProvider;
    } else {
      providers[chainId] = {
        http: new ethers.providers.JsonRpcProvider(network.rpcUrl),
        ws: wsProvider
      };
    }

    // Resubscribe to events
    wsProvider.on('block', (blockNumber) => {
      fetchBlockInfo(chainId, blockNumber);
    });

    // Add error handler and reconnection logic
    wsProvider._websocket.on('error', () => {
      console.warn(`WebSocket error for ${network.name}. Reconnecting in 10s...`);
      setTimeout(() => reconnectWebSocket(chainId), 10000);
    });

    wsProvider._websocket.on('close', () => {
      console.warn(`WebSocket closed for ${network.name}. Reconnecting in 10s...`);
      setTimeout(() => reconnectWebSocket(chainId), 10000);
    });

    console.log(`Successfully reconnected WebSocket for ${network.name}`);
  } catch (error) {
    console.error(`Failed to reconnect WebSocket for ${network.name}:`, error);
  }
}

/**
 * Start polling for chain data
 */
function startPolling(): void {
  Object.keys(providers).forEach((chainIdStr) => {
    const chainId = parseInt(chainIdStr);

    // Immediate initial fetch
    fetchChainData(chainId);

    // Regular polling interval (different for each chain to avoid simultaneous requests)
    const interval = 15000 + (chainId % 10) * 1000; // 15-25 seconds
    setInterval(() => fetchChainData(chainId), interval);
  });
}

/**
 * Start polling for price data
 */
function startPricePolling(): void {
  // Initial fetch
  fetchAllPriceData();

  // Regular polling interval for prices (every 60 seconds)
  setInterval(() => fetchAllPriceData(), 60000);
}

/**
 * Fetch blockchain data for a specific chain
 * @param chainId Chain ID to fetch data for
 */
async function fetchChainData(chainId: number): Promise<void> {
  const provider = providers[chainId]?.http;
  if (!provider) return;

  const network = NETWORKS[chainId];
  if (!network) return;

  const startTime = Date.now();

  try {
    // Get block number
    const blockNumber = await provider.getBlockNumber();

    // Get gas price
    const gasPrice = await provider.getGasPrice();

    // Try to get fee data for EIP-1559 chains
    let baseFeePerGas: string | undefined;
    let maxPriorityFeePerGas: string | undefined;

    try {
      const feeData = await provider.getFeeData();
      if (feeData.maxFeePerGas) {
        baseFeePerGas = ethers.utils.formatUnits(feeData.maxFeePerGas, 'gwei');
      }
      if (feeData.maxPriorityFeePerGas) {
        maxPriorityFeePerGas = ethers.utils.formatUnits(feeData.maxPriorityFeePerGas, 'gwei');
      }
    } catch (error) {
      // Non-EIP1559 chains don't support this
    }

    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Get TPS estimate by looking at recent blocks
    const recentBlocks = blockHistory[chainId] || [];
    const tps = calculateTPS(recentBlocks);

    // Get timestamp of latest block
    let lastBlockTimestamp = statistics[chainId]?.lastBlockTimestamp || 0;
    if (recentBlocks.length > 0) {
      lastBlockTimestamp = recentBlocks[recentBlocks.length - 1].timestamp;
    }

    // Determine network status
    const lastBlockAge = Math.floor(Date.now() / 1000) - lastBlockTimestamp;
    const status = determineNetworkStatus(responseTime, lastBlockAge, 1, 1);

    // Update statistics
    statistics[chainId] = {
      ...statistics[chainId],
      blockNumber,
      gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei'),
      baseFeePerGas,
      maxPriorityFeePerGas,
      transactionsPerSecond: tps,
      lastBlockTimestamp,
      status,
      responseTime,
      nodesUp: 1,
      totalNodes: 1,
      lastUpdated: Date.now()
    };

    // Notify listeners
    notifyListeners();

    // If the network is degraded or offline, play a sound notification
    if (status === 'degraded' || status === 'offline') {
      const prevStatus = NETWORKS[chainId].status;
      if (prevStatus !== 'degraded' && prevStatus !== 'offline') {
        playSound('notification-system');
      }
    }

    // Update the network status in the NETWORKS object
    NETWORKS[chainId].status = status;
  } catch (error) {
    console.error(`Error fetching data for ${network.name}:`, error);

    // Mark as offline
    statistics[chainId] = {
      ...statistics[chainId],
      status: 'offline',
      responseTime: Date.now() - startTime,
      lastUpdated: Date.now()
    };

    // Notify listeners
    notifyListeners();

    // If the network was previously online, play a sound notification
    if (NETWORKS[chainId].status === 'online') {
      playSound('notification-system');
    }

    // Update the network status in the NETWORKS object
    NETWORKS[chainId].status = 'offline';
  }
}

/**
 * Fetch detailed block information for a specific block
 * @param chainId Chain ID to fetch block for
 * @param blockNumber Block number to fetch
 */
async function fetchBlockInfo(chainId: number, blockNumber: number): Promise<void> {
  const provider = providers[chainId]?.http;
  if (!provider) return;

  try {
    // Get block with transactions
    const block = await provider.getBlock(blockNumber, true);

    // Calculate gas used (sum of all transactions gas)
    let gasUsed = BigInt(0);
    if (block.transactions && block.transactions.length > 0) {
      // For full transaction objects
      if (typeof block.transactions[0] === 'object') {
        for (const tx of block.transactions) {
          if (typeof tx === 'object' && tx.gasLimit) {
            gasUsed += BigInt(tx.gasLimit.toString());
          }
        }
      }
    }

    // Format the block info
    const blockInfo: BlockInfo = {
      number: block.number,
      timestamp: block.timestamp,
      gasUsed: gasUsed.toString(),
      gasLimit: block.gasLimit.toString(),
      baseFeePerGas: block.baseFeePerGas ? ethers.utils.formatUnits(block.baseFeePerGas, 'gwei') : undefined,
      transactions: block.transactions.length
    };

    // Add to history
    const history = blockHistory[chainId] || [];
    history.push(blockInfo);

    // Trim history to keep only the most recent blocks
    if (history.length > MAX_BLOCK_HISTORY) {
      history.splice(0, history.length - MAX_BLOCK_HISTORY);
    }

    blockHistory[chainId] = history;

    // Update lastBlockTimestamp in statistics
    if (statistics[chainId]) {
      statistics[chainId].lastBlockTimestamp = block.timestamp;

      // Recalculate TPS
      statistics[chainId].transactionsPerSecond = calculateTPS(history);

      // Update statistics last updated timestamp
      statistics[chainId].lastUpdated = Date.now();
    }

    // Notify listeners
    notifyListeners();
    notifyBlockListeners(chainId, blockInfo);
  } catch (error) {
    console.error(`Error fetching block ${blockNumber} for chain ${chainId}:`, error);
  }
}

/**
 * Fetch price data for all networks
 */
async function fetchAllPriceData(): Promise<void> {
  for (const chainIdStr in providers) {
    const chainId = parseInt(chainIdStr);
    fetchPriceData(chainId);
  }
}

/**
 * Fetch price data for a specific chain
 * @param chainId Chain ID to fetch price data for
 */
async function fetchPriceData(chainId: number): Promise<void> {
  const network = NETWORKS[chainId];
  if (!network) return;

  try {
    // In a real app, this would fetch from a price API
    // Here we'll use placeholder values for demonstration
    const nativeTokenPriceUSD = chainId === 1 ? 3000 : // ETH
      chainId === 137 ? 0.50 : // MATIC
      chainId === 56 ? 200 : // BNB
      chainId === 43114 ? 10 : // AVAX
      chainId === 250 ? 0.20 : // FTM
      500; // Default for others

    // Get gas price
    const gasPrice = statistics[chainId]?.gasPrice || '0';

    // Calculate transaction cost in USD
    // Assuming a standard transfer costs 21000 gas
    const gasPriceGwei = parseFloat(gasPrice);
    const gasPriceEth = gasPriceGwei / 1e9;
    const transactionCostETH = gasPriceEth * 21000;
    const transactionCostUSD = transactionCostETH * nativeTokenPriceUSD;

    // Update price info
    priceInfo[chainId] = {
      nativeTokenPriceUSD,
      gasPrice,
      transactionCostUSD,
      lastUpdated: Date.now()
    };

    // Notify price listeners
    notifyPriceListeners();
  } catch (error) {
    console.error(`Error fetching price data for ${network.name}:`, error);
  }
}

/**
 * Calculate transactions per second from block history
 * @param blocks Array of block info objects
 * @returns Transactions per second
 */
function calculateTPS(blocks: BlockInfo[]): number {
  if (blocks.length < 2) return 0;

  // Get the first and last blocks in the history
  const firstBlock = blocks[0];
  const lastBlock = blocks[blocks.length - 1];

  // Calculate total transactions
  let totalTransactions = 0;
  for (const block of blocks) {
    totalTransactions += block.transactions;
  }

  // Calculate time span in seconds
  const timeSpanSeconds = lastBlock.timestamp - firstBlock.timestamp;
  if (timeSpanSeconds <= 0) return 0;

  // Calculate TPS
  return totalTransactions / timeSpanSeconds;
}

/**
 * Register a listener for blockchain statistics updates
 * @param listener Function to call when statistics are updated
 */
export function registerListener(
  listener: (stats: Record<number, BlockchainStats>) => void
): void {
  listeners.push(listener);
}

/**
 * Unregister a listener
 * @param listener The listener function to remove
 */
export function unregisterListener(
  listener: (stats: Record<number, BlockchainStats>) => void
): void {
  listeners = listeners.filter(l => l !== listener);
}

/**
 * Register a listener for price updates
 * @param listener Function to call when prices are updated
 */
export function registerPriceListener(
  listener: (prices: Record<number, NetworkPriceInfo>) => void
): void {
  priceListeners.push(listener);
}

/**
 * Unregister a price listener
 * @param listener The price listener function to remove
 */
export function unregisterPriceListener(
  listener: (prices: Record<number, NetworkPriceInfo>) => void
): void {
  priceListeners = priceListeners.filter(l => l !== listener);
}

/**
 * Register a listener for new blocks
 * @param listener Function to call when a new block is processed
 */
export function registerBlockListener(
  listener: (chainId: number, blockInfo: BlockInfo) => void
): void {
  blockListeners.push(listener);
}

/**
 * Unregister a block listener
 * @param listener The block listener function to remove
 */
export function unregisterBlockListener(
  listener: (chainId: number, blockInfo: BlockInfo) => void
): void {
  blockListeners = blockListeners.filter(l => l !== listener);
}

/**
 * Notify all registered listeners with the current statistics
 */
function notifyListeners(): void {
  for (const listener of listeners) {
    try {
      listener(statistics);
    } catch (error) {
      console.error('Error in blockchain stats listener:', error);
    }
  }
}

/**
 * Notify all registered price listeners with the current price data
 */
function notifyPriceListeners(): void {
  for (const listener of priceListeners) {
    try {
      listener(priceInfo);
    } catch (error) {
      console.error('Error in price listener:', error);
    }
  }
}

/**
 * Notify block listeners of a new block
 * @param chainId Chain ID the block belongs to
 * @param blockInfo Block information
 */
function notifyBlockListeners(chainId: number, blockInfo: BlockInfo): void {
  for (const listener of blockListeners) {
    try {
      listener(chainId, blockInfo);
    } catch (error) {
      console.error('Error in block listener:', error);
    }
  }
}

/**
 * Get statistics for a specific chain
 * @param chainId Chain ID to get statistics for
 * @returns Blockchain statistics or undefined if not available
 */
export function getChainStats(chainId: number): BlockchainStats | undefined {
  return statistics[chainId];
}

/**
 * Get price information for a specific chain
 * @param chainId Chain ID to get price information for
 * @returns Network price information or undefined if not available
 */
export function getChainPriceInfo(chainId: number): NetworkPriceInfo | undefined {
  return priceInfo[chainId];
}

/**
 * Get block history for a specific chain
 * @param chainId Chain ID to get block history for
 * @param limit Maximum number of blocks to return (latest first)
 * @returns Array of block information objects
 */
export function getChainBlockHistory(chainId: number, limit = MAX_BLOCK_HISTORY): BlockInfo[] {
  const history = blockHistory[chainId] || [];
  return limit > 0 ? history.slice(-limit) : history;
}

/**
 * Get all chain statistics
 * @returns Record of blockchain statistics by chain ID
 */
export function getAllChainStats(): Record<number, BlockchainStats> {
  return statistics;
}

/**
 * Clean up resources used by this module
 */
export function cleanup(): void {
  // Close WebSocket connections
  for (const chainId in providers) {
    if (providers[chainId].ws) {
      providers[chainId].ws._websocket.close();
    }
  }

  // Clear listeners
  listeners = [];
  priceListeners = [];
  blockListeners = [];
}
