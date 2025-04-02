import { toast } from 'sonner';
import { ethers } from 'ethers';

// Type for token balances
export interface TokenBalance {
  token: string;
  balance: string;
  formattedBalance: string;
  symbol: string;
  decimals: number;
}

// Add NetworkStatus type
export type NetworkStatus = 'online' | 'degraded' | 'offline';

// Interface for supported networks
export interface NetworkInfo {
  chainId: number;
  name: string;
  symbol: string;
  decimals: number;
  rpcUrl: string;
  blockExplorer: string;
  logoUrl: string;
  status?: NetworkStatus;
  gasPrice?: string;
  features?: string[];
}

// Define supported networks with accurate data
export const NETWORKS: Record<number, NetworkInfo> = {
  1: {
    chainId: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    blockExplorer: 'https://etherscan.io',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
    status: 'online',
    gasPrice: '25 gwei',
    features: ['EVM', 'Smart Contracts', 'Layer 1', 'DeFi'],
  },
  137: {
    chainId: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    decimals: 18,
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png',
    status: 'online',
    gasPrice: '80 gwei',
    features: ['EVM', 'Layer 2', 'Scaling', 'POS'],
  },
  42161: {
    chainId: 42161,
    name: 'Arbitrum',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png',
    status: 'online',
    gasPrice: '0.1 gwei',
    features: ['EVM', 'Layer 2', 'Optimistic Rollups', 'Scaling'],
  },
  10: {
    chainId: 10,
    name: 'Optimism',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11840.png',
    status: 'degraded',
    gasPrice: '0.001 gwei',
    features: ['EVM', 'Layer 2', 'Optimistic Rollups', 'Scaling'],
  },
  8453: {
    chainId: 8453,
    name: 'Base',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/27716.png',
    status: 'online',
    gasPrice: '0.01 gwei',
    features: ['EVM', 'Layer 2', 'Optimistic Rollups', 'Coinbase'],
  },
  56: {
    chainId: 56,
    name: 'BNB Chain',
    symbol: 'BNB',
    decimals: 18,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockExplorer: 'https://bscscan.com',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
    status: 'online',
    gasPrice: '5 gwei',
    features: ['EVM', 'Smart Contracts', 'Layer 1', 'Binance Ecosystem'],
  },
  43114: {
    chainId: 43114,
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    blockExplorer: 'https://snowtrace.io',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png',
    status: 'online',
    gasPrice: '25 gwei',
    features: ['EVM', 'Smart Contracts', 'Layer 1', 'High Performance'],
  },
  250: {
    chainId: 250,
    name: 'Fantom',
    symbol: 'FTM',
    decimals: 18,
    rpcUrl: 'https://rpc.ftm.tools',
    blockExplorer: 'https://ftmscan.com',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3513.png',
    status: 'online',
    gasPrice: '100 gwei',
    features: ['EVM', 'Smart Contracts', 'Layer 1', 'DAG-based'],
  },
  59144: {
    chainId: 59144,
    name: 'Linea',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://rpc.linea.build',
    blockExplorer: 'https://lineascan.build',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/27657.png',
    status: 'online',
    gasPrice: '0.001 gwei',
    features: ['EVM', 'Layer 2', 'ZK Rollups', 'Consensys'],
  },
  1101: {
    chainId: 1101,
    name: 'Polygon zkEVM',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://zkevm-rpc.com',
    blockExplorer: 'https://zkevm.polygonscan.com',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png',
    status: 'online',
    gasPrice: '0.001 gwei',
    features: ['EVM', 'Layer 2', 'ZK Rollups', 'Polygon'],
  }
};

