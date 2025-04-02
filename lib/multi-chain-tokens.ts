import { NETWORKS } from './ethereum';

// Token Category Types
export enum TokenCategory {
  Native = 'native',
  Stablecoin = 'stablecoin',
  Wrapped = 'wrapped',
  Governance = 'governance',
  LendingProtocol = 'lending',
  GameFi = 'gamefi',
  DeFi = 'defi',
  Bridge = 'bridge',
  LST = 'liquid-staking'
}

// Interface for token information
export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl: string;
  category: TokenCategory | string;
  isVerified?: boolean;
}

// Interface for cross-chain token mapping
export type CrossChainTokenMap = Record<number, Record<string, TokenInfo>>;

/**
 * Token addresses mapped by symbol for each chain
 * 'native' address is used for the native token of each chain
 */
export const MULTI_CHAIN_TOKENS: CrossChainTokenMap = {
  // Ethereum Mainnet - Chain ID: 1
  1: {
    ETH: {
      address: 'native',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
      category: TokenCategory.Native,
      isVerified: true
    },
    WETH: {
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2396.png',
      category: TokenCategory.Wrapped,
      isVerified: true
    },
    USDC: {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
      category: TokenCategory.Stablecoin,
      isVerified: true
    },
    USDT: {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether',
      decimals: 6,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
      category: TokenCategory.Stablecoin,
      isVerified: true
    },
    DAI: {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png',
      category: TokenCategory.Stablecoin,
      isVerified: true
    },
    WBTC: {
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      decimals: 8,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3717.png',
      category: TokenCategory.Wrapped,
      isVerified: true
    },
    stETH: {
      address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
      symbol: 'stETH',
      name: 'Lido Staked ETH',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/8085.png',
      category: TokenCategory.LST,
      isVerified: true
    },
    UNI: {
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      symbol: 'UNI',
      name: 'Uniswap',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7083.png',
      category: TokenCategory.Governance,
      isVerified: true
    }
  },

  // Polygon - Chain ID: 137
  137: {
    MATIC: {
      address: 'native',
      symbol: 'MATIC',
      name: 'Polygon',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png',
      category: TokenCategory.Native,
      isVerified: true
    },
    WMATIC: {
      address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      symbol: 'WMATIC',
      name: 'Wrapped Matic',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png',
      category: TokenCategory.Wrapped,
      isVerified: true
    },
    USDC: {
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      symbol: 'USDC',
      name: 'USD Coin (PoS)',
      decimals: 6,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
      category: TokenCategory.Stablecoin,
      isVerified: true
    },
    USDT: {
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      symbol: 'USDT',
      name: 'Tether (PoS)',
      decimals: 6,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
      category: TokenCategory.Stablecoin,
      isVerified: true
    },
    DAI: {
      address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      symbol: 'DAI',
      name: 'Dai (PoS)',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png',
      category: TokenCategory.Stablecoin,
      isVerified: true
    },
    WETH: {
      address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      symbol: 'WETH',
      name: 'Wrapped Ethereum (PoS)',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2396.png',
      category: TokenCategory.Wrapped,
      isVerified: true
    },
    QUICK: {
      address: '0xB5C064F955D8e7F38fE0460C556a72987494eE17',
      symbol: 'QUICK',
      name: 'QuickSwap',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/8206.png',
      category: TokenCategory.Governance,
      isVerified: true
    }
  },

  // Arbitrum - Chain ID: 42161
  42161: {
    ETH: {
      address: 'native',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
      category: TokenCategory.Native,
      isVerified: true
    },
    WETH: {
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2396.png',
      category: TokenCategory.Wrapped,
      isVerified: true
    },
    USDC: {
      address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
      symbol: 'USDC',
      name: 'USD Coin (Arb1)',
      decimals: 6,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
      category: TokenCategory.Stablecoin,
      isVerified: true
    },
    USDT: {
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      symbol: 'USDT',
      name: 'Tether (Arb1)',
      decimals: 6,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
      category: TokenCategory.Stablecoin,
      isVerified: true
    },
    ARB: {
      address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
      symbol: 'ARB',
      name: 'Arbitrum',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png',
      category: TokenCategory.Governance,
      isVerified: true
    },
    wstETH: {
      address: '0x5979D7b546E38E414F7E9822514be443A4800529',
      symbol: 'wstETH',
      name: 'Wrapped stETH',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/20829.png',
      category: TokenCategory.LST,
      isVerified: true
    },
    GMX: {
      address: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a',
      symbol: 'GMX',
      name: 'GMX',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11857.png',
      category: TokenCategory.DeFi,
      isVerified: true
    }
  },

  // Optimism - Chain ID: 10
  10: {
    ETH: {
      address: 'native',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
      category: TokenCategory.Native,
      isVerified: true
    },
    WETH: {
      address: '0x4200000000000000000000000000000000000006',
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2396.png',
      category: TokenCategory.Wrapped,
      isVerified: true
    },
    USDC: {
      address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
      category: TokenCategory.Stablecoin,
      isVerified: true
    },
    USDT: {
      address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
      symbol: 'USDT',
      name: 'Tether',
      decimals: 6,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
      category: TokenCategory.Stablecoin,
      isVerified: true
    },
    OP: {
      address: '0x4200000000000000000000000000000000000042',
      symbol: 'OP',
      name: 'Optimism',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11840.png',
      category: TokenCategory.Governance,
      isVerified: true
    }
  },

  // Base - Chain ID: 8453
  8453: {
    ETH: {
      address: 'native',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
      category: TokenCategory.Native,
      isVerified: true
    },
    WETH: {
      address: '0x4200000000000000000000000000000000000006',
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2396.png',
      category: TokenCategory.Wrapped,
      isVerified: true
    },
    USDbC: {
      address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
      symbol: 'USDbC',
      name: 'USD Base Coin',
      decimals: 6,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/25954.png',
      category: TokenCategory.Stablecoin,
      isVerified: true
    },
    USDC: {
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
      category: TokenCategory.Stablecoin,
      isVerified: true
    }
  },

  // BNB Chain - Chain ID: 56
  56: {
    BNB: {
      address: 'native',
      symbol: 'BNB',
      name: 'BNB',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
      category: TokenCategory.Native,
      isVerified: true
    },
    WBNB: {
      address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      symbol: 'WBNB',
      name: 'Wrapped BNB',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
      category: TokenCategory.Wrapped,
      isVerified: true
    },
    BUSD: {
      address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
      symbol: 'BUSD',
      name: 'Binance USD',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4687.png',
      category: TokenCategory.Stablecoin,
      isVerified: true
    },
    USDT: {
      address: '0x55d398326f99059fF775485246999027B3197955',
      symbol: 'USDT',
      name: 'Tether',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
      category: TokenCategory.Stablecoin,
      isVerified: true
    },
    CAKE: {
      address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
      symbol: 'CAKE',
      name: 'PancakeSwap Token',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7186.png',
      category: TokenCategory.Governance,
      isVerified: true
    }
  },

  // Avalanche C-Chain - Chain ID: 43114
  43114: {
    AVAX: {
      address: 'native',
      symbol: 'AVAX',
      name: 'Avalanche',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png',
      category: TokenCategory.Native,
      isVerified: true
    },
    WAVAX: {
      address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
      symbol: 'WAVAX',
      name: 'Wrapped AVAX',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png',
      category: TokenCategory.Wrapped,
      isVerified: true
    },
    USDC: {
      address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
      category: TokenCategory.Stablecoin,
      isVerified: true
    },
    USDT: {
      address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
      symbol: 'USDT',
      name: 'Tether',
      decimals: 6,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
      category: TokenCategory.Stablecoin,
      isVerified: true
    },
    JOE: {
      address: '0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd',
      symbol: 'JOE',
      name: 'Trader Joe',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11396.png',
      category: TokenCategory.Governance,
      isVerified: true
    }
  },

  // Fantom - Chain ID: 250
  250: {
    FTM: {
      address: 'native',
      symbol: 'FTM',
      name: 'Fantom',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3513.png',
      category: TokenCategory.Native,
      isVerified: true
    },
    WFTM: {
      address: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
      symbol: 'WFTM',
      name: 'Wrapped Fantom',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3513.png',
      category: TokenCategory.Wrapped,
      isVerified: true
    },
    USDC: {
      address: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
      category: TokenCategory.Stablecoin,
      isVerified: true
    },
    SPIRIT: {
      address: '0x5Cc61A78F164885776AA610fb0FE1257df78E59B',
      symbol: 'SPIRIT',
      name: 'SpiritSwap Token',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/9026.png',
      category: TokenCategory.Governance,
      isVerified: true
    }
  },

  // Linea - Chain ID: 59144
  59144: {
    ETH: {
      address: 'native',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
      category: TokenCategory.Native,
      isVerified: true
    },
    WETH: {
      address: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f',
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2396.png',
      category: TokenCategory.Wrapped,
      isVerified: true
    },
    USDC: {
      address: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
      category: TokenCategory.Stablecoin,
      isVerified: true
    },
    USDT: {
      address: '0xA219439258ca9da29E9Cc4cE5596924745e12B93',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
      category: TokenCategory.Stablecoin,
      isVerified: true
    },
    DAI: {
      address: '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png',
      category: TokenCategory.Stablecoin,
      isVerified: true
    },
    BUSD: {
      address: '0x7d43AABC515C356145049227CeE54B608342c0ad',
      symbol: 'BUSD',
      name: 'Binance USD',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4687.png',
      category: TokenCategory.Stablecoin,
      isVerified: true
    },
    WBTC: {
      address: '0x3aAB2285ddcDdaD8edf438C1bAB47e1a9D05a9b4',
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      decimals: 8,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3717.png',
      category: TokenCategory.Wrapped,
      isVerified: true
    }
  },

  // Polygon zkEVM - Chain ID: 1101
  1101: {
    ETH: {
      address: 'native',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
      category: TokenCategory.Native,
      isVerified: true
    },
    WETH: {
      address: '0x4F9A0e7FD2Bf6067db6994CF12E4495Df938E6e9',
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2396.png',
      category: TokenCategory.Wrapped,
      isVerified: true
    },
    USDC: {
      address: '0xA8CE8aee21bC2A48a5EF670afCc9274C7bbbC035',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
      category: TokenCategory.Stablecoin,
      isVerified: true
    },
    USDT: {
      address: '0x1E4a5963aBFD975d8c9021ce480b42188849D41d',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
      category: TokenCategory.Stablecoin,
      isVerified: true
    },
    DAI: {
      address: '0xC5015b9d9161Dca7e18e32f6f25C4aD850731Fd4',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png',
      category: TokenCategory.Stablecoin,
      isVerified: true
    },
    MATIC: {
      address: '0xa2036f0538221a77A3937F1379699f44945018d0',
      symbol: 'MATIC',
      name: 'Matic Token',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png',
      category: TokenCategory.Governance,
      isVerified: true
    },
    WBTC: {
      address: '0xEA034fb02eB1808C2cc3adbC15f447B93CbE08e1',
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      decimals: 8,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3717.png',
      category: TokenCategory.Wrapped,
      isVerified: true
    }
  }
};

