# Polymeme - Degen AI Prediction Markets

## Overview

Polymeme is a Web3 prediction market platform where an AI oracle makes predictions on crypto assets (NFT floors or token prices). Users bet whether the AI is RIGHT or WRONG using either USDC (simulated mode) or SOL (mainnet mode), with winners claiming from a pari-mutuel pool after 24-hour settlement.

The platform features a cyberpunk/degen aesthetic with neon accents (magenta for AI RIGHT, cyan for AI WRONG), dual-mode betting system (simulated vs mainnet), Solana wallet integration, real-time pool visualization, and simplified directional predictions (UP or DOWN only - no threshold percentages). Predictions are powered by OpenAI's GPT-5.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Tooling**
- **React + TypeScript** with Vite for development and builds
- **Wouter** for client-side routing (lightweight React Router alternative)
- **TanStack Query (React Query)** for server state management and API data fetching
- **Tailwind CSS** with custom cyberpunk design system (dark mode only)
- **Shadcn/ui** component library (New York style) with Radix UI primitives

**Design System**
- Dark-first cyberpunk aesthetic with neon accents
- Magenta (#FF00FF) for "AI RIGHT" actions/pools
- Cyan (#00FFFF) for "AI WRONG" actions/pools  
- Space Grotesk/Archivo Black for display typography
- Inter/DM Sans for body text
- JetBrains Mono for data/numbers
- Custom animations: glitch effects, scanlines, particle fields

**State Management Pattern**
- Server state via React Query with custom `queryClient` configuration
- Local state with React hooks (useState, useEffect)
- Form state managed by React Hook Form with Zod validation
- No global state management library (Redux/Zustand) - uses React Query cache as source of truth

**Key Pages & Components**
- **Home** (`/`): Landing page with mode switch, Solana wallet button, selected market prediction card, betting interface, markets timeline, and past markets
- **Dashboard** (`/dashboard`): User positions table, balance management (USDC + SOL), claim winnings, points & referrals
  - **Positions Tab**: Active bets, claim winnings, view rationale
  - **Balance Tab**: SOL balance card (mainnet mode), deposit/withdraw USDC (simulated mode)
  - **Points Tab**: Airdrop points, referral system, leaderboard
  - **History Tab**: Past market results (coming soon)
- **Shared Components**: 
  - ModeSwitch: Toggle between simulated (USDC) and mainnet (SOL) modes
  - SolanaWalletButton: Connect/disconnect Phantom wallet
  - SolanaBalanceCard: Display SOL balance with refresh option
  - PredictionCard: Displays selected market with real-time price updates (TOKEN markets only)
  - BetPanel: Betting interface for AI RIGHT/WRONG on selected market (adapts currency based on mode)
  - MarketsTimeline: Shows all 4 active markets with status indicators - **clickable to select market for betting**
  - PastMarkets: Shows recently settled markets with outcomes and price changes
  - PointsPanel: Points dashboard, referral management, leaderboard
  - PoolMeter, CountdownBadge, ProphetChatDrawer (AI Q&A)

**Price Formatting Utility**
- Shared `formatPrice()` function in `client/src/lib/utils/price.ts`
- Handles small-value tokens with significant digits (e.g., BONK at $0.00001399, PEPE at $0.000006694)
- Used consistently across PredictionCard and MarketsTimeline
- Prevents "$0.0000" display for tokens with fractional cent values
- Logic: Shows 2-10 decimal places based on price magnitude to preserve meaningful precision

### Backend Architecture

**Server Framework**
- **Express.js** with TypeScript running on Node.js
- **Vite middleware** for development (HMR, SSR template serving)
- RESTful API design pattern

**Data Storage Strategy**
- **PostgreSQL database** (`DatabaseStorage` class) implementing `IStorage` interface
- Uses Drizzle ORM for type-safe database operations
- Data persists across server restarts (no more in-memory volatility)
- Storage entities: Markets, Balances, Bets, Rationales, UserStats

**Database Schema (Active PostgreSQL)**
- Uses Drizzle ORM with schema definitions in `shared/schema.ts`
- Tables: `markets`, `balances`, `bets`, `rationales`, `user_stats`
- Neon serverless PostgreSQL via `DATABASE_URL` environment variable
- Database connection configured in `server/db.ts`
- Schema pushed to database via `npm run db:push`
- **Solana Integration Fields**:
  - `user_stats.solanaAddress`: Stores connected Phantom wallet address
  - `bets.mode`: 'simulated' (USDC) or 'mainnet' (SOL)
  - `bets.currency`: 'USDC' or 'SOL'

**Points & Referral System**
- **Points Earning**: 1 point per USDC wagered (auto-calculated on each bet)
- **Referral Bonuses**: 
  - New user: 10 points for applying a code
  - Referrer: 50 points per successful referral
- **Referral Codes**: Unique 6-character alphanumeric codes (uppercase)
- **Leaderboard**: Top 100 users ranked by points
- **X/Twitter Integration**: Share referral links with pre-filled tweet text
- **Tracking**: Volume traded, referral count, referrer address stored in `user_stats`

**Market Lifecycle Management**
- **Cron-based scheduler** using `node-cron` for daily market creation (runs at 9am daily)
- **Exactly 4 markets created every 24 hours** with guaranteed 50/50 mix:
  - 2 TOKEN markets (BONK, PEPE, WIF, DOGE)
  - 2 NFT markets (Pudgy Penguins, Milady)
  - Selection randomized from each pool to ensure diversity
- **Safeguard against duplicate creation**: Server startup checks if markets were created in last 24h before creating new ones
- Market states: OPEN → LOCKED → SETTLED/REFUND
- **Simplified settlement logic**: 
  - UP prediction wins if final price > starting price (any increase)
  - DOWN prediction wins if final price < starting price (any decrease)
  - TIE if prices are exactly equal (very rare)
  - No threshold percentages - simple directional betting
- Market timing: lockTime = creation + 2h, endTime = creation + 24h
- `getTodayMarket()` returns most recent market by `createdAt` timestamp (descending)
- Users can select any active market from MarketsTimeline to place bets
- All markets created with `thresholdBps=0` (field kept in schema for compatibility but not used)

**AI Integration Architecture**
- **OpenAI GPT-5** via Replit AI Integrations service (no API key required)
- **DexScreener API** (free, no key required) for real-time token prices:
  - Fetches actual prices for Solana tokens (BONK, WIF, DOGE) and Ethereum tokens (PEPE)
  - Provides starting price (price0) when market opens
  - Real-time price updates via `/api/price/:marketId` endpoint (auto-refresh every 30s on frontend)
  - Returns price0, currentPrice, and priceChange percentage
  - Used for settlement to determine actual price movement
- **OpenSea API v2** (requires API key) for real-time NFT floor prices:
  - ✅ Fully integrated and operational with user's API key (`OPENSEA_API_KEY`)
  - Fetches actual floor prices for NFT collections (Pudgy Penguins, Milady, etc.)
  - API endpoint: `https://api.opensea.io/api/v2/collections/{slug}/stats`
  - Returns floor_price in ETH, 24h volume, 7d sales count
  - Module: `server/lib/opensea.ts` - handles API calls with error handling
  - Module: `server/lib/nftfloor.ts` - orchestrates OpenSea API calls
  - Fallback to simulated prices if API fails or collection not found
  - Collection slugs mapped to contract addresses for API calls
- Two operational modes:
  - **Analytics mode**: Real market data from DexScreener API (for TOKENs) and OpenSea API (for NFTs)
  - **Simulate mode**: AI-generated realistic predictions (fallback when API fails)
- Generates rationale bullets (4-6 analytical points) for each prediction
- ProphetX chat drawer for user Q&A about predictions

**Key API Endpoints**
- `/api/market/today` - Current active market (most recent by createdAt)
- `/api/markets` - All markets sorted by creation time (newest first)
- `/api/price/:marketId` - Real-time price data for TOKEN markets
- `/api/balance/:userAddress` - User USDC balance
- `/api/positions/:userAddress` - User's bet positions with market data
- `/api/bet` - Place bet on AI RIGHT or AI WRONG (supports mode/currency params, awards points automatically)
- `/api/claim` - Claim winnings from settled markets
- `/api/stats/:userAddress` - User stats (points, volume, referrals)
- `/api/referral/generate` - Generate unique 6-character referral code
- `/api/referral/apply` - Apply referral code for bonuses
- `/api/leaderboard` - Top 100 users by points
- **Solana Endpoints**:
  - POST `/api/solana/connect` - Register Solana wallet address
  - GET `/api/solana/address/:userAddress` - Retrieve connected Solana address

### External Dependencies

**AI & Data Services**
- **OpenAI GPT-5**: Prediction rationale generation, chat responses (via Replit AI Integrations)
- **OpenSea API v2**: ✅ Real NFT floor prices (active with `OPENSEA_API_KEY`)
- **DexScreener API**: Real-time token prices (free, no key required)

**Web3 Stack (Implemented)**
- **Solana web3.js**: Loaded via CDN for Solana mainnet integration
- **Phantom Wallet**: Primary wallet for SOL betting on mainnet
- **SolanaContext**: React context managing wallet connection state, balance, and mode switching
- **Dual-Mode System**:
  - **Simulated Mode**: USDC-based betting using internal ledger (default)
  - **Mainnet Mode**: Real SOL betting on Solana mainnet with Phantom wallet
- Real-time SOL balance fetching from Solana mainnet
- Wallet address registration with backend for user tracking

**UI & Utilities**
- **Radix UI**: Unstyled accessible components (dialogs, dropdowns, tooltips, etc.)
- **Canvas Confetti**: Celebration effects on wins
- **Framer Motion**: Animation library (dependency present for future use)
- **Zod**: Schema validation for API requests/responses

**Development Tools**
- **Drizzle Kit**: Database migration tool (configured for PostgreSQL)
- **esbuild**: Server-side bundling for production
- **tsx**: TypeScript execution for development server
- **Replit-specific plugins**: Error overlay, cartographer, dev banner

**Asset Management**
- Generated hero images stored in `attached_assets/generated_images/`
- Custom fonts loaded from Google Fonts (Inter, Space Grotesk, JetBrains Mono, DM Sans)