import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateRationale, answerQuestion } from "./lib/openai";
import { getTokenPrice } from "./lib/dexscreener";
import { getNFTFloorPrice } from "./lib/nftfloor";
import { setupTwitterAuth, isAuthenticated } from "./twitterAuth";
import {
  depositSchema,
  withdrawSchema,
  placeBetSchema,
  claimSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Direct Twitter OAuth (NO Replit branding)
  await setupTwitterAuth(app);

  // Auth user endpoint - returns current authenticated user
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Return null if not authenticated instead of 401
      if (!req.user || !req.user.id) {
        return res.json(null);
      }
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get today's market
  app.get("/api/market/today", async (req, res) => {
    try {
      const market = await storage.getTodayMarket();
      
      if (!market) {
        // Create a demo market if none exists
        const demoMarket = await createDemoMarket();
        return res.json(demoMarket);
      }
      
      res.json(market);
    } catch (error) {
      console.error("Error fetching today's market:", error);
      res.status(500).json({ error: "Failed to fetch market" });
    }
  });

  // Get market rationale
  app.get("/api/rationale/:marketId", async (req, res) => {
    try {
      const { marketId } = req.params;
      const rationale = await storage.getRationale(marketId);
      
      if (!rationale) {
        return res.status(404).json({ error: "Rationale not found" });
      }
      
      res.json(rationale);
    } catch (error) {
      console.error("Error fetching rationale:", error);
      res.status(500).json({ error: "Failed to fetch rationale" });
    }
  });

  // Get current price (real-time) for a market's token or NFT
  app.get("/api/price/:marketId", async (req, res) => {
    try {
      const { marketId } = req.params;
      const market = await storage.getMarket(marketId);
      
      if (!market) {
        return res.status(404).json({ error: "Market not found" });
      }

      const price0 = parseFloat(market.price0 || "0");

      // Fetch real-time price based on asset type
      if (market.assetType === "NFT") {
        // Get current NFT floor price from OpenSea
        const currentFloorPrice = await getNFTFloorPrice(market.assetId);
        const priceNow = currentFloorPrice ? parseFloat(currentFloorPrice) : price0;
        const priceChange = price0 > 0 ? ((priceNow - price0) / price0) * 100 : 0;

        return res.json({
          price0: market.price0,
          currentPrice: priceNow.toFixed(6),
          priceChange: priceChange.toFixed(2),
        });
      }

      // TOKEN: fetch from DexScreener
      const currentPrice = await getTokenPrice(market.assetId);
      const priceNow = currentPrice ? parseFloat(currentPrice) : price0;
      const priceChange = price0 > 0 ? ((priceNow - price0) / price0) * 100 : 0;

      res.json({
        price0: market.price0,
        currentPrice: priceNow.toFixed(6),
        priceChange: priceChange.toFixed(2),
      });
    } catch (error) {
      console.error("Error fetching price:", error);
      res.status(500).json({ error: "Failed to fetch price" });
    }
  });

  // Get user balance
  app.get("/api/balance/:userAddress", async (req, res) => {
    try {
      const { userAddress } = req.params;
      let balance = await storage.getBalance(userAddress);
      
      if (!balance) {
        // Create initial balance - Start with 5000 USDC
        balance = await storage.createOrUpdateBalance(userAddress, "5000");
      }
      
      res.json({ balance: balance.balance });
    } catch (error) {
      console.error("Error fetching balance:", error);
      res.status(500).json({ error: "Failed to fetch balance" });
    }
  });

  // Deposit USDC (max 5000 USDC total balance allowed)
  app.post("/api/deposit", async (req, res) => {
    try {
      const parsed = depositSchema.parse(req.body);
      const { userAddress, amount } = parsed;
      
      const currentBalance = await storage.getBalance(userAddress);
      const currentAmount = currentBalance ? parseFloat(currentBalance.balance) : 5000;
      const depositAmount = parseFloat(amount);
      const newAmount = currentAmount + depositAmount;
      
      // Maximum total balance is 10000 USDC (5000 initial + 5000 deposit max)
      const MAX_BALANCE = 10000;
      if (newAmount > MAX_BALANCE) {
        return res.status(400).json({ 
          error: `Maximum balance is ${MAX_BALANCE} USDC (5000 initial + 5000 deposit max). Current balance: ${currentAmount}` 
        });
      }
      
      const balance = await storage.createOrUpdateBalance(userAddress, newAmount.toString());
      
      res.json({ success: true, balance: balance.balance });
    } catch (error: any) {
      console.error("Error depositing:", error);
      res.status(400).json({ error: error.message || "Failed to deposit" });
    }
  });

  // Withdraw USDC
  app.post("/api/withdraw", async (req, res) => {
    try {
      const parsed = withdrawSchema.parse(req.body);
      const { userAddress, amount } = parsed;
      
      const currentBalance = await storage.getBalance(userAddress);
      if (!currentBalance) {
        return res.status(400).json({ error: "No balance found" });
      }
      
      const currentAmount = parseFloat(currentBalance.balance);
      const withdrawAmount = parseFloat(amount);
      
      if (withdrawAmount > currentAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      const newAmount = currentAmount - withdrawAmount;
      const balance = await storage.updateBalance(userAddress, newAmount.toString());
      
      res.json({ success: true, balance: balance?.balance || "0" });
    } catch (error: any) {
      console.error("Error withdrawing:", error);
      res.status(400).json({ error: error.message || "Failed to withdraw" });
    }
  });

  // Place bet
  app.post("/api/bet", async (req, res) => {
    try {
      const parsed = placeBetSchema.parse(req.body);
      const { marketId, userAddress, side, amount } = parsed;
      
      const market = await storage.getMarket(marketId);
      if (!market) {
        return res.status(404).json({ error: "Market not found" });
      }
      
      if (market.status !== "OPEN") {
        return res.status(400).json({ error: "Market is not open for betting" });
      }
      
      // Check if market is locked
      const now = new Date();
      if (now > new Date(market.lockTime)) {
        return res.status(400).json({ error: "Market is locked" });
      }
      
      // Check user balance
      const balance = await storage.getBalance(userAddress);
      if (!balance || parseFloat(balance.balance) < parseFloat(amount)) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      // Deduct from balance
      const newBalance = parseFloat(balance.balance) - parseFloat(amount);
      await storage.updateBalance(userAddress, newBalance.toString());
      
      // Update pool
      const poolKey = side === "RIGHT" ? "poolRight" : "poolWrong";
      const currentPool = parseFloat(market[poolKey]);
      const newPool = currentPool + parseFloat(amount);
      await storage.updateMarket(marketId, {
        [poolKey]: newPool.toString(),
      });
      
      // Create bet with ticket ID
      const ticketId = `${market.marketId}${side === "RIGHT" ? "1" : "2"}`;
      const bet = await storage.createBet({
        marketId,
        userAddress,
        side,
        amount,
        ticketId,
      });
      
      // Update user stats: add points (1 point per USDC wagered) and update volume
      const betAmount = parseFloat(amount);
      const points = Math.floor(betAmount); // 1 point per USDC
      
      const currentStats = await storage.getUserStats(userAddress);
      const currentVolume = parseFloat(currentStats?.volumeTraded || "0");
      const currentPoints = currentStats?.points || 0;
      
      await storage.createOrUpdateUserStats(userAddress, {
        points: currentPoints + points,
        volumeTraded: (currentVolume + betAmount).toString(),
      });
      
      res.json({ success: true, bet, pointsEarned: points });
    } catch (error: any) {
      console.error("Error placing bet:", error);
      res.status(400).json({ error: error.message || "Failed to place bet" });
    }
  });

  // Get all markets
  app.get("/api/markets", async (req, res) => {
    try {
      const markets = await storage.getAllMarkets();
      res.json(markets);
    } catch (error) {
      console.error("Error fetching markets:", error);
      res.status(500).json({ error: "Failed to fetch markets" });
    }
  });

  // Get recent activity
  app.get("/api/recent-activity", async (req, res) => {
    try {
      const activity = await storage.getRecentActivity();
      res.json(activity);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ error: "Failed to fetch recent activity" });
    }
  });

  // Get user positions
  app.get("/api/positions/:userAddress", async (req, res) => {
    try {
      const { userAddress } = req.params;
      const bets = await storage.getUserBets(userAddress);
      
      // Enrich bets with market data
      const enrichedBets = await Promise.all(
        bets.map(async (bet) => {
          const market = await storage.getMarket(bet.marketId);
          return { ...bet, market };
        })
      );
      
      res.json(enrichedBets);
    } catch (error) {
      console.error("Error fetching positions:", error);
      res.status(500).json({ error: "Failed to fetch positions" });
    }
  });

  // Claim winnings
  app.post("/api/claim", async (req, res) => {
    try {
      const parsed = claimSchema.parse(req.body);
      const { marketId, userAddress } = parsed;
      
      const market = await storage.getMarket(marketId);
      if (!market) {
        return res.status(404).json({ error: "Market not found" });
      }
      
      if (market.status !== "SETTLED") {
        return res.status(400).json({ error: "Market not settled yet" });
      }
      
      const userBets = await storage.getMarketBets(marketId);
      const userBet = userBets.find(
        (b) => b.userAddress.toLowerCase() === userAddress.toLowerCase() && !b.claimed
      );
      
      if (!userBet) {
        return res.status(404).json({ error: "No unclaimed bet found" });
      }
      
      // Calculate payout
      let payout = 0;
      const totalPool = parseFloat(market.poolRight) + parseFloat(market.poolWrong);
      const betAmount = parseFloat(userBet.amount);
      
      if (market.winner === "TIE") {
        // Refund
        payout = betAmount;
      } else if (market.winner === userBet.side) {
        // Winner - calculate pari-mutuel payout
        const winningPool = market.winner === "RIGHT" ? parseFloat(market.poolRight) : parseFloat(market.poolWrong);
        const losingPool = market.winner === "RIGHT" ? parseFloat(market.poolWrong) : parseFloat(market.poolRight);
        
        const share = betAmount / winningPool;
        const grossPayout = betAmount + (losingPool * share);
        
        // Apply 2% fee
        payout = grossPayout * 0.98;
      }
      
      if (payout > 0) {
        // Update bet
        await storage.updateBet(userBet.id, {
          claimed: true,
          payout: payout.toString(),
        });
        
        // Credit balance
        const balance = await storage.getBalance(userAddress);
        const currentBalance = balance ? parseFloat(balance.balance) : 0;
        await storage.createOrUpdateBalance(userAddress, (currentBalance + payout).toString());
        
        // Award bonus points if bet won (30% bonus on bet amount for winners)
        let bonusPoints = 0;
        if (market.winner === userBet.side && market.winner !== "TIE") {
          bonusPoints = Math.floor(betAmount * 0.3); // 30% of bet amount as bonus points
          const currentStats = await storage.getUserStats(userAddress);
          await storage.createOrUpdateUserStats(userAddress, {
            points: (currentStats?.points || 0) + bonusPoints,
          });
        }
        
        res.json({ 
          success: true, 
          payout: payout.toString(),
          bonusPoints: bonusPoints 
        });
      } else {
        res.status(400).json({ error: "No payout available" });
      }
    } catch (error: any) {
      console.error("Error claiming:", error);
      res.status(400).json({ error: error.message || "Failed to claim" });
    }
  });

  // Get user stats (points, volume, referrals)
  app.get("/api/stats/:userAddress", async (req, res) => {
    try {
      const { userAddress } = req.params;
      let stats = await storage.getUserStats(userAddress);
      
      // Create stats if they don't exist
      if (!stats) {
        stats = await storage.createOrUpdateUserStats(userAddress, {});
      }
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Generate referral code
  app.post("/api/referral/generate", async (req, res) => {
    try {
      const { userAddress } = req.body;
      
      let stats = await storage.getUserStats(userAddress);
      
      // If user already has a code, return it
      if (stats?.referralCode) {
        return res.json({ referralCode: stats.referralCode });
      }
      
      // Generate unique 6-character code
      const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };
      
      let referralCode = generateCode();
      // Ensure uniqueness
      while (await storage.getUserByReferralCode(referralCode)) {
        referralCode = generateCode();
      }
      
      // Update or create stats with referral code
      stats = await storage.createOrUpdateUserStats(userAddress, { referralCode });
      
      res.json({ referralCode });
    } catch (error) {
      console.error("Error generating referral code:", error);
      res.status(500).json({ error: "Failed to generate referral code" });
    }
  });

  // Apply referral code
  app.post("/api/referral/apply", async (req, res) => {
    try {
      const { userAddress, referralCode } = req.body;
      
      // Check if user already has a referrer
      const userStats = await storage.getUserStats(userAddress);
      if (userStats?.referredBy) {
        return res.status(400).json({ error: "You already used a referral code" });
      }
      
      // Find referrer by code
      const referrer = await storage.getUserByReferralCode(referralCode);
      if (!referrer) {
        return res.status(404).json({ error: "Invalid referral code" });
      }
      
      // Can't refer yourself
      if (referrer.userAddress.toLowerCase() === userAddress.toLowerCase()) {
        return res.status(400).json({ error: "Cannot use your own referral code" });
      }
      
      // Update user stats with referrer
      await storage.createOrUpdateUserStats(userAddress, {
        referredBy: referrer.userAddress,
      });
      
      // Give bonus points to referrer (150 points)
      await storage.createOrUpdateUserStats(referrer.userAddress, {
        points: referrer.points + 150,
        referralCount: referrer.referralCount + 1,
      });
      
      // Give bonus points to new user (50 points)
      await storage.createOrUpdateUserStats(userAddress, {
        points: (userStats?.points || 0) + 50,
      });
      
      res.json({ success: true, message: "Referral applied! You earned 50 points, your referrer earned 150 points" });
    } catch (error) {
      console.error("Error applying referral:", error);
      res.status(500).json({ error: "Failed to apply referral code" });
    }
  });

  // Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const allStats = await storage.getAllUserStats();
      const leaderboard = allStats.slice(0, 100); // Top 100
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Chat with Prophet
  app.post("/api/chat", async (req, res) => {
    try {
      const { question, marketId } = req.body;
      console.log(`Chat request: "${question}", marketId: ${marketId}`);
      
      let marketContext = null;
      if (marketId) {
        const market = await storage.getMarket(marketId);
        const rationale = await storage.getRationale(marketId);
        marketContext = { market, rationale };
        console.log(`Market context loaded: ${market?.assetName} ${market?.direction}`);
      }
      
      const answer = await answerQuestion(question, marketContext);
      console.log(`Answer generated (${answer.length} chars):`, answer.substring(0, 100));
      
      if (!answer || answer.trim().length === 0) {
        console.warn("Empty answer, using fallback");
        const fallback = marketContext?.market 
          ? `I predicted ${marketContext.market.assetName} will move ${marketContext.market.direction} by ${marketContext.market.thresholdBps / 100}% based on market analysis.`
          : "I analyze market conditions to make predictions. Ask me about specific aspects.";
        return res.json({ answer: fallback });
      }
      
      res.json({ answer });
    } catch (error) {
      console.error("Error in chat endpoint:", error);
      // Return a helpful fallback even on error
      const fallback = "I'm currently analyzing market conditions. Please try asking again in a moment.";
      res.json({ answer: fallback });
    }
  });

  // Helper function to create demo market
  async function createDemoMarket() {
    const assets = [
      { type: "TOKEN", name: "PEPE", id: "pepe", logo: "https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg" },
      { type: "TOKEN", name: "WIF", id: "dogwifhat", logo: "https://assets.coingecko.com/coins/images/33566/small/dogwifhat.jpg" },
      { type: "TOKEN", name: "DOGE", id: "dogecoin", logo: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png" },
      { type: "NFT", name: "Pudgy Penguins", id: "pudgy-penguins", logo: "https://i.seadn.io/gae/yNi-XdGxsgQCPpqSio4o31ygAV6wURdIdInWRcFIl46UjUQ1eV7BEndGe8L661OoG-clRi7EgInLX4LPu9Jfw4fq0bnVYHqg7RFi?w=500" },
    ];
    
    const randomAsset = assets[Math.floor(Math.random() * assets.length)];
    const direction = Math.random() > 0.5 ? "UP" : "DOWN";
    const thresholdBps = 500; // 5%
    
    const now = new Date();
    const startTime = new Date(now);
    
    // Lock time is 24 hours from now (when betting closes)
    const lockTime = new Date(now);
    lockTime.setHours(lockTime.getHours() + 24);
    
    // End time is 48 hours from now (when market settles)
    const endTime = new Date(now);
    endTime.setHours(endTime.getHours() + 48);
    
    const market = await storage.createMarket({
      assetType: randomAsset.type,
      assetId: randomAsset.id,
      assetName: randomAsset.name,
      assetLogo: randomAsset.logo,
      direction,
      thresholdBps,
      startTime,
      lockTime,
      endTime,
      price0: null,
      price1: null,
    });
    
    // Generate rationale
    const rationaleData = await generateRationale(
      randomAsset.type,
      randomAsset.name,
      direction,
      thresholdBps / 100,
      "simulate"
    );
    
    await storage.createRationale({
      marketId: market.id,
      content: JSON.stringify(rationaleData.bullets),
      dataMode: "simulate",
    });
    
    return market;
  }

  const httpServer = createServer(app);
  return httpServer;
}
