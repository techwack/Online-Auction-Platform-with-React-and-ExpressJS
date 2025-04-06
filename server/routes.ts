import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupWebSocketServer } from "./websocket";
import { z } from "zod";
import { insertAuctionSchema, insertBidSchema, insertWatchlistSchema } from "server/schema";

// Authentication middleware
function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  setupWebSocketServer(httpServer);
  
  // ====== API Routes ======
  
  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/categories/:slug", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Auctions routes
  app.get("/api/auctions", async (req, res) => {
    try {
      const auctions = await storage.getAuctions();
      res.json(auctions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/auctions/featured", async (req, res) => {
    try {
      const auctions = await storage.getFeaturedAuctions();
      res.json(auctions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/auctions/:id", async (req, res) => {
    try {
      const auctionId = parseInt(req.params.id);
      const auction = await storage.getAuctionById(auctionId);
      
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      
      res.json(auction);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/auctions", isAuthenticated, async (req, res) => {
    try {
      const validation = insertAuctionSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid auction data", 
          errors: validation.error.format() 
        });
      }
      
      // Set the seller to the current user
      const auctionData = {
        ...validation.data,
        sellerId: req.user.id
      };
      
      const auction = await storage.createAuction(auctionData);
      res.status(201).json(auction);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/auctions/category/:categoryId", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const auctions = await storage.getAuctionsByCategory(categoryId);
      res.json(auctions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/auctions/seller/:sellerId", async (req, res) => {
    try {
      const sellerId = parseInt(req.params.sellerId);
      const auctions = await storage.getAuctionsBySeller(sellerId);
      res.json(auctions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Bids routes
  app.get("/api/auctions/:id/bids", async (req, res) => {
    try {
      const auctionId = parseInt(req.params.id);
      const bids = await storage.getBidsForAuction(auctionId);
      res.json(bids);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/bids", isAuthenticated, async (req, res) => {
    try {
      const validation = insertBidSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid bid data", 
          errors: validation.error.format() 
        });
      }
      
      // Set the user to the current user
      const bidData = {
        ...validation.data,
        userId: req.user.id
      };
      
      // Validate bid amount
      const auction = await storage.getAuctionById(bidData.auctionId);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      
      if (auction.status !== 'active') {
        return res.status(400).json({ message: "Auction is not active" });
      }
      
      const highestBid = await storage.getHighestBid(bidData.auctionId);
      const minimumBid = highestBid 
        ? Number(highestBid.amount) + 10 // Minimum increment of $10
        : Number(auction.startingPrice);
        
      if (Number(bidData.amount) < minimumBid) {
        return res.status(400).json({ 
          message: `Bid must be at least $${minimumBid}` 
        });
      }
      
      const bid = await storage.createBid(bidData);
      res.status(201).json(bid);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Watchlist routes
  app.get("/api/watchlist", isAuthenticated, async (req, res) => {
    try {
      const watchlist = await storage.getWatchlistForUser(req.user.id);
      
      // Fetch auction details for each watchlist item
      const watchlistWithAuctions = await Promise.all(
        watchlist.map(async (item) => {
          const auction = await storage.getAuctionById(item.auctionId);
          return {
            ...item,
            auction
          };
        })
      );
      
      res.json(watchlistWithAuctions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/watchlist", isAuthenticated, async (req, res) => {
    try {
      const validation = insertWatchlistSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid watchlist data", 
          errors: validation.error.format() 
        });
      }
      
      // Set the user to the current user
      const watchlistData = {
        ...validation.data,
        userId: req.user.id
      };
      
      const watchlistItem = await storage.addToWatchlist(watchlistData);
      res.status(201).json(watchlistItem);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete("/api/watchlist/:auctionId", isAuthenticated, async (req, res) => {
    try {
      const auctionId = parseInt(req.params.auctionId);
      await storage.removeFromWatchlist(req.user.id, auctionId);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/watchlist/check/:auctionId", isAuthenticated, async (req, res) => {
    try {
      const auctionId = parseInt(req.params.auctionId);
      const isInWatchlist = await storage.isInWatchlist(req.user.id, auctionId);
      res.json({ isInWatchlist });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
