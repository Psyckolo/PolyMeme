// DexScreener API integration for real-time token prices
// Free API, no key required

interface DexPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  volume: {
    h24: number;
  };
  priceChange: {
    h24: number;
  };
  liquidity: {
    usd: number;
  };
}

interface DexScreenerResponse {
  schemaVersion: string;
  pairs: DexPair[];
}

// Token mint addresses (Solana) or contract addresses (Ethereum)
export const TOKEN_ADDRESSES: Record<string, { address: string; chain: string }> = {
  "bonk": { 
    address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", 
    chain: "solana" 
  },
  "dogwifhat": { 
    address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", 
    chain: "solana" 
  },
  "pepe": { 
    address: "0x6982508145454Ce325dDbE47a25d4ec3d2311933", 
    chain: "ethereum" 
  },
  "dogecoin": {
    // Wrapped DOGE on Ethereum or Solana
    address: "0xba2ae424d960c26247dd6c32edc70b295c744c43",
    chain: "ethereum"
  },
};

/**
 * Fetch current price for a token from DexScreener
 * @param tokenId - The token ID (e.g., "bonk", "pepe")
 * @returns USD price as string or null if not found
 */
export async function getTokenPrice(tokenId: string): Promise<string | null> {
  try {
    const tokenConfig = TOKEN_ADDRESSES[tokenId];
    if (!tokenConfig) {
      console.log(`Token ${tokenId} not configured for DexScreener`);
      return null;
    }

    const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenConfig.address}`;
    console.log(`Fetching price for ${tokenId} from DexScreener:`, url);

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`DexScreener API error: ${response.status}`);
      return null;
    }

    const data: DexScreenerResponse = await response.json();
    
    if (!data.pairs || data.pairs.length === 0) {
      console.log(`No pairs found for ${tokenId}`);
      return null;
    }

    // Get the pair with highest liquidity (most reliable)
    const bestPair = data.pairs.reduce((prev, current) => 
      (current.liquidity?.usd || 0) > (prev.liquidity?.usd || 0) ? current : prev
    );

    const price = bestPair.priceUsd;
    console.log(`${tokenId} price: $${price} (from ${bestPair.dexId} on ${bestPair.chainId})`);
    
    return price;
  } catch (error) {
    console.error(`Error fetching price for ${tokenId}:`, error);
    return null;
  }
}

/**
 * Fetch price change percentage for a token in the last 24h
 * @param tokenId - The token ID
 * @returns Price change percentage or null
 */
export async function getTokenPriceChange(tokenId: string): Promise<number | null> {
  try {
    const tokenConfig = TOKEN_ADDRESSES[tokenId];
    if (!tokenConfig) {
      return null;
    }

    const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenConfig.address}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }

    const data: DexScreenerResponse = await response.json();
    
    if (!data.pairs || data.pairs.length === 0) {
      return null;
    }

    const bestPair = data.pairs.reduce((prev, current) => 
      (current.liquidity?.usd || 0) > (prev.liquidity?.usd || 0) ? current : prev
    );

    return bestPair.priceChange?.h24 || null;
  } catch (error) {
    console.error(`Error fetching price change for ${tokenId}:`, error);
    return null;
  }
}

/**
 * Get current price or return a simulated price as fallback
 * @param tokenId - The token ID
 * @returns Price as string (always returns a value)
 */
export async function getPriceOrFallback(tokenId: string): Promise<string> {
  const realPrice = await getTokenPrice(tokenId);
  
  if (realPrice) {
    return realPrice;
  }

  // Fallback: simulate a realistic price
  const basePrice = Math.random() * 0.1 + 0.001; // Between $0.001 and $0.101
  return basePrice.toFixed(6);
}
