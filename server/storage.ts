import { users, type User, type InsertUser, categories, type Category, type InsertCategory, 
  auctions, type Auction, type InsertAuction, bids, type Bid, type InsertBid, 
  watchlist, type Watchlist, type InsertWatchlist } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

// Import the DatabaseStorage implementation
import { DatabaseStorage } from './storage.db';

const MemoryStore = createMemoryStore(session);

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
  sessionStore: session.Store;
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
  sessionStore: session.Store;
  
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
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    this.initializeData().catch(console.error);
  }
  
  private async initializeData() {
    await this.initializeSampleData();
  }
  
  private async initializeSampleData() {
    await this.initializeCategories();
    
    // Create sample user
    const userData = {
      username: "testuser",
      email: "test@example.com",
      password: "password123", // In a real app, this would be hashed
      avatar: "https://i.pravatar.cc/150?u=testuser"
    };
    const user = await this.createUser(userData);
    
    // Create sample auctions
    const auction1Data = {
      title: "Vintage Polaroid Camera",
      description: "A classic Polaroid camera from the 1970s in excellent working condition. Includes original case and manual.",
      imageUrl: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      categoryId: 3, // Vintage category
      startingPrice: "50",
      currentPrice: "50",
      sellerId: user.id,
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "active" as const,
      featured: true
    };
    const auction1 = await this.createAuction(auction1Data);
    
    const auction2Data = {
      title: "Limited Edition Vinyl Record Collection",
      description: "Collection of 5 rare, limited edition vinyl records from the 1980s. All in mint condition, never played.",
      imageUrl: "https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      categoryId: 1, // Collectibles category
      startingPrice: "200",
      currentPrice: "250",
      sellerId: user.id,
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 
      status: "active" as const,
      featured: true
    };
    const auction2 = await this.createAuction(auction2Data);
    
    const auction3Data = {
      title: "Professional DSLR Camera",
      description: "High-end DSLR camera with multiple lenses, tripod, and carrying case. Perfect for professional photography.",
      imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      categoryId: 2, // Electronics category
      startingPrice: "600",
      currentPrice: "800",
      sellerId: user.id,
      endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: "active" as const,
      featured: false
    };
    const auction3 = await this.createAuction(auction3Data);
    
    const auction4Data = {
      title: "Abstract Canvas Painting",
      description: "Original abstract painting by emerging artist. Acrylic on canvas, 24x36 inches, ready to hang.",
      imageUrl: "https://images.unsplash.com/photo-1549289524-06cf8837ace5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      categoryId: 4, // Art category
      startingPrice: "150",
      currentPrice: "150",
      sellerId: user.id,
      endTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: "active" as const,
      featured: true
    };
    const auction4 = await this.createAuction(auction4Data);
    
    // Create some sample bids
    await this.createBid({
      auctionId: auction2.id,
      userId: user.id,
      amount: "220"
    });
    
    await this.createBid({
      auctionId: auction2.id,
      userId: user.id,
      amount: "250"
    });
    
    await this.createBid({
      auctionId: auction3.id,
      userId: user.id,
      amount: "650"
    });
    
    await this.createBid({
      auctionId: auction3.id,
      userId: user.id,
      amount: "700"
    });
    
    await this.createBid({
      auctionId: auction3.id,
      userId: user.id,
      amount: "800"
    });
    
    // Add some items to watchlist
    await this.addToWatchlist({
      userId: user.id,
      auctionId: auction1.id
    });
    
    await this.addToWatchlist({
      userId: user.id,
      auctionId: auction4.id
    });
  }
  
  private initializeCategories() {
    const initialCategories: InsertCategory[] = [
      { name: "Collectibles", slug: "collectibles", type: "collectibles", imageUrl: "https://images.unsplash.com/photo-1560343776-97e7d202ff0e?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" },
      { name: "Electronics", slug: "electronics", type: "electronics", imageUrl: "https://images.unsplash.com/photo-1598032895397-b9472444bf93?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" },
      { name: "Vintage & Antiques", slug: "vintage", type: "vintage", imageUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" },
      { name: "Art & Decor", slug: "art", type: "art", imageUrl: "https://images.unsplash.com/photo-1518049362265-d5b2a6b00b37?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" }
    ];
    
    for (const category of initialCategories) {
      this.createCategory(category);
    }
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.email.toLowerCase() === email.toLowerCase()
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt,
      updatedAt: createdAt,
      fullName: insertUser.fullName || null,
      avatar: insertUser.avatar || null
    };
    this.users.set(id, user);
    return user;
  }
  
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      category => category.slug === slug
    );
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const createdAt = new Date();
    const category: Category = { 
      ...insertCategory, 
      id, 
      createdAt,
      updatedAt: createdAt,
      count: 0,
      imageUrl: insertCategory.imageUrl || null
    };
    this.categories.set(id, category);
    return category;
  }
  
  async updateCategoryCount(id: number, count: number): Promise<Category> {
    const category = await this.getCategoryById(id);
    if (!category) {
      throw new Error(`Category with ID ${id} not found`);
    }
    
    const updatedCategory = { ...category, count, updatedAt: new Date() };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async getAuctions(): Promise<Auction[]> {
    return Array.from(this.auctions.values());
  }
  
  async getAuctionById(id: number): Promise<Auction | undefined> {
    return this.auctions.get(id);
  }
  
  async getAuctionsByCategory(categoryId: number): Promise<Auction[]> {
    return Array.from(this.auctions.values()).filter(
      auction => auction.categoryId === categoryId
    );
  }
  
  async getAuctionsBySeller(sellerId: number): Promise<Auction[]> {
    return Array.from(this.auctions.values()).filter(
      auction => auction.sellerId === sellerId
    );
  }
  
  async createAuction(insertAuction: InsertAuction): Promise<Auction> {
    const id = this.currentAuctionId++;
    const createdAt = new Date();
    const auction: Auction = { 
      ...insertAuction, 
      id, 
      createdAt,
      updatedAt: createdAt,
      featured: insertAuction.featured || false,
      bidCount: 0,
      status: insertAuction.status || 'active',
      startTime: insertAuction.startTime || new Date()
    };
    this.auctions.set(id, auction);
    
    // Update category count
    const category = await this.getCategoryById(insertAuction.categoryId);
    if (category) {
      await this.updateCategoryCount(category.id, (category.count || 0) + 1);
    }
    
    return auction;
  }
  
  async updateAuction(id: number, data: Partial<Auction>): Promise<Auction | undefined> {
    const auction = await this.getAuctionById(id);
    if (!auction) {
      return undefined;
    }
    
    const updatedAuction = { 
      ...auction, 
      ...data, 
      updatedAt: new Date() 
    };
    
    this.auctions.set(id, updatedAuction);
    return updatedAuction;
  }
  
  async getFeaturedAuctions(): Promise<Auction[]> {
    return Array.from(this.auctions.values()).filter(
      auction => auction.featured
    );
  }
  
  async getBidsForAuction(auctionId: number): Promise<Bid[]> {
    return Array.from(this.bids.values())
      .filter(bid => bid.auctionId === auctionId)
      .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
  }
  
  async createBid(insertBid: InsertBid): Promise<Bid> {
    const id = this.currentBidId++;
    const createdAt = new Date();
    const bid: Bid = { ...insertBid, id, createdAt };
    this.bids.set(id, bid);
    
    // Update auction price
    const auction = await this.getAuctionById(insertBid.auctionId);
    if (auction) {
      await this.updateAuction(auction.id, { 
        currentPrice: insertBid.amount,
        bidCount: (auction.bidCount || 0) + 1
      });
    }
    
    return bid;
  }
  
  async getHighestBid(auctionId: number): Promise<Bid | undefined> {
    const bids = await this.getBidsForAuction(auctionId);
    return bids.length > 0 ? bids[0] : undefined;
  }
  
  async getWatchlistForUser(userId: number): Promise<Watchlist[]> {
    return Array.from(this.watchlist.values()).filter(
      item => item.userId === userId
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

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();