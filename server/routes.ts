import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateRationale, answerQuestion } from "./lib/openai";
import { getTokenPrice } from "./lib/dexscreener";
import {
  depositSchema,
  withdrawSchema,
  placeBetSchema,
  claimSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Get current price (real-time) for a market's token
  app.get("/api/price/:marketId", async (req, res) => {
    try {
      const { marketId } = req.params;
      const market = await storage.getMarket(marketId);
      
      if (!market) {
        return res.status(404).json({ error: "Market not found" });
      }

      // Only fetch real-time price for tokens
      if (market.assetType !== "TOKEN") {
        return res.json({ 
          price0: market.price0,
          currentPrice: market.price0, // For NFTs, no real-time update
          priceChange: 0 
        });
      }

      const currentPrice = await getTokenPrice(market.assetId);
      const price0 = parseFloat(market.price0 || "0");
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
        // Create initial balance
        balance = await storage.createOrUpdateBalance(userAddress, "1000"); // Start with 1000 USDC
      }
      
      res.json({ balance: balance.balance });
    } catch (error) {
      console.error("Error fetching balance:", error);
      res.status(500).json({ error: "Failed to fetch balance" });
    }
  });

  // Deposit USDC
  app.post("/api/deposit", async (req, res) => {
    try {
      const parsed = depositSchema.parse(req.body);
      const { userAddress, amount } = parsed;
      
      const currentBalance = await storage.getBalance(userAddress);
      const currentAmount = currentBalance ? parseFloat(currentBalance.balance) : 0;
      const newAmount = currentAmount + parseFloat(amount);
      
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
      
      res.json({ success: true, bet });
    } catch (error: any) {
      console.error("Error placing bet:", error);
      res.status(400).json({ error: error.message || "Failed to place bet" });
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
        
        res.json({ success: true, payout: payout.toString() });
      } else {
        res.status(400).json({ error: "No payout available" });
      }
    } catch (error: any) {
      console.error("Error claiming:", error);
      res.status(400).json({ error: error.message || "Failed to claim" });
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
