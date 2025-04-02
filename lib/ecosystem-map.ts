"use client";

import { NetworkInfo } from './ethereum';

// Protocol categories
export enum ProtocolCategory {
  DeFi = 'defi',
  NFT = 'nft',
  Gaming = 'gaming',
  Social = 'social',
  Infrastructure = 'infrastructure',
  Bridge = 'bridge',
  Oracle = 'oracle',
  DAO = 'dao',
  Derivatives = 'derivatives',
  Lending = 'lending',
  DEX = 'dex',
  Yield = 'yield',
  Payment = 'payment',
  Analytics = 'analytics',
  Other = 'other'
}

// Protocol type
export interface Protocol {
  id: string;
  name: string;
  description: string;
  category: ProtocolCategory;
  url: string;
  logoUrl: string;
  tvlUSD?: number; // Total Value Locked in USD
  chainIds: number[]; // Which chains this protocol is deployed on
  tokenSymbol?: string;
  tokenAddress?: string;
  twitter?: string;
  discord?: string;
  github?: string;
  audited?: boolean;
  auditUrls?: string[];
  launchDate?: string; // ISO date string
}

// Chain ecosystem summary
export interface ChainEcosystem {
  chainId: number;
  totalProtocols: number;
  protocolsByCategory: Record<ProtocolCategory, number>;
  topProtocols: Protocol[];
  totalTVL: number;
  recentlyAdded: Protocol[];
  uniqueProtocols: Protocol[]; // Protocols only on this chain
}