/**
 * Get the native token symbol for a specific chain
 * @param chainId The chain ID
 * @returns The native token symbol or 'ETH' as fallback
 */
export function getNativeTokenSymbol(chainId: number): string {
  const chainTokens = MULTI_CHAIN_TOKENS[chainId];
  if (!chainTokens) return 'ETH';

  for (const [symbol, tokenInfo] of Object.entries(chainTokens)) {
    if (tokenInfo.address === 'native') {
      return symbol;
    }
  }

  return 'ETH'; // Default fallback
}

/**
 * Get the wrapped version of the native token for a specific chain
 * @param chainId The chain ID
 * @returns The wrapped native token info or undefined if not found
 */
export function getWrappedNativeTokenInfo(chainId: number): TokenInfo | undefined {
  const chainTokens = MULTI_CHAIN_TOKENS[chainId];
  if (!chainTokens) return undefined;

  const nativeSymbol = getNativeTokenSymbol(chainId);
  const wrappedSymbol = `W${nativeSymbol}`;

  return chainTokens[wrappedSymbol];
}

/**
 * Find a token by its address on a specific chain
 * @param chainId The chain ID
 * @param address The token address
 * @returns The token info or undefined if not found
 */
export function findTokenByAddress(chainId: number, address: string): TokenInfo | undefined {
  const chainTokens = MULTI_CHAIN_TOKENS[chainId];
  if (!chainTokens) return undefined;

  const normalizedAddress = address.toLowerCase();

  for (const tokenInfo of Object.values(chainTokens)) {
    if (tokenInfo.address.toLowerCase() === normalizedAddress) {
      return tokenInfo;
    }
  }

  return undefined;
}

