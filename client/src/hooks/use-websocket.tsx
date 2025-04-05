import { useState, useEffect, useRef } from 'react';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!socketRef.current) {
      // Determine the correct WebSocket URL based on the current protocol
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Create WebSocket connection
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnected(true);
      };
      
      socket.onclose = () => {
        console.log('WebSocket connection closed');
        setIsConnected(false);
        
        // Attempt to reconnect after a delay
        setTimeout(() => {
          socketRef.current = null;
        }, 5000);
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
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
    }
    
    // Clean up the WebSocket connection when the component unmounts
    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    };
  }, []);
  
  return socketRef.current;
}
