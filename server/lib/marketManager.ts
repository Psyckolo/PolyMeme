import cron from "node-cron";
import { storage } from "../storage";
import { generateRationale } from "./openai";

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
    startTime.setHours(9, 0, 0, 0);
    
    const lockTime = new Date(startTime);
    lockTime.setMinutes(lockTime.getMinutes() + 30);
    
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 24);
    
    // Simulate price0 (starting price)
    const basePrice = Math.random() * 100 + 10;
    const price0 = basePrice.toFixed(6);
    
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
    
    // Simulate price1 (ending price) based on direction
    const price0 = parseFloat(market.price0 || "0");
    const thresholdPercent = market.thresholdBps / 100;
    
    // Simulate price movement
    const randomFactor = (Math.random() - 0.5) * 2; // -1 to 1
    const actualMove = thresholdPercent * (0.8 + randomFactor * 0.6); // ±40% variation
    
    const price1 = market.direction === "UP"
      ? price0 * (1 + actualMove / 100)
      : price0 * (1 - actualMove / 100);
    
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
    
    console.log(`Market settled: Winner = ${winner}, Price: ${price0} → ${price1.toFixed(6)}`);
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

export function startMarketScheduler() {
  // Create daily market at 9 AM
  cron.schedule("0 9 * * *", async () => {
    await createDailyMarket();
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
  
  // Create initial market if none exists
  setTimeout(async () => {
    const todayMarket = await storage.getTodayMarket();
    if (!todayMarket) {
      await createDailyMarket();
    }
  }, 1000);
}
