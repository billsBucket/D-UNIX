"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useWalletContext } from './wallet-provider';
import { NETWORKS } from '@/lib/ethereum';
import { ThemeToggle } from './theme-toggle';
import NotificationBell from './notification-bell';
import NetworkDropdown from './network-dropdown';
import { useChainFavorites } from '@/lib/chain-favorites';
import { useRecentChains } from '@/lib/recent-chains';
import { useNetworkSpeed } from '@/lib/network-speed';
import { useCustomRPC } from '@/lib/custom-rpc';

export default function Navbar() {
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isChainSwitching, setIsChainSwitching] = useState(false);

  const { isConnected, connect, disconnect, address, balance, formatAddress, chainId, switchChain } = useWalletContext();
  const { favoriteChainIds, isFavorite, toggleFavorite } = useChainFavorites();
  const { recentChains, addRecentChain, getMostRecentChains } = useRecentChains();
  const { speedResults, getNetworkSpeed } = useNetworkSpeed();
  const { hasCustomRPC } = useCustomRPC();

  const currentNetwork = useMemo(() => {
    return chainId && NETWORKS[chainId] ? NETWORKS[chainId] : NETWORKS[1];
  }, [chainId]);

  useEffect(() => {
    if (!chainId && switchChain) {
      switchChain(1);
      addRecentChain(1);
    }
  }, [chainId, switchChain, addRecentChain]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showMenu && !target.closest('#mobile-menu') && !target.closest('#mobile-menu-button')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  useEffect(() => {
    setShowMenu(false);
  }, [pathname]);

  const handleNetworkChange = useCallback((networkId: number) => {
    console.log("Network change:", networkId);
    if (!isNaN(networkId)) {
      setIsChainSwitching(true);
      switchChain(networkId);
      addRecentChain(networkId);
      setTimeout(() => {
        setIsChainSwitching(false);
      }, 500);
    }
  }, [switchChain, addRecentChain]);

  const links = [
    { name: 'DEX', href: '/' },
    { name: 'ANALYTICS', href: '/analytics' },
    { name: 'NETWORK HEALTH', href: '/network-health' },
    { name: 'ALERTS', href: '/alerts' },
    { name: 'ABOUT', href: '/about' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-black border-b border-white/10 transition-all duration-200 ${scrolled ? 'shadow-md' : ''}`}>
      <div className="container mx-auto px-3 md:px-4">
        <div className="flex justify-between items-center h-14 md:h-16">
          <div className="flex items-center">
            <a href="/" className="text-2xl font-bold mr-4 md:mr-8">
              <span className="font-mono">D</span>
            </a>

            <nav className="hidden md:flex space-x-1">
              {links.map(link => {
                const isNetworkStatusPage = pathname === '/network-status';
                const href = isNetworkStatusPage ?
                  `/fix.html?to=${link.href.replace('/', '')}` :
                  link.href;

                return (
                  <a
                    key={link.name}
                    href={href}
                    className={`px-3 py-2 text-sm ${
                      pathname === link.href
                        ? 'bg-white/10 border-b-2 border-white'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    {link.name}
                  </a>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="lg:flex hidden items-center gap-2">
              <ThemeToggle />
            </div>

            <div className="flex items-center">
              <div className="hidden md:flex items-center mr-2">
                <div className="relative w-[120px]">
                  <NetworkDropdown
                    chainId={chainId}
                    isChainSwitching={isChainSwitching}
                    onNetworkChange={handleNetworkChange}
                    width="280px"
                  />
                </div>
              </div>

              {isConnected ? (
                <Button
                  variant="outline"
                  className="h-9 border border-white/20 hover:bg-white/10 text-white rounded-none text-xs whitespace-nowrap"
                  onClick={disconnect}
                >
                  <span className="hidden md:inline mr-2 truncate max-w-[120px]">{formatAddress(address)}</span>
                  <span className="whitespace-nowrap">DISCONNECT</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="h-9 border border-white/20 hover:bg-white/10 text-white rounded-none text-xs whitespace-nowrap"
                  onClick={connect}
                >
                  CONNECT
                </Button>
              )}

              <button
                id="mobile-menu-button"
                className="md:hidden text-white p-2 ml-2"
                onClick={() => setShowMenu(!showMenu)}
                aria-label="Toggle menu"
              >
                {showMenu ? "✕" : "☰"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showMenu && (
        <div
          id="mobile-menu"
          className="md:hidden fixed top-14 right-0 bottom-0 w-[280px] bg-black border-l border-white/10 z-50 transform transition-transform duration-300 overflow-y-auto"
          style={{ boxShadow: "-4px 0 15px rgba(0, 0, 0, 0.5)" }}
        >
          <div className="py-2">
            <div className="flex items-center justify-center gap-2 py-3 border-b border-white/10">
              <NotificationBell />
              <ThemeToggle />
            </div>

            <nav className="flex flex-col">
              {links.map(link => {
                const isNetworkStatusPage = pathname === '/network-status';
                const href = isNetworkStatusPage ?
                  `/fix.html?to=${link.href.replace('/', '')}` :
                  link.href;

                return (
                  <a
                    key={link.name}
                    href={href}
                    className={`px-4 py-3 border-b border-white/10 ${
                      pathname === link.href ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                    onClick={() => setShowMenu(false)}
                  >
                    {link.name}
                  </a>
                );
              })}
            </nav>

            <div className="p-4 border-b border-white/10">
              <p className="text-xs text-white/60 mb-1">NETWORK</p>
              <NetworkDropdown
                chainId={chainId}
                isChainSwitching={isChainSwitching}
                onNetworkChange={handleNetworkChange}
                width="100%"
                mobileView={true}
                onClose={() => setShowMenu(false)}
              />
            </div>

            {isConnected && (
              <div className="p-4 border-b border-white/10">
                <p className="text-xs text-white/60 mb-1">WALLET</p>
                <p className="text-sm font-mono truncate mb-1">{formatAddress(address)}</p>
                <p className="text-xs text-white/80">{balance} {chainId && NETWORKS[chainId]?.symbol}</p>
              </div>
            )}

            <div className="p-4">
              <p className="text-xs text-white/60 mb-2">STATUS</p>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <p className="text-xs">SYSTEM OPERATIONAL</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMenu && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </header>
  );
}
