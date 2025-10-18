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
  // Solana Tokens
  "bonk": { 
    address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", 
    chain: "solana" 
  },
  "dogwifhat": { 
    address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", 
    chain: "solana" 
  },
  "popcat": {
    address: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
    chain: "solana"
  },
  "peanut-the-squirrel": {
    address: "2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump",
    chain: "solana"
  },
  "goatseus-maximus": {
    address: "CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump",
    chain: "solana"
  },
  "cat-in-a-dogs-world": {
    address: "MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5",
    chain: "solana"
  },
  "just-a-chill-guy": {
    address: "Df6yfrKC8kZE3KNkrHERKzAetSxbrWeniQfyJY4Jpump",
    chain: "solana"
  },
  "act-i-the-ai-prophecy": {
    address: "GJAFwWjJ3vnTsrQVabjBVK2TYB1YtRCQXRDfDgUnpump",
    chain: "solana"
  },
  
  // Ethereum Tokens
  "pepe": { 
    address: "0x6982508145454Ce325dDbE47a25d4ec3d2311933", 
    chain: "ethereum" 
  },
  "shiba-inu": {
    address: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
    chain: "ethereum"
  },
  "brett": {
    address: "0x532f27101965dd16442E59d40670FaF5eBB142E4",
    chain: "base"
  },
  "mog-coin": {
    address: "0xaaeE1A9723aaDB7afA2810263653A34bA2C21C7a",
    chain: "ethereum"
  },
  "turbo": {
    address: "0xA35923162C49cF95e6BF26623385eb431ad920D3",
    chain: "ethereum"
  },
  "dogecoin": {
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
