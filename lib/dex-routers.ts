import { NETWORKS } from './ethereum';
import { getWrappedNativeToken } from './multi-chain-tokens';

// DEX Router interface
export interface DexRouterInfo {
  name: string;
  routerAddress: string;
  factoryAddress: string;
  wrappedNativeToken: string;
  quoterAddress?: string; // For V3 DEXes
  swapFee: number; // In percentage, e.g., 0.3 means 0.3%
  initCodeHash?: string; // For some DEXes to compute pair addresses
  useNativeETH?: boolean; // Whether the DEX expects native ETH for swaps rather than WETH
  version: 'v2' | 'v3';
}

// Type for DEX router configuration
export type DexRouterConfig = Record<number, DexRouterInfo[]>;

/**
 * DEX router addresses and configurations for all supported chains
 * Primary DEX is listed first for each chain
 */
export const DEX_ROUTERS: DexRouterConfig = {
  // Ethereum - Chain ID: 1
  1: [
    {
      name: 'Uniswap V2',
      routerAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      factoryAddress: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      wrappedNativeToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      swapFee: 0.3,
      initCodeHash: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f',
      version: 'v2'
    },
    {
      name: 'Uniswap V3',
      routerAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      wrappedNativeToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      quoterAddress: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
      swapFee: 0.3,
      version: 'v3'
    },
    {
      name: 'SushiSwap',
      routerAddress: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
      factoryAddress: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
      wrappedNativeToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      swapFee: 0.3,
      initCodeHash: '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303',
      version: 'v2'
    }
  ],

  // Polygon - Chain ID: 137
  137: [
    {
      name: 'QuickSwap',
      routerAddress: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
      factoryAddress: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
      wrappedNativeToken: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
      swapFee: 0.3,
      initCodeHash: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f',
      version: 'v2'
    },
    {
      name: 'SushiSwap Polygon',
      routerAddress: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
      factoryAddress: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
      wrappedNativeToken: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
      swapFee: 0.3,
      initCodeHash: '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303',
      version: 'v2'
    }
  ],

  // Arbitrum - Chain ID: 42161
  42161: [
    {
      name: 'Camelot',
      routerAddress: '0xc873fEcbd354f5A56E00E710B90EF4201db2448d',
      factoryAddress: '0x6EcCab422D763aC031210895C81787E87B43A652',
      wrappedNativeToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH on Arbitrum
      swapFee: 0.3,
      initCodeHash: '0x9f10162d0b5b7b8e0723a3c111153cd88a51036a3a25172df78d539fb0d8c48e',
      version: 'v2'
    },
    {
      name: 'SushiSwap Arbitrum',
      routerAddress: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
      factoryAddress: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
      wrappedNativeToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH on Arbitrum
      swapFee: 0.3,
      initCodeHash: '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303',
      version: 'v2'
    }
  ],

  // Optimism - Chain ID: 10
  10: [
    {
      name: 'Velodrome',
      routerAddress: '0xa132DAB612dB5cB9fC9Ac426A0Cc215A3423F9c9',
      factoryAddress: '0x25CbdDb98b35ab1FF77413456B31EC81A6B6B746',
      wrappedNativeToken: '0x4200000000000000000000000000000000000006', // WETH on Optimism
      swapFee: 0.3,
      version: 'v2'
    },
    {
      name: 'SushiSwap Optimism',
      routerAddress: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
      factoryAddress: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
      wrappedNativeToken: '0x4200000000000000000000000000000000000006', // WETH on Optimism
      swapFee: 0.3,
      initCodeHash: '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303',
      version: 'v2'
    }
  ],

  // Base - Chain ID: 8453
  8453: [
    {
      name: 'BaseSwap',
      routerAddress: '0x327Df1E6de05895d2ab08513aaDD9313Fe505d86',
      factoryAddress: '0xFDa619b6d20975be80A10332cD39b9a4b0FAa8BB',
      wrappedNativeToken: '0x4200000000000000000000000000000000000006', // WETH on Base
      swapFee: 0.3,
      version: 'v2'
    },
    {
      name: 'Aerodrome',
      routerAddress: '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43',
      factoryAddress: '0x420DD381b31aEf6683db6B902084cB0FFECe40Da',
      wrappedNativeToken: '0x4200000000000000000000000000000000000006', // WETH on Base
      swapFee: 0.25,
      version: 'v2'
    }
  ],

  // BNB Chain - Chain ID: 56
  56: [
    {
      name: 'PancakeSwap',
      routerAddress: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
      factoryAddress: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
      wrappedNativeToken: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
      swapFee: 0.25,
      initCodeHash: '0x00fb7f630766e6a796048ea87d01acd3068e8ff67d078148a3fa3f4a84f69bd5',
      version: 'v2'
    }
  ],

  // Avalanche C-Chain - Chain ID: 43114
  43114: [
    {
      name: 'Trader Joe',
      routerAddress: '0x60aE616a2155Ee3d9A68541Ba4544862310933d4',
      factoryAddress: '0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10',
      wrappedNativeToken: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', // WAVAX
      swapFee: 0.3,
      initCodeHash: '0x0bbca9af0511ad1a1da383135cf3a8d2ac620e549ef9f6ae3a4c33c2fed0af91',
      version: 'v2'
    },
    {
      name: 'Pangolin',
      routerAddress: '0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106',
      factoryAddress: '0xefa94DE7a4656D787667C749f7E1223D71E9FD88',
      wrappedNativeToken: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', // WAVAX
      swapFee: 0.3,
      version: 'v2'
    }
  ],

  // Fantom - Chain ID: 250
  250: [
    {
      name: 'SpookySwap',
      routerAddress: '0xF491e7B69E4244ad4002BC14e878a34207E38c29',
      factoryAddress: '0x152eE697f2E276fA89E96742e9bB9aB1F2E61bE3',
      wrappedNativeToken: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83', // WFTM
      swapFee: 0.2,
      version: 'v2'
    },
    {
      name: 'SpiritSwap',
      routerAddress: '0x16327E3FbDaCA3bcF7E38F5Af2599D2DDc33aE52',
      factoryAddress: '0xEF45d134b73241eDa7703fa787148D9C9F4950b0',
      wrappedNativeToken: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83', // WFTM
      swapFee: 0.3,
      version: 'v2'
    }
  ],

  // Linea - Chain ID: 59144
  59144: [
    {
      name: 'HorizonDEX',
      routerAddress: '0xd3EeC8D1D38a38B149d9668303d75aBec0f2d5C0',
      factoryAddress: '0xA4D436b525ee7bc57A7FdEF9810635e41D8e88D2',
      wrappedNativeToken: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f', // WETH on Linea
      swapFee: 0.3,
      version: 'v2'
    },
    {
      name: 'LineaSwap',
      routerAddress: '0x3228d205A96409a07A44D9950A5dC00ba3F80437',
      factoryAddress: '0xB91a15260BD8e94111396958CA5E66B4350F062F',
      wrappedNativeToken: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f', // WETH on Linea
      swapFee: 0.25,
      version: 'v2'
    }
  ],

  // Polygon zkEVM - Chain ID: 1101
  1101: [
    {
      name: 'Quickswap',
      routerAddress: '0xaFb64D3Ea771925Aff2A4D8A550483Cb418A61b3',
      factoryAddress: '0x4B9f4d2435Ef65559567e5DbFC1BbB37abC43B57',
      wrappedNativeToken: '0x4F9A0e7FD2Bf6067db6994CF12E4495Df938E6e9', // WETH on zkEVM
      swapFee: 0.3,
      version: 'v2'
    },
    {
      name: 'Pancake zkEVM',
      routerAddress: '0xDCf4EE5B700e2a5Fec458e06B763A4018E996396',
      factoryAddress: '0x1BB72E0CbbEA93c08f535FC7856E0338D7F7a8aB',
      wrappedNativeToken: '0x4F9A0e7FD2Bf6067db6994CF12E4495Df938E6e9', // WETH on zkEVM
      swapFee: 0.25,
      version: 'v2'
    }
  ]
};

