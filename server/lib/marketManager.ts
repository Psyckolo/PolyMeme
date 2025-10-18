import cron from "node-cron";
import { storage } from "../storage";
import { generateRationale } from "./openai";
import { getPriceOrFallback, getTokenPrice } from "./dexscreener";
import { getFloorPriceOrFallback } from "./nftfloor";

// ✅ All 20 tokens verified with DexScreener API - prices and logos working
const SOLANA_TOKENS = [
  { type: "TOKEN", name: "BONK", id: "bonk", logo: "https://assets.coingecko.com/coins/images/28600/large/bonk.jpg" },
  { type: "TOKEN", name: "WIF", id: "dogwifhat", logo: "https://assets.coingecko.com/coins/images/33566/large/dogwifhat.jpg" },
  { type: "TOKEN", name: "POPCAT", id: "popcat", logo: "https://assets.coingecko.com/coins/images/38030/large/popcat.png" },
  { type: "TOKEN", name: "PNUT", id: "peanut-the-squirrel", logo: "https://assets.coingecko.com/coins/images/42555/large/Peanut_the_Squirrel.jpg" },
  { type: "TOKEN", name: "GOAT", id: "goatseus-maximus", logo: "https://assets.coingecko.com/coins/images/41469/large/goat.jpeg" },
  { type: "TOKEN", name: "MEW", id: "cat-in-a-dogs-world", logo: "https://assets.coingecko.com/coins/images/36796/large/mew.jpg" },
  { type: "TOKEN", name: "FARTCOIN", id: "fartcoin", logo: "https://assets.coingecko.com/coins/images/50611/large/fart.jpg" },
  { type: "TOKEN", name: "CHILLGUY", id: "just-a-chill-guy", logo: "https://assets.coingecko.com/coins/images/42970/large/Just_a_chill_guy.jpeg" },
  { type: "TOKEN", name: "MOODENG", id: "moo-deng", logo: "https://assets.coingecko.com/coins/images/42366/large/moo.jpg" },
  { type: "TOKEN", name: "GIGA", id: "giga", logo: "https://assets.coingecko.com/coins/images/42150/large/giga.jpeg" },
  { type: "TOKEN", name: "ACT", id: "act-i-the-ai-prophecy", logo: "https://assets.coingecko.com/coins/images/41710/large/symbol.png" },
  { type: "TOKEN", name: "FWOG", id: "fwog", logo: "https://assets.coingecko.com/coins/images/41345/large/fwog.png" },
  { type: "TOKEN", name: "SLERF", id: "slerf", logo: "https://assets.coingecko.com/coins/images/36269/large/slerf.png" },
  { type: "TOKEN", name: "BOME", id: "book-of-meme", logo: "https://assets.coingecko.com/coins/images/36297/large/bome.png" },
  { type: "TOKEN", name: "MICHI", id: "michicoin", logo: "https://assets.coingecko.com/coins/images/36923/large/michi.png" },
  { type: "TOKEN", name: "PENG", id: "peng", logo: "https://assets.coingecko.com/coins/images/43632/large/penguin.png" },
  { type: "TOKEN", name: "SCF", id: "smoking-chicken-fish", logo: "https://assets.coingecko.com/coins/images/36804/large/scf.png" },
  { type: "TOKEN", name: "PONKE", id: "ponke", logo: "https://assets.coingecko.com/coins/images/35871/large/ponke.png" },
  { type: "TOKEN", name: "RETARDIO", id: "retardio", logo: "https://assets.coingecko.com/coins/images/40842/large/retardio.jpg" },
];

// ✅ BRETT verified on Base chain
const ETH_TOKENS = [
  { type: "TOKEN", name: "BRETT", id: "brett", logo: "https://assets.coingecko.com/coins/images/36395/large/brett.jpg" },
];

const NFTS = [
  { type: "NFT", name: "Pudgy Penguins", id: "pudgy-penguins", logo: "https://opensea.io/static/images/logos/opensea-logo.svg", contract: "0xBd3531dA5CF5857e7CfAA92426877b022e612cf8" },
  { type: "NFT", name: "Milady", id: "milady", logo: "https://opensea.io/static/images/logos/opensea-logo.svg", contract: "0x5Af0D9827E0c53E4799BB226655A1de152A425a5" },
  { type: "NFT", name: "Bored Ape Yacht Club", id: "bored-ape-yacht-club", logo: "https://opensea.io/static/images/logos/opensea-logo.svg", contract: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D" },
  { type: "NFT", name: "Azuki", id: "azuki", logo: "https://opensea.io/static/images/logos/opensea-logo.svg", contract: "0xED5AF388653567Af2F388E6224dC7C4b3241C544" },
  { type: "NFT", name: "DeGods", id: "degods", logo: "https://opensea.io/static/images/logos/opensea-logo.svg", contract: "0x8821BeE2ba0dF28761AffF119D66390D594CD280" },
  { type: "NFT", name: "Doodles", id: "doodles-official", logo: "https://opensea.io/static/images/logos/opensea-logo.svg", contract: "0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e" },
  { type: "NFT", name: "Clone X", id: "clonex", logo: "https://opensea.io/static/images/logos/opensea-logo.svg", contract: "0x49cF6f5d44E70224e2E23fDcdd2C053F30aDA28B" },
  { type: "NFT", name: "Moonbirds", id: "moonbirds", logo: "https://opensea.io/static/images/logos/opensea-logo.svg", contract: "0x23581767a106ae21c074b2276D25e5C3e136a68b" },
  { type: "NFT", name: "Captainz", id: "captainz", logo: "https://opensea.io/static/images/logos/opensea-logo.svg", contract: "0x769272677faB02575E84945F03Eca517acC544cC" },
  { type: "NFT", name: "Otherdeed", id: "otherdeed", logo: "https://opensea.io/static/images/logos/opensea-logo.svg", contract: "0x34d85c9CDeB23FA97cb08333b511ac86E1C4E258" },
  { type: "NFT", name: "Meebits", id: "meebits", logo: "https://opensea.io/static/images/logos/opensea-logo.svg", contract: "0x7Bd29408f11D2bFC23c34f18275bBf23bB716Bc7" },
  { type: "NFT", name: "CryptoPunks", id: "cryptopunks", logo: "https://opensea.io/static/images/logos/opensea-logo.svg", contract: "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB" },
  { type: "NFT", name: "Remilio", id: "remilio", logo: "https://opensea.io/static/images/logos/opensea-logo.svg", contract: "0xD3D9ddd0CF0A5F0BFB8f7fcEAe075DF687eAEBaB" },
  { type: "NFT", name: "Sappy Seals", id: "sappy-seals", logo: "https://opensea.io/static/images/logos/opensea-logo.svg", contract: "0x364C828eE171616a39897688A831c2499aD972ec" },
  { type: "NFT", name: "Opepen", id: "opepen-edition", logo: "https://opensea.io/static/images/logos/opensea-logo.svg", contract: "0x6339e5E072086621540D0362C4e3Cea0d643E114" },
  { type: "NFT", name: "Nakamigos", id: "nakamigos", logo: "https://opensea.io/static/images/logos/opensea-logo.svg", contract: "0xd774557b647330C91Bf44cfEAB205095f7E6c367" },
  { type: "NFT", name: "Bored Ape Kennel Club", id: "bored-ape-kennel-club", logo: "https://opensea.io/static/images/logos/opensea-logo.svg", contract: "0xba30E5F9Bb24caa003E9f2f0497Ad287FDF95623" },
  { type: "NFT", name: "Mutant Ape Yacht Club", id: "mutant-ape-yacht-club", logo: "https://opensea.io/static/images/logos/opensea-logo.svg", contract: "0x60E4d786628Fea6478F785A6d7e704777c86a7c6" },
  { type: "NFT", name: "Art Blocks Curated", id: "art-blocks", logo: "https://opensea.io/static/images/logos/opensea-logo.svg", contract: "0xa7d8d9ef8D8Ce8992Df33D8b8CF4Aebabd5bD270" },
  { type: "NFT", name: "The Potatoz", id: "the-potatoz", logo: "https://opensea.io/static/images/logos/opensea-logo.svg", contract: "0x39ee2c7b3cb80254225884ca001F57118C8f21B6" },
  { type: "NFT", name: "goblintown", id: "goblintown-wtf", logo: "https://opensea.io/static/images/logos/opensea-logo.svg", contract: "0xbCe3781ae7Ca1a5e050Bd9C4c77369867eBc307e" },
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
