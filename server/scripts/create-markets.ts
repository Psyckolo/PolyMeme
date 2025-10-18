import { createDailyMarket } from '../lib/marketManager';

async function run() {
  console.log('Creating 4 daily markets...');
  await createDailyMarket();
  console.log('Done!');
  process.exit(0);
}

run().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
