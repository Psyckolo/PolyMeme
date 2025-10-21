import { storage } from '../storage';
import { generateRationale } from '../lib/openai';
import { getPriceOrFallback } from '../lib/dexscreener';
import { getFloorPriceOrFallback } from '../lib/nftfloor';

async function createFreshMarkets() {
  console.log('Creating 4 fresh markets with POPCAT UP...');
  
  const assetsToCreate = [
    { 
      type: "TOKEN", 
      name: "POPCAT", 
      id: "popcat", 
      logo: "https://dd.dexscreener.com/ds-data/tokens/solana/7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr.png",
      direction: "UP" // ✅ FORCED TO UP
    },
    { 
      type: "TOKEN", 
      name: "BOME", 
      id: "book-of-meme", 
      logo: "https://dd.dexscreener.com/ds-data/tokens/solana/ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82.png",
      direction: "UP"
    },
    { 
      type: "NFT", 
      name: "Pudgy Penguins", 
      id: "pudgy-penguins", 
      logo: "https://i.seadn.io/gae/jxBFWHcImvkzMfojn1xQ5Xo-weUlex48Q1yG42pR4IW16QGvZ3vX2zTk7YFOIbNrguYwU3FOLiKXGNAhql3XiB_YCoHAROjjT67t?w=500&auto=format",
      direction: "UP"
    },
    { 
      type: "NFT", 
      name: "Milady", 
      id: "milady", 
      logo: "https://i.seadn.io/gae/a_frplnavZA9g4vN3SexO5rrtaBX_cBTaJYcgrPtwQIqPhzgzUendQxiwUdr51CGPE2QyPEa1DHnkW1wLrHAv5DgfC3BP-CWpFq6BA?w=500&auto=format",
      direction: "DOWN"
    }
  ];
  
  for (const asset of assetsToCreate) {
    const now = new Date();
    const startTime = new Date(now);
    
    // Lock time is 2 hours from now - T+2h
    const lockTime = new Date(now);
    lockTime.setHours(lockTime.getHours() + 2);
    
    // End time is 24 hours from now - T+24h
    const endTime = new Date(now);
    endTime.setHours(endTime.getHours() + 24);
    
    // Get real price
    let price0 = "0";
    if (asset.type === "TOKEN") {
      price0 = await getPriceOrFallback(asset.id);
      console.log(`${asset.name} starting price: $${price0}`);
    } else {
      price0 = await getFloorPriceOrFallback(asset.id);
      console.log(`${asset.name} starting floor price: ${price0} ETH`);
    }
    
    const market = await storage.createMarket({
      assetType: asset.type,
      assetId: asset.id,
      assetName: asset.name,
      assetLogo: asset.logo,
      direction: asset.direction,
      thresholdBps: 0,
      startTime,
      lockTime,
      endTime,
      price0,
      price1: null,
    });
    
    // Generate AI rationale
    const rationaleData = await generateRationale(
      asset.type,
      asset.name,
      asset.direction,
      0,
      "simulate"
    );
    
    await storage.createRationale({
      marketId: market.id,
      content: JSON.stringify(rationaleData.bullets),
      dataMode: "simulate",
    });
    
    console.log(`✅ Market created: ${asset.name} ${asset.direction} (lock at ${lockTime.toISOString()})`);
  }
  
  console.log('✅ All 4 fresh markets created!');
}

createFreshMarkets()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
