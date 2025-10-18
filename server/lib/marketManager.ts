import cron from "node-cron";
import { storage } from "../storage";
import { generateRationale } from "./openai";
import { getPriceOrFallback, getTokenPrice } from "./dexscreener";
import { getFloorPriceOrFallback } from "./nftfloor";

// ✅ Real logos from DexScreener CDN (solana tokens)
const SOLANA_TOKENS = [
  { type: "TOKEN", name: "BONK", id: "bonk", logo: "https://dd.dexscreener.com/ds-data/tokens/solana/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263.png" },
  { type: "TOKEN", name: "WIF", id: "dogwifhat", logo: "https://dd.dexscreener.com/ds-data/tokens/solana/EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm.png" },
  { type: "TOKEN", name: "POPCAT", id: "popcat", logo: "https://dd.dexscreener.com/ds-data/tokens/solana/7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr.png" },
  { type: "TOKEN", name: "PNUT", id: "peanut-the-squirrel", logo: "https://dd.dexscreener.com/ds-data/tokens/solana/2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump.png" },
  { type: "TOKEN", name: "GOAT", id: "goatseus-maximus", logo: "https://dd.dexscreener.com/ds-data/tokens/solana/CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump.png" },
  { type: "TOKEN", name: "MEW", id: "cat-in-a-dogs-world", logo: "https://dd.dexscreener.com/ds-data/tokens/solana/MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5.png" },
  { type: "TOKEN", name: "FARTCOIN", id: "fartcoin", logo: "https://dd.dexscreener.com/ds-data/tokens/solana/9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump.png" },
  { type: "TOKEN", name: "CHILLGUY", id: "just-a-chill-guy", logo: "https://dd.dexscreener.com/ds-data/tokens/solana/Df6yfrKC8kZE3KNkrHERKzAetSxbrWeniQfyJY4Jpump.png" },
  { type: "TOKEN", name: "MOODENG", id: "moo-deng", logo: "https://dd.dexscreener.com/ds-data/tokens/solana/ED5nyyWEzpPPiWimP8vYm7sD7TD3LAt3Q3gRTWHzPJBY.png" },
  { type: "TOKEN", name: "GIGA", id: "giga", logo: "https://dd.dexscreener.com/ds-data/tokens/solana/63LfDmNb3MQ8mw9MtZ2To9bEA2M71kZUUGq5tiJxcqj9.png" },
  { type: "TOKEN", name: "ACT", id: "act-i-the-ai-prophecy", logo: "https://dd.dexscreener.com/ds-data/tokens/solana/GJAFwWjJ3vnTsrQVabjBVK2TYB1YtRCQXRDfDgUnpump.png" },
  { type: "TOKEN", name: "FWOG", id: "fwog", logo: "https://dd.dexscreener.com/ds-data/tokens/solana/A8C3xuqscfmyLrte3VmTqrAq8kgMASius9AFNANwpump.png" },
  { type: "TOKEN", name: "SLERF", id: "slerf", logo: "https://dd.dexscreener.com/ds-data/tokens/solana/7BgBvyjrZX1YKz4oh9mjb8ZScatkkwb8DzFx7LoiVkM3.png" },
  { type: "TOKEN", name: "BOME", id: "book-of-meme", logo: "https://dd.dexscreener.com/ds-data/tokens/solana/ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82.png" },
  { type: "TOKEN", name: "MICHI", id: "michicoin", logo: "https://dd.dexscreener.com/ds-data/tokens/solana/5mbK36SZ7J19An8jFochhQS4of8g6BwUjbeCSxBSoWdp.png" },
  { type: "TOKEN", name: "PENG", id: "peng", logo: "https://dd.dexscreener.com/ds-data/tokens/solana/2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv.png" },
  { type: "TOKEN", name: "SCF", id: "smoking-chicken-fish", logo: "https://dd.dexscreener.com/ds-data/tokens/solana/4LLbsb5ReP3yEtYzmXewyGjcir5uXtKFURtaEUVC2AHs.png" },
  { type: "TOKEN", name: "PONKE", id: "ponke", logo: "https://dd.dexscreener.com/ds-data/tokens/solana/5z3EqYQo9HiCEs3R84RCDMu2n7anpDMxRhdK8PSWmrRC.png" },
  { type: "TOKEN", name: "RETARDIO", id: "retardio", logo: "https://dd.dexscreener.com/ds-data/tokens/solana/6ogzHhzdrQr9Pgv6hZ2MNze7UrzBMAFyBBWUYp1Fhitx.png" },
];

