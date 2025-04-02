import { toast } from 'sonner';

const CMC_API_KEY = '05ac970b-e813-4fe8-80c2-0e563da773f2';
const CMC_API_URL = 'https://pro-api.coinmarketcap.com/v1';

export interface TokenInfo {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmcRank: number;
  marketPairCount: number;
  circulatingSupply: number;
  selfReportedCirculatingSupply: number;
  totalSupply: number;
  maxSupply: number;
  ath: number;
  atl: number;
  high24h: number;
  low24h: number;
  isActive: number;
  lastUpdated: string;
  dateAdded: string;
  quotes: {
    [key: string]: {
      price: number;
      volume24h: number;
      volume7d: number;
      volume30d: number;
      marketCap: number;
      selfReportedMarketCap: number;
      percentChange1h: number;
      percentChange24h: number;
      percentChange7d: number;
      percentChange30d: number;
      percentChange60d: number;
      percentChange90d: number;
      fullyDilluttedMarketCap: number;
      marketCapByTotalSupply: number;
      dominance: number;
      turnover: number;
      ytdPriceChangePercentage: number;
      percentChange1y: number;
    };
  };
  isAudited: boolean;
  logo?: string;
  address?: string;
  contractAddresses?: {
    [chainId: string]: string;
  };
}

export interface CMCResponse {
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
    elapsed: number;
    credit_count: number;
    notice: string | null;
  };
  data: {
    [symbol: string]: TokenInfo;
  };
}

// Addresses for Ethereum chain
const CONTRACT_ADDRESSES: Record<string, string> = {
  ETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH - Used for native ETH
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  UNI: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  LINK: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
  AAVE: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
  MKR: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
};

// Cache mechanism to avoid repeated API calls
const tokenInfoCache: { [symbol: string]: TokenInfo } = {};
const allTokensCache: TokenInfo[] | null = null;
let lastFetchTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch token information from CoinMarketCap API
 */
export const fetchTokenInfo = async (symbol: string): Promise<TokenInfo | null> => {
  try {
    // Check if we have a cached version
    if (tokenInfoCache[symbol] && Date.now() - lastFetchTimestamp < CACHE_DURATION) {
      return tokenInfoCache[symbol];
    }

    const response = await fetch(`${CMC_API_URL}/cryptocurrency/quotes/latest?symbol=${symbol}`, {
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CoinMarketCap API responded with status: ${response.status}`);
    }

    const data: CMCResponse = await response.json();

    if (data.status.error_code !== 0) {
      throw new Error(data.status.error_message || 'Unknown error from CoinMarketCap API');
    }

    const tokenInfo = data.data[symbol];

    if (!tokenInfo) {
      throw new Error(`Token ${symbol} not found in CoinMarketCap API response`);
    }

    // Add contract address if available
    if (CONTRACT_ADDRESSES[symbol]) {
      tokenInfo.address = CONTRACT_ADDRESSES[symbol];
      tokenInfo.contractAddresses = {
        '1': CONTRACT_ADDRESSES[symbol], // Ethereum mainnet
      };
    }

    // Add logo URL
    tokenInfo.logo = `https://s2.coinmarketcap.com/static/img/coins/64x64/${tokenInfo.id}.png`;

    // Cache the result
    tokenInfoCache[symbol] = tokenInfo;
    lastFetchTimestamp = Date.now();

    return tokenInfo;
  } catch (error) {
    console.error('Error fetching token info from CoinMarketCap:', error);
    toast.error(`Failed to fetch token data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
};

/**
 * Fetch multiple tokens at once
 */
export const fetchMultipleTokens = async (symbols: string[]): Promise<Record<string, TokenInfo>> => {
  try {
    const symbolsStr = symbols.join(',');

    const response = await fetch(`${CMC_API_URL}/cryptocurrency/quotes/latest?symbol=${symbolsStr}`, {
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CoinMarketCap API responded with status: ${response.status}`);
    }

    const data: CMCResponse = await response.json();

    if (data.status.error_code !== 0) {
      throw new Error(data.status.error_message || 'Unknown error from CoinMarketCap API');
    }

    // Add contract addresses and logos
    Object.keys(data.data).forEach(symbol => {
      if (CONTRACT_ADDRESSES[symbol]) {
        data.data[symbol].address = CONTRACT_ADDRESSES[symbol];
        data.data[symbol].contractAddresses = {
          '1': CONTRACT_ADDRESSES[symbol], // Ethereum mainnet
        };
      }

      // Add logo URL
      data.data[symbol].logo = `https://s2.coinmarketcap.com/static/img/coins/64x64/${data.data[symbol].id}.png`;

      // Cache individual tokens
      tokenInfoCache[symbol] = data.data[symbol];
    });

    lastFetchTimestamp = Date.now();

    return data.data;
  } catch (error) {
    console.error('Error fetching multiple tokens from CoinMarketCap:', error);
    toast.error(`Failed to fetch token data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {};
  }
};

/**
 * Fetch top tokens by market cap
 */
export const fetchTopTokens = async (limit: number = 20): Promise<TokenInfo[]> => {
  try {
    // Check if we have a cached version
    if (allTokensCache && Date.now() - lastFetchTimestamp < CACHE_DURATION) {
      return allTokensCache.slice(0, limit);
    }

    const response = await fetch(`${CMC_API_URL}/cryptocurrency/listings/latest?limit=${limit}`, {
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CoinMarketCap API responded with status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status.error_code !== 0) {
      throw new Error(data.status.error_message || 'Unknown error from CoinMarketCap API');
    }

    // Format and enhance the response
    const tokens = data.data.map((token: TokenInfo) => {
      // Add contract address if available
      if (CONTRACT_ADDRESSES[token.symbol]) {
        token.address = CONTRACT_ADDRESSES[token.symbol];
        token.contractAddresses = {
          '1': CONTRACT_ADDRESSES[token.symbol], // Ethereum mainnet
        };
      }

      // Add logo URL
      token.logo = `https://s2.coinmarketcap.com/static/img/coins/64x64/${token.id}.png`;

      // Cache individual tokens
      tokenInfoCache[token.symbol] = token;

      return token;
    });

    lastFetchTimestamp = Date.now();

    return tokens;
  } catch (error) {
    console.error('Error fetching top tokens from CoinMarketCap:', error);
    toast.error(`Failed to fetch top tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
};

/**
 * Get logo URL for a token
 */
export const getTokenLogo = (symbol: string, id?: number): string => {
  if (tokenInfoCache[symbol]?.logo) {
    return tokenInfoCache[symbol].logo as string;
  }

  if (id) {
    return `https://s2.coinmarketcap.com/static/img/coins/64x64/${id}.png`;
  }

  // Default placeholder
  return `https://via.placeholder.com/64/111111/FFFFFF/?text=${symbol}`;
};

/**
 * Get common tokens for the Ethereum chain
 */
export const getCommonEthereumTokens = (): { symbol: string, name: string, address: string }[] => {
  return [
    { symbol: 'ETH', name: 'Ethereum', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' }, // Using WETH address for ETH
    { symbol: 'WETH', name: 'Wrapped Ethereum', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
    { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
    { symbol: 'USDT', name: 'Tether', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
    { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' },
    { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984' },
    { symbol: 'LINK', name: 'Chainlink', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA' },
    { symbol: 'AAVE', name: 'Aave', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9' },
    { symbol: 'MKR', name: 'Maker', address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2' },
  ];
};
