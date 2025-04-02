import React, { useState, useEffect, useMemo } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { NETWORKS, NetworkStatus } from '@/lib/ethereum';
import NetworkStatusIndicator from './network-status-indicator';
import { useChainFavorites } from '@/lib/chain-favorites';
import { useNetworkSpeed } from '@/lib/network-speed';

interface NetworkDropdownProps {
  chainId: number | null;
  isChainSwitching: boolean;
  onNetworkChange: (networkId: number) => void;
  width?: string;
  mobileView?: boolean;
  onClose?: () => void;
}

export default function NetworkDropdown({
  chainId,
  isChainSwitching,
  onNetworkChange,
  width = "280px",
  mobileView = false,
  onClose
}: NetworkDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [networkSearch, setNetworkSearch] = useState('');
  const { isFavorite } = useChainFavorites();
  const { getNetworkSpeed } = useNetworkSpeed();

  const currentNetwork = useMemo(() => {
    return chainId && NETWORKS[chainId] ? NETWORKS[chainId] : NETWORKS[1];
  }, [chainId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredNetworks = useMemo(() => {
    let networksArr = Object.entries(NETWORKS);
    const uniqueNetworks = new Map();

    networksArr.forEach(([id, network]) => {
      uniqueNetworks.set(parseInt(id), [id, network]);
    });

    networksArr = Array.from(uniqueNetworks.values());

    if (networkSearch) {
      const searchTerm = networkSearch.toLowerCase();
      networksArr = networksArr.filter(([id, network]) =>
        network.name.toLowerCase().includes(searchTerm) ||
        id.includes(searchTerm) ||
        (network.features && network.features.some(feature =>
          feature.toLowerCase().includes(searchTerm)
        ))
      );
    }

    networksArr.sort((a, b) => {
      const aId = parseInt(a[0]);
      const bId = parseInt(b[0]);

      const aIsFavorite = isFavorite(aId);
      const bIsFavorite = isFavorite(bId);

      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;

      const getStatusPriority = (status?: NetworkStatus) => {
        if (!status) return 3;
        return status === 'online' ? 0 : status === 'degraded' ? 1 : 2;
      };

      const aStatusPriority = getStatusPriority(a[1].status);
      const bStatusPriority = getStatusPriority(b[1].status);

      if (aStatusPriority !== bStatusPriority) {
        return aStatusPriority - bStatusPriority;
      }

      const aSpeed = getNetworkSpeed(aId);
      const bSpeed = getNetworkSpeed(bId);

      if (aSpeed?.success && bSpeed?.success) {
        return aSpeed.latency - bSpeed.latency;
      }

      return a[1].name.localeCompare(b[1].name);
    });

    return networksArr;
  }, [networkSearch, isFavorite, getNetworkSpeed]);

  const handleSelect = (id: string) => {
    const networkId = parseInt(id);
    if (!isNaN(networkId)) {
      onNetworkChange(networkId);
      setIsOpen(false);
      if (onClose) onClose();
    }
  };

  return (
    <div
      className="relative"
      data-dropdown
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-8 border border-white/20 bg-black/80 backdrop-blur-sm text-xs rounded-md
                  transition-all duration-200 hover:border-white/40 hover:bg-black/90 focus:border-white/50 focus:ring-0
                  flex items-center justify-between px-2 py-1"
      >
        <div className="flex items-center space-x-1">
          {isChainSwitching ? (
            <div className="flex items-center space-x-1">
              <div className="w-3.5 h-3.5 rounded-full animate-pulse bg-white/20"></div>
              <span className="animate-pulse">Switching...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              {chainId && NETWORKS[chainId] ? (
                <>
                  <img
                    src={NETWORKS[chainId].logoUrl}
                    alt={NETWORKS[chainId].name}
                    className="w-3.5 h-3.5 rounded-full mr-1"
                  />
                  <span className="truncate">{NETWORKS[chainId].name}</span>
                </>
              ) : (
                <span className="truncate">Select</span>
              )}
            </div>
          )}
          <ChevronDown className={`h-3.5 w-3.5 opacity-50 flex-shrink-0 transition-transform duration-200 ml-1 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
        </div>
      </button>

      {isOpen && (
        <div
          className={`absolute z-[9999] top-full left-0 mt-1 rounded-md border border-white/20 bg-black/95 shadow-md`}
          style={{
            width: width,
            maxHeight: '60vh',
            overflowY: 'auto'
          }}
        >
          {/* Optional search field */}
          {filteredNetworks.length > 5 && (
            <div className="p-2 border-b border-white/10">
              <input
                type="text"
                placeholder="Search networks..."
                value={networkSearch}
                onChange={(e) => setNetworkSearch(e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded-sm p-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/30"
              />
            </div>
          )}

          {filteredNetworks.map(([id, network]) => {
            const numericId = parseInt(id);
            const isSelected = chainId === numericId;

            return (
              <div
                key={id}
                className={`${isSelected ? 'bg-white/10' : 'hover:bg-white/5'} px-2 py-1.5 cursor-pointer flex items-center`}
                onClick={() => handleSelect(id)}
              >
                <NetworkStatusIndicator status={network.status} size="sm" />
                <img
                  src={network.logoUrl}
                  alt={network.name}
                  className="w-4 h-4 rounded-full object-contain mr-2"
                />
                <span className="text-sm flex-1 truncate">{network.name}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-green-400 ml-auto" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
