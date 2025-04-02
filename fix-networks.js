const fs = require('fs');
const path = require('path');

const navbarPath = path.join(process.cwd(), 'src/components/navbar.tsx');
const content = fs.readFileSync(navbarPath, 'utf8');

// Find the filteredNetworks useMemo function
const startMarker = '// Memoized filtering and sorting of networks';
const endMarker = 'return networksArr;';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker, startIdx) + endMarker.length;

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find the filteredNetworks useMemo function in the navbar.tsx file');
  process.exit(1);
}

// The existing function code
const oldCode = content.substring(startIdx, endIdx);

// The new function code with Ethereum deduplication
const newCode = `// Memoized filtering and sorting of networks
  const filteredNetworks = useMemo(() => {
    // Start with networks from the NETWORKS object
    let networksArr = Object.entries(NETWORKS);
    
    // Create a Map to track unique chainIds and prevent duplicates
    const uniqueNetworks = new Map();
    
    // Add each network to the map using chainId as the key
    networksArr.forEach(([id, network]) => {
      uniqueNetworks.set(parseInt(id), [id, network]);
    });
    
    // Convert back to array format
    networksArr = Array.from(uniqueNetworks.values());

    // Apply search filter if there's a search term
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

    // Sort: first by favorites, then by status, then by latency if available, then alphabetically
    networksArr.sort((a, b) => {
      const aId = parseInt(a[0]);
      const bId = parseInt(b[0]);

      // Sort by favorites first
      const aIsFavorite = isFavorite(aId);
      const bIsFavorite = isFavorite(bId);

      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;

      // Then sort by status
      const getStatusPriority = (status?: NetworkStatus) => {
        if (!status) return 3;
        return status === 'online' ? 0 : status === 'degraded' ? 1 : 2;
      };

      const aStatusPriority = getStatusPriority(a[1].status);
      const bStatusPriority = getStatusPriority(b[1].status);

      if (aStatusPriority !== bStatusPriority) {
        return aStatusPriority - bStatusPriority;
      }

      // Then sort by latency if available
      const aSpeed = getNetworkSpeed(aId);
      const bSpeed = getNetworkSpeed(bId);

      if (aSpeed?.success && bSpeed?.success) {
        return aSpeed.latency - bSpeed.latency;
      }

      // Finally sort alphabetically
      return a[1].name.localeCompare(b[1].name);
    });

    // Filter out the first Ethereum entry if more than one exists
    // This is a specific workaround for the issue with duplicate Ethereum entries
    const ethereumEntries = networksArr.filter(([_, network]) => network.name === 'Ethereum');
    
    if (ethereumEntries.length > 1) {
      // If there are multiple Ethereum entries, keep only one (the selected one)
      // Remove all Ethereum entries except the one that's currently selected (if any)
      const selectedEthereumEntry = networksArr.find(([id]) => parseInt(id) === chainId && ethereumEntries.some(([eId]) => eId === id));
      
      // If there's a selected Ethereum entry, keep only that one
      if (selectedEthereumEntry) {
        networksArr = networksArr.filter(([id, network]) => 
          network.name !== 'Ethereum' || id === selectedEthereumEntry[0]
        );
      } else {
        // Otherwise, keep only the first Ethereum entry (chainId 1)
        let foundFirst = false;
        networksArr = networksArr.filter(([id, network]) => {
          if (network.name !== 'Ethereum') return true;
          if (!foundFirst) {
            foundFirst = true;
            return true;
          }
          return false;
        });
      }
    }
    
    return networksArr;`;

// Replace the old code with the new code
const newContent = content.substring(0, startIdx) + newCode + content.substring(endIdx);

// Write the updated content back to the file
fs.writeFileSync(navbarPath, newContent, 'utf8');

console.log('Successfully updated the filteredNetworks function in navbar.tsx');
