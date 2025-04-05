import { users, type User, type InsertUser, type Category, type Auction, type InsertAuction, type Bid, type InsertBid, type Watchlist, type InsertWatchlist, categories, InsertCategory, auctions, bids, watchlist } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategoryCount(id: number, count: number): Promise<Category>;
  
  // Auction methods
  getAuctions(): Promise<Auction[]>;
  getAuctionById(id: number): Promise<Auction | undefined>;
  getAuctionsByCategory(categoryId: number): Promise<Auction[]>;
  getAuctionsBySeller(sellerId: number): Promise<Auction[]>;
  createAuction(auction: InsertAuction): Promise<Auction>;
  updateAuction(id: number, data: Partial<Auction>): Promise<Auction | undefined>;
  getFeaturedAuctions(): Promise<Auction[]>;
  
  // Bid methods
  getBidsForAuction(auctionId: number): Promise<Bid[]>;
  createBid(bid: InsertBid): Promise<Bid>;
  getHighestBid(auctionId: number): Promise<Bid | undefined>;
  
  // Watchlist methods
  getWatchlistForUser(userId: number): Promise<Watchlist[]>;
  addToWatchlist(data: InsertWatchlist): Promise<Watchlist>;
  removeFromWatchlist(userId: number, auctionId: number): Promise<void>;
  isInWatchlist(userId: number, auctionId: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private auctions: Map<number, Auction>;
  private bids: Map<number, Bid>;
  private watchlist: Map<number, Watchlist>;
  
  currentUserId: number;
  currentCategoryId: number;
  currentAuctionId: number;
  currentBidId: number;
  currentWatchlistId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.auctions = new Map();
    this.bids = new Map();
    this.watchlist = new Map();
    
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentAuctionId = 1;
    this.currentBidId = 1;
    this.currentWatchlistId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Initialize with some categories
    this.initializeCategories();
  }
  
  private initializeCategories() {
    const initialCategories: InsertCategory[] = [
      { name: "Collectibles", slug: "collectibles", type: "collectibles", imageUrl: "https://images.unsplash.com/photo-1560343776-97e7d202ff0e?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" },
      { name: "Electronics", slug: "electronics", type: "electronics", imageUrl: "https://images.unsplash.com/photo-1598032895397-b9472444bf93?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" },
      { name: "Vintage & Antiques", slug: "vintage", type: "vintage", imageUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" },
      { name: "Art & Decor", slug: "art", type: "art", imageUrl: "https://images.unsplash.com/photo-1518049362265-d5b2a6b00b37?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" }
    ];
    
    initialCategories.forEach(category => {
      this.createCategory(category);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }
  
  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      (category) => category.slug === slug,
    );
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = { ...insertCategory, id, count: 0 };
    this.categories.set(id, category);
    return category;
  }
  
  async updateCategoryCount(id: number, count: number): Promise<Category> {
    const category = this.categories.get(id);
    if (!category) {
      throw new Error(`Category with id ${id} not found`);
    }
    
    const updatedCategory = { ...category, count };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  // Auction methods
  async getAuctions(): Promise<Auction[]> {
    return Array.from(this.auctions.values());
  }
  
  async getAuctionById(id: number): Promise<Auction | undefined> {
    return this.auctions.get(id);
  }
  
  async getAuctionsByCategory(categoryId: number): Promise<Auction[]> {
    return Array.from(this.auctions.values()).filter(
      (auction) => auction.categoryId === categoryId,
    );
  }
  
  async getAuctionsBySeller(sellerId: number): Promise<Auction[]> {
    return Array.from(this.auctions.values()).filter(
      (auction) => auction.sellerId === sellerId,
    );
  }
  
  async createAuction(insertAuction: InsertAuction): Promise<Auction> {
    const id = this.currentAuctionId++;
    const createdAt = new Date();
    const auction: Auction = { ...insertAuction, id, createdAt };
    this.auctions.set(id, auction);
    
    // Update category count
    const category = await this.getCategoryById(insertAuction.categoryId);
    if (category) {
      await this.updateCategoryCount(category.id, (category.count || 0) + 1);
    }
    
    return auction;
  }
  
  async updateAuction(id: number, data: Partial<Auction>): Promise<Auction | undefined> {
    const auction = this.auctions.get(id);
    if (!auction) {
      return undefined;
    }
    
    const updatedAuction = { ...auction, ...data };
    this.auctions.set(id, updatedAuction);
    return updatedAuction;
  }
  
  async getFeaturedAuctions(): Promise<Auction[]> {
    return Array.from(this.auctions.values()).filter(
      (auction) => auction.featured === true,
    );
  }
  
  // Bid methods
  async getBidsForAuction(auctionId: number): Promise<Bid[]> {
    return Array.from(this.bids.values()).filter(
      (bid) => bid.auctionId === auctionId,
    );
  }
  
  async createBid(insertBid: InsertBid): Promise<Bid> {
    const id = this.currentBidId++;
    const createdAt = new Date();
    const bid: Bid = { ...insertBid, id, createdAt };
    this.bids.set(id, bid);
    
    // Update auction current price
    const auction = await this.getAuctionById(insertBid.auctionId);
    if (auction) {
      await this.updateAuction(auction.id, { currentPrice: insertBid.amount });
    }
    
    return bid;
  }
  
  async getHighestBid(auctionId: number): Promise<Bid | undefined> {
    const bids = await this.getBidsForAuction(auctionId);
    if (bids.length === 0) {
      return undefined;
    }
    
    // Sort bids by amount in descending order and return the first one
    return bids.sort((a, b) => Number(b.amount) - Number(a.amount))[0];
  }
  
  // Watchlist methods
  async getWatchlistForUser(userId: number): Promise<Watchlist[]> {
    return Array.from(this.watchlist.values()).filter(
      (item) => item.userId === userId,
    );
  }
  
  async addToWatchlist(insertWatchlist: InsertWatchlist): Promise<Watchlist> {
    // Check if already in watchlist
    const exists = await this.isInWatchlist(
      insertWatchlist.userId,
      insertWatchlist.auctionId
    );
    
    if (exists) {
      throw new Error("Item already in watchlist");
    }
    
    const id = this.currentWatchlistId++;
    const createdAt = new Date();
    const watchlistItem: Watchlist = { ...insertWatchlist, id, createdAt };
    this.watchlist.set(id, watchlistItem);
    return watchlistItem;
  }
  
  async removeFromWatchlist(userId: number, auctionId: number): Promise<void> {
    const watchlistItems = await this.getWatchlistForUser(userId);
    const item = watchlistItems.find(item => item.auctionId === auctionId);
    
    if (item) {
      this.watchlist.delete(item.id);
    }
  }
  
  async isInWatchlist(userId: number, auctionId: number): Promise<boolean> {
    const watchlistItems = await this.getWatchlistForUser(userId);
    return watchlistItems.some(item => item.auctionId === auctionId);
  }
}

export const storage = new MemStorage();
