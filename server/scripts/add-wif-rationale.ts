import { storage } from '../storage';
import { generateRationale } from '../lib/openai';

async function addWifRationale() {
  // Trouver le market WIF
  const markets = await storage.getMarkets();
  const wifMarket = markets.find(m => m.assetName === 'WIF' && m.status === 'OPEN');
  
  if (!wifMarket) {
    console.log('WIF market not found');
    return;
  }
  
  console.log(`Creating rationale for WIF market ${wifMarket.id}...`);
  
  const rationale = await generateRationale("TOKEN", "WIF", "UP", 0, "simulate");
  await storage.createRationale({
    marketId: wifMarket.id,
    content: JSON.stringify(rationale.bullets),
    dataMode: "simulate",
  });
  
  console.log('✅ WIF rationale created!');
}

addWifRationale().then(() => process.exit(0)).catch(console.error);