/**
 * Get a token by its symbol on a specific chain
 * @param chainId The chain ID
 * @param symbol The token symbol
 * @returns The token info or undefined if not found
 */
export function getTokenBySymbol(chainId: number, symbol: string): TokenInfo | undefined {
  const chainTokens = MULTI_CHAIN_TOKENS[chainId];
  if (!chainTokens) return undefined;

  return chainTokens[symbol];
}

/**
 * Find the equivalent token on another chain
 * @param fromChainId The source chain ID
 * @param toChainId The target chain ID
 * @param tokenSymbol The token symbol to find
 * @returns The equivalent token on the target chain or undefined if not found
 */
export function findEquivalentToken(fromChainId: number, toChainId: number, tokenSymbol: string): TokenInfo | undefined {
  const sourceTokens = MULTI_CHAIN_TOKENS[fromChainId];
  const targetTokens = MULTI_CHAIN_TOKENS[toChainId];

  if (!sourceTokens || !targetTokens) return undefined;

  const sourceToken = sourceTokens[tokenSymbol];
  if (!sourceToken) return undefined;

  // First try exact symbol match
  if (targetTokens[tokenSymbol]) {
    return targetTokens[tokenSymbol];
  }

  // For native tokens, find the native token on the target chain
  if (sourceToken.address === 'native') {
    for (const token of Object.values(targetTokens)) {
      if (token.address === 'native') {
        return token;
      }
    }
  }

  // For stablecoins, find any stablecoin
  if (sourceToken.category === TokenCategory.Stablecoin) {
    for (const [symbol, token] of Object.entries(targetTokens)) {
      if (token.category === TokenCategory.Stablecoin) {
        // Prefer USDC if available
        if (symbol === 'USDC') return token;
      }
    }

    // Return any stablecoin if USDC not found
    for (const token of Object.values(targetTokens)) {
      if (token.category === TokenCategory.Stablecoin) {
        return token;
      }
    }
  }

  return undefined;
}

