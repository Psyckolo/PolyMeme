import { storage } from '../storage';
import { generateRationale } from '../lib/openai';
import { getFloorPriceOrFallback } from '../lib/nftfloor';

async function createMilady() {
  const now = new Date();
  const lockTime = new Date(now);
  lockTime.setHours(lockTime.getHours() + 2);
  const endTime = new Date(now);
  endTime.setHours(endTime.getHours() + 24);
  
  const price0 = await getFloorPriceOrFallback("milady");
  console.log(`Milady floor: ${price0} ETH`);
  
  const market = await storage.createMarket({
    assetType: "NFT",
    assetId: "milady",
    assetName: "Milady",
    assetLogo: "https://i.seadn.io/gae/a_frplnavZA9g4vN3SexO5rrtaBX_cBTaJYcgrPtwQIqPhzgzUendQxiwUdr51CGPE2QyPEa1DHnkW1wLrHAv5DgfC3BP-CWpFq6BA?w=500&auto=format",
    direction: "DOWN",
    thresholdBps: 0,
    startTime: now,
    lockTime,
    endTime,
    price0,
    price1: null,
  });
  
  const rationale = await generateRationale("NFT", "Milady", "DOWN", 0, "simulate");
  await storage.createRationale({
    marketId: market.id,
    content: JSON.stringify(rationale.bullets),
    dataMode: "simulate",
  });
  
  console.log(`✅ Milady market created!`);
}

createMilady().then(() => process.exit(0)).catch(console.error);
