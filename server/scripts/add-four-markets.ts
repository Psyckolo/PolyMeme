import { storage } from '../storage';
import { generateRationale } from '../lib/openai';
import { getPriceOrFallback } from '../lib/dexscreener';
import { getFloorPriceOrFallback } from '../lib/nftfloor';

async function addFourMarkets() {
  console.log('Creating 4 new markets...');
  
  const markets = [
    { 
      type: "TOKEN" as const,
      name: "PNUT", 
      id: "peanut-the-squirrel", 
      logo: "https://dd.dexscreener.com/ds-data/tokens/solana/2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump.png",
      direction: "UP" as const
    },
    { 
      type: "TOKEN" as const,
      name: "GOAT", 
      id: "goatseus-maximus", 
      logo: "https://dd.dexscreener.com/ds-data/tokens/solana/CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump.png",
      direction: "DOWN" as const
    },
    { 
      type: "NFT" as const,
      name: "Azuki", 
      id: "azuki", 
      logo: "https://i.seadn.io/gae/H8jOCJuQokNqGBpkBN5wk1oZwO7LM8bNnrHCaekV2nKjnCqw6UB5oaH8XyNeBDj6bA_n1mjejzhFQUP3O1NfjFLHr3FOaeHcTOOT?w=500&auto=format",
      direction: "UP" as const
    },
    { 
      type: "NFT" as const,
      name: "Doodles", 
      id: "doodles-official", 
      logo: "https://i.seadn.io/s/raw/files/e663a85a2900fdd4bfe8f34a444b72d3.jpg",
      direction: "DOWN" as const
    }
  ];
  
  for (const market of markets) {
    const now = new Date();
    const lockTime = new Date(now);
    lockTime.setHours(lockTime.getHours() + 2);
    const endTime = new Date(now);
    endTime.setHours(endTime.getHours() + 24);
    
    let price0 = "0";
    if (market.type === "TOKEN") {
      price0 = await getPriceOrFallback(market.id);
      console.log(`${market.name} price: $${price0}`);
    } else {
      price0 = await getFloorPriceOrFallback(market.id);
      console.log(`${market.name} floor: ${price0} ETH`);
    }
    
    const createdMarket = await storage.createMarket({
      assetType: market.type,
      assetId: market.id,
      assetName: market.name,
      assetLogo: market.logo,
      direction: market.direction,
      thresholdBps: 0,
      startTime: now,
      lockTime,
      endTime,
      price0,
      price1: null,
    });
    
    const rationale = await generateRationale(market.type, market.name, market.direction, 0, "simulate");
    await storage.createRationale({
      marketId: createdMarket.id,
      content: JSON.stringify(rationale.bullets),
      dataMode: "simulate",
    });
    
    console.log(`✅ ${market.name} ${market.direction} created!`);
  }
  
  console.log('✅ All 4 markets created!');
}

addFourMarkets().then(() => process.exit(0)).catch(console.error);