/**
 * Get all DEX routers for a specific chain
 * @param chainId The blockchain's chain ID
 * @returns Array of DEX router info objects for the chain, or empty array if chain not supported
 */
export function getDexRoutersForChain(chainId: number): DexRouterInfo[] {
  return DEX_ROUTERS[chainId] || [];
}

/**
 * Get the default (primary) DEX router for a specific chain
 * @param chainId The blockchain's chain ID
 * @returns The primary DEX router info for the chain, or undefined if chain not supported
 */
export function getDefaultDexRouter(chainId: number): DexRouterInfo | undefined {
  const routers = getDexRoutersForChain(chainId);
  return routers.length > 0 ? routers[0] : undefined;
}

/**
 * Get a specific DEX router by name for a chain
 * @param chainId The blockchain's chain ID
 * @param routerName The name of the DEX router to get
 * @returns The requested DEX router info, or undefined if not found
 */
export function getDexRouterByName(chainId: number, routerName: string): DexRouterInfo | undefined {
  const routers = getDexRoutersForChain(chainId);
  return routers.find(router => router.name === routerName);
}

/**
 * Get the wrapped native token address for a specific chain
 * This is a convenience function that uses both the DEX router and token data
 * @param chainId The blockchain's chain ID
 * @returns The wrapped native token address, or undefined if not found
 */
export function getWrappedNativeTokenAddress(chainId: number): string | undefined {
  // First try to get from the default DEX router
  const defaultRouter = getDefaultDexRouter(chainId);
  if (defaultRouter?.wrappedNativeToken) {
    return defaultRouter.wrappedNativeToken;
  }

  // Fallback to looking it up in the token list
  const wrappedToken = getWrappedNativeToken(chainId);
  return wrappedToken?.address;
}

/**
 * Get available DEX versions for a specific chain
 * @param chainId The blockchain's chain ID
 * @returns Array of available DEX versions ('v2' and/or 'v3')
 */
export function getAvailableDexVersions(chainId: number): ('v2' | 'v3')[] {
  const routers = getDexRoutersForChain(chainId);
  const versions = new Set<'v2' | 'v3'>();

  for (const router of routers) {
    versions.add(router.version);
  }

  return Array.from(versions);
}

/**
 * Get DEX routers supporting a specific version for a chain
 * @param chainId The blockchain's chain ID
 * @param version The DEX version to filter by ('v2' or 'v3')
 * @returns Array of DEX router info objects matching the version
 */
export function getDexRoutersByVersion(chainId: number, version: 'v2' | 'v3'): DexRouterInfo[] {
  const routers = getDexRoutersForChain(chainId);
  return routers.filter(router => router.version === version);
}
