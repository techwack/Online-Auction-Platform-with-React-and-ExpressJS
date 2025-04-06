import { pgTable, text, serial, integer, boolean, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  avatar: true,
});

// Category model
export const categoryEnum = pgEnum('category_type', [
  'collectibles', 
  'electronics', 
  'vintage', 
  'art', 
  'fashion', 
  'sports', 
  'toys', 
  'jewelry',
  'books',
  'other'
]);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: categoryEnum("type").notNull(),
  imageUrl: text("image_url"),
  count: integer("count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  slug: true,
  type: true,
  imageUrl: true,
});

// Auction status enum
export const auctionStatusEnum = pgEnum('auction_status', [
  'active',
  'ended',
  'cancelled',
  'pending'
]);

// Auction model
export const auctions = pgTable("auctions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  startingPrice: numeric("starting_price").notNull(),
  currentPrice: numeric("current_price").notNull(),
  categoryId: integer("category_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time").notNull(),
  status: auctionStatusEnum("status").notNull().default('active'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  featured: boolean("featured").default(false),
  bidCount: integer("bid_count").default(0)
});

export const insertAuctionSchema = createInsertSchema(auctions).pick({
  title: true,
  description: true,
  imageUrl: true,
  startingPrice: true, 
  currentPrice: true,
  categoryId: true,
  sellerId: true,
  startTime: true,
  endTime: true,
  status: true,
  featured: true
});

// Bids model
export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  auctionId: integer("auction_id").notNull(),
  userId: integer("user_id").notNull(),
  amount: numeric("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertBidSchema = createInsertSchema(bids).pick({
  auctionId: true,
  userId: true,
  amount: true
});

// Watchlist model
export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  auctionId: integer("auction_id").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertWatchlistSchema = createInsertSchema(watchlist).pick({
  userId: true,
  auctionId: true
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertAuction = z.infer<typeof insertAuctionSchema>;
export type Auction = typeof auctions.$inferSelect;

export type InsertBid = z.infer<typeof insertBidSchema>;
export type Bid = typeof bids.$inferSelect;

export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;
export type Watchlist = typeof watchlist.$inferSelect;