// Define known protocols with their metadata
export const PROTOCOLS: Protocol[] = [
  // Ethereum DeFi
  {
    id: 'uniswap',
    name: 'Uniswap',
    description: 'Decentralized token exchange protocol with automated market makers',
    category: ProtocolCategory.DEX,
    url: 'https://uniswap.org',
    logoUrl: 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
    tvlUSD: 5780000000,
    chainIds: [1, 137, 42161, 10, 8453],
    tokenSymbol: 'UNI',
    twitter: 'Uniswap',
    github: 'Uniswap',
    audited: true,
    auditUrls: ['https://github.com/Uniswap/v3-core/tree/main/audits'],
    launchDate: '2018-11-02'
  },
  {
    id: 'aave',
    name: 'Aave',
    description: 'Decentralized lending and borrowing protocol',
    category: ProtocolCategory.Lending,
    url: 'https://aave.com',
    logoUrl: 'https://cryptologos.cc/logos/aave-aave-logo.png',
    tvlUSD: 3900000000,
    chainIds: [1, 137, 42161, 10, 8453],
    tokenSymbol: 'AAVE',
    twitter: 'AaveAave',
    github: 'aave',
    audited: true,
    auditUrls: ['https://github.com/aave/protocol-v3/tree/master/audits'],
    launchDate: '2020-01-08'
  },
  {
    id: 'makerdao',
    name: 'MakerDAO',
    description: 'Decentralized stablecoin protocol for DAI',
    category: ProtocolCategory.DeFi,
    url: 'https://makerdao.com',
    logoUrl: 'https://cryptologos.cc/logos/maker-mkr-logo.png',
    tvlUSD: 9500000000,
    chainIds: [1],
    tokenSymbol: 'MKR',
    twitter: 'MakerDAO',
    github: 'makerdao',
    audited: true,
    launchDate: '2017-12-18'
  },
  // Multi-chain
  {
    id: 'chainlink',
    name: 'Chainlink',
    description: 'Decentralized oracle network providing reliable data feeds',
    category: ProtocolCategory.Oracle,
    url: 'https://chain.link',
    logoUrl: 'https://cryptologos.cc/logos/chainlink-link-logo.png',
    chainIds: [1, 137, 42161, 10, 8453],
    tokenSymbol: 'LINK',
    twitter: 'chainlink',
    github: 'smartcontractkit',
    audited: true,
    launchDate: '2017-09-19'
  },
  // Layer 2 specific
  {
    id: 'hop-protocol',
    name: 'Hop Protocol',
    description: 'A scalable rollup-to-rollup general token bridge',
    category: ProtocolCategory.Bridge,
    url: 'https://hop.exchange',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/12333.png',
    tvlUSD: 45000000,
    chainIds: [1, 137, 42161, 10, 8453],
    tokenSymbol: 'HOP',
    twitter: 'HopProtocol',
    github: 'hop-protocol',
    audited: true,
    launchDate: '2021-05-11'
  },
  {
    id: 'synapse',
    name: 'Synapse Protocol',
    description: 'Cross-chain layer for bridging assets between blockchains',
    category: ProtocolCategory.Bridge,
    url: 'https://synapseprotocol.com',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/12147.png',
    tvlUSD: 72000000,
    chainIds: [1, 137, 42161, 10],
    tokenSymbol: 'SYN',
    twitter: 'SynapseProtocol',
    github: 'synapsecns',
    audited: true,
    launchDate: '2021-08-29'
  },
  // Arbitrum specific
  {
    id: 'arbitrum-gmx',
    name: 'GMX',
    description: 'Decentralized perpetual exchange with low swap fees',
    category: ProtocolCategory.Derivatives,
    url: 'https://gmx.io',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11857.png',
    tvlUSD: 450000000,
    chainIds: [42161],
    tokenSymbol: 'GMX',
    twitter: 'GMX_IO',
    github: 'gmx-io',
    audited: true,
    launchDate: '2021-08-31'
  },
  // Optimism specific
  {
    id: 'optimism-velodrome',
    name: 'Velodrome',
    description: 'Optimism native liquidity and trading platform',
    category: ProtocolCategory.DEX,
    url: 'https://velodrome.finance',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/20462.png',
    tvlUSD: 185000000,
    chainIds: [10],
    tokenSymbol: 'VELO',
    twitter: 'VelodromeFi',
    github: 'velodrome-finance',
    audited: true,
    launchDate: '2022-06-01'
  },
  // Base specific
  {
    id: 'base-aerodrome',
    name: 'Aerodrome',
    description: 'Base native liquidity and trading platform',
    category: ProtocolCategory.DEX,
    url: 'https://aerodrome.finance',
    logoUrl: 'https://cdn.icon-icons.com/icons2/2389/PNG/512/aerodrome_logo_icon_144881.png',
    tvlUSD: 165000000,
    chainIds: [8453],
    tokenSymbol: 'AERO',
    twitter: 'AerodromeBase',
    github: 'aerodrome-finance',
    audited: true,
    launchDate: '2023-08-28'
  },
  // Polygon specific
  {
    id: 'polygon-quickswap',
    name: 'QuickSwap',
    description: 'Native DEX for the Polygon chain with low fees',
    category: ProtocolCategory.DEX,
    url: 'https://quickswap.exchange',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/8206.png',
    tvlUSD: 125000000,
    chainIds: [137],
    tokenSymbol: 'QUICK',
    twitter: 'QuickswapDEX',
    github: 'QuickSwap',
    audited: true,
    launchDate: '2020-10-06'
  },
  // NFT platforms
  {
    id: 'opensea',
    name: 'OpenSea',
    description: 'Largest NFT marketplace with millions of items',
    category: ProtocolCategory.NFT,
    url: 'https://opensea.io',
    logoUrl: 'https://storage.googleapis.com/opensea-static/Logomark/OpenSea-Full-Logo%20(dark).png',
    chainIds: [1, 137, 42161, 10, 8453],
    twitter: 'opensea',
    github: 'ProjectOpenSea',
    audited: true,
    launchDate: '2017-12-20'
  },
  // Gaming
  {
    id: 'axie-infinity',
    name: 'Axie Infinity',
    description: 'Blockchain game with collectible and battling creatures',
    category: ProtocolCategory.Gaming,
    url: 'https://axieinfinity.com',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/6783.png',
    tvlUSD: 50000000,
    chainIds: [1, 2020],
    tokenSymbol: 'AXS',
    twitter: 'AxieInfinity',
    github: 'axieinfinity',
    audited: true,
    launchDate: '2018-03-21'
  },
  // Add more protocols here
];

// Get all protocols on a specific chain
export const getProtocolsOnChain = (chainId: number): Protocol[] => {
  return PROTOCOLS.filter(protocol => protocol.chainIds.includes(chainId));
};