// ✅ BRETT verified on Base chain
const ETH_TOKENS = [
  { type: "TOKEN", name: "BRETT", id: "brett", logo: "https://dd.dexscreener.com/ds-data/tokens/base/0x532f27101965dd16442e59d40670faf5ebb142e4.png" },
];

const NFTS = [
  { type: "NFT", name: "Pudgy Penguins", id: "pudgy-penguins", logo: "https://i.seadn.io/gcs/files/8e04e626c96ccb27e31df72ec04a9ae2.png", contract: "0xBd3531dA5CF5857e7CfAA92426877b022e612cf8" },
  { type: "NFT", name: "Milady", id: "milady", logo: "https://i.seadn.io/gcs/files/3b0c7c200b4e57629f2828db364608ad.png", contract: "0x5Af0D9827E0c53E4799BB226655A1de152A425a5" },
  { type: "NFT", name: "Bored Ape Yacht Club", id: "bored-ape-yacht-club", logo: "https://i.seadn.io/gcs/files/90ab5cb9c92e449bf48866f61c9fd462.png", contract: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D" },
  { type: "NFT", name: "Azuki", id: "azuki", logo: "https://i.seadn.io/gcs/files/05e9e7e7c93084b08be95b9dccf37e89.png", contract: "0xED5AF388653567Af2F388E6224dC7C4b3241C544" },
  { type: "NFT", name: "DeGods", id: "degods", logo: "https://i.seadn.io/gcs/files/928ba2a4a0e0968cf5e61e90f995c68f.png", contract: "0x8821BeE2ba0dF28761AffF119D66390D594CD280" },
  { type: "NFT", name: "Doodles", id: "doodles-official", logo: "https://i.seadn.io/gcs/files/7b9a81ddf0d0443fbf947e38cea2cc8b.png", contract: "0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e" },
  { type: "NFT", name: "Clone X", id: "clonex", logo: "https://i.seadn.io/gcs/files/baa6556e8da0b8233b3bbe47dc53a0e0.png", contract: "0x49cF6f5d44E70224e2E23fDcdd2C053F30aDA28B" },
  { type: "NFT", name: "Moonbirds", id: "moonbirds", logo: "https://i.seadn.io/gcs/files/f39ded83bbbe1dd7c590d2bc23e15186.png", contract: "0x23581767a106ae21c074b2276D25e5C3e136a68b" },
  { type: "NFT", name: "Captainz", id: "captainz", logo: "https://i.seadn.io/gcs/files/27fb9e57f1e87fffdc96c1dfad5ad04e.png", contract: "0x769272677faB02575E84945F03Eca517acC544cC" },
  { type: "NFT", name: "Otherdeed", id: "otherdeed", logo: "https://i.seadn.io/gcs/files/a1f82f3109984f5dbad85b5b43aa5a0a.png", contract: "0x34d85c9CDeB23FA97cb08333b511ac86E1C4E258" },
  { type: "NFT", name: "Meebits", id: "meebits", logo: "https://i.seadn.io/gcs/files/00470bce8ac3b7718969554d3460c87c.png", contract: "0x7Bd29408f11D2bFC23c34f18275bBf23bB716Bc7" },
  { type: "NFT", name: "CryptoPunks", id: "cryptopunks", logo: "https://i.seadn.io/gcs/files/c05e0532c059d3fdd5e2b0e5c0e4eee3.png", contract: "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB" },
  { type: "NFT", name: "Remilio", id: "remilio", logo: "https://i.seadn.io/gcs/files/35b73de9f5c5dcb5ad99c20f4fbdd8c1.png", contract: "0xD3D9ddd0CF0A5F0BFB8f7fcEAe075DF687eAEBaB" },
  { type: "NFT", name: "Sappy Seals", id: "sappy-seals", logo: "https://i.seadn.io/gcs/files/ba025111cdee99c4d2b1dbb50c3a73d0.png", contract: "0x364C828eE171616a39897688A831c2499aD972ec" },
  { type: "NFT", name: "Opepen", id: "opepen-edition", logo: "https://i.seadn.io/s/raw/files/ee37e7eabff7e95d7b16b654e8c11801.png", contract: "0x6339e5E072086621540D0362C4e3Cea0d643E114" },
  { type: "NFT", name: "Nakamigos", id: "nakamigos", logo: "https://i.seadn.io/gcs/files/4ea68acdcfd9f99f7e62c0f1c4e4c3f7.png", contract: "0xd774557b647330C91Bf44cfEAB205095f7E6c367" },
  { type: "NFT", name: "Bored Ape Kennel Club", id: "bored-ape-kennel-club", logo: "https://i.seadn.io/gcs/files/8e96f7c53fa976ce39e90aca9d623fa5.png", contract: "0xba30E5F9Bb24caa003E9f2f0497Ad287FDF95623" },
  { type: "NFT", name: "Mutant Ape Yacht Club", id: "mutant-ape-yacht-club", logo: "https://i.seadn.io/gcs/files/64cbaf0c2993c32fcee48bf5e9b05015.png", contract: "0x60E4d786628Fea6478F785A6d7e704777c86a7c6" },
  { type: "NFT", name: "Art Blocks Curated", id: "art-blocks", logo: "https://i.seadn.io/gcs/files/e1c4fafd2fee55c09b9f5e5c42d7b20a.png", contract: "0xa7d8d9ef8D8Ce8992Df33D8b8CF4Aebabd5bD270" },
  { type: "NFT", name: "The Potatoz", id: "the-potatoz", logo: "https://i.seadn.io/gcs/files/22dc3da23abb2d4053f2bb0906f2b4e8.png", contract: "0x39ee2c7b3cb80254225884ca001F57118C8f21B6" },
  { type: "NFT", name: "goblintown", id: "goblintown-wtf", logo: "https://i.seadn.io/gcs/files/51f6baf05cbf0a3ad5fc8e25acfc0eeb.png", contract: "0xbCe3781ae7Ca1a5e050Bd9C4c77369867eBc307e" },
];

const ASSETS = [...SOLANA_TOKENS, ...ETH_TOKENS, ...NFTS];

export async function createDailyMarket() {
  try {
    console.log("Creating 4 daily markets (2 tokens + 2 NFTs)...");
    
    // Select 2 random tokens
    const allTokens = [...SOLANA_TOKENS, ...ETH_TOKENS];
    const shuffledTokens = allTokens.sort(() => Math.random() - 0.5);
    const selectedTokens = shuffledTokens.slice(0, 2);
    
    // Select 2 random NFTs
    const shuffledNFTs = NFTS.sort(() => Math.random() - 0.5);
    const selectedNFTs = shuffledNFTs.slice(0, 2);
    
    const selectedAssets = [...selectedTokens, ...selectedNFTs];
    const createdMarkets = [];
    
    for (const asset of selectedAssets) {
      const direction = Math.random() > 0.5 ? "UP" : "DOWN";
      const thresholdBps = Math.random() > 0.7 ? 300 : 500; // 3% or 5%
      
      const now = new Date();
      const startTime = new Date(now);
      
      // Lock time is 2 hours from now (when betting closes) - T+2h
      const lockTime = new Date(now);
      lockTime.setHours(lockTime.getHours() + 2);
      
      // End time is 24 hours from now (when market settles) - T+24h
      const endTime = new Date(now);
      endTime.setHours(endTime.getHours() + 24);
      
      // Get real price from DexScreener or NFT floor price API
      let price0 = "0";
      if (asset.type === "TOKEN") {
        price0 = await getPriceOrFallback(asset.id);
        console.log(`${asset.name} starting price: $${price0}`);
      } else {
        // For NFTs, get floor price from OpenSea API
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
      
      console.log(`✅ Market created: ${asset.name} ${direction} ${thresholdBps / 100}%`);
      createdMarkets.push(market);
    }
    
    console.log(`✅ Successfully created ${createdMarkets.length} markets`);
    return createdMarkets;
  } catch (error) {
    console.error("Error creating daily markets:", error);
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
  
  // Ensure a mix of tokens and NFTs (50% each)
  const tokens = ASSETS.filter(a => a.type === "TOKEN");
  const nfts = ASSETS.filter(a => a.type === "NFT");
  
  const tokenCount = Math.floor(count / 2);
  const nftCount = count - tokenCount;
  
  const shuffledTokens = [...tokens].sort(() => Math.random() - 0.5);
  const shuffledNfts = [...nfts].sort(() => Math.random() - 0.5);
  
  const assetsToUse = [
    ...shuffledTokens.slice(0, Math.min(tokenCount, tokens.length)),
    ...shuffledNfts.slice(0, Math.min(nftCount, nfts.length))
  ];
  
  // Shuffle the final list
  assetsToUse.sort(() => Math.random() - 0.5);
  
  for (const asset of assetsToUse) {
    const direction = Math.random() > 0.5 ? "UP" : "DOWN";
    const thresholdBps = Math.random() > 0.7 ? 300 : 500;
    
    const now = new Date();
    const startTime = new Date(now);
    const lockTime = new Date(now);
    lockTime.setHours(lockTime.getHours() + 2);
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
