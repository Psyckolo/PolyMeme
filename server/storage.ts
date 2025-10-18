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
  type User,
  type UpsertUser,
  markets,
  balances,
  bets,
  rationales,
  userStats,
  users,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // Auth (Twitter OAuth required methods)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
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
  getAllUserStats(): Promise<UserStats[]>;
  getUserByReferralCode(code: string): Promise<UserStats | undefined>;
  
  // Activity
  getRecentActivity(): Promise<{
    activeBets: number;
    totalVolume: string;
    largestBet: string;
    recentBets: Array<{
      id: string;
      userAddress: string;
      prediction: "RIGHT" | "WRONG";
      amount: string;
      createdAt: string;
    }>;
  }>;
}

export class MemStorage implements IStorage {
  private markets: Map<string, Market>;
  private balances: Map<string, Balance>;
  private bets: Map<string, Bet>;
  private rationales: Map<string, Rationale>;
  private userStats: Map<string, UserStats>;
  private usersMap: Map<string, User>;
  private marketIdCounter: number;

  constructor() {
    this.markets = new Map();
    this.balances = new Map();
    this.bets = new Map();
    this.rationales = new Map();
    this.userStats = new Map();
    this.usersMap = new Map();
    this.marketIdCounter = 1;
  }

  // Auth
  async getUser(id: string): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = this.usersMap.get(userData.id!);
    const user: User = {
      id: userData.id!,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.usersMap.set(user.id, user);
    return user;
  }

  // Markets
  async createMarket(insertMarket: InsertMarket): Promise<Market> {
    const id = randomUUID();
    const market: Market = {
      ...insertMarket,
      id,
      marketId: this.marketIdCounter++,
      assetLogo: insertMarket.assetLogo || null,
      thresholdBps: insertMarket.thresholdBps || 500,
      price0: insertMarket.price0 || null,
      price1: insertMarket.price1 || null,
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
    // Sort by creation time, most recent first
    markets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Return the most recent market
    return markets[0];
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
    
    const defaults: UserStats = {
      id: randomUUID(),
      userAddress: key,
      totalBets: 0,
      wonBets: 0,
      totalWagered: "0",
      totalWinnings: "0",
      currentStreak: 0,
      bestStreak: 0,
      points: 0,
      volumeTraded: "0",
      referralCode: null,
      referredBy: null,
      referralCount: 0,
      updatedAt: new Date(),
    };
    
    const newStats: UserStats = { ...defaults, ...updates, updatedAt: new Date() };
    this.userStats.set(key, newStats);
    return newStats;
  }
  
  async getAllUserStats(): Promise<UserStats[]> {
    return Array.from(this.userStats.values()).sort(
      (a, b) => b.points - a.points
    );
  }
  
  async getUserByReferralCode(code: string): Promise<UserStats | undefined> {
    return Array.from(this.userStats.values()).find(
      (stats) => stats.referralCode === code
    );
  }
  
  async getRecentActivity() {
    const allBets = Array.from(this.bets.values())
      .filter(b => !b.claimed)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const activeBets = allBets.length;
    const totalVolume = allBets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0).toString();
    const largestBet = allBets.length > 0 
      ? Math.max(...allBets.map(b => parseFloat(b.amount))).toString()
      : "0";
    
    const recentBets = allBets.slice(0, 5).map(bet => ({
      id: bet.id,
      userAddress: bet.userAddress,
      prediction: bet.side as "RIGHT" | "WRONG",
      amount: bet.amount,
      createdAt: bet.createdAt.toISOString(),
    }));
    
    return {
      activeBets,
      totalVolume,
      largestBet,
      recentBets,
    };
  }
}

export class DatabaseStorage implements IStorage {
  // Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Markets
  async createMarket(insertMarket: InsertMarket): Promise<Market> {
    // Get the next marketId by finding the max marketId and adding 1
    const result = await db
      .select({ maxId: sql<number>`COALESCE(MAX(${markets.marketId}), 0)` })
      .from(markets);
    const nextMarketId = (result[0]?.maxId || 0) + 1;

    const [market] = await db
      .insert(markets)
      .values({
        ...insertMarket,
        marketId: nextMarketId,
        assetLogo: insertMarket.assetLogo || null,
        thresholdBps: insertMarket.thresholdBps || 500,
        price0: insertMarket.price0 || null,
        price1: insertMarket.price1 || null,
        poolRight: "0",
        poolWrong: "0",
        status: "OPEN",
        winner: null,
        settledAt: null,
      })
      .returning();
    
    return market;
  }

  async getMarket(id: string): Promise<Market | undefined> {
    const [market] = await db
      .select()
      .from(markets)
      .where(eq(markets.id, id));
    
    return market;
  }

  async getMarketByMarketId(marketId: number): Promise<Market | undefined> {
    const [market] = await db
      .select()
      .from(markets)
      .where(eq(markets.marketId, marketId));
    
    return market;
  }

  async getTodayMarket(): Promise<Market | undefined> {
    const [market] = await db
      .select()
      .from(markets)
      .orderBy(desc(markets.createdAt))
      .limit(1);
    
    return market;
  }

  async getAllMarkets(): Promise<Market[]> {
    return await db
      .select()
      .from(markets)
      .orderBy(desc(markets.createdAt));
  }