// Common token addresses on Ethereum Mainnet
export const TOKENS = {
  ETH: {
    address: 'native', // Special marker for ETH
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
    category: 'base',
  },
  WETH: {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    decimals: 18,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2396.png',
    category: 'base',
  },
  USDC: {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
    category: 'stablecoin',
  },
  USDT: {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    name: 'Tether',
    decimals: 6,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
    category: 'stablecoin',
  },
  DAI: {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png',
    category: 'stablecoin',
  },
  WBTC: {
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3717.png',
    category: 'bitcoin',
  },
  UNI: {
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    symbol: 'UNI',
    name: 'Uniswap',
    decimals: 18,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7083.png',
    category: 'defi',
  },
  LINK: {
    address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    symbol: 'LINK',
    name: 'Chainlink',
    decimals: 18,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1975.png',
    category: 'defi',
  },
  AAVE: {
    address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    symbol: 'AAVE',
    name: 'Aave',
    decimals: 18,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7278.png',
    category: 'defi',
  },
  CRV: {
    address: '0xD533a949740bb3306d119CC777fa900bA034cd52',
    symbol: 'CRV',
    name: 'Curve DAO Token',
    decimals: 18,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/6538.png',
    category: 'defi',
  },
  COMP: {
    address: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
    symbol: 'COMP',
    name: 'Compound',
    decimals: 18,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5692.png',
    category: 'defi',
  },
  SUSHI: {
    address: '0x6B3595068778DD592e39A122f4f5a5cF09C90fE2',
    symbol: 'SUSHI',
    name: 'Sushi',
    decimals: 18,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/6758.png',
    category: 'defi',
  },
  SNX: {
    address: '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F',
    symbol: 'SNX',
    name: 'Synthetix',
    decimals: 18,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2586.png',
    category: 'defi',
  },
  MKR: {
    address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
    symbol: 'MKR',
    name: 'Maker',
    decimals: 18,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1518.png',
    category: 'defi',
  },
  YFI: {
    address: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
    symbol: 'YFI',
    name: 'yearn.finance',
    decimals: 18,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5864.png',
    category: 'defi',
  },
  MATIC: {
    address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
    symbol: 'MATIC',
    name: 'Polygon',
    decimals: 18,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png',
    category: 'layer2',
  },
  SHIB: {
    address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
    symbol: 'SHIB',
    name: 'Shiba Inu',
    decimals: 18,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5994.png',
    category: 'meme',
  },
  APE: {
    address: '0x4d224452801ACEd8B2F0aebE155379bb5D594381',
    symbol: 'APE',
    name: 'ApeCoin',
    decimals: 18,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/18876.png',
    category: 'meme',
  },
  PEPE: {
    address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
    symbol: 'PEPE',
    name: 'Pepe',
    decimals: 18,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/24478.png',
    category: 'meme',
  },
  ARB: {
    address: '0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1',
    symbol: 'ARB',
    name: 'Arbitrum',
    decimals: 18,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png',
    category: 'layer2',
  },
  OP: {
    address: '0x4200000000000000000000000000000000000042',
    symbol: 'OP',
    name: 'Optimism',
    decimals: 18,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11840.png',
    category: 'layer2',
  },
  LDO: {
    address: '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32',
    symbol: 'LDO',
    name: 'Lido DAO',
    decimals: 18,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/8000.png',
    category: 'defi',
  },
  FXS: {
    address: '0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0',
    symbol: 'FXS',
    name: 'Frax Share',
    decimals: 18,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/6953.png',
    category: 'defi',
  },
  RPL: {
    address: '0xD33526068D116cE69F19A9ee46F0bd304F21A51f',
    symbol: 'RPL',
    name: 'Rocket Pool',
    decimals: 18,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2943.png',
    category: 'defi',
  },
  FRAX: {
    address: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
    symbol: 'FRAX',
    name: 'Frax',
    decimals: 18,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/6952.png',
    category: 'stablecoin',
  },
  GRT: {
    address: '0xc944E90C64B2c07662A292be6244BDf05Cda44a7',
    symbol: 'GRT',
    name: 'The Graph',
    decimals: 18,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/6719.png',
    category: 'defi',
  },
  DYDX: {
    address: '0x92D6C1e31e14520e676a687F0a93788B716BEff5',
    symbol: 'DYDX',
    name: 'dYdX',
    decimals: 18,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11156.png',
    category: 'defi',
  },
  ENS: {
    address: '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72',
    symbol: 'ENS',
    name: 'Ethereum Name Service',
    decimals: 18,
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/13855.png',
    category: 'utility',
  }
};

// Standard ERC20 ABI for token operations
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
];

// Get a provider based on currently connected network
export const getProvider = async (): Promise<ethers.BrowserProvider> => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No Ethereum provider available');
  }

  return new ethers.BrowserProvider(window.ethereum as any);
};

// Get a signer from the provider
export const getSigner = async (): Promise<ethers.JsonRpcSigner> => {
  const provider = await getProvider();
  return provider.getSigner();
};

