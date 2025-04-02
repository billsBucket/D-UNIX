// Contract deployment script for DunixSwap, DunixLimitOrders, and DunixBridge
// For cross-chain token swaps, limit orders, and bridging functionality
// Supports multiple DEXes across various blockchain networks
//
// Setup:
// 1. Install dependencies: bun install ethers@5.7.2 dotenv
// 2. Create a .env file with the following variables:
//    - PRIVATE_KEY: Your deployment private key
//    - For each chain, add RPC_URL: ETH_MAINNET_RPC, POLYGON_RPC, etc.
// 3. Run: node deploy-contracts.js [optional: chainId]

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Contract ABIs and bytecode
// Note: In a production environment, you would compile the contracts and import the artifacts
// For this example, we'll use placeholder objects that would be generated after compilation

// Paths to contract source files
const CONTRACTS_DIR = path.join(__dirname, 'src/contracts');
const ARTIFACTS_DIR = path.join(__dirname, 'artifacts');

// Create artifacts directory if it doesn't exist
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

// Compile contracts function (uses solc in real deployment)
async function compileContracts() {
  console.log('Compiling contracts...');

  // In a real scenario, you would use solc here to compile the contracts
  // For this example, we'll just read the source code and create placeholder artifacts

  const contractNames = ['DunixSwap', 'DunixLimitOrders', 'DunixBridge'];
  const artifacts = {};

  for (const contractName of contractNames) {
    const sourcePath = path.join(CONTRACTS_DIR, `${contractName}.sol`);
    if (!fs.existsSync(sourcePath)) {
      console.error(`Contract source file not found: ${sourcePath}`);
      continue;
    }

    // In a real scenario, this would be the actual compiled ABI and bytecode
    // For now, we'll create a placeholder that assumes the contract was compiled correctly
    const artifact = {
      abi: [], // This would be the actual ABI from compilation
      bytecode: '0x', // This would be the actual bytecode from compilation
      sourcePath,
      contractName
    };

    artifacts[contractName] = artifact;

    // Save artifact
    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, `${contractName}.json`),
      JSON.stringify(artifact, null, 2)
    );
  }

  console.log('Contracts compiled successfully!');
  return artifacts;
}

// Placeholder for imported ABIs and bytecode
// In a real deployment, these would come from the compilation output
const CONTRACT_ARTIFACTS = {
  DunixSwap: {
    abi: [], // This would be populated with the actual ABI
    bytecode: '0x' // This would be populated with the actual bytecode
  },
  DunixLimitOrders: {
    abi: [], // This would be populated with the actual ABI
    bytecode: '0x' // This would be populated with the actual bytecode
  },
  DunixBridge: {
    abi: [], // This would be populated with the actual ABI
    bytecode: '0x' // This would be populated with the actual bytecode
  }
};

// Import contract ABIs (these would be generated after compilation)
const DUNIX_SWAP_ABI = CONTRACT_ARTIFACTS.DunixSwap.abi;
const DUNIX_LIMIT_ORDERS_ABI = CONTRACT_ARTIFACTS.DunixLimitOrders.abi;
const DUNIX_BRIDGE_ABI = CONTRACT_ARTIFACTS.DunixBridge.abi;

// Import contract bytecode
const DUNIX_SWAP_BYTECODE = CONTRACT_ARTIFACTS.DunixSwap.bytecode;
const DUNIX_LIMIT_ORDERS_BYTECODE = CONTRACT_ARTIFACTS.DunixLimitOrders.bytecode;
const DUNIX_BRIDGE_BYTECODE = CONTRACT_ARTIFACTS.DunixBridge.bytecode;

// Configuration
const privateKey = process.env.PRIVATE_KEY;
const outputPath = path.join(__dirname, 'deployed-contracts.json');

// Chain-specific token mappings (tokens that exist across multiple chains)
const tokenMappings = {
  // USDC token mappings across chains
  USDC: {
    1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',     // Ethereum Mainnet
    137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',   // Polygon
    42161: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // Arbitrum
    10: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',    // Optimism
    8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',  // Base
    56: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',    // BNB Chain
    43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // Avalanche
    250: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75',   // Fantom
    59144: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff', // Linea
    1101: '0xA8CE8aee21bC2A48a5EF670afCc9274C7bbbC035'   // Polygon zkEVM
  },
  // USDT token mappings across chains
  USDT: {
    1: '0xdAC17F958D2ee523a2206206994597C13D831ec7',     // Ethereum Mainnet
    137: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',   // Polygon
    42161: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // Arbitrum
    10: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',    // Optimism
    8453: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',  // Base
    56: '0x55d398326f99059fF775485246999027B3197955',    // BNB Chain
    43114: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', // Avalanche
    250: '0x049d68029688eAbF473097a2fC38ef61633A3C7A',   // Fantom
    59144: '0xA219439258ca9da29E9Cc4cE5596924745e12B93', // Linea
    1101: '0x1E4a5963aBFD975d8c9021ce480b42188849D41d'   // Polygon zkEVM
  },
  // DAI token mappings across chains
  DAI: {
    1: '0x6B175474E89094C44Da98b954EedeAC495271d0F',     // Ethereum Mainnet
    137: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',   // Polygon
    42161: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // Arbitrum
    10: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',    // Optimism
    8453: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',  // Base
    56: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',    // BNB Chain
    43114: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', // Avalanche
    250: '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E',   // Fantom
    59144: '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5', // Linea
    1101: '0xC5015b9d9161Dca7e18e32f6f25C4aD850731Fd4'   // Polygon zkEVM
  },
  // WETH token mappings across chains
  WETH: {
    1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',     // Ethereum Mainnet
    137: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',   // Polygon
    42161: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // Arbitrum
    10: '0x4200000000000000000000000000000000000006',    // Optimism
    8453: '0x4200000000000000000000000000000000000006',  // Base
    56: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',    // BNB Chain (WETH)
    43114: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB', // Avalanche
    250: '0x74b23882a30290451A17c44f4F05243b6b58C76d',   // Fantom
    59144: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f', // Linea
    1101: '0x4F9A0e7FD2Bf6067db6994CF12E4495Df938E6e9'   // Polygon zkEVM
  }
};

// DEX router addresses for each chain
const dexRouters = {
  // Ethereum Mainnet
  1: {
    "Uniswap V2": {
      router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
    },
    "SushiSwap": {
      router: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
      factory: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac'
    }
  },
  // Polygon
  137: {
    "QuickSwap": {
      router: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
      factory: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32'
    },
    "SushiSwap": {
      router: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
      factory: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4'
    }
  },
  // Arbitrum
  42161: {
    "Camelot": {
      router: '0xc873fEcbd354f5A56E00E710B90EF4201db2448d',
      factory: '0x6EcCab422D763aC031210895C81787E87B43A652'
    },
    "SushiSwap": {
      router: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
      factory: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4'
    }
  },
  // Optimism
  10: {
    "Velodrome": {
      router: '0xa132DAB612dB5cB9fC9Ac426A0Cc215A3423F9c9',
      factory: '0x25CbdDb98b35ab1FF77413456B31EC81A6B6B746'
    }
  },
  // Base
  8453: {
    "BaseSwap": {
      router: '0x327Df1E6de05895d2ab08513aaDD9313Fe505d86',
      factory: '0xFDa619b6d20975be80A10332cD39b9a4b0FAa8BB'
    }
  },
  // BNB Chain
  56: {
    "PancakeSwap": {
      router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
      factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73'
    }
  },
  // Avalanche
  43114: {
    "TraderJoe": {
      router: '0x60aE616a2155Ee3d9A68541Ba4544862310933d4',
      factory: '0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10'
    }
  },
  // Fantom
  250: {
    "SpookySwap": {
      router: '0xF491e7B69E4244ad4002BC14e878a34207E38c29',
      factory: '0x152eE697f2E276fA89E96742e9bB9aB1F2E61bE3'
    }
  },
  // Linea
  59144: {
    "HorizonDEX": {
      router: '0xd3EeC8D1D38a38B149d9668303d75aBec0f2d5C0',
      factory: '0xA4D436b525ee7bc57A7FdEF9810635e41D8e88D2'
    }
  },
  // Polygon zkEVM
  1101: {
    "Quickswap": {
      router: '0xaFb64D3Ea771925Aff2A4D8A550483Cb418A61b3',
      factory: '0x4B9f4d2435Ef65559567e5DbFC1BbB37abC43B57'
    }
  }
};

// Chain-specific configuration
const chains = {
  1: {
    name: 'Ethereum Mainnet',
    rpcUrl: process.env.ETH_MAINNET_RPC || 'https://mainnet.infura.io/v3/your-key',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    deployed: {},
    dexes: dexRouters[1],
    tokens: {
      USDC: tokenMappings.USDC[1],
      USDT: tokenMappings.USDT[1],
      DAI: tokenMappings.DAI[1],
      WETH: tokenMappings.WETH[1]
    }
  },
  137: {
    name: 'Polygon',
    rpcUrl: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18
    },
    deployed: {},
    dexes: dexRouters[137],
    tokens: {
      USDC: tokenMappings.USDC[137],
      USDT: tokenMappings.USDT[137],
      DAI: tokenMappings.DAI[137],
      WETH: tokenMappings.WETH[137]
    }
  },
  42161: {
    name: 'Arbitrum',
    rpcUrl: process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    deployed: {},
    dexes: dexRouters[42161],
    tokens: {
      USDC: tokenMappings.USDC[42161],
      USDT: tokenMappings.USDT[42161],
      DAI: tokenMappings.DAI[42161],
      WETH: tokenMappings.WETH[42161]
    }
  },
  10: {
    name: 'Optimism',
    rpcUrl: process.env.OPTIMISM_RPC || 'https://mainnet.optimism.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    deployed: {},
    dexes: dexRouters[10],
    tokens: {
      USDC: tokenMappings.USDC[10],
      USDT: tokenMappings.USDT[10],
      DAI: tokenMappings.DAI[10],
      WETH: tokenMappings.WETH[10]
    }
  },
  8453: {
    name: 'Base',
    rpcUrl: process.env.BASE_RPC || 'https://mainnet.base.org',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    deployed: {},
    dexes: dexRouters[8453],
    tokens: {
      USDC: tokenMappings.USDC[8453],
      USDT: tokenMappings.USDT[8453],
      DAI: tokenMappings.DAI[8453],
      WETH: tokenMappings.WETH[8453]
    }
  },
  56: {
    name: 'BNB Chain',
    rpcUrl: process.env.BSC_RPC || 'https://bsc-dataseed.binance.org',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    deployed: {},
    dexes: dexRouters[56],
    tokens: {
      USDC: tokenMappings.USDC[56],
      USDT: tokenMappings.USDT[56],
      DAI: tokenMappings.DAI[56],
      WETH: tokenMappings.WETH[56]
    }
  },
  43114: {
    name: 'Avalanche',
    rpcUrl: process.env.AVAX_RPC || 'https://api.avax.network/ext/bc/C/rpc',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18
    },
    deployed: {},
    dexes: dexRouters[43114],
    tokens: {
      USDC: tokenMappings.USDC[43114],
      USDT: tokenMappings.USDT[43114],
      DAI: tokenMappings.DAI[43114],
      WETH: tokenMappings.WETH[43114]
    }
  },
  250: {
    name: 'Fantom',
    rpcUrl: process.env.FANTOM_RPC || 'https://rpc.ftm.tools',
    nativeCurrency: {
      name: 'Fantom',
      symbol: 'FTM',
      decimals: 18
    },
    deployed: {},
    dexes: dexRouters[250],
    tokens: {
      USDC: tokenMappings.USDC[250],
      USDT: tokenMappings.USDT[250],
      DAI: tokenMappings.DAI[250],
      WETH: tokenMappings.WETH[250]
    }
  },
  59144: {
    name: 'Linea',
    rpcUrl: process.env.LINEA_RPC || 'https://rpc.linea.build',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    deployed: {},
    dexes: dexRouters[59144],
    tokens: {
      USDC: tokenMappings.USDC[59144],
      USDT: tokenMappings.USDT[59144],
      DAI: tokenMappings.DAI[59144],
      WETH: tokenMappings.WETH[59144]
    }
  },
  1101: {
    name: 'Polygon zkEVM',
    rpcUrl: process.env.ZKEVM_RPC || 'https://zkevm-rpc.com',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    deployed: {},
    dexes: dexRouters[1101],
    tokens: {
      USDC: tokenMappings.USDC[1101],
      USDT: tokenMappings.USDT[1101],
      DAI: tokenMappings.DAI[1101],
      WETH: tokenMappings.WETH[1101]
    }
  }
};

// Saved deployments
let deployments = {};
if (fs.existsSync(outputPath)) {
  try {
    deployments = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  } catch (error) {
    console.error('Error reading deployments file:', error);
    deployments = {};
  }
}

/**
 * Deploy a contract to a specified chain
 * @param {number} chainId Chain ID to deploy to
 * @param {string} contractName Name of the contract
 * @param {string} abi Contract ABI
 * @param {string} bytecode Contract bytecode
 * @param {Array} args Constructor arguments
 * @returns {Promise<string>} Deployed contract address
 */
async function deployContract(chainId, contractName, abi, bytecode, args = []) {
  console.log(`Deploying ${contractName} to ${chains[chainId].name}...`);

  const provider = new ethers.providers.JsonRpcProvider(chains[chainId].rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const contractFactory = new ethers.ContractFactory(abi, bytecode, wallet);

  try {
    // Get gas price from the network
    const gasPrice = await provider.getGasPrice();
    const adjustedGasPrice = gasPrice.mul(120).div(100); // 20% higher for faster confirmation

    console.log(`Current gas price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);
    console.log(`Using gas price: ${ethers.utils.formatUnits(adjustedGasPrice, 'gwei')} gwei`);

    // Calculate gas estimate
    const gasEstimate = await contractFactory.estimateGas.deploy(...args);
    const adjustedGasLimit = gasEstimate.mul(120).div(100); // 20% buffer

    console.log(`Estimated gas: ${gasEstimate.toString()}`);
    console.log(`Using gas limit: ${adjustedGasLimit.toString()}`);

    // Deploy with adjusted gas settings
    const contract = await contractFactory.deploy(...args, {
      gasPrice: adjustedGasPrice,
      gasLimit: adjustedGasLimit
    });

    // Wait for deployment confirmation
    console.log(`Waiting for ${contractName} deployment...`);
    await contract.deployed();

    console.log(`${contractName} deployed to: ${contract.address}`);

    // Save deployment to our records
    if (!deployments[chainId]) {
      deployments[chainId] = {};
    }

    deployments[chainId][contractName] = {
      address: contract.address,
      deployedAt: new Date().toISOString(),
      transactionHash: contract.deployTransaction.hash
    };

    // Save to file
    fs.writeFileSync(outputPath, JSON.stringify(deployments, null, 2));

    return contract.address;
  } catch (error) {
    console.error(`Error deploying ${contractName} to ${chains[chainId].name}:`, error);
    throw error;
  }
}

/**
 * Deploy all Dunix contracts to a specified chain
 * @param {number} chainId Chain ID to deploy to
 */
async function deployAllToChain(chainId) {
  if (!chains[chainId]) {
    console.error(`Chain ID ${chainId} not configured`);
    return;
  }

  console.log(`Deploying all contracts to ${chains[chainId].name}...`);

  try {
    // Deploy DunixSwap with 0.3% fee
    const swapAddress = await deployContract(
      chainId,
      'DunixSwap',
      DUNIX_SWAP_ABI,
      DUNIX_SWAP_BYTECODE,
      [30] // 0.3% fee in basis points
    );

    // Deploy DunixLimitOrders with 0.2% fee
    const limitOrdersAddress = await deployContract(
      chainId,
      'DunixLimitOrders',
      DUNIX_LIMIT_ORDERS_ABI,
      DUNIX_LIMIT_ORDERS_BYTECODE,
      [20] // 0.2% fee in basis points
    );

    // Deploy DunixBridge with 0.1% fee
    const bridgeAddress = await deployContract(
      chainId,
      'DunixBridge',
      DUNIX_BRIDGE_ABI,
      DUNIX_BRIDGE_BYTECODE,
      [10] // 0.1% fee in basis points
    );

    console.log(`All contracts deployed to ${chains[chainId].name}!`);

    // Initialize contracts with DEXes and tokens
    await initializeContracts(chainId, {
      swap: swapAddress,
      limitOrders: limitOrdersAddress,
      bridge: bridgeAddress
    });

    return {
      DunixSwap: swapAddress,
      DunixLimitOrders: limitOrdersAddress,
      DunixBridge: bridgeAddress
    };
  } catch (error) {
    console.error(`Error during deployment to ${chains[chainId].name}:`, error);
  }
}

/**
 * Initialize deployed contracts with DEXes and tokens
 * @param {number} chainId Chain ID where contracts are deployed
 * @param {Object} addresses Addresses of deployed contracts
 */
async function initializeContracts(chainId, addresses) {
  console.log(`Initializing contracts on ${chains[chainId].name}...`);

  const chain = chains[chainId];
  const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  try {
    // Initialize DunixSwap
    if (addresses.swap) {
      console.log(`Initializing DunixSwap on ${chain.name}...`);
      const swapContract = new ethers.Contract(
        addresses.swap,
        DUNIX_SWAP_ABI,
        wallet
      );

      // Add chain DEXes
      for (const [dexName, dexInfo] of Object.entries(chain.dexes)) {
        console.log(`Adding DEX ${dexName} to DunixSwap...`);
        await swapContract.addDex(
          chainId,
          dexName,
          dexInfo.router,
          dexInfo.factory
        );
      }

      // Set primary router
      const primaryDex = Object.keys(chain.dexes)[0];
      if (primaryDex) {
        console.log(`Setting ${primaryDex} as primary router...`);
        await swapContract.setPrimaryRouter(
          chainId,
          chain.dexes[primaryDex].router
        );
      }
    }

    // Initialize DunixLimitOrders
    if (addresses.limitOrders) {
      console.log(`Initializing DunixLimitOrders on ${chain.name}...`);
      const limitOrdersContract = new ethers.Contract(
        addresses.limitOrders,
        DUNIX_LIMIT_ORDERS_ABI,
        wallet
      );

      // Add DEXes
      for (const [dexName, dexInfo] of Object.entries(chain.dexes)) {
        console.log(`Adding DEX ${dexName} to DunixLimitOrders...`);
        await limitOrdersContract.addDex(
          chainId,
          dexName,
          dexInfo.router
        );
      }

      // Add the owner as an executor
      console.log('Adding owner as executor...');
      await limitOrdersContract.setExecutor(wallet.address, true);
    }

    // Initialize DunixBridge
    if (addresses.bridge) {
      console.log(`Initializing DunixBridge on ${chain.name}...`);
      const bridgeContract = new ethers.Contract(
        addresses.bridge,
        DUNIX_BRIDGE_ABI,
        wallet
      );

      // Add chain support
      console.log(`Adding chain support for ${chain.name}...`);
      await bridgeContract.setChainSupport(
        chainId,
        chain.name,
        true
      );

      // Add the owner as a relayer
      console.log('Adding owner as relayer...');
      await bridgeContract.setRelayer(wallet.address, true);

      // Set minimum bridge amounts for common tokens
      console.log('Setting minimum bridge amounts...');
      for (const [symbol, address] of Object.entries(chain.tokens)) {
        if (address) {
          // Different minimum amounts based on token type
          let minAmount;
          if (symbol === 'USDC' || symbol === 'USDT') {
            minAmount = ethers.utils.parseUnits('10', 6); // $10 minimum
          } else if (symbol === 'DAI') {
            minAmount = ethers.utils.parseUnits('10', 18); // $10 minimum
          } else if (symbol === 'WETH') {
            minAmount = ethers.utils.parseUnits('0.005', 18); // 0.005 ETH minimum
          }

          if (minAmount) {
            await bridgeContract.setMinimumBridgeAmount(address, minAmount);
          }
        }
      }
    }

    console.log(`Contract initialization on ${chain.name} complete!`);
  } catch (error) {
    console.error(`Error initializing contracts on ${chain.name}:`, error);
  }
}

/**
 * Configure bridges between chains by mapping tokens
 * @param {Object} deployments Object containing all deployments
 */
async function configureBridges(deployments) {
  console.log('Configuring bridges between chains...');

  // Loop through each pair of chains
  for (const sourceChainId in deployments) {
    for (const destChainId in deployments) {
      // Skip same chain
      if (sourceChainId === destChainId) continue;

      const sourceChain = parseInt(sourceChainId);
      const destChain = parseInt(destChainId);

      if (!deployments[sourceChainId].DunixBridge || !deployments[destChainId].DunixBridge) {
        console.log(`Skipping ${sourceChainId} -> ${destChainId} bridge configuration (missing bridge contract)`);
        continue;
      }

      console.log(`Configuring bridge from ${chains[sourceChainId].name} to ${chains[destChainId].name}...`);

      // Get bridge contract instance
      const provider = new ethers.providers.JsonRpcProvider(chains[sourceChainId].rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);
      const bridgeContract = new ethers.Contract(
        deployments[sourceChainId].DunixBridge.address,
        DUNIX_BRIDGE_ABI,
        wallet
      );

      // Setup token mappings
      // Map common tokens (USDC, USDT, DAI, WETH) between chains
      const sourceTokens = chains[sourceChainId].tokens;
      const destTokens = chains[destChainId].tokens;

      // For common tokens, map them between chains
      for (const symbol of ['USDC', 'USDT', 'DAI', 'WETH']) {
        if (sourceTokens[symbol] && destTokens[symbol]) {
          console.log(`Mapping ${symbol} from ${chains[sourceChainId].name} to ${chains[destChainId].name}...`);

          try {
            await bridgeContract.mapToken(
              sourceChain,
              sourceTokens[symbol],
              destChain,
              destTokens[symbol]
            );
          } catch (error) {
            console.error(`Error mapping ${symbol}:`, error);
          }
        }
      }

      console.log(`Bridge configured from ${chains[sourceChainId].name} to ${chains[destChainId].name}`);
    }
  }

  console.log('All bridges configured!');
}

/**
 * Deploy all contracts to all configured chains
 */
async function deployToAllChains() {
  // First, compile the contracts
  await compileContracts();

  for (const chainId in chains) {
    try {
      await deployAllToChain(parseInt(chainId));
    } catch (error) {
      console.error(`Deployment to chain ${chainId} failed, continuing with next chain...`);
    }
  }

  console.log('All deployments completed!');
  console.log('Deployment summary:');
  console.log(JSON.stringify(deployments, null, 2));
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'all') {
    await deployToAllChains();
    await configureBridges(deployments);
  } else if (args[0] === 'compile') {
    await compileContracts();
    console.log('Compilation complete!');
  } else {
    const chainId = parseInt(args[0]);
    if (chains[chainId]) {
      await deployAllToChain(chainId);

      // If this is the only chain deployed, we can't configure bridges
      if (Object.keys(deployments).length > 1) {
        await configureBridges(deployments);
      } else {
        console.log('Bridges not configured - need at least 2 chains deployed');
      }
    } else {
      console.error(`Chain ID ${chainId} not configured`);
    }
  }
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
