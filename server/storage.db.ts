import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { IStorage } from "./storage";
import pkg from 'pg';
const { Pool } = pkg;
import { 
  users, categories, auctions, bids, watchlist,
  type User, type Category, type Auction, type Bid, type Watchlist,
  type InsertUser, type InsertCategory, type InsertAuction, type InsertBid, type InsertWatchlist
} from "@shared/schema";

// Create PostgreSQL session store
const PostgresSessionStore = connectPg(session);

// Create a pg Pool for session store (it requires a different client type than postgres-js)
const pgPool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool: pgPool,
      createTableIfMissing: true,
    });
    
    this.initializeData().then(() => {
      console.log("Database initialized successfully");
    }).catch(err => {
      console.error("Error initializing database:", err);
    });
  }

  private async initializeData() {
    try {
      // First, check if the table exists by querying directly
      const tableExists = await pgPool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log("Users table doesn't exist, need to run migrations first");
        // Push schema to database
        await this.runMigrations();
        console.log("Initializing sample data after migration...");
        await this.initializeSampleData();
        return;
      }
      
      // If table exists, check if it has data
      const userCount = await pgPool.query('SELECT COUNT(*) FROM users');
      
      if (parseInt(userCount.rows[0].count, 10) === 0) {
        console.log("No users found, initializing sample data...");
        await this.initializeSampleData();
      } else {
        console.log("Database already has data");
      }
    } catch (error) {
      console.error("Error checking database:", error);
      // Continue with initialization in case of error
      console.log("Initializing sample data due to database check error");
      await this.runMigrations();
      await this.initializeSampleData();
    }
  }
  
  private async runMigrations() {
    console.log("Running database migrations...");
    try {
      // Push schema to database using drizzle-kit
      const { exec } = require("child_process");
      return new Promise((resolve, reject) => {
        exec("npm run db:push", (error: unknown, stdout: string, stderr: string) => {
          if (error) {
            console.error(`Migration execution error: ${error}`);
            console.error(stderr);
            reject(error);
            return;
          }
          console.log(`Migration stdout: ${stdout}`);
          resolve(stdout);
        });
      });
    } catch (error) {
      console.error("Error running migrations:", error);
      throw error;
    }
  }

  private async initializeSampleData() {
    try {
      // Create sample categories
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
      
      console.log("Sample data initialized successfully");
    } catch (error) {
      console.error("Error initializing sample data:", error);
      throw error;
    }
  }

  private async initializeCategories() {
    const initialCategories: InsertCategory[] = [
      { name: "Collectibles", slug: "collectibles", type: "collectibles", imageUrl: "https://images.unsplash.com/photo-1560343776-97e7d202ff0e?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" },
      { name: "Electronics", slug: "electronics", type: "electronics", imageUrl: "https://images.unsplash.com/photo-1598032895397-b9472444bf93?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" },
      { name: "Vintage & Antiques", slug: "vintage", type: "vintage", imageUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" },
      { name: "Art & Decor", slug: "art", type: "art", imageUrl: "https://images.unsplash.com/photo-1518049362265-d5b2a6b00b37?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" }
    ];
    
    for (const category of initialCategories) {
      await this.createCategory(category);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Category methods
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }
  
  async updateCategoryCount(id: number, count: number): Promise<Category> {
    const [category] = await db
      .update(categories)
      .set({ count })
      .where(eq(categories.id, id))
      .returning();
      
    if (!category) {
      throw new Error(`Category with ID ${id} not found`);
    }
    
    return category;
  }
  
  // Auction methods
  async getAuctions(): Promise<Auction[]> {
    return await db.select().from(auctions);
  }
  
  async getAuctionById(id: number): Promise<Auction | undefined> {
    const [auction] = await db.select().from(auctions).where(eq(auctions.id, id));
    return auction;
  }
  
  async getAuctionsByCategory(categoryId: number): Promise<Auction[]> {
    return await db.select().from(auctions).where(eq(auctions.categoryId, categoryId));
  }
  
  async getAuctionsBySeller(sellerId: number): Promise<Auction[]> {
    return await db.select().from(auctions).where(eq(auctions.sellerId, sellerId));
  }
  
  async createAuction(insertAuction: InsertAuction): Promise<Auction> {
    const [auction] = await db.insert(auctions).values(insertAuction).returning();

    // Update category count
    const category = await this.getCategoryById(insertAuction.categoryId);
    if (category) {
      await this.updateCategoryCount(category.id, (category.count || 0) + 1);
    }

    return auction;
  }
  
  async updateAuction(id: number, data: Partial<Auction>): Promise<Auction | undefined> {
    const [auction] = await db
      .update(auctions)
      .set(data)
      .where(eq(auctions.id, id))
      .returning();
      
    return auction;
  }
  
  async getFeaturedAuctions(): Promise<Auction[]> {
    return await db.select().from(auctions).where(eq(auctions.featured, true));
  }
  
  // Bid methods
  async getBidsForAuction(auctionId: number): Promise<Bid[]> {
    return await db
      .select()
      .from(bids)
      .where(eq(bids.auctionId, auctionId))
      .orderBy(desc(bids.amount)); // Sort by highest amount
  }
  
  async createBid(insertBid: InsertBid): Promise<Bid> {
    const [bid] = await db.insert(bids).values(insertBid).returning();
    
    // Update auction current price and bid count
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
    const [bid] = await db
      .select()
      .from(bids)
      .where(eq(bids.auctionId, auctionId))
      .orderBy(desc(bids.amount))
      .limit(1);
      
    return bid;
  }
  
  // Watchlist methods
  async getWatchlistForUser(userId: number): Promise<Watchlist[]> {
    return await db.select().from(watchlist).where(eq(watchlist.userId, userId));
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
    
    const [watchlistItem] = await db.insert(watchlist).values(insertWatchlist).returning();
    return watchlistItem;
  }
  
  async removeFromWatchlist(userId: number, auctionId: number): Promise<void> {
    await db
      .delete(watchlist)
      .where(
        and(
          eq(watchlist.userId, userId),
          eq(watchlist.auctionId, auctionId)
        )
      );
  }
  
  async isInWatchlist(userId: number, auctionId: number): Promise<boolean> {
    const [item] = await db
      .select()
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, userId),
          eq(watchlist.auctionId, auctionId)
        )
      );
      
    return !!item;
  }
}