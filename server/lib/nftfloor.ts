// NFT Floor Price API integration using OpenSea API v2
// Free API, no key required

interface OpenSeaStats {
  total: {
    floor_price: number;
    floor_price_symbol: string;
    floor_price_currency: string;
    one_day_volume: number;
    seven_day_sales: number;
    market_cap: number;
  };
}

interface OpenSeaResponse {
  total: {
    floor_price: number;
    floor_price_symbol: string;
    floor_price_currency: string;
    one_day_volume: number;
    seven_day_sales: number;
    market_cap: number;
  };
}

// NFT collection slugs mapping (ProphetX ID -> OpenSea slug)
const NFT_COLLECTIONS: Record<string, string> = {
  "pudgy-penguins": "pudgypenguins",
  "milady": "milady",
  "azuki": "azuki",
  "doodles-official": "doodles-official",
  "cryptopunks": "cryptopunks",
  "bored-ape-yacht-club": "boredapeyachtclub",
  "degods": "degods",
  "clonex": "clonex",
  "moonbirds": "proof-moonbirds",
  "captainz": "captainz-by-memeland",
  "otherdeed": "otherdeed",
  "meebits": "meebits",
  "remilio": "remilio",
  "sappy-seals": "sappyseals",
  "opepen-edition": "opepen-edition",
  "nakamigos": "nakamigos",
  "bored-ape-kennel-club": "bored-ape-kennel-club",
  "mutant-ape-yacht-club": "mutant-ape-yacht-club",
  "art-blocks": "art-blocks",
  "the-potatoz": "the-potatoz",
  "goblintown-wtf": "goblintownwtf",
};

/**
 * Get NFT collection floor price from OpenSea API v2
 * @param collectionSlug - The collection slug (e.g., "pudgy-penguins", "milady")
 * @returns Floor price in ETH as string or null if not found
 */
export async function getNFTFloorPrice(collectionSlug: string): Promise<string | null> {
  try {
    const openseaSlug = NFT_COLLECTIONS[collectionSlug];
    if (!openseaSlug) {
      console.log(`NFT collection ${collectionSlug} not configured for OpenSea`);
      return null;
    }

    const url = `https://api.opensea.io/api/v2/collections/${openseaSlug}/stats`;
    console.log(`Fetching floor price for ${collectionSlug} from OpenSea:`, url);

    const apiKey = process.env.OPENSEA_API_KEY;
    if (!apiKey) {
      console.error('OPENSEA_API_KEY not found in environment variables');
      return null;
    }

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-API-KEY': apiKey,
      },
    });

    if (!response.ok) {
      console.error(`OpenSea API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: OpenSeaResponse = await response.json();
    
    if (!data.total || data.total.floor_price === undefined) {
      console.log(`No floor price found for ${collectionSlug}`);
      return null;
    }

    const floorPrice = data.total.floor_price;
    const symbol = data.total.floor_price_symbol || 'ETH';
    
    console.log(`${collectionSlug} floor price: ${floorPrice} ${symbol} (OpenSea API)`);
    console.log(`  - 24h volume: ${data.total.one_day_volume} ${symbol}`);
    console.log(`  - 7d sales: ${data.total.seven_day_sales}`);
    
    return floorPrice.toString();
  } catch (error) {
    console.error(`Error fetching floor price for ${collectionSlug}:`, error);
    return null;
  }
}

/**
 * Get NFT floor price with fallback to simulation
 * @param collectionSlug - The collection slug
 * @returns Floor price as string (always returns a value)
 */
export async function getFloorPriceOrFallback(collectionSlug: string): Promise<string> {
  const realPrice = await getNFTFloorPrice(collectionSlug);
  
  if (realPrice) {
    return realPrice;
  }

  // Fallback: simulate a realistic floor price in ETH
  const fallbackPrices: Record<string, number> = {
    "pudgy-penguins": 12.5,
    "milady": 3.2,
    "azuki": 8.5,
    "doodles": 2.8,
    "cryptopunks": 45.0,
    "bored-ape-yacht-club": 28.0,
  };

  const basePrice = fallbackPrices[collectionSlug] || 5.0;
  // Add small random variation (+/- 5%)
  const variation = (Math.random() - 0.5) * 0.1;
  const simulatedPrice = basePrice * (1 + variation);
  
  console.log(`${collectionSlug} simulated floor price: ${simulatedPrice.toFixed(6)} ETH (API unavailable)`);
  return simulatedPrice.toFixed(6);
}

/**
 * Get NFT collection stats including floor price, volume, and sales
 * @param collectionSlug - The collection slug
 * @returns Full stats object or null
 */
export async function getNFTStats(collectionSlug: string): Promise<OpenSeaStats | null> {
  try {
    const openseaSlug = NFT_COLLECTIONS[collectionSlug];
    if (!openseaSlug) {
      return null;
    }

    const apiKey = process.env.OPENSEA_API_KEY;
    if (!apiKey) {
      console.error('OPENSEA_API_KEY not found in environment variables');
      return null;
    }

    const url = `https://api.opensea.io/api/v2/collections/${openseaSlug}/stats`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-API-KEY': apiKey,
      },
    });
    
    if (!response.ok) {
      return null;
    }

    const data: OpenSeaResponse = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching stats for ${collectionSlug}:`, error);
    return null;
  }
}