// Get current chain ID
export const getCurrentChainId = async (): Promise<number> => {
  try {
    const provider = await getProvider();
    const network = await provider.getNetwork();
    return Number(network.chainId);
  } catch (error) {
    console.error('Error getting chain ID:', error);
    toast.error(`Failed to get chain ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};

// Connect to wallet
export const connectWallet = async (): Promise<string> => {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No Ethereum provider available');
    }

    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    return accounts[0];
  } catch (error) {
    console.error('Error connecting to wallet:', error);
    toast.error(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};

// Get ETH balance for an address
export const getEthBalance = async (address: string): Promise<string> => {
  try {
    const provider = await getProvider();
    const balanceWei = await provider.getBalance(address);
    return ethers.formatEther(balanceWei);
  } catch (error) {
    console.error('Error getting ETH balance:', error);
    toast.error(`Failed to get ETH balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};

// Get gas price
export const getGasPrice = async (): Promise<string> => {
  try {
    const provider = await getProvider();
    const feeData = await provider.getFeeData();

    if (!feeData.gasPrice) {
      console.warn('Gas price not available, using default');
      return '20.00'; // Default fallback value
    }

    // Convert to GWEI
    const gasPriceGwei = ethers.formatUnits(feeData.gasPrice, 'gwei');
    return parseFloat(gasPriceGwei).toFixed(2);
  } catch (error) {
    console.error('Error getting gas price:', error);
    // Provide a reasonable fallback
    return '20.00';
  }
};

// Get token balance for an address
export const getTokenBalance = async (
  tokenAddress: string,
  userAddress: string
): Promise<TokenBalance> => {
  try {
    // Handle ETH balance
    if (tokenAddress === 'ETH' || tokenAddress === 'native') {
      try {
        const balance = await getEthBalance(userAddress);
        return {
          token: 'ETH',
          balance: ethers.parseEther(balance).toString(),
          formattedBalance: parseFloat(balance).toFixed(4),
          symbol: 'ETH',
          decimals: 18,
        };
      } catch (error) {
        console.error('Error getting ETH balance:', error);
        // Return a default entry with zero balance
        return {
          token: 'ETH',
          balance: '0',
          formattedBalance: '0.0000',
          symbol: 'ETH',
          decimals: 18,
        };
      }
    }

    // Handle ERC-20 token balance with better error handling
    try {
      const provider = await getProvider();
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

      // Get token details and balance in parallel with timeouts
      const promises = [
        Promise.race([
          tokenContract.balanceOf(userAddress),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Balance lookup timeout')), 5000))
        ]),
        Promise.race([
          tokenContract.decimals(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Decimals lookup timeout')), 5000))
        ]),
        Promise.race([
          tokenContract.symbol(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Symbol lookup timeout')), 5000))
        ])
      ];

      const [balance, decimals, symbol] = await Promise.all(promises);

      const formattedBalance = ethers.formatUnits(balance, decimals);

      return {
        token: tokenAddress,
        balance: balance.toString(),
        formattedBalance: parseFloat(formattedBalance).toFixed(4),
        symbol,
        decimals,
      };
    } catch (error) {
      console.error(`Error getting token balance for address ${tokenAddress}:`, error);

      // Try to get token info from our predefined list
      const tokenSymbol = Object.entries(TOKENS).find(
        ([_, details]) => details.address.toLowerCase() === tokenAddress.toLowerCase()
      )?.[0];

      if (tokenSymbol) {
        const token = TOKENS[tokenSymbol as keyof typeof TOKENS];
        return {
          token: tokenAddress,
          balance: '0',
          formattedBalance: '0.0000',
          symbol: token.symbol,
          decimals: token.decimals,
        };
      }

      // If we can't find it in our list, return generic info
      return {
        token: tokenAddress,
        balance: '0',
        formattedBalance: '0.0000',
        symbol: 'UNKNOWN',
        decimals: 18,
      };
    }
  } catch (error) {
    console.error('Fatal error getting token balance:', error);
    return {
      token: tokenAddress,
      balance: '0',
      formattedBalance: '0.0000',
      symbol: 'ERROR',
      decimals: 18,
    };
  }
};

// Check token allowance for a spender
export const getTokenAllowance = async (
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string
): Promise<string> => {
  try {
    const provider = await getProvider();
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    const allowance = await tokenContract.allowance(ownerAddress, spenderAddress);
    return allowance.toString();
  } catch (error) {
    console.error('Error checking allowance:', error);
    throw error;
  }
};

// Approve token spending
export const approveToken = async (
  tokenAddress: string,
  spenderAddress: string,
  amount: string
): Promise<string> => {
  try {
    const signer = await getSigner();
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

    const tx = await tokenContract.approve(spenderAddress, amount);
    await tx.wait();

    return tx.hash;
  } catch (error) {
    console.error('Error approving token:', error);
    toast.error(`Failed to approve token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};
