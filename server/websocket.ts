import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { storage } from "./storage";

// Define message types
type WebSocketMessage = {
  type: 'bid' | 'auction_update' | 'watchlist_update' | 'error';
  payload: any;
};

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ 
    server, 
    path: '/ws',
    // Add WebSocket server verifyClient to handle CORS
    verifyClient: (info, cb) => {
      // Accept all origins
      return cb(true);
    }
  });
  
  // Keep track of clients per auction room
  const auctionRooms: Map<number, Set<WebSocket>> = new Map();
  
  wss.on('connection', (ws) => {
    console.log('Client connected to websocket');
    
    // Handle messages from clients
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString()) as WebSocketMessage;
        
        switch (data.type) {
          case 'bid':
            // Process new bid
            const { auctionId, userId, amount } = data.payload;
            
            // Validate bid
            const auction = await storage.getAuctionById(auctionId);
            if (!auction) {
              sendError(ws, "Auction not found");
              return;
            }
            
            if (auction.status !== 'active') {
              sendError(ws, "Auction is not active");
              return;
            }
            
            const highestBid = await storage.getHighestBid(auctionId);
            const minimumBid = highestBid 
              ? Number(highestBid.amount) + 10 // Minimum increment of $10
              : Number(auction.startingPrice);
              
            if (Number(amount) < minimumBid) {
              sendError(ws, `Bid must be at least $${minimumBid}`);
              return;
            }
            
            // Save bid to storage
            const newBid = await storage.createBid({
              auctionId,
              userId,
              amount
            });
            
            // Update auction's current price
            await storage.updateAuction(auctionId, { 
              currentPrice: amount 
            });
            
            // Get user details for the bid
            const user = await storage.getUser(userId);
            const bidWithUser = {
              ...newBid,
              user: user ? {
                id: user.id,
                username: user.username,
                avatar: user.avatar
              } : null
            };
            
            // Broadcast to all clients in the auction room
            broadcastToAuction(auctionId, {
              type: 'bid',
              payload: bidWithUser
            });
            break;
            
          case 'auction_update':
            // Join auction room
            const { auctionId: roomId } = data.payload;
            joinAuctionRoom(ws, roomId);
            break;
            
          default:
            sendError(ws, "Unknown message type");
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
        sendError(ws, "Invalid message format");
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      console.log('Client disconnected from websocket');
      removeFromAllRooms(ws);
    });
    
    // Send a welcome message
    ws.send(JSON.stringify({ 
      type: 'connection', 
      payload: { message: 'Connected to BidHub WebSocket server' } 
    }));
  });
  
  // Helper functions
  function joinAuctionRoom(ws: WebSocket, auctionId: number) {
    if (!auctionRooms.has(auctionId)) {
      auctionRooms.set(auctionId, new Set());
    }
    
    auctionRooms.get(auctionId)?.add(ws);
    
    // Confirm room join
    ws.send(JSON.stringify({
      type: 'auction_update',
      payload: { 
        joined: true,
        auctionId 
      }
    }));
  }
  
  function removeFromAllRooms(ws: WebSocket) {
    // Use forEach instead of for...of for better compatibility
    auctionRooms.forEach((clients) => {
      clients.delete(ws);
    });
    
    // Clean up empty rooms
    auctionRooms.forEach((clients, auctionId) => {
      if (clients.size === 0) {
        auctionRooms.delete(auctionId);
      }
    });
  }
  
  function broadcastToAuction(auctionId: number, message: WebSocketMessage) {
    const clients = auctionRooms.get(auctionId);
    if (!clients) return;
    
    const messageStr = JSON.stringify(message);
    
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
  
  function sendError(ws: WebSocket, message: string) {
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message }
    }));
  }
  
  return wss;
}
