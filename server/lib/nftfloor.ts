// NFT Floor Price API integration
// NOTE: Reservoir API is shutting down in October 2025
// TODO: Migrate to alternative (Alchemy or NFT Price Floor API)

interface CollectionStats {
  collection: string;
  floorAsk: {
    price: {
      amount: {
        native: number;
      };
    };
  } | null;
}

/**
 * Get NFT collection floor price from Reservoir API
 * Currently simulated due to Reservoir shutdown
 * TODO: Implement with Alchemy getFloorPrice API or similar
 */
export async function getNFTFloorPrice(collectionSlug: string): Promise<string | null> {
  try {
    // Map collection slugs to contract addresses
    const contractMap: Record<string, string> = {
      "pudgy-penguins": "0xbd3531da5cf5857e7cfaa92426877b022e612cf8",
      "milady": "0x5af0d9827e0c53e4799bb226655a1de152a425a5",
      "azuki": "0xed5af388653567af2f388e6224dc7c4b3241c544",
      "bored-ape-yacht-club": "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
    };

    const contractAddress = contractMap[collectionSlug];
    if (!contractAddress) {
      console.log(`No contract address mapped for ${collectionSlug}, simulating floor price`);
      // Simulate floor price
      const basePrice = Math.random() * 5 + 1; // Between 1-6 ETH
      return basePrice.toFixed(6);
    }

    // TODO: Replace with actual Reservoir or Alchemy API call
    // For now, simulate floor prices
    const floorPrices: Record<string, number> = {
      "pudgy-penguins": 12.5,
      "milady": 3.2,
      "azuki": 8.7,
      "bored-ape-yacht-club": 24.3,
    };

    const floorPrice = floorPrices[collectionSlug] || Math.random() * 5 + 1;
    console.log(`${collectionSlug} simulated floor price: ${floorPrice.toFixed(2)} ETH`);
    
    return floorPrice.toFixed(6);
    
    /* TODO: Implement real API call like this:
    const apiKey = process.env.RESERVOIR_API_KEY || "demo-api-key";
    const url = `https://api.reservoir.tools/collections/v7?id=${contractAddress}`;
    
    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Reservoir API error: ${response.status}`);
    }

    const data = await response.json();
    const collection = data.collections?.[0];
    
    if (collection?.floorAsk?.price?.amount?.native) {
      const floorPrice = collection.floorAsk.price.amount.native;
      console.log(`${collectionSlug} floor price: ${floorPrice} ETH`);
      return floorPrice.toString();
    }

    return null;
    */
  } catch (error) {
    console.error(`Error fetching floor price for ${collectionSlug}:`, error);
    // Fallback to simulated price
    const fallbackPrice = Math.random() * 5 + 1;
    return fallbackPrice.toFixed(6);
  }
}

/**
 * Get NFT floor price with fallback to simulation
 */
export async function getFloorPriceOrFallback(collectionSlug: string): Promise<string> {
  const price = await getNFTFloorPrice(collectionSlug);
  if (price) {
    return price;
  }
  
  // Fallback
  const fallbackPrice = Math.random() * 5 + 1;
  return fallbackPrice.toFixed(6);
}
