import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from './use-toast';
import { createContext, ReactNode, useContext } from 'react';

// Message types from the server
type WebSocketMessageType = 'bid' | 'auction_update' | 'watchlist_update' | 'error' | 'connection';

// WebSocket message interface
export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
}

// WebSocket context type
interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  joinAuctionRoom: (auctionId: number) => void;
}

// Create context
const WebSocketContext = createContext<WebSocketContextType | null>(null);

// Provider component
export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);
  const maxReconnectAttempts = 5;
  const { toast } = useToast();

  // Establish websocket connection
  const connect = useCallback(() => {
    // Don't attempt to reconnect if max attempts reached
    if (reconnectCountRef.current >= maxReconnectAttempts) {
      console.error('Max WebSocket reconnection attempts reached');
      return;
    }

    // Clear any existing socket
    if (socketRef.current) {
      socketRef.current.onclose = null; // Prevent the onclose handler from triggering another reconnect
      socketRef.current.close();
    }

    // Determine the correct WebSocket URL based on the current protocol
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    
    // Get the correct host, assuming API and client are on the same host in production
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log(`Attempting WebSocket connection to: ${wsUrl} (Attempt ${reconnectCountRef.current + 1}/${maxReconnectAttempts})`);
    
    try {
      // Create WebSocket connection
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnected(true);
        reconnectCountRef.current = 0; // Reset reconnect counter on successful connection
      };
      
      socket.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        setIsConnected(false);
        
        // Don't attempt to reconnect on normal closure
        if (event.code === 1000) {
          console.log('WebSocket closed normally, not reconnecting');
          return;
        }
        
        // Attempt to reconnect after a delay with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 30000); // Max 30s
        console.log(`Attempting to reconnect in ${delay}ms`);
        
        reconnectCountRef.current++;
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Only show toast on first error to avoid spamming the user
        if (reconnectCountRef.current === 0) {
          toast({
            title: "Connection Error",
            description: "Having trouble connecting to real-time updates. Retrying...",
            variant: "destructive"
          });
        }
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          // Handle error messages with toast notifications
          if (data.type === 'error') {
            toast({
              title: "WebSocket Error",
              description: data.payload.message,
              variant: "destructive"
            });
          }
          
          if (data.type === 'connection') {
            console.log('Connection confirmed:', data.payload.message);
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };
      
      socketRef.current = socket;
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setIsConnected(false);
      
      // Schedule a reconnect attempt
      const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 30000);
      reconnectCountRef.current++;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    }
  }, [toast]);

  // Send a message through the websocket
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log('Sending WebSocket message:', message);
      socketRef.current.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('WebSocket not connected, cannot send message');
      // If not connected, attempt to reconnect
      if (!isConnected && reconnectCountRef.current < maxReconnectAttempts) {
        connect();
      }
      return false;
    }
  }, [isConnected, connect, maxReconnectAttempts]);

  // Join an auction room to receive updates
  const joinAuctionRoom = useCallback((auctionId: number) => {
    console.log(`Joining auction room: ${auctionId}`);
    return sendMessage({
      type: 'auction_update',
      payload: { auctionId }
    });
  }, [sendMessage]);

  // Connect on mount
  useEffect(() => {
    connect();
    
    // Clean up the WebSocket connection when the component unmounts
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (socketRef.current) {
        socketRef.current.onclose = null; // Prevent reconnect attempts after unmount
        socketRef.current.close();
      }
    };
  }, [connect]);

  // Provide the WebSocket context
  return (
    <WebSocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      sendMessage,
      joinAuctionRoom
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

// Hook to use the WebSocket context
export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
