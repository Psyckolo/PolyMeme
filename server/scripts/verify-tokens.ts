// Script pour vérifier les tokens Solana sur DexScreener
import { getTokenPrice } from "../lib/dexscreener";

interface SolanaToken {
  name: string;
  symbol: string;
  address: string;
  coingeckoId: string;
}

const SOLANA_TOKENS: SolanaToken[] = [
  { name: "BONK", symbol: "BONK", address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", coingeckoId: "bonk" },
  { name: "dogwifhat", symbol: "WIF", address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", coingeckoId: "dogwifhat" },
  { name: "POPCAT", symbol: "POPCAT", address: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr", coingeckoId: "popcat" },
  { name: "PNUT", symbol: "PNUT", address: "2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump", coingeckoId: "peanut-the-squirrel" },
  { name: "Jupiter", symbol: "JUP", address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", coingeckoId: "jupiter" },
  { name: "Cat in a dogs world", symbol: "MEW", address: "MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5", coingeckoId: "cat-in-a-dogs-world" },
  { name: "GOAT", symbol: "GOAT", address: "CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump", coingeckoId: "goatseus-maximus" },
  { name: "ACT", symbol: "ACT", address: "GJAFwWjJ3vnTsrQVabjBVK2TYB1YtRCQXRDfDgUnpump", coingeckoId: "act-i-the-ai-prophecy" },
  { name: "Fartcoin", symbol: "FARTCOIN", address: "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump", coingeckoId: "fartcoin" },
  { name: "FWOG", symbol: "FWOG", address: "A8C3xuqscfmyLrte3VmTqrAq8kgMASius9AFNANwpump", coingeckoId: "fwog" },
  { name: "SLERF", symbol: "SLERF", address: "7BgBvyjrZX1YKz4oh9mjb8ZScatkkwb8DzFx7LoiVkM3", coingeckoId: "slerf" },
  { name: "Michi", symbol: "MICHI", address: "5mbK36SZ7J19An8jFochhQS4of8g6BwUjbeCSxBSoWdp", coingeckoId: "michicoin" },
  { name: "BOME", symbol: "BOME", address: "ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82", coingeckoId: "book-of-meme" },
  { name: "Moo Deng", symbol: "MOODENG", address: "ED5nyyWEzpPPiWimP8vYm7sD7TD3LAt3Q3gRTWHzPJBY", coingeckoId: "moo-deng" },
  { name: "GIGA", symbol: "GIGA", address: "FgX1pCFYxNF3K9x3s3J7J7WqtqvQwmP1HS3X9P6pump", coingeckoId: "giga" },
  { name: "Just a chill guy", symbol: "CHILLGUY", address: "Df6yfrKC8kZE3KNkrHERKzAetSxbrWeniQfyJY4Jpump", coingeckoId: "just-a-chill-guy" },
  { name: "Peng", symbol: "PENG", address: "2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv", coingeckoId: "peng" },
  { name: "Smoking Chicken Fish", symbol: "SCF", address: "4LLbsb5ReP3yEtYzmXewyGjcir5uXtKFURtaEUVC2AHs", coingeckoId: "smoking-chicken-fish" },
  { name: "MANEKI", symbol: "MANEKI", address: "GFX1ZYR4oLnVAT5xM7Qd8PzBs7HTeKGKSKwLXFP9pump", coingeckoId: "maneki" },
  { name: "PONKE", symbol: "PONKE", address: "5z3EqYQo9HiCEs3R84RCDMu2n7anpDMxRhdK8PSWmrRC", coingeckoId: "ponke" },
  { name: "RETARDIO", symbol: "RETARDIO", address: "6ogzHhzdrQr9Pgv6hZ2MNze7UrzBMAFyBBWUYp1Fhitx", coingeckoId: "retardio" },
  { name: "BRETT", symbol: "BRETT", address: "BRetv9Yw7Dkx7XBUqp8y6qPH6dJTm8ARvPWfS2HgCpM", coingeckoId: "brett" },
];

async function verifyToken(token: SolanaToken): Promise<boolean> {
  try {
    const price = await getTokenPrice(token.coingeckoId);
    if (!price || parseFloat(price) === 0) {
      console.log(`❌ ${token.symbol}: No price data`);
      return false;
    }
    console.log(`✅ ${token.symbol}: $${price}`);
    return true;
  } catch (error) {
    console.log(`❌ ${token.symbol}: Error - ${error instanceof Error ? error.message : 'Unknown'}`);
    return false;
  }
}

async function run() {
  console.log("Testing Solana tokens on DexScreener...\n");
  
  const validTokens: SolanaToken[] = [];
  
  for (const token of SOLANA_TOKENS) {
    const isValid = await verifyToken(token);
    if (isValid) {
      validTokens.push(token);
    }
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n✅ Found ${validTokens.length} valid tokens:`);
  validTokens.forEach(t => console.log(`  - ${t.symbol} (${t.coingeckoId})`));
}

run().catch(console.error);