  async updateMarket(id: string, updates: Partial<Market>): Promise<Market | undefined> {
    const [updated] = await db
      .update(markets)
      .set(updates)
      .where(eq(markets.id, id))
      .returning();
    
    return updated;
  }

  // Balances
  async getBalance(userAddress: string): Promise<Balance | undefined> {
    const [balance] = await db
      .select()
      .from(balances)
      .where(sql`LOWER(${balances.userAddress}) = LOWER(${userAddress})`);
    
    return balance;
  }

  async createOrUpdateBalance(userAddress: string, balance: string): Promise<Balance> {
    const key = userAddress.toLowerCase();
    const existing = await this.getBalance(key);
    
    if (existing) {
      const [updated] = await db
        .update(balances)
        .set({ balance, updatedAt: new Date() })
        .where(eq(balances.userAddress, key))
        .returning();
      
      return updated;
    }
    
    const [newBalance] = await db
      .insert(balances)
      .values({
        userAddress: key,
        balance,
      })
      .returning();
    
    return newBalance;
  }

  async updateBalance(userAddress: string, newBalance: string): Promise<Balance | undefined> {
    return this.createOrUpdateBalance(userAddress, newBalance);
  }

  // Bets
  async createBet(insertBet: InsertBet): Promise<Bet> {
    const [bet] = await db
      .insert(bets)
      .values({
        ...insertBet,
        claimed: false,
        payout: null,
      })
      .returning();
    
    return bet;
  }

  async getBet(id: string): Promise<Bet | undefined> {
    const [bet] = await db
      .select()
      .from(bets)
      .where(eq(bets.id, id));
    
    return bet;
  }

  async getUserBets(userAddress: string): Promise<Bet[]> {
    return await db
      .select()
      .from(bets)
      .where(sql`LOWER(${bets.userAddress}) = LOWER(${userAddress})`)
      .orderBy(desc(bets.createdAt));
  }

  async getMarketBets(marketId: string): Promise<Bet[]> {
    return await db
      .select()
      .from(bets)
      .where(eq(bets.marketId, marketId));
  }

  async updateBet(id: string, updates: Partial<Bet>): Promise<Bet | undefined> {
    const [updated] = await db
      .update(bets)
      .set(updates)
      .where(eq(bets.id, id))
      .returning();
    
    return updated;
  }

  // Rationales
  async createRationale(insertRationale: InsertRationale): Promise<Rationale> {
    const [rationale] = await db
      .insert(rationales)
      .values(insertRationale)
      .returning();
    
    return rationale;
  }

  async getRationale(marketId: string): Promise<Rationale | undefined> {
    const [rationale] = await db
      .select()
      .from(rationales)
      .where(eq(rationales.marketId, marketId));
    
    return rationale;
  }

  // User Stats
  async getUserStats(userAddress: string): Promise<UserStats | undefined> {
    const [stats] = await db
      .select()
      .from(userStats)
      .where(sql`LOWER(${userStats.userAddress}) = LOWER(${userAddress})`);
    
    return stats;
  }

  async createOrUpdateUserStats(userAddress: string, updates: Partial<UserStats>): Promise<UserStats> {
    const key = userAddress.toLowerCase();
    const existing = await this.getUserStats(key);
    
    if (existing) {
      const [updated] = await db
        .update(userStats)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(userStats.userAddress, key))
        .returning();
      
      return updated;
    }
    
    const [newStats] = await db
      .insert(userStats)
      .values({
        userAddress: key,
        totalBets: updates.totalBets ?? 0,
        wonBets: updates.wonBets ?? 0,
        totalWagered: updates.totalWagered ?? "0",
        totalWinnings: updates.totalWinnings ?? "0",
        currentStreak: updates.currentStreak ?? 0,
        bestStreak: updates.bestStreak ?? 0,
        points: updates.points ?? 0,
        volumeTraded: updates.volumeTraded ?? "0",
        referralCode: updates.referralCode ?? null,
        referredBy: updates.referredBy ?? null,
        referralCount: updates.referralCount ?? 0,
      })
      .returning();
    
    return newStats;
  }
  
  async getAllUserStats(): Promise<UserStats[]> {
    return await db
      .select()
      .from(userStats)
      .orderBy(desc(userStats.points));
  }
  
  async getUserByReferralCode(code: string): Promise<UserStats | undefined> {
    const [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.referralCode, code));
    
    return stats;
  }
  
  async getRecentActivity() {
    // Get all unclaimed bets (active bets)
    const allBets = await db
      .select()
      .from(bets)
      .where(eq(bets.claimed, false))
      .orderBy(desc(bets.createdAt));
    
    // Calculate statistics
    const activeBets = allBets.length;
    const totalVolume = allBets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0).toString();
    const largestBet = allBets.length > 0 
      ? Math.max(...allBets.map(b => parseFloat(b.amount))).toString()
      : "0";
    
    // Get recent 5 bets for display
    const recentBets = allBets.slice(0, 5).map(bet => ({
      id: bet.id,
      userAddress: bet.userAddress,
      prediction: bet.side as "RIGHT" | "WRONG",
      amount: bet.amount,
      createdAt: bet.createdAt.toISOString(),
    }));
    
    return {
      activeBets,
      totalVolume,
      largestBet,
      recentBets,
    };
  }
}

export const storage = new DatabaseStorage();
