import { storage } from '../storage';
import { generateRationale } from '../lib/openai';
import { getPriceOrFallback } from '../lib/dexscreener';

async function addFartcoin() {
  const now = new Date();
  const lockTime = new Date(now);
  lockTime.setHours(lockTime.getHours() + 2);
  const endTime = new Date(now);
  endTime.setHours(endTime.getHours() + 24);
  
  const price0 = await getPriceOrFallback("fartcoin");
  console.log(`FARTCOIN price: $${price0}`);
  
  const market = await storage.createMarket({
    assetType: "TOKEN",
    assetId: "fartcoin",
    assetName: "FARTCOIN",
    assetLogo: "https://dd.dexscreener.com/ds-data/tokens/solana/9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump.png",
    direction: "DOWN",
    thresholdBps: 0,
    startTime: now,
    lockTime,
    endTime,
    price0,
    price1: null,
  });
  
  const rationale = await generateRationale("TOKEN", "FARTCOIN", "DOWN", 0, "simulate");
  await storage.createRationale({
    marketId: market.id,
    content: JSON.stringify(rationale.bullets),
    dataMode: "simulate",
  });
  
  console.log(`✅ FARTCOIN DOWN created!`);
}

addFartcoin().then(() => process.exit(0)).catch(console.error);
