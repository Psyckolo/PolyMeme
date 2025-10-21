import { storage } from '../storage';
import { generateRationale } from '../lib/openai';
import { getPriceOrFallback } from '../lib/dexscreener';

async function addTwoTokens() {
  const tokens = [
    { 
      name: "WIF", 
      id: "dogwifhat", 
      logo: "https://dd.dexscreener.com/ds-data/tokens/solana/EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm.png",
      direction: "UP" as const
    },
    { 
      name: "FARTCOIN", 
      id: "fartcoin", 
      logo: "https://dd.dexscreener.com/ds-data/tokens/solana/9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump.png",
      direction: "DOWN" as const
    }
  ];
  
  for (const token of tokens) {
    const now = new Date();
    const lockTime = new Date(now);
    lockTime.setHours(lockTime.getHours() + 2);
    const endTime = new Date(now);
    endTime.setHours(endTime.getHours() + 24);
    
    const price0 = await getPriceOrFallback(token.id);
    console.log(`${token.name} price: $${price0}`);
    
    const market = await storage.createMarket({
      assetType: "TOKEN",
      assetId: token.id,
      assetName: token.name,
      assetLogo: token.logo,
      direction: token.direction,
      thresholdBps: 0,
      startTime: now,
      lockTime,
      endTime,
      price0,
      price1: null,
    });
    
    const rationale = await generateRationale("TOKEN", token.name, token.direction, 0, "simulate");
    await storage.createRationale({
      marketId: market.id,
      content: JSON.stringify(rationale.bullets),
      dataMode: "simulate",
    });
    
    console.log(`✅ ${token.name} ${token.direction} market created!`);
  }
}

addTwoTokens().then(() => process.exit(0)).catch(console.error);
