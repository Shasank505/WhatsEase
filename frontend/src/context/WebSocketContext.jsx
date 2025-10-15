import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { STORAGE_KEYS } from '../utils/constants';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const { user } = useAuth();
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const messageHandlersRef = useRef(new Set());

  const connect = useCallback(() => {
    if (!user) return;

    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) return;

    try {
      // WebSocket URL - match your backend
      const wsBaseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
      const wsUrl = `${wsBaseUrl}/ws/chat?token=${token}`;
      console.log('Connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          // Add to messages array
          setMessages(prev => [...prev, data]);
          
          // Notify all registered handlers
          messageHandlersRef.current.forEach(handler => {
            try {
              handler(data);
            } catch (error) {
              console.error('Error in message handler:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Reconnecting... Attempt ${reconnectAttemptsRef.current + 1}`);
            reconnectAttemptsRef.current += 1;
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      setSocket(ws);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (user && token) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [user, connect]);

  /**
   * Send a message through WebSocket
   */
  const sendMessage = useCallback((type, data) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const payload = {
        type,
        data,
        timestamp: new Date().toISOString()
      };
      socket.send(JSON.stringify(payload));
    } else {
      console.error('WebSocket is not connected');
    }
  }, [socket]);

  /**
   * Send a chat message
   */
  const sendChatMessage = useCallback((recipient, content, replyTo = null) => {
    sendMessage('new_message', {
      recipient,
      content,
      reply_to: replyTo
    });
  }, [sendMessage]);

  /**
   * Send typing indicator
   */
  const sendTypingIndicator = useCallback((recipient, isTyping) => {
    sendMessage('typing', {
      recipient,
      is_typing: isTyping
    });
  }, [sendMessage]);

  /**
   * Mark message as delivered
   */
  const markAsDelivered = useCallback((messageId, senderEmail) => {
    sendMessage('mark_delivered', {
      message_id: messageId,
      sender: senderEmail
    });
  }, [sendMessage]);

  /**
   * Mark message as read
   */
  const markAsRead = useCallback((messageId, senderEmail) => {
    sendMessage('mark_read', {
      message_id: messageId,
      sender: senderEmail
    });
  }, [sendMessage]);

  /**
   * Send ping to keep connection alive
   */
  const sendPing = useCallback(() => {
    sendMessage('ping', {});
  }, [sendMessage]);

  /**
   * Register a message handler
   */
  const addMessageHandler = useCallback((handler) => {
    messageHandlersRef.current.add(handler);
    
    // Return cleanup function
    return () => {
      messageHandlersRef.current.delete(handler);
    };
  }, []);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const value = {
    socket,
    isConnected,
    messages,
    sendMessage,
    sendChatMessage,
    sendTypingIndicator,
    markAsDelivered,
    markAsRead,
    sendPing,
    addMessageHandler,
    clearMessages
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};