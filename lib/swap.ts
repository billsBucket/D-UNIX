import { toast } from 'sonner';
import { ethers } from 'ethers';
import { getProvider, getSigner, NETWORKS, NetworkInfo } from './ethereum';
import {
  getTokenOnChain,
  getWrappedNativeToken as getWrappedNativeTokenInfo
} from './multi-chain-tokens';
import {
  getDefaultDexRouter,
  getDexRouterByName,
  getWrappedNativeTokenAddress
} from './dex-routers';

// Uniswap V2 Router ABI (minimal for the functions we need)
export const UNISWAP_ROUTER_ABI = [
  // Get amounts out
  {
    inputs: [
      { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      { internalType: 'address[]', name: 'path', type: 'address[]' },
    ],
    name: 'getAmountsOut',
    outputs: [{ internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Swap ETH for tokens
  {
    inputs: [
      { internalType: 'uint256', name: 'amountOutMin', type: 'uint256' },
      { internalType: 'address[]', name: 'path', type: 'address[]' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' },
    ],
    name: 'swapExactETHForTokens',
    outputs: [{ internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'payable',
    type: 'function',
  },
  // Swap tokens for ETH
  {
    inputs: [
      { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      { internalType: 'uint256', name: 'amountOutMin', type: 'uint256' },
      { internalType: 'address[]', name: 'path', type: 'address[]' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' },
    ],
    name: 'swapExactTokensForETH',
    outputs: [{ internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Swap tokens for tokens
  {
    inputs: [
      { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      { internalType: 'uint256', name: 'amountOutMin', type: 'uint256' },
      { internalType: 'address[]', name: 'path', type: 'address[]' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' },
    ],
    name: 'swapExactTokensForTokens',
    outputs: [{ internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

// Uniswap V2 Factory ABI (minimal for the functions we need)
export const UNISWAP_FACTORY_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'tokenA', type: 'address' },
      { internalType: 'address', name: 'tokenB', type: 'address' },
    ],
    name: 'getPair',
    outputs: [{ internalType: 'address', name: 'pair', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
];

// Uniswap V2 Pair ABI (minimal for the functions we need)
export const UNISWAP_PAIR_ABI = [
  {
    inputs: [],
    name: 'getReserves',
    outputs: [
      { internalType: 'uint112', name: '_reserve0', type: 'uint112' },
      { internalType: 'uint112', name: '_reserve1', type: 'uint112' },
      { internalType: 'uint32', name: '_blockTimestampLast', type: 'uint32' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token0',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token1',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
];

// Interface for token approval
export interface ApprovalParams {
  tokenAddress: string;
  spenderAddress: string;
  amount: string;
  chainId: number;
}

// Interface for token allowance check
export interface AllowanceParams {
  tokenAddress: string;
  ownerAddress: string;
  spenderAddress: string;
  chainId: number;
}

// Interface for swap parameters
export interface SwapParams {
  inputToken: string;
  outputToken: string;
  inputAmount: string;
  slippage: number;
  userAddress: string;
  chainId: number;
  dexName?: string;
  deadline?: number; // Unix timestamp in seconds
}

// Interface for swap quote
export interface SwapQuote {
  inputToken: string;
  outputToken: string;
  inputAmount: string;
  outputAmount: string;
  inputAmountInWei: string;
  outputAmountInWei: string;
  priceImpact: string;
  path: string[];
  gas: string;
  executionPrice: string;
  minimumOutputAmount: string;
  minimumOutputAmountInWei: string;
  dexName: string;
  chainId: number;
}

/**
 * Helper to get token address for a specific chain
 * @param token Token symbol or address
 * @param chainId Chain ID to look up the token on
 * @returns Token address for the specified chain
 */
export const getTokenAddress = (token: string, chainId: number): string => {
  const nativeToken = getNativeToken(chainId);
  const wrappedNativeToken = getWrappedNativeTokenAddress(chainId);

  // Handle direct addresses
  if (token.startsWith('0x')) return token;

  // Handle native token symbol
  if (nativeToken && token === nativeToken.symbol) return 'native';

  // Check if it's a known token symbol on this chain
  const tokenInfo = getTokenOnChain(chainId, token);
  if (tokenInfo) {
    return tokenInfo.address === 'native' ?
      (wrappedNativeToken || '') :
      tokenInfo.address;
  }

  // Fallback: return the input as is (likely an address)
  return token;
};

/**
 * Get native token for a chain
 * @param chainId Chain ID to get native token for
 * @returns Native token info from the NETWORKS mapping
 */
export const getNativeToken = (chainId: number): NetworkInfo | undefined => {
  return NETWORKS[chainId];
};

/**
 * Helper to get token decimals for a specific chain
 * @param token Token symbol or address
 * @param chainId Chain ID to look up the token on
 * @returns Token decimals (defaults to 18 if not found)
 */
export const getTokenDecimals = (token: string, chainId: number): number => {
  // Handle native token
  const nativeToken = getNativeToken(chainId);
  if (nativeToken && token === nativeToken.symbol) {
    return nativeToken.decimals;
  }

  // Check if it's a known token symbol on this chain
  const tokenInfo = getTokenOnChain(chainId, token);
  if (tokenInfo) {
    return tokenInfo.decimals;
  }

  // Default to 18 decimals
  return 18;
};

/**
 * Approve a token for spending by a contract
 * @param params Token approval parameters
 * @returns Transaction hash
 */
export const approveToken = async (params: ApprovalParams): Promise<string> => {
  try {
    const { tokenAddress, spenderAddress, amount, chainId } = params;

    // Get signer for the specified chain
    const signer = await getSigner(chainId);

    // Create token contract instance
    const tokenContract = new ethers.Contract(
      tokenAddress,
      [
        'function approve(address spender, uint256 amount) public returns (bool)',
      ],
      signer
    );

    // Execute approval
    const tx = await tokenContract.approve(spenderAddress, amount);
    const receipt = await tx.wait();

    return receipt.hash;
  } catch (error) {
    console.error('Error approving token:', error);
    throw error;
  }
};

/**
 * Get token allowance for a specific owner and spender
 * @param params Token allowance parameters
 * @returns Allowance as a string
 */
export const getTokenAllowance = async (params: AllowanceParams): Promise<string> => {
  try {
    const { tokenAddress, ownerAddress, spenderAddress, chainId } = params;

    // Get provider for the specified chain
    const provider = await getProvider(chainId);

    // Create token contract instance
    const tokenContract = new ethers.Contract(
      tokenAddress,
      [
        'function allowance(address owner, address spender) public view returns (uint256)',
      ],
      provider
    );

    // Get allowance
    const allowance = await tokenContract.allowance(ownerAddress, spenderAddress);

    return allowance.toString();
  } catch (error) {
    console.error('Error getting token allowance:', error);
    return '0';
  }
};

/**
 * Calculate price impact for a swap
 * @param inputToken Input token symbol
 * @param outputToken Output token symbol
 * @param amountIn Input amount as a string
 * @param amountOut Output amount as a string
 * @param chainId Chain ID to perform calculation on
 * @param dexName Optional DEX name to use for calculation
 * @returns Price impact as a percentage string
 */
const calculatePriceImpact = async (
  inputToken: string,
  outputToken: string,
  amountIn: string,
  amountOut: string,
  chainId: number,
  dexName?: string
): Promise<string> => {
  try {
    // Get router for the specified DEX or the default
    const router = dexName ?
      getDexRouterByName(chainId, dexName) :
      getDefaultDexRouter(chainId);

    if (!router) {
      console.warn(`No compatible DEX found for chain ID ${chainId}`);
      return '0.00%';
    }

    // Get token addresses
    const inputTokenAddress = getTokenAddress(inputToken, chainId);
    const outputTokenAddress = getTokenAddress(outputToken, chainId);

    // Get provider
    const provider = await getProvider(chainId);

    // Connect to factory
    const factory = new ethers.Contract(
      router.factoryAddress,
      UNISWAP_FACTORY_ABI,
      provider
    );

    // Get pair address
    const pairAddress = await factory.getPair(
      inputTokenAddress === 'native' ? router.wrappedNativeToken : inputTokenAddress,
      outputTokenAddress === 'native' ? router.wrappedNativeToken : outputTokenAddress
    );

    if (pairAddress === ethers.ZeroAddress) {
      return '0.00%'; // No direct pair, would use a path through wrapped native token
    }

    // Connect to pair
    const pair = new ethers.Contract(pairAddress, UNISWAP_PAIR_ABI, provider);

    // Get reserves
    const [reserve0, reserve1] = await pair.getReserves();

    // Get token order
    const token0 = await pair.token0();

    // Determine which token address to use (accounting for native token)
    const effectiveInputAddress = inputTokenAddress === 'native' ?
      router.wrappedNativeToken : inputTokenAddress;

    const effectiveOutputAddress = outputTokenAddress === 'native' ?
      router.wrappedNativeToken : outputTokenAddress;

    // Determine which reserve is which token
    const [reserveIn, reserveOut] = token0.toLowerCase() === effectiveInputAddress.toLowerCase() ?
      [reserve0, reserve1] : [reserve1, reserve0];

    // Calculate price impact (simplified)
    const inputDecimals = getTokenDecimals(inputToken, chainId);
    const outputDecimals = getTokenDecimals(outputToken, chainId);

    const amountInWithDecimals = ethers.parseUnits(amountIn, inputDecimals);
    const amountOutWithDecimals = ethers.parseUnits(amountOut, outputDecimals);

    const numerator = amountInWithDecimals * reserveOut;
    const denominator = (reserveIn * amountOutWithDecimals);

    if (denominator === BigInt(0)) {
      return '0.00%';
    }

    // Calculate price impact as 1 - (amountOut * reserveIn) / (amountIn * reserveOut)
    // This is a simplification; in practice, DEXes use more complex math for multi-hop routes
    const exactQuote = Number(numerator) / Number(denominator);
    const impact = 1 - (1 / exactQuote);

    return `${(impact * 100).toFixed(2)}%`;
  } catch (error) {
    console.error('Error calculating price impact:', error);
    // Return a default value if calculation fails
    return '0.50%';
  }
};

/**
 * Get a quote for a token swap on a specific chain
 * @param params Swap parameters
 * @returns Swap quote with details
 */
export const getSwapQuote = async (params: SwapParams): Promise<SwapQuote> => {
  try {
    const {
      inputToken,
      outputToken,
      inputAmount,
      slippage,
      userAddress,
      chainId,
      dexName
    } = params;

    // Get router for the specified DEX or the default
    const router = dexName ?
      getDexRouterByName(chainId, dexName) :
      getDefaultDexRouter(chainId);

    if (!router) {
      throw new Error(`No compatible DEX found for chain ID ${chainId}`);
    }

    // Create provider and router contract
    const provider = await getProvider(chainId);
    const routerContract = new ethers.Contract(
      router.routerAddress,
      UNISWAP_ROUTER_ABI,
      provider
    );

    // Get token addresses and decimals
    const inputTokenAddress = getTokenAddress(inputToken, chainId);
    const outputTokenAddress = getTokenAddress(outputToken, chainId);
    const inputDecimals = getTokenDecimals(inputToken, chainId);

    // Convert input amount to wei
    const inputAmountInWei = ethers.parseUnits(inputAmount, inputDecimals);

    // Determine the path - route through wrapped native token if not a direct pair
    let path: string[];

    // Handle 'native' token addresses
    const effectiveInputAddress = inputTokenAddress === 'native' ?
      router.wrappedNativeToken : inputTokenAddress;

    const effectiveOutputAddress = outputTokenAddress === 'native' ?
      router.wrappedNativeToken : outputTokenAddress;

    if (effectiveInputAddress === router.wrappedNativeToken ||
        effectiveOutputAddress === router.wrappedNativeToken) {
      // Direct path if one of the tokens is wrapped native token
      path = [effectiveInputAddress, effectiveOutputAddress];
    } else {
      // Try to route through wrapped native token
      path = [effectiveInputAddress, router.wrappedNativeToken, effectiveOutputAddress];

      // Check if direct pair exists
      const factory = new ethers.Contract(
        router.factoryAddress,
        UNISWAP_FACTORY_ABI,
        provider
      );

      const pairAddress = await factory.getPair(effectiveInputAddress, effectiveOutputAddress);

      if (pairAddress !== ethers.ZeroAddress) {
        // Direct pair exists, use direct path
        path = [effectiveInputAddress, effectiveOutputAddress];
      }
    }

    // Get amounts out from router
    const amounts = await routerContract.getAmountsOut(inputAmountInWei, path);

    // Get output amount
    const outputAmountInWei = amounts[amounts.length - 1];
    const outputDecimals = getTokenDecimals(outputToken, chainId);
    const outputAmount = ethers.formatUnits(outputAmountInWei, outputDecimals);

    // Calculate minimum output with slippage
    const slippageFactor = 1 - slippage / 100;
    const minimumOutputAmountInWei = (outputAmountInWei * BigInt(Math.floor(slippageFactor * 1000))) / 1000n;
    const minimumOutputAmount = ethers.formatUnits(minimumOutputAmountInWei, outputDecimals);

    // Calculate execution price
    const executionPrice = (parseFloat(outputAmount) / parseFloat(inputAmount)).toString();

    // Calculate price impact
    const priceImpact = await calculatePriceImpact(
      inputToken,
      outputToken,
      inputAmount,
      outputAmount,
      chainId,
      dexName
    );

    // Get network info for path display
    const network = NETWORKS[chainId];

    // Format path for display
    const pathDisplay = path.map(address => {
      // Native token special case
      if (address === router.wrappedNativeToken) {
        return network?.symbol || 'ETH'; // Use network symbol or fallback to ETH
      }

      // Find token by address in this chain
      for (const symbol in getTokenOnChain(chainId, '')) {
        const tokenInfo = getTokenOnChain(chainId, symbol);
        if (tokenInfo && tokenInfo.address === address) return symbol;
      }

      // If not found, return shortened address
      return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    });

    // Estimate gas (varies by DEX and chain)
    const gas = router.version === 'v3' ? '250000' : '210000';

    return {
      inputToken,
      outputToken,
      inputAmount,
      outputAmount,
      inputAmountInWei: inputAmountInWei.toString(),
      outputAmountInWei: outputAmountInWei.toString(),
      priceImpact,
      path: pathDisplay,
      gas,
      executionPrice,
      minimumOutputAmount,
      minimumOutputAmountInWei: minimumOutputAmountInWei.toString(),
      dexName: router.name,
      chainId
    };
  } catch (error) {
    console.error('Error getting swap quote:', error);
    toast.error(`Failed to get swap quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};

/**
 * Execute a token swap on a specific chain
 * @param quote Swap quote to execute
 * @param params Original swap parameters
 * @returns Transaction hash
 */
export const executeSwap = async (quote: SwapQuote, params: SwapParams): Promise<string> => {
  try {
    const { chainId, dexName } = params;

    // Get router for the specified DEX or the default
    const router = dexName ?
      getDexRouterByName(chainId, dexName) :
      getDefaultDexRouter(chainId);

    if (!router) {
      throw new Error(`No compatible DEX found for chain ID ${chainId}`);
    }

    // Create signer and router contract
    const signer = await getSigner(chainId);
    const routerContract = new ethers.Contract(
      router.routerAddress,
      UNISWAP_ROUTER_ABI,
      signer
    );

    const { inputToken, outputToken, userAddress } = params;
    const { inputAmountInWei, minimumOutputAmountInWei } = quote;

    // Convert string values to BigInt
    const inputAmount = BigInt(inputAmountInWei);
    const minOutput = BigInt(minimumOutputAmountInWei);

    // Set deadline to 20 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 20 * 60;

    // Get token addresses
    const inputTokenAddress = getTokenAddress(inputToken, chainId);
    const outputTokenAddress = getTokenAddress(outputToken, chainId);

    // Handle 'native' token addresses for the path
    const effectiveInputAddress = inputTokenAddress === 'native' ?
      router.wrappedNativeToken : inputTokenAddress;

    const effectiveOutputAddress = outputTokenAddress === 'native' ?
      router.wrappedNativeToken : outputTokenAddress;

    // Determine the path
    let path: string[];
    if (effectiveInputAddress === router.wrappedNativeToken ||
        effectiveOutputAddress === router.wrappedNativeToken) {
      // Direct path if one of the tokens is wrapped native token
      path = [effectiveInputAddress, effectiveOutputAddress];
    } else {
      // Route through wrapped native token by default
      path = [effectiveInputAddress, router.wrappedNativeToken, effectiveOutputAddress];

      // Check if direct pair exists
      const provider = await getProvider(chainId);
      const factory = new ethers.Contract(
        router.factoryAddress,
        UNISWAP_FACTORY_ABI,
        provider
      );

      const pairAddress = await factory.getPair(effectiveInputAddress, effectiveOutputAddress);

      if (pairAddress !== ethers.ZeroAddress) {
        // Direct pair exists, use direct path
        path = [effectiveInputAddress, effectiveOutputAddress];
      }
    }

    // If input token is not native token, we need to approve the router first
    let txHash;

    if (inputTokenAddress !== 'native') {
      // Check current allowance
      const currentAllowance = await getTokenAllowance({
        tokenAddress: effectiveInputAddress,
        ownerAddress: userAddress,
        spenderAddress: router.routerAddress,
        chainId
      });

      // Only approve if needed
      if (BigInt(currentAllowance) < inputAmount) {
        toast.info('Approving token spending...');

        await approveToken({
          tokenAddress: effectiveInputAddress,
          spenderAddress: router.routerAddress,
          amount: inputAmountInWei,
          chainId
        });

        toast.success('Token spending approved!');
      }
    }

    // Execute the swap based on token types
    let tx;

    if (inputTokenAddress === 'native') {
      // Native token to Token
      tx = await routerContract.swapExactETHForTokens(
        minOutput,
        path,
        userAddress,
        deadline,
        { value: inputAmount }
      );
    } else if (outputTokenAddress === 'native') {
      // Token to Native token
      tx = await routerContract.swapExactTokensForETH(
        inputAmount,
        minOutput,
        path,
        userAddress,
        deadline
      );
    } else {
      // Token to Token
      tx = await routerContract.swapExactTokensForTokens(
        inputAmount,
        minOutput,
        path,
        userAddress,
        deadline
      );
    }

    // Wait for transaction to be mined
    const receipt = await tx.wait();
    txHash = receipt.hash;

    return txHash;
  } catch (error) {
    console.error('Error executing swap:', error);
    toast.error(`Failed to execute swap: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};

/**
 * Predict the route for a swap on a specific chain
 * @param inputToken Input token symbol
 * @param outputToken Output token symbol
 * @param chainId Chain ID to predict route for
 * @returns Array of token symbols representing the predicted route
 */
export const predictSwapRoute = (inputToken: string, outputToken: string, chainId: number): string[] => {
  if (inputToken === outputToken) return [inputToken];

  const network = NETWORKS[chainId];
  if (!network) return [inputToken, 'Unknown', outputToken];

  const nativeSymbol = network.symbol;

  if (inputToken === nativeSymbol || inputToken === `W${nativeSymbol}`) {
    return [nativeSymbol, outputToken];
  }

  if (outputToken === nativeSymbol || outputToken === `W${nativeSymbol}`) {
    return [inputToken, nativeSymbol];
  }

  // For other pairs, usually routing through native token is the most liquid path
  return [inputToken, nativeSymbol, outputToken];
};
