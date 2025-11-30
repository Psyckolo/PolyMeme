# Polymeme
# Polymeme - AI Prediction Markets
## What is Polymeme?
## C'est quoi Polymeme ?
Polymeme is a prediction market platform where you bet against an AI oracle. Every few hours, our AI analyzes crypto markets and makes bold predictions about token prices and NFT floor values. Your job? Decide if the AI is right or wrong.
Polymeme est une plateforme de paris décentralisée où une **IA Oracle** fait des prédictions sur le marché crypto. Tu paries si l'IA a raison ou tort, et les gagnants se partagent la cagnotte.
## How It Works
1. **The AI Makes a Prediction** - Our AI oracle analyzes market data and predicts whether an asset will go UP or DOWN in the next 24 hours.
2. **You Take a Side** - Think the AI nailed it? Bet "AI RIGHT". Think it's wrong? Bet "AI WRONG".
3. **Wait for Settlement** - After 24 hours, we check the actual price movement and determine the winner.
4. **Winners Take the Pool** - All winning bettors share the total pool proportionally. The more you bet, the bigger your share.
## Two Ways to Play
**Simulated Mode** - Practice with virtual USDC. No real money, no risk. Perfect for learning the ropes.
**Mainnet Mode** - Bet with real SOL through your Phantom wallet. Real stakes, real rewards.
## What Can You Bet On?
- **Tokens**: BONK, PEPE, WIF, DOGE and more popular crypto tokens
- **NFT Collections**: Pudgy Penguins, Milady, Captainz and other blue-chip NFTs
## Features
- Connect with your X (Twitter) account
- Real-time price tracking from DexScreener and OpenSea
- Points system with referral bonuses
- Leaderboard to track top predictors
- Cyberpunk-inspired design with neon aesthetics
## The Vision
Polymeme brings the thrill of prediction markets to the degen community. No complex order books, no market making - just you versus the AI. Simple, fun, and competitive.
Whether you're a seasoned trader or just getting started, Polymeme offers an accessible way to put your market intuition to the test.
## Links
- Website: https://polymeme-ai.xyz
- Twitter: @PolymemeAI
**Concept simple :**
- L'IA prédit si un token ou un NFT va monter (UP) ou descendre (DOWN)
- Tu paries "AI RIGHT" si tu penses que l'IA a raison
- Tu paries "AI WRONG" si tu penses qu'elle se trompe
- 24h plus tard, on vérifie le prix réel → les gagnants récupèrent le pot
---
Built for degens, by degens.
## Comment ça marche ?
### Cycle d'un marché
```
CRÉATION          LOCK              SETTLEMENT
    |               |                   |
    |--- BETTING ---|--- EN ATTENTE ----|
    |   (2 heures)  |   (22 heures)     |
    v               v                   v
  T+0h            T+2h               T+24h
```
1. **Création (T+0h)** - L'IA analyse le marché et fait une prédiction
2. **Betting ouvert (0-2h)** - Tu peux placer tes paris pendant 2 heures
3. **Lock (T+2h)** - Les paris sont verrouillés, plus personne ne peut miser
4. **Settlement (T+24h)** - On compare le prix final au prix initial → gagnants déterminés
### Fréquence des prédictions
- **1 nouveau marché toutes les 4 heures**
- Soit **6 marchés par jour** (à 0h, 4h, 8h, 12h, 16h, 20h)
- Mix équilibré : 50% tokens crypto + 50% NFT collections
---
## Les deux modes de jeu
### Mode Simulé (USDC virtuel)
- Aucun argent réel
- Tu commences avec **5000 USDC** virtuels
- Parfait pour tester et comprendre la plateforme
- Pas besoin de wallet
### Mode Mainnet (SOL réel)
- Paris en **SOL** sur la blockchain Solana
- Nécessite le wallet **Phantom**
- Chaque pari = une vraie transaction blockchain
- Tu signes avec ton wallet pour confirmer
---
## Comment récupérer mes gains ?
1. **Attendre le settlement** - Le marché doit être réglé (après 24h)
2. **Aller dans Dashboard** → Onglet "Positions"
3. **Cliquer "Claim"** sur les paris gagnants
4. **Les gains sont crédités** :
   - Mode simulé → Ton solde USDC augmente
   - Mode mainnet → SOL envoyé à ton wallet Phantom
### Calcul des gains (Pari-mutuel)
Les gagnants se partagent **100% de la pool** proportionnellement à leur mise.
**Exemple :**
- Pool "AI RIGHT" : 1000 USDC (10 joueurs)
- Pool "AI WRONG" : 500 USDC (5 joueurs)
- L'IA avait raison → "AI RIGHT" gagne
- Tu avais misé 100 USDC sur "AI RIGHT" (10% de la pool gagnante)
- Tu récupères : 10% × 1500 USDC = **150 USDC** (profit de 50 USDC)
---
## Sur quoi on peut parier ?
### Tokens crypto
BONK, WIF, POPCAT, PNUT, GOAT, MEW, FARTCOIN, CHILLGUY, MOODENG, GIGA, ACT, FWOG, SLERF, BOME, MICHI, PENG, PONKE, BRETT...
### Collections NFT
Pudgy Penguins, Milady, Bored Ape Yacht Club, Azuki, DeGods, Doodles, Clone X, Moonbirds, CryptoPunks, Remilio, Meebits...
---
## Système de points & referral
### Gagner des points
- **1 point par USDC misé** (automatique)
- **50 points** quand tu utilises un code referral
- **150 points** quand quelqu'un utilise ton code
### Leaderboard
- Top 100 joueurs classés par points
- Potentiel airdrop futur pour les top holders
---
## Technologies utilisées
### Frontend
- **React + TypeScript** - Interface utilisateur moderne
- **Vite** - Build ultra-rapide
- **TailwindCSS** - Design cyberpunk/degen
- **Shadcn/ui** - Composants UI élégants
- **TanStack Query** - Gestion des données en temps réel
### Backend
- **Express.js** - Serveur API
- **PostgreSQL** - Base de données (Neon serverless)
- **Drizzle ORM** - Gestion de la base de données
### Blockchain
- **Solana Web3.js** - Intégration blockchain
- **Phantom Wallet** - Wallet officiel Solana
- **Helius RPC** - Nœud Solana performant
### IA & Data
- **OpenAI GPT-5** - Génération des prédictions et analyses
- **DexScreener API** - Prix en temps réel des tokens
- **OpenSea API** - Floor price des NFT en temps réel
### Auth
- **Twitter/X OAuth** - Connexion avec ton compte X
---
## Interface de l'app
### Page d'accueil
- **Mode Switch** - Basculer entre Simulated et Mainnet
- **Prediction Card** - Le marché sélectionné avec prix en temps réel
- **Bet Panel** - Interface pour parier (AI RIGHT / AI WRONG)
- **Markets Timeline** - Tous les marchés actifs (cliquables)
- **Past Markets** - Historique des marchés réglés
### Dashboard
- **Positions** - Tes paris actifs + bouton Claim
- **Balance** - Ton solde (USDC ou SOL selon le mode)
- **Points** - Tes points, code referral, leaderboard
- **History** - Historique de tes paris
---
## Sécurité
- **Pas de custody** - On ne garde jamais tes SOL
- **Transactions signées** - Chaque pari mainnet nécessite ta signature Phantom
- **Open source** - Code vérifiable
- **Prix réels** - APIs officielles (DexScreener, OpenSea)
---
## Liens
- **Website** : https://polymeme-ai.xyz
- **Twitter** : @PolymemeAI
---
*Built for degens, by degens.* 🐸
