## Polymeme - AI Prediction Markets

## What is Polymeme?
Polymeme is a decentralized prediction market where an **AI Oracle** makes predictions about crypto markets, token prices, and NFT floor values. Users bet on whether the AI is RIGHT or WRONG. Winners share the pool proportionally.

## How It Works
1. **AI Makes a Prediction** — It analyzes market data and predicts if an asset will go UP or DOWN in the next 24 hours.  
2. **You Take a Side** — Bet “AI RIGHT” if you trust the prediction, or “AI WRONG” if you think the AI is wrong.  
3. **Wait for Settlement** — After 24 hours, the real price movement is checked.  
4. **Winners Take the Pool** — The winning side splits 100% of the pool.

## Two Ways to Play
### Simulated Mode
- Uses virtual USDC  
- Zero risk  
- Great for learning the platform  

### Mainnet Mode
- Bet real SOL on Solana  
- Requires Phantom wallet  
- Each bet = signed blockchain transaction  

## What Can You Bet On?
### Tokens
BONK, WIF, POPCAT, PEPE, PNUT, GOAT, MEW, CHILLGUY, etc.

### NFT Collections
Pudgy Penguins, Milady, Captainz, Bored Ape Yacht Club, Azuki, CryptoPunks, etc.

## Market Cycle
```
CREATION         LOCK             SETTLEMENT
   |              |                   |
   |--- BETTING ---|--- WAITING -------|
   |   (2h)        |     (22h)         |
   v              v                   v
 T+0h           T+2h                T+24h
```

## Prediction Frequency
- 1 new market every **4 hours**  
- 6 markets per day  
- Balanced: 50% tokens, 50% NFTs  

## Claiming Rewards
1. Wait for settlement  
2. Go to Dashboard → Positions  
3. Click **Claim**  
4. Rewards are credited automatically  
   - Simulated: USDC balance updates  
   - Mainnet: SOL sent to Phantom  

### Example (Pari-mutuel)
- AI RIGHT pool: 1000 USDC  
- AI WRONG pool: 500 USDC  
- AI was right  
- You bet 100 USDC on AI RIGHT (10% of winning pool)  
- You receive: 10% × 1500 = **150 USDC**

## Points & Referral System
- **1 point per USDC bet**  
- **50 bonus points** when using a referral code  
- **150 bonus points** when someone uses your code  
- Top 100 leaderboard (possible future airdrop)

## Technologies
### Frontend
React + TS, Vite, TailwindCSS, shadcn/ui, TanStack Query  

### Backend
Express.js, PostgreSQL (Neon), Drizzle ORM  

### Blockchain
Solana Web3.js, Phantom Wallet, Helius RPC  

### AI & Data
OpenAI GPT-5, DexScreener API, OpenSea API  

### Auth
Twitter/X OAuth  

## App Interface
### Home
- Mode switch  
- Prediction card  
- Bet panel  
- Market timeline  
- Past markets  

### Dashboard
- Positions  
- Balance  
- Points & referral  
- History  

## Security
- Non-custodial  
- Signed transactions  
- Open-source  
- Real price feeds from official APIs  

## Links
- **Website:** https://polymeme-ai.xyz  
- **Twitter:** https://x.com/solmefers

*Built for degens, by degens.* 🐸

