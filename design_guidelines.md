# ProphetX Design Guidelines

## Design Approach
**Reference-Based: Underground Crypto/Degen Aesthetic**
Draw inspiration from cyberpunk poster art, underground tech publications, and crypto-native platforms like Polymarket, Degen, and Terminal. The design should feel like a high-stakes prediction terminal—raw, technical, and visually striking without sacrificing clarity.

---

## Core Design Principles
1. **Radical Clarity First**: Despite aggressive aesthetics, information hierarchy must be crystal clear. Users should instantly understand: what the AI predicted, how to bet, and their position status.
2. **Controlled Chaos**: Neon effects and glitches are accent layers—never obscure critical data or CTAs.
3. **No Emojis, Pure Graphics**: All visual communication through vectorial illustrations, iconography, and typographic hierarchy.

---

## Color Palette

### Dark Mode Only
- **Base Black**: 0 0% 4% (deep void, #0a0a0f)
- **Surface Dark**: 0 0% 8% (cards/panels)
- **Border Subtle**: 0 0% 15% (dividers)

### Neon Accents
- **Magenta Primary**: 320 100% 60% (hot pink neon, primary CTAs, "AI RIGHT" pool)
- **Cyan Secondary**: 180 100% 50% (electric blue, "AI WRONG" pool, links)
- **Green Success**: 140 80% 55% (winning states, claim buttons)
- **Red Alert**: 0 85% 60% (warnings, lock states)

### Neutrals
- **Off-White Text**: 0 0% 92% (primary readable text)
- **Gray Muted**: 0 0% 60% (secondary text, timestamps)
- **Ghost White**: 0 0% 98% (hover states on dark)

---

## Typography

### Font Stack
- **Display/Headlines**: "Space Grotesk" or "Archivo Black" (condensed, bold, poster-style)
- **Body/UI**: "Inter" or "DM Sans" (modern grotesque, excellent readability)
- **Mono/Data**: "JetBrains Mono" (pool amounts, countdowns, addresses)

### Scale
- **Hero Title**: text-7xl md:text-8xl font-black tracking-tight (ProphetX)
- **Section Headers**: text-4xl md:text-5xl font-bold
- **Card Titles**: text-2xl font-semibold
- **Body**: text-base leading-relaxed
- **Data/Numbers**: text-xl md:text-3xl font-mono tabular-nums
- **Captions**: text-sm text-gray-muted

---

## Layout System

### Spacing Primitives
Use Tailwind units: **2, 4, 6, 8, 12, 16, 20, 24** for consistent rhythm.
- Component padding: p-6 to p-8
- Section gaps: gap-8 md:gap-12
- Page margins: px-4 md:px-8, max-w-7xl mx-auto

### Grid Structure
- **Landing Hero**: Single column centered, max-w-4xl
- **Prediction Card**: Standalone centered block, w-full max-w-3xl
- **Dashboard**: 2-column on desktop (sidebar nav + content area), stack on mobile
- **Positions Table**: Full-width responsive table with horizontal scroll fallback

---

## Component Library

### Hero Section
- **Background**: Deep black with animated particle field (subtle white dots drifting, opacity 0.1-0.3)
- **Title Treatment**: "ProphetX" with subtle glitch effect (text-shadow with cyan/magenta offset, animates on load)
- **Subtitle**: "Every day, the AI makes one prediction on NFT floors or token prices. Bet if it's RIGHT or WRONG." — text-xl off-white, max-w-2xl centered
- **Visual Element**: Large abstract vectorial illustration (circuit board traces, terminal screen frame, or stylized AI brain silhouette) positioned behind title with low opacity

### Today's Prediction Card
- **Container**: Rounded-xl, black background with animated neon border glow (box-shadow with magenta/cyan, pulsing subtly)
- **Header**: Asset logo (64px circle) + name (text-3xl) + badge (NFT/TOKEN pill)
- **Prediction Display**: 
  - Direction arrow (UP ↑ green or DOWN ↓ red, text-6xl)
  - Threshold "+5.0%" in mono font
  - Scanline overlay (subtle horizontal lines, opacity 0.05, animated scroll)
- **Pool Meters**: Two side-by-side progress bars
  - "AI RIGHT" (magenta fill, percentage + USDC amount)
  - "AI WRONG" (cyan fill, percentage + USDC amount)
  - Glass-morphic background (bg-white/5 backdrop-blur)
- **Countdown**: Large mono numbers with "Lock in 29:47" label, yellow ring animation when <5min
- **Bet Buttons**: 
  - Full-width on mobile, side-by-side on desktop
  - "Bet AI RIGHT" (bg-magenta, large px-12 py-4 text-xl)
  - "Bet AI WRONG" (bg-cyan, large px-12 py-4 text-xl)
  - Neon halo on hover (box-shadow glow intensifies)

### Connect Wallet Section
- **MetaMask Button**: Primary style, icon + "Connect MetaMask"
- **Phantom Button**: Same visual design but disabled state (opacity-40, cursor-not-allowed), tooltip "Solana support coming soon"

### Dashboard Components
- **Tab Navigation**: Horizontal pills (Positions / Balance / History), active tab has neon underline
- **Positions Table**: 
  - Columns: Market | Side | Stake | Status | Actions
  - ERC-1155 token ID badge (small monospace chip)
  - "Claim" button (green if won, disabled gray if lost/pending)
  - Expandable row for rationale view
- **Balance Panel**: 
  - Large USDC amount display (text-5xl mono)
  - Input field with +/- quick amounts (10, 50, 100 USDC)
  - Deposit/Withdraw buttons side-by-side
  - "Withdraw All" link in muted text below
- **Transaction Toasts**: Slide from top-right, neon border, success=green accent, error=red accent, 5s auto-dismiss

### Ask the Prophet Drawer
- **Trigger**: Small floating button (bottom-right) with pulsing cyan glow
- **Panel**: Slides from right, 400px wide, black background
- **Chat Interface**: 
  - Message bubbles (user=magenta outline, AI=cyan filled)
  - Input at bottom with "Ask..." placeholder
  - "Why this prediction?" quick-action button above input
- **Rationale Display**: Bullet list (4-6 points), analytical tone, no emojis, small disclaimers at bottom

---

## Visual Effects

### Glitch Effect
- Applied to "ProphetX" title on page load (once, 0.3s duration)
- RGB split with cyan/magenta channels offset 2-3px
- Use Framer Motion keyframes

### Neon Halos
- `box-shadow: 0 0 20px rgba(255, 0, 255, 0.4), 0 0 40px rgba(255, 0, 255, 0.2)` for magenta
- Animate shadow blur/spread on hover
- Use sparingly: primary CTAs, prediction card border

### Particle Field
- Canvas background layer, 100-150 white particles (1-2px), slow random drift
- Opacity 0.1-0.3, no interactivity
- Performance: requestAnimationFrame, limit to 60fps

### Scanline Overlay
- Horizontal lines, 2px tall, spaced 4px apart, opacity 0.03
- Subtle top-to-bottom scroll animation (30s loop, easing linear)
- Applied to prediction card only

### Confetti
- Trigger on successful claim action
- Colors: magenta, cyan, green (no yellow/gold)
- Duration: 3s, origin from claim button

### Transitions
- Framer Motion for all page/component mounts (fade + scale from 0.95)
- Button hover: scale-105 transform + glow intensify (150ms ease-out)
- Tab switches: crossfade content (200ms)

---

## Images

### Hero Background
Large abstract vectorial illustration (1920x1080 aspect) featuring:
- Terminal/command-line interface aesthetic
- Circuit board traces or network nodes
- Stylized AI brain or oracle eye silhouette
- Low saturation (desaturated magenta/cyan tones)
- Positioned as background layer with opacity 0.15, blend mode overlay

### Asset Logos
- Circular 64px for tokens (e.g., PEPE, WIF, DOGE)
- Square 64px rounded-lg for NFT collections (Milady, Pudgy, DeGods)
- Loaded via external API or local fallback icons

### No Large Hero Image
This design uses an illustrated/graphic background layer instead of photography. The focus is on the prediction card and typography.

---

## Accessibility Notes
- All neon colors pass WCAG AA contrast against black backgrounds (text 4.5:1 minimum)
- Focus states: 2px cyan ring offset (ring-2 ring-cyan ring-offset-2 ring-offset-black)
- Hover states clearly visible (scale + shadow changes)
- Toast notifications have 5s duration + manual dismiss option
- Scanline/particle effects respect `prefers-reduced-motion` media query

---

## Component Naming Conventions
- `PredictionCard.tsx`
- `PoolMeter.tsx`
- `BetPanel.tsx`
- `BalancePanel.tsx`
- `PositionsTable.tsx`
- `RationaleSheet.tsx`
- `ProphetChatDrawer.tsx`
- `CountdownBadge.tsx`
- `NetworkGuard.tsx`
- `GlitchText.tsx`
- `NeonButton.tsx`

---

**Final Note**: This design balances aggressive cyberpunk aesthetics with functional clarity. Every neon glow, glitch, and particle serves to reinforce the "AI prediction terminal" concept while ensuring users can deposit, bet, and claim with zero confusion.