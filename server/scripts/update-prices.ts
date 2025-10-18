// Script to update price0 for all markets with real prices from APIs
import { db } from '../db';
import { markets } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { getTokenPrice } from '../lib/dexscreener';
import { getNFTFloorPrice } from '../lib/nftfloor';

async function updateMarketPrices() {
  console.log('Fetching all markets with price0 = 0...');
  
  const allMarkets = await db
    .select()
    .from(markets)
    .where(eq(markets.price0, '0'));
  
  console.log(`Found ${allMarkets.length} markets to update`);
  
  for (const market of allMarkets) {
    try {
      console.log(`\nUpdating ${market.assetName} (${market.assetType})...`);
      
      let price0: string | null = null;
      
      if (market.assetType === 'NFT') {
        // Fetch NFT floor price from OpenSea
        price0 = await getNFTFloorPrice(market.assetId);
      } else {
        // Fetch token price from DexScreener
        price0 = await getTokenPrice(market.assetId);
      }
      
      if (price0) {
        await db
          .update(markets)
          .set({ price0 })
          .where(eq(markets.id, market.id));
        
        console.log(`✅ Updated ${market.assetName}: price0 = ${price0}`);
      } else {
        console.log(`⚠️  Could not fetch price for ${market.assetName}, skipping...`);
      }
      
      // Rate limit: wait 1 second between API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Error updating ${market.assetName}:`, error);
    }
  }
  
  console.log('\n✅ Price update complete!');
  process.exit(0);
}

updateMarketPrices().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