// Get ecosystem summary for a specific chain
export const getChainEcosystem = (chainId: number): ChainEcosystem => {
  const protocolsOnChain = getProtocolsOnChain(chainId);

  // Count protocols by category
  const protocolsByCategory: Record<ProtocolCategory, number> = Object.values(ProtocolCategory).reduce(
    (acc, category) => ({ ...acc, [category]: 0 }),
    {} as Record<ProtocolCategory, number>
  );

  protocolsOnChain.forEach(protocol => {
    protocolsByCategory[protocol.category]++;
  });

  // Calculate total TVL
  const totalTVL = protocolsOnChain.reduce((sum, protocol) => sum + (protocol.tvlUSD || 0), 0);

  // Get top protocols by TVL
  const topProtocols = [...protocolsOnChain]
    .sort((a, b) => (b.tvlUSD || 0) - (a.tvlUSD || 0))
    .slice(0, 5);

  // Get recently added protocols (based on launch date)
  const recentlyAdded = [...protocolsOnChain]
    .filter(p => p.launchDate)
    .sort((a, b) => new Date(b.launchDate || '').getTime() - new Date(a.launchDate || '').getTime())
    .slice(0, 3);

  // Get protocols unique to this chain
  const uniqueProtocols = protocolsOnChain.filter(
    protocol => protocol.chainIds.length === 1 && protocol.chainIds[0] === chainId
  );

  return {
    chainId,
    totalProtocols: protocolsOnChain.length,
    protocolsByCategory,
    topProtocols,
    totalTVL,
    recentlyAdded,
    uniqueProtocols
  };
};

// Search for protocols by name, category, or description
export const searchProtocols = (query: string): Protocol[] => {
  const lowerQuery = query.toLowerCase();
  return PROTOCOLS.filter(protocol =>
    protocol.name.toLowerCase().includes(lowerQuery) ||
    protocol.description.toLowerCase().includes(lowerQuery) ||
    protocol.category.toLowerCase().includes(lowerQuery) ||
    protocol.tokenSymbol?.toLowerCase().includes(lowerQuery)
  );
};

// Compare ecosystem metrics between chains
export const compareChainEcosystems = (chainIds: number[]): Record<number, ChainEcosystem> => {
  const result: Record<number, ChainEcosystem> = {};

  chainIds.forEach(chainId => {
    result[chainId] = getChainEcosystem(chainId);
  });

  return result;
};

// Get category distribution across all chains
export const getCategoryDistribution = (): Record<ProtocolCategory, number> => {
  const distribution: Record<ProtocolCategory, number> = Object.values(ProtocolCategory).reduce(
    (acc, category) => ({ ...acc, [category]: 0 }),
    {} as Record<ProtocolCategory, number>
  );

  PROTOCOLS.forEach(protocol => {
    distribution[protocol.category]++;
  });

  return distribution;
};

// Get the ecosystem richness score (higher means more diverse ecosystem)
export const getEcosystemRichnessScore = (chainId: number): number => {
  const ecosystem = getChainEcosystem(chainId);
  const categories = Object.entries(ecosystem.protocolsByCategory);

  // More categories with protocols = more diverse
  const categoriesWithProtocols = categories.filter(([_, count]) => count > 0).length;

  // Calculate evenness of distribution (similar to Shannon diversity index)
  const totalProtocols = ecosystem.totalProtocols;
  let evenness = 0;

  if (totalProtocols > 0) {
    categories.forEach(([_, count]) => {
      if (count > 0) {
        const proportion = count / totalProtocols;
        evenness -= proportion * Math.log(proportion);
      }
    });
    // Normalize between 0 and 1
    evenness = evenness / Math.log(categories.length);
  }

  // Combine factors (unique protocols, total TVL, diversity)
  const uniqueProtocolsFactor = Math.min(10, ecosystem.uniqueProtocols.length);
  const tvlFactor = Math.min(30, Math.log10(ecosystem.totalTVL + 1) * 10);
  const diversityFactor = Math.round(evenness * 30);
  const categoryFactor = Math.min(30, categoriesWithProtocols * 5);

  return uniqueProtocolsFactor + tvlFactor + diversityFactor + categoryFactor;
};
