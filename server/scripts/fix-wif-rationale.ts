import { db } from '../db';
import { rationales } from '../../shared/schema';
import { generateRationale } from '../lib/openai';

async function fixWifRationale() {
  const marketId = 'edc558ed-2a90-47b0-962e-800f9217d66e';
  
  console.log(`Creating rationale for WIF...`);
  
  const rationaleData = await generateRationale("TOKEN", "WIF", "UP", 0, "simulate");
  
  await db.insert(rationales).values({
    marketId,
    content: JSON.stringify(rationaleData.bullets),
    dataMode: "simulate",
  });
  
  console.log('✅ WIF rationale created!');
}

fixWifRationale().then(() => process.exit(0)).catch(console.error);
