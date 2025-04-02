// ... existing code ... <imports, constants, etc.>

/**
 * Get coin icon URL from CoinGecko
 */
export async function getCoinIcon(coinName: string): Promise<string> {
  const normalizedName = coinName.toUpperCase().trim();

  // Check cache first
  if (iconCache[normalizedName] && Date.now() - iconCache[normalizedName].timestamp < ICON_CACHE_DURATION) {
    return iconCache[normalizedName].url;
  }

  try {
    const coinId = chainIdMap[normalizedName];

    if (!coinId) {
      console.warn(`No CoinGecko ID mapping for ${normalizedName}`);
      // Return fallback icon URL for unknown coins
      return `/icons/generic-coin.svg`;
    }

    // For known chains, we can directly use CoinGecko's API
    const coinData = await client.coinId({ id: coinId });

    if (coinData && coinData.image && coinData.image.small) {
      // Cache the icon URL
      iconCache[normalizedName] = {
        url: coinData.image.small,
        timestamp: Date.now()
      };

      return coinData.image.small;
    } else {
      throw new Error(`No icon found for ${normalizedName}`);
    }
  } catch (error) {
    console.error(`Error fetching icon for ${normalizedName}:`, error);

    // Fallback to generic icon
    const fallbackUrl = `/icons/generic-coin.svg`;

    // Cache the fallback URL to avoid repeated failed requests
    iconCache[normalizedName] = {
      url: fallbackUrl,
      timestamp: Date.now()
    };

    return fallbackUrl;
  }
}

/**
 * Get multiple coin icons at once
 */
export async function getCoinIcons(coinNames: string[]): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  // Process coins in parallel for efficiency
  await Promise.all(
    coinNames.map(async (name) => {
      try {
        results[name] = await getCoinIcon(name);
      } catch (error) {
        console.error(`Error fetching icon for ${name}:`, error);
        // Use a generic placeholder for failed icons
        results[name] = `/icons/generic-coin.svg`;
      }
    })
  );

  return results;
}

// ... existing code ... <remaining functions>
