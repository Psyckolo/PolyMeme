# ProphetX - AI Prediction Markets

## Overview

ProphetX is a Web3 prediction market platform where an AI oracle makes daily predictions on crypto assets (NFT floors or token prices). Users bet whether the AI is RIGHT or WRONG using USDC, with winners claiming from a pari-mutuel pool after 24-hour settlement.

The platform features a cyberpunk/degen aesthetic with neon accents (magenta for AI RIGHT, cyan for AI WRONG), real-time pool visualization, and simulated or analytics-driven predictions powered by OpenAI's GPT-5.

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
- **Home** (`/`): Landing page with today's prediction card and betting interface
- **Dashboard** (`/dashboard`): User positions table, balance management, claim winnings
- **Shared Components**: PredictionCard, BetPanel, PoolMeter, CountdownBadge, ProphetChatDrawer (AI Q&A)

### Backend Architecture

**Server Framework**
- **Express.js** with TypeScript running on Node.js
- **Vite middleware** for development (HMR, SSR template serving)
- RESTful API design pattern

**Data Storage Strategy**
- **In-memory storage** (`MemStorage` class) implementing `IStorage` interface
- Designed for future PostgreSQL migration via Drizzle ORM (configuration present, not yet active)
- Storage entities: Markets, Balances, Bets, Rationales, UserStats

**Database Schema (Prepared for PostgreSQL)**
- Uses Drizzle ORM with schema definitions in `shared/schema.ts`
- Tables: `markets`, `balances`, `bets`, `rationales`, `user_stats`
- Configured for Neon serverless PostgreSQL via `DATABASE_URL` environment variable
- Note: Currently using in-memory storage; database will be added when ready

**Market Lifecycle Management**
- **Cron-based scheduler** using `node-cron` for daily market creation
- Market states: OPEN → LOCKED → SETTLED/REFUND
- Automated settlement logic via oracle agent

**AI Integration Architecture**
- **OpenAI GPT-5** via Replit AI Integrations service (no API key required)
- **DexScreener API** (free, no key required) for real-time token prices:
  - Fetches actual prices for Solana tokens (BONK, WIF) and Ethereum tokens (PEPE)
  - Provides starting price (price0) when market opens
  - Real-time price updates via `/api/price/:marketId` endpoint
  - Used for settlement to determine actual price movement
- Two operational modes:
  - **Analytics mode**: Real market data from DexScreener API
  - **Simulate mode**: AI-generated realistic predictions (fallback when API fails)
- Generates rationale bullets (4-6 analytical points) for each prediction
- ProphetX chat drawer for user Q&A about predictions

### External Dependencies

**AI & Data Services**
- **OpenAI GPT-5**: Prediction rationale generation, chat responses (via Replit AI Integrations)
- **Reservoir API**: NFT floor price data (optional, for analytics mode)
- **CoinGecko API**: Token price data (optional, for analytics mode)  
- **DexScreener API**: DEX trading data (optional, for analytics mode)

**Web3 Stack (Implemented)**
- **wagmi**: React hooks for Ethereum with injected connector (MetaMask)
- **viem**: Low-level Ethereum interactions
- Real MetaMask wallet connection enabled - users connect actual wallets
- Supports mainnet, Sepolia, Base, and Base Sepolia networks

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