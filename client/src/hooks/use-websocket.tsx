import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from './use-toast';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);
  const maxReconnectAttempts = 5;
  const { toast } = useToast();

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
    
    // Handle both local development and production
    const host = window.location.hostname === 'localhost' ? 
      `${window.location.hostname}:5000` : window.location.host;
    
    const wsUrl = `${protocol}//${host}/ws`;
    
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
          socketRef.current = null;
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
          
          // Handle different message types here if needed
          // This could be expanded to use a context or event emitter
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };
      
      socketRef.current = socket;
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      // Schedule a reconnect attempt
      const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 30000);
      reconnectCountRef.current++;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        socketRef.current = null;
        connect();
      }, delay);
    }
  }, [toast, maxReconnectAttempts]);

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
  
  return socketRef.current;
}
