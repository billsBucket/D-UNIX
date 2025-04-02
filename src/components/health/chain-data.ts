export interface ChainStatus {
  id: string;
  name: string;
  status: 'OPERATIONAL' | 'CONGESTED' | 'DEGRADED' | 'OUTAGE';
  color: string;
  image: string;
  gas: number;
  block: string;
  tps: number;
  time: string;
}

// Chain configuration with base metrics and visual properties
export const CHAIN_CONFIGS = [
  {
    id: 'ethereum',
    name: 'ETHEREUM',
    color: '#627eea',
    image: 'https://ext.same-assets.com/1159289182/6203952.png',
    baseGas: [30, 50],
    baseTps: [12, 15],
    baseTime: [9, 12],
    baseBlock: 19000000
  },
  {
    id: 'polygon',
    name: 'POLYGON',
    color: '#8247e5',
    image: 'https://ext.same-assets.com/1159289182/3462688511.png',
    baseGas: [40, 90],
    baseTps: [35, 60],
    baseTime: [1.5, 2.5],
    baseBlock: 51000000
  },
  {
    id: 'bnbchain',
    name: 'BNB CHAIN',
    color: '#f0b90b',
    image: 'https://ext.same-assets.com/1159289182/3000630900.png',
    baseGas: [5, 12],
    baseTps: [55, 65],
    baseTime: [1.5, 2.5],
    baseBlock: 36000000
  },
  {
    id: 'arbitrum',
    name: 'ARBITRUM',
    color: '#28a0f0',
    image: 'https://ext.same-assets.com/1159289182/3772565966.png',
    baseGas: [8, 20],
    baseTps: [25, 35],
    baseTime: [1.5, 2.5],
    baseBlock: 10000000
  },
  {
    id: 'optimism',
    name: 'OPTIMISM',
    color: '#ff0420',
    image: 'https://ext.same-assets.com/1159289182/3498909149.png',
    baseGas: [20, 30],
    baseTps: [30, 35],
    baseTime: [1.8, 2.5],
    baseBlock: 10000000
  },
  {
    id: 'solana',
    name: 'SOLANA',
    color: '#9945ff',
    image: 'https://ext.same-assets.com/1159289182/2743983505.png',
    baseGas: [10, 30],
    baseTps: [25, 35],
    baseTime: [1.2, 2],
    baseBlock: 10000000
  },
  {
    id: 'avalanche',
    name: 'AVALANCHE',
    color: '#e84142',
    image: 'https://ext.same-assets.com/1159289182/1158837840.png',
    baseGas: [20, 30],
    baseTps: [22, 35],
    baseTime: [1.4, 2.5],
    baseBlock: 10000000
  },
  {
    id: 'base',
    name: 'BASE',
    color: '#0052ff',
    image: 'https://ext.same-assets.com/1159289182/2544662829.png',
    baseGas: [15, 25],
    baseTps: [25, 40],
    baseTime: [1.8, 2.5],
    baseBlock: 10000000
  },
  {
    id: 'fantom',
    name: 'FANTOM',
    color: '#1969ff',
    image: 'https://ext.same-assets.com/1159289182/2620008673.png',
    baseGas: [15, 25],
    baseTps: [30, 40],
    baseTime: [2, 2.5],
    baseBlock: 10000000
  },
  {
    id: 'kadena',
    name: 'KADENA',
    color: '#9553e9',
    image: 'https://ext.same-assets.com/1159289182/2069678299.png',
    baseGas: [10, 25],
    baseTps: [30, 40],
    baseTime: [1.8, 2.5],
    baseBlock: 10000000
  }
];

// Generate a random number within a range
const randomInRange = (min: number, max: number): number => {
  return min + Math.random() * (max - min);
};

// Generate a random block number for a chain
const generateBlockNumber = (baseBlock: number): string => {
  const random = Math.floor(Math.random() * 10000);
  return `#${baseBlock + random}`;
};

// Determine chain status based on metrics
const determineChainStatus = (
  gasValue: number,
  tpsValue: number,
  timeValue: number,
  config: typeof CHAIN_CONFIGS[0]
): 'OPERATIONAL' | 'CONGESTED' | 'DEGRADED' | 'OUTAGE' => {
  // If time is very high, it's an outage
  if (timeValue > config.baseTime[1] * 3) return 'OUTAGE';

  // If gas is very high and tps is low, it's congested
  if (gasValue > config.baseGas[1] * 1.5 && tpsValue < config.baseTps[0] * 0.8) return 'CONGESTED';

  // If time is high but not an outage, it's degraded
  if (timeValue > config.baseTime[1] * 1.5) return 'DEGRADED';

  // Otherwise operational
  return 'OPERATIONAL';
};

// Create sets of problem chains for realistic scenarios
export const createProblemChains = () => {
  // Randomly determine which chains will have issues
  const totalChains = CHAIN_CONFIGS.length;
  const problemCount = Math.floor(Math.random() * 4) + 2; // 2-5 chains with issues

  // Pick random chains to have issues
  const problemIndices = new Set<number>();
  while (problemIndices.size < problemCount) {
    problemIndices.add(Math.floor(Math.random() * totalChains));
  }

  return Array.from(problemIndices).map(index => CHAIN_CONFIGS[index].id);
};

// Generate chain data with realistic status distribution
export const generateChainsData = (problemChainIds: string[] = []): ChainStatus[] => {
  return CHAIN_CONFIGS.map(chain => {
    const isProblem = problemChainIds.includes(chain.id);

    // Generate more realistic metrics with potential issues
    let gas: number;
    let tps: number;
    let time: number;

    if (isProblem) {
      // Problem chains have higher gas, lower tps, higher block time
      gas = Math.floor(randomInRange(chain.baseGas[1], chain.baseGas[1] * 2));
      tps = parseFloat(randomInRange(chain.baseTps[0] * 0.6, chain.baseTps[0] * 0.9).toFixed(1));
      time = parseFloat(randomInRange(chain.baseTime[1], chain.baseTime[1] * 2.5).toFixed(1));
    } else {
      // Normal chains have expected values with some random variance
      gas = Math.floor(randomInRange(chain.baseGas[0], chain.baseGas[1]));
      tps = parseFloat(randomInRange(chain.baseTps[0], chain.baseTps[1]).toFixed(1));
      time = parseFloat(randomInRange(chain.baseTime[0], chain.baseTime[1]).toFixed(1));
    }

    // Determine status based on metrics
    const status = isProblem
      ? Math.random() > 0.3 ? 'CONGESTED' : 'DEGRADED'
      : determineChainStatus(gas, tps, time, chain);

    return {
      id: chain.id,
      name: chain.name,
      status,
      color: chain.color,
      image: chain.image,
      gas,
      block: generateBlockNumber(chain.baseBlock),
      tps,
      time: `${time}s`
    };
  });
};

// Calculate stats from chain data
export const calculateStats = (chainsData: ChainStatus[]) => {
  const operational = chainsData.filter(c => c.status === 'OPERATIONAL').length;
  const congested = chainsData.filter(c => c.status === 'CONGESTED').length;
  const degraded = chainsData.filter(c => c.status === 'DEGRADED').length;
  const outage = chainsData.filter(c => c.status === 'OUTAGE').length;

  // Calculate health score - weighted average
  const total = chainsData.length;
  const healthScore = Math.round(
    ((operational * 1.0) + (congested * 0.7) + (degraded * 0.3)) / total * 100
  );

  return {
    operational,
    congested,
    degraded,
    outage,
    healthScore
  };
};
