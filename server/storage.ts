import {
  type Market,
  type InsertMarket,
  type Balance,
  type InsertBalance,
  type Bet,
  type InsertBet,
  type Rationale,
  type InsertRationale,
  type UserStats,
  type InsertUserStats,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Markets
  createMarket(market: InsertMarket): Promise<Market>;
  getMarket(id: string): Promise<Market | undefined>;
  getMarketByMarketId(marketId: number): Promise<Market | undefined>;
  getTodayMarket(): Promise<Market | undefined>;
  getAllMarkets(): Promise<Market[]>;
  updateMarket(id: string, updates: Partial<Market>): Promise<Market | undefined>;
  
  // Balances
  getBalance(userAddress: string): Promise<Balance | undefined>;
  createOrUpdateBalance(userAddress: string, balance: string): Promise<Balance>;
  updateBalance(userAddress: string, newBalance: string): Promise<Balance | undefined>;
  
  // Bets
  createBet(bet: InsertBet): Promise<Bet>;
  getBet(id: string): Promise<Bet | undefined>;
  getUserBets(userAddress: string): Promise<Bet[]>;
  getMarketBets(marketId: string): Promise<Bet[]>;
  updateBet(id: string, updates: Partial<Bet>): Promise<Bet | undefined>;
  
  // Rationales
  createRationale(rationale: InsertRationale): Promise<Rationale>;
  getRationale(marketId: string): Promise<Rationale | undefined>;
  
  // User Stats
  getUserStats(userAddress: string): Promise<UserStats | undefined>;
  createOrUpdateUserStats(userAddress: string, updates: Partial<UserStats>): Promise<UserStats>;
}

export class MemStorage implements IStorage {
  private markets: Map<string, Market>;
  private balances: Map<string, Balance>;
  private bets: Map<string, Bet>;
  private rationales: Map<string, Rationale>;
  private userStats: Map<string, UserStats>;
  private marketIdCounter: number;

  constructor() {
    this.markets = new Map();
    this.balances = new Map();
    this.bets = new Map();
    this.rationales = new Map();
    this.userStats = new Map();
    this.marketIdCounter = 1;
  }

  // Markets
  async createMarket(insertMarket: InsertMarket): Promise<Market> {
    const id = randomUUID();
    const market: Market = {
      ...insertMarket,
      id,
      marketId: this.marketIdCounter++,
      poolRight: "0",
      poolWrong: "0",
      status: "OPEN",
      winner: null,
      settledAt: null,
      createdAt: new Date(),
    };
    this.markets.set(id, market);
    return market;
  }

  async getMarket(id: string): Promise<Market | undefined> {
    return this.markets.get(id);
  }

  async getMarketByMarketId(marketId: number): Promise<Market | undefined> {
    return Array.from(this.markets.values()).find((m) => m.marketId === marketId);
  }

  async getTodayMarket(): Promise<Market | undefined> {
    const markets = Array.from(this.markets.values());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return markets.find((m) => {
      const marketDate = new Date(m.startTime);
      marketDate.setHours(0, 0, 0, 0);
      return marketDate.getTime() === today.getTime();
    }) || markets[markets.length - 1]; // Return most recent if no today market
  }

  async getAllMarkets(): Promise<Market[]> {
    return Array.from(this.markets.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async updateMarket(id: string, updates: Partial<Market>): Promise<Market | undefined> {
    const market = this.markets.get(id);
    if (!market) return undefined;
    
    const updated = { ...market, ...updates };
    this.markets.set(id, updated);
    return updated;
  }

  // Balances
  async getBalance(userAddress: string): Promise<Balance | undefined> {
    return this.balances.get(userAddress.toLowerCase());
  }

  async createOrUpdateBalance(userAddress: string, balance: string): Promise<Balance> {
    const key = userAddress.toLowerCase();
    const existing = this.balances.get(key);
    
    if (existing) {
      const updated: Balance = { ...existing, balance, updatedAt: new Date() };
      this.balances.set(key, updated);
      return updated;
    }
    
    const newBalance: Balance = {
      id: randomUUID(),
      userAddress: key,
      balance,
      updatedAt: new Date(),
    };
    this.balances.set(key, newBalance);
    return newBalance;
  }

  async updateBalance(userAddress: string, newBalance: string): Promise<Balance | undefined> {
    return this.createOrUpdateBalance(userAddress, newBalance);
  }

  // Bets
  async createBet(insertBet: InsertBet): Promise<Bet> {
    const id = randomUUID();
    const bet: Bet = {
      ...insertBet,
      id,
      claimed: false,
      payout: null,
      createdAt: new Date(),
    };
    this.bets.set(id, bet);
    return bet;
  }

  async getBet(id: string): Promise<Bet | undefined> {
    return this.bets.get(id);
  }

  async getUserBets(userAddress: string): Promise<Bet[]> {
    return Array.from(this.bets.values())
      .filter((b) => b.userAddress.toLowerCase() === userAddress.toLowerCase())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getMarketBets(marketId: string): Promise<Bet[]> {
    return Array.from(this.bets.values()).filter((b) => b.marketId === marketId);
  }

  async updateBet(id: string, updates: Partial<Bet>): Promise<Bet | undefined> {
    const bet = this.bets.get(id);
    if (!bet) return undefined;
    
    const updated = { ...bet, ...updates };
    this.bets.set(id, updated);
    return updated;
  }

  // Rationales
  async createRationale(insertRationale: InsertRationale): Promise<Rationale> {
    const id = randomUUID();
    const rationale: Rationale = {
      ...insertRationale,
      id,
      createdAt: new Date(),
    };
    this.rationales.set(insertRationale.marketId, rationale);
    return rationale;
  }

  async getRationale(marketId: string): Promise<Rationale | undefined> {
    return this.rationales.get(marketId);
  }

  // User Stats
  async getUserStats(userAddress: string): Promise<UserStats | undefined> {
    return this.userStats.get(userAddress.toLowerCase());
  }

  async createOrUpdateUserStats(userAddress: string, updates: Partial<UserStats>): Promise<UserStats> {
    const key = userAddress.toLowerCase();
    const existing = this.userStats.get(key);
    
    if (existing) {
      const updated: UserStats = { ...existing, ...updates, updatedAt: new Date() };
      this.userStats.set(key, updated);
      return updated;
    }
    
    const newStats: UserStats = {
      id: randomUUID(),
      userAddress: key,
      totalBets: 0,
      wonBets: 0,
      totalWagered: "0",
      totalWinnings: "0",
      currentStreak: 0,
      bestStreak: 0,
      ...updates,
      updatedAt: new Date(),
    };
    this.userStats.set(key, newStats);
    return newStats;
  }
}

export const storage = new MemStorage();
