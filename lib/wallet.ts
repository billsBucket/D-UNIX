import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ethers } from 'ethers';
import { NETWORKS } from './ethereum';

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WalletState {
  address: string;
  chainId: number;
  status: WalletStatus;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  balance: string;
}

const initialState: WalletState = {
  address: '',
  chainId: 1, // Ethereum mainnet by default
  status: 'disconnected',
  provider: null,
  signer: null,
  balance: '0',
};

export function useWallet() {
  const [state, setState] = useState<WalletState>(initialState);

  // Check if ethereum is available
  const hasMetaMask = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  // Initialize and check connection status
  useEffect(() => {
    const checkConnection = async () => {
      if (!hasMetaMask()) return;

      try {
        const { ethereum } = window as any;

        // Create ethers provider
        const provider = new ethers.BrowserProvider(ethereum);

        // Listen for account changes
        ethereum.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length === 0) {
            // User has disconnected their wallet
            setState({ ...initialState });
            toast.info('Wallet disconnected');
          } else {
            // User switched accounts
            handleAccountChange(accounts[0], provider);
          }
        });

        // Listen for chain changes
        ethereum.on('chainChanged', (chainId: string) => {
          const numericChainId = parseInt(chainId, 16);
          handleChainChange(numericChainId, provider);
        });

        // Check if already connected
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          await handleAccountChange(accounts[0], provider);
        }
      } catch (error) {
        console.error('Failed to check wallet connection:', error);
      }
    };

    checkConnection();

    // Clean up event listeners
    return () => {
      if (hasMetaMask()) {
        const { ethereum } = window as any;
        ethereum.removeAllListeners('accountsChanged');
        ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  // Handle account changes
  const handleAccountChange = async (address: string, provider: ethers.BrowserProvider) => {
    try {
      // Get signer and chain ID
      const signer = await provider.getSigner();
      const { chainId } = await provider.getNetwork();

      // Get account balance
      const balanceWei = await provider.getBalance(address);
      const balance = ethers.formatEther(balanceWei);

      setState({
        address,
        chainId: Number(chainId),
        status: 'connected',
        provider,
        signer,
        balance: parseFloat(balance).toFixed(4),
      });

      toast.success('Wallet connected');
    } catch (error) {
      console.error('Error handling account change:', error);
      setState({
        ...initialState,
        status: 'error',
      });
    }
  };

  // Handle chain changes
  const handleChainChange = async (chainId: number, provider: ethers.BrowserProvider) => {
    if (state.address) {
      try {
        // Get signer for the new chain
        const signer = await provider.getSigner();

        // Get account balance on the new chain
        const balanceWei = await provider.getBalance(state.address);
        const balance = ethers.formatEther(balanceWei);

        setState({
          ...state,
          chainId,
          provider,
          signer,
          balance: parseFloat(balance).toFixed(4),
        });

        const chainName = NETWORKS[chainId]?.name || `Chain ${chainId}`;
        toast.success(`Switched to ${chainName}`);
      } catch (error) {
        console.error('Error handling chain change:', error);
      }
    }
  };

  // Connect wallet
  const connect = async () => {
    if (!hasMetaMask()) {
      toast.error('MetaMask is not installed');
      return;
    }

    setState({ ...state, status: 'connecting' });

    try {
      const { ethereum } = window as any;
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

      if (accounts.length > 0) {
        const provider = new ethers.BrowserProvider(ethereum);
        await handleAccountChange(accounts[0], provider);
      } else {
        setState({
          ...initialState,
          status: 'error',
        });
        toast.error('No accounts found');
      }
    } catch (error: any) {
      setState({
        ...initialState,
        status: 'error',
      });

      // Handle user rejected request error
      if (error.code === 4001) {
        toast.error('Connection rejected by user');
      } else {
        toast.error('Failed to connect wallet');
        console.error('Wallet connection error:', error);
      }
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    setState({ ...initialState });
    toast.success('Wallet disconnected');
  };

  // Switch chain
  const switchChain = async (chainId: number) => {
    if (!hasMetaMask() || state.status !== 'connected') {
      toast.error('Connect your wallet first');
      return;
    }

    try {
      const { ethereum } = window as any;

      // Format chain ID as hexadecimal
      const chainIdHex = `0x${chainId.toString(16)}`;

      try {
        // Try to switch to the chain
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          const chainConfig = NETWORKS[chainId];

          if (!chainConfig) {
            toast.error('Unsupported chain');
            return;
          }

          // Add the chain to MetaMask
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName: chainConfig.name,
                nativeCurrency: {
                  name: chainConfig.symbol,
                  symbol: chainConfig.symbol,
                  decimals: chainConfig.decimals,
                },
                rpcUrls: [chainConfig.rpcUrl],
                blockExplorerUrls: [chainConfig.blockExplorer],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }

      // Create new provider after chain switch
      const provider = new ethers.BrowserProvider(ethereum);
      await handleChainChange(chainId, provider);

    } catch (error) {
      console.error('Error switching chain:', error);
      toast.error('Failed to switch chain');
    }
  };

  // Format the address for display
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return {
    ...state,
    connect,
    disconnect,
    switchChain,
    formatAddress,
    isConnected: state.status === 'connected',
    isConnecting: state.status === 'connecting',
  };
}
