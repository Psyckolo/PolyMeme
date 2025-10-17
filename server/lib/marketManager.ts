import cron from "node-cron";
import { storage } from "../storage";
import { generateRationale } from "./openai";
import { getPriceOrFallback, getTokenPrice } from "./dexscreener";
import { getFloorPriceOrFallback } from "./nftfloor";

const ASSETS = [
  { type: "TOKEN", name: "PEPE", id: "pepe", logo: "https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg" },
  { type: "TOKEN", name: "WIF", id: "dogwifhat", logo: "https://assets.coingecko.com/coins/images/33566/small/dogwifhat.jpg" },
  { type: "TOKEN", name: "DOGE", id: "dogecoin", logo: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png" },
  { type: "TOKEN", name: "BONK", id: "bonk", logo: "https://assets.coingecko.com/coins/images/28600/small/bonk.jpg" },
  { type: "NFT", name: "Pudgy Penguins", id: "pudgy-penguins", logo: "https://i.seadn.io/gae/yNi-XdGxsgQCPpqSio4o31ygAV6wURdIdInWRcFIl46UjUQ1eV7BEndGe8L661OoG-clRi7EgInLX4LPu9Jfw4fq0bnVYHqg7RFi?w=500" },
  { type: "NFT", name: "Milady", id: "milady", logo: "https://i.seadn.io/gae/a_frplnavZA9g4vN3SexO5rrtaBX_cBTaJYcgrPtwQIqPhzgzUendQxiwUdr51CGPE2QyPEa1DHnkW1wLrHAv5DgTFPJqv5TdUQAqw?w=500" },
];

export async function createDailyMarket() {
  try {
    console.log("Creating daily market...");
    
    // Select random asset
    const randomAsset = ASSETS[Math.floor(Math.random() * ASSETS.length)];
    const direction = Math.random() > 0.5 ? "UP" : "DOWN";
    const thresholdBps = Math.random() > 0.7 ? 300 : 500; // 3% or 5%
    
    const now = new Date();
    const startTime = new Date(now);
    
    // Lock time is 12 hours from now (when betting closes)
    const lockTime = new Date(now);
    lockTime.setHours(lockTime.getHours() + 12);
    
    // End time is 24 hours from now (when market settles)
    const endTime = new Date(now);
    endTime.setHours(endTime.getHours() + 24);
    
    // Get real price from DexScreener or NFT floor price API
    let price0 = "0";
    if (randomAsset.type === "TOKEN") {
      price0 = await getPriceOrFallback(randomAsset.id);
      console.log(`${randomAsset.name} starting price: $${price0}`);
    } else {
      // For NFTs, get floor price (currently simulated)
      price0 = await getFloorPriceOrFallback(randomAsset.id);
      console.log(`${randomAsset.name} starting floor price: ${price0} ETH`);
    }
    
    const market = await storage.createMarket({
      assetType: randomAsset.type,
      assetId: randomAsset.id,
      assetName: randomAsset.name,
      assetLogo: randomAsset.logo,
      direction,
      thresholdBps,
      startTime,
      lockTime,
      endTime,
      price0,
      price1: null,
    });
    
    // Generate AI rationale
    const rationaleData = await generateRationale(
      randomAsset.type,
      randomAsset.name,
      direction,
      thresholdBps / 100,
      "simulate"
    );
    
    await storage.createRationale({
      marketId: market.id,
      content: JSON.stringify(rationaleData.bullets),
      dataMode: "simulate",
    });
    
    console.log(`Market created: ${randomAsset.name} ${direction} ${thresholdBps / 100}%`);
    return market;
  } catch (error) {
    console.error("Error creating daily market:", error);
  }
}

export async function settleMarket(marketId: string) {
  try {
    console.log(`Settling market ${marketId}...`);
    
    const market = await storage.getMarket(marketId);
    if (!market || market.status === "SETTLED") {
      return;
    }
    
    const price0 = parseFloat(market.price0 || "0");
    const thresholdPercent = market.thresholdBps / 100;
    
    // Get real ending price for tokens
    let price1 = price0;
    if (market.assetType === "TOKEN") {
      const realPrice = await getTokenPrice(market.assetId);
      if (realPrice) {
        price1 = parseFloat(realPrice);
        console.log(`Real ending price for ${market.assetName}: $${price1}`);
      } else {
        // Fallback: simulate if API fails
        const randomFactor = (Math.random() - 0.5) * 2;
        const actualMove = thresholdPercent * (0.8 + randomFactor * 0.6);
        price1 = market.direction === "UP"
          ? price0 * (1 + actualMove / 100)
          : price0 * (1 - actualMove / 100);
        console.log(`Simulated ending price (API unavailable): $${price1}`);
      }
    } else {
      // For NFTs, get ending floor price (currently simulated)
      const realFloor = await getFloorPriceOrFallback(market.assetId);
      if (realFloor) {
        price1 = parseFloat(realFloor);
        console.log(`Real ending floor price for ${market.assetName}: ${price1} ETH`);
      } else {
        // Fallback: simulate if API fails
        const randomFactor = (Math.random() - 0.5) * 2;
        const actualMove = thresholdPercent * (0.8 + randomFactor * 0.6);
        price1 = market.direction === "UP"
          ? price0 * (1 + actualMove / 100)
          : price0 * (1 - actualMove / 100);
        console.log(`Simulated ending floor price (API unavailable): ${price1} ETH`);
      }
    }
    
    // Determine winner
    const actualPercent = ((price1 - price0) / price0) * 100;
    let winner: "RIGHT" | "WRONG" | "TIE" = "WRONG";
    
    if (market.direction === "UP") {
      winner = actualPercent >= thresholdPercent ? "RIGHT" : "WRONG";
    } else {
      winner = actualPercent <= -thresholdPercent ? "RIGHT" : "WRONG";
    }
    
    // Check for tie (within 0.1% of threshold)
    if (Math.abs(Math.abs(actualPercent) - thresholdPercent) < 0.1) {
      winner = "TIE";
    }
    
    await storage.updateMarket(marketId, {
      price1: price1.toFixed(6),
      status: "SETTLED",
      winner,
      settledAt: new Date(),
    });
    
    console.log(`Market settled: Winner = ${winner}, Price: $${price0} → ${price1.toFixed(6)} (${actualPercent.toFixed(2)}%)`);
  } catch (error) {
    console.error("Error settling market:", error);
  }
}

export async function lockMarket(marketId: string) {
  try {
    const market = await storage.getMarket(marketId);
    if (!market || market.status !== "OPEN") {
      return;
    }
    
    await storage.updateMarket(marketId, {
      status: "LOCKED",
    });
    
    console.log(`Market ${marketId} locked`);
  } catch (error) {
    console.error("Error locking market:", error);
  }
}

export async function createMultipleMarkets(count: number = 4) {
  console.log(`Creating ${count} markets...`);
  
  // Shuffle assets to ensure diversity
  const shuffledAssets = [...ASSETS].sort(() => Math.random() - 0.5);
  const assetsToUse = shuffledAssets.slice(0, Math.min(count, ASSETS.length));
  
  for (const asset of assetsToUse) {
    const direction = Math.random() > 0.5 ? "UP" : "DOWN";
    const thresholdBps = Math.random() > 0.7 ? 300 : 500;
    
    const now = new Date();
    const startTime = new Date(now);
    const lockTime = new Date(now);
    lockTime.setHours(lockTime.getHours() + 12);
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
      direction,
      thresholdBps,
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
      direction,
      thresholdBps / 100,
      "simulate"
    );
    
    await storage.createRationale({
      marketId: market.id,
      content: JSON.stringify(rationaleData.bullets),
      dataMode: "simulate",
    });
    
    console.log(`Market created: ${asset.name} ${direction} ${thresholdBps / 100}%`);
    
    // Small delay between creations
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`${assetsToUse.length} markets created`);
}

export function startMarketScheduler() {
  // Create daily markets at 9 AM (4 markets)
  cron.schedule("0 9 * * *", async () => {
    await createMultipleMarkets(4);
  });
  
  // Check for markets to lock every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    const markets = await storage.getAllMarkets();
    const now = new Date();
    
    for (const market of markets) {
      if (market.status === "OPEN" && now > new Date(market.lockTime)) {
        await lockMarket(market.id);
      }
      
      if (market.status === "LOCKED" && now > new Date(market.endTime)) {
        await settleMarket(market.id);
      }
    }
  });
  
  console.log("Market scheduler started");
  
  // Create initial markets if needed (ensure 4 active markets)
  setTimeout(async () => {
    const markets = await storage.getAllMarkets();
    const activeMarkets = markets.filter(m => m.status === "OPEN");
    
    if (activeMarkets.length === 0) {
      await createMultipleMarkets(4);
    } else if (activeMarkets.length < 4) {
      // Top up to 4 active markets
      await createMultipleMarkets(4 - activeMarkets.length);
    }
  }, 1000);
}