/**
 * Gets all tokens for a specific chain
 * @param chainId The blockchain's chain ID
 * @returns Record of tokens for the specified chain, or empty record if chain not supported
 */
export function getTokensForChain(chainId: number): Record<string, TokenInfo> {
  return MULTI_CHAIN_TOKENS[chainId] || {};
}

/**
 * Gets a specific token on a specific chain
 * @param chainId The blockchain's chain ID
 * @param symbol The token symbol to look up
 * @returns TokenInfo or undefined if not found
 */
export function getTokenOnChain(chainId: number, symbol: string): TokenInfo | undefined {
  const chainTokens = MULTI_CHAIN_TOKENS[chainId];
  if (!chainTokens) return undefined;
  return chainTokens[symbol];
}

/**
 * Gets the native token for a specific chain
 * @param chainId The blockchain's chain ID
 * @returns The native token info or undefined if chain not supported
 */
export function getNativeToken(chainId: number): TokenInfo | undefined {
  const chainTokens = MULTI_CHAIN_TOKENS[chainId];
  if (!chainTokens) return undefined;

  return Object.values(chainTokens).find(
    token => token.address === 'native'
  );
}

/**
 * Gets the wrapped version of the native token for a specific chain
 * @param chainId The blockchain's chain ID
 * @returns The wrapped native token info or undefined if not found
 */
export function getWrappedNativeToken(chainId: number): TokenInfo | undefined {
  const chainTokens = MULTI_CHAIN_TOKENS[chainId];
  if (!chainTokens) return undefined;

  const nativeToken = getNativeToken(chainId);
  if (!nativeToken) return undefined;

  // Most wrapped native tokens follow the pattern of prefixing with 'W'
  const wrappedSymbol = `W${nativeToken.symbol}`;
  return chainTokens[wrappedSymbol];
}

/**
 * Check if a token exists on a specific chain
 * @param chainId The blockchain's chain ID
 * @param symbol The token symbol to look up
 * @returns boolean indicating if the token exists on the chain
 */
export function tokenExistsOnChain(chainId: number, symbol: string): boolean {
  const chainTokens = MULTI_CHAIN_TOKENS[chainId];
  if (!chainTokens) return false;
  return !!chainTokens[symbol];
}
