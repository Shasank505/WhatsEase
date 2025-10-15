// API and WebSocket URLs
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/api/auth/register',
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  ME: '/api/auth/me',
  
  // Messages
  SEND_MESSAGE: '/api/messages/',
  GET_CONVERSATION: '/api/messages/conversation',
  GET_CHAT_LIST: '/api/messages/chats',
  CHAT_WITH_BOT: '/api/messages/bot',
  UPDATE_MESSAGE_STATUS: '/api/messages',
  
  // WebSocket
  WS_CHAT: '/ws/chat'
};

// Message Status
export const MESSAGE_STATUS = {
  SENT: 'Sent',
  DELIVERED: 'Delivered',
  READ: 'Read'
};

// WebSocket Message Types
export const WS_MESSAGE_TYPES = {
  CONNECTION_ESTABLISHED: 'connection_established',
  NEW_MESSAGE: 'new_message',
  MESSAGE_STATUS: 'message_status',
  TYPING: 'typing',
  USER_STATUS: 'user_status',
  MARK_DELIVERED: 'mark_delivered',
  MARK_READ: 'mark_read',
  PING: 'ping',
  PONG: 'pong',
  ERROR: 'error'
};

// Bot Email
export const BOT_EMAIL = 'bot@whatsease.com';

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'whatsease_token',
  USER: 'whatsease_user'
};

// Pagination
export const MESSAGES_PER_PAGE = 50;

// Timeouts
export const TYPING_INDICATOR_TIMEOUT = 3000; // 3 seconds
export const RECONNECT_INTERVAL = 5000; // 5 seconds
export const PING_INTERVAL = 30000; // 30 seconds