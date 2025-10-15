import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import Header from '../Layout/Header';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import apiService from '../../services/api';
import '../../styles/chat.css';

function ChatDashboard() {
  const { userEmail } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected, addMessageHandler } = useWebSocket();
  
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    loadChatList();
  }, []);

  // Listen for user status updates via WebSocket
  useEffect(() => {
    if (!addMessageHandler) return;

    const cleanup = addMessageHandler((wsMessage) => {
      console.log('WebSocket message received:', wsMessage);

      // Handle user_status_change (from your backend)
      if (wsMessage.type === 'user_status_change') {
        const { user_email, is_online } = wsMessage.data || {};
        
        console.log(`User status changed: ${user_email} is ${is_online ? 'online' : 'offline'}`);
        
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          if (is_online) {
            newSet.add(user_email);
          } else {
            newSet.delete(user_email);
          }
          return newSet;
        });

        // Update the specific chat's online status
        setChats(prevChats => 
          prevChats.map(chat => 
            chat.other_user_email === user_email 
              ? { ...chat, is_online } 
              : chat
          )
        );

        // Update selected chat if it's the one that changed
        if (selectedChat?.other_user_email === user_email) {
          setSelectedChat(prev => ({ ...prev, is_online }));
        }
      }
    });

    return cleanup;
  }, [addMessageHandler, selectedChat]);

  useEffect(() => {
    if (userEmail && chats.length > 0) {
      const chat = chats.find(c => c.other_user_email === userEmail);
      if (chat) {
        // Update online status from current state
        const updatedChat = {
          ...chat,
          is_online: chat.other_user_email === 'bot@whatsease.com' 
            ? true 
            : onlineUsers.has(chat.other_user_email) || chat.is_online
        };
        setSelectedChat(updatedChat);
      }
    }
  }, [userEmail, chats, onlineUsers]);

  const loadChatList = async () => {
    setLoading(true);
    try {
      const chatList = await apiService.getChatList();
      
      // Build initial online users set from API response
      const online = new Set();
      chatList.forEach(chat => {
        if (chat.is_online) {
          online.add(chat.other_user_email);
        }
      });
      setOnlineUsers(online);
      
      setChats(chatList);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSelect = (chat) => {
    // Update chat with current online status
    const updatedChat = {
      ...chat,
      is_online: chat.other_user_email === 'bot@whatsease.com' 
        ? true 
        : onlineUsers.has(chat.other_user_email) || chat.is_online
    };
    
    setSelectedChat(updatedChat);
    navigate(`/chat/${chat.other_user_email}`);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleRefresh = () => {
    loadChatList();
  };

  return (
    <div className="chat-dashboard">
      <Header />
      
      <div className="dashboard-content">
        {/* Chat List Sidebar */}
        <aside className="chat-sidebar" aria-label="Chat list">
          <ChatList
            chats={chats}
            selectedChat={selectedChat}
            onChatSelect={handleChatSelect}
            onSearch={handleSearch}
            onRefresh={handleRefresh}
            loading={loading}
            searchQuery={searchQuery}
          />
        </aside>

        {/* Chat Window */}
        <main className="chat-main" aria-label="Chat messages">
          {selectedChat ? (
            <ChatWindow
              chat={selectedChat}
              currentUser={user}
            />
          ) : (
            <div className="no-chat-selected">
              <div className="no-chat-content">
                <svg 
                  width="120" 
                  height="120" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <h2>Welcome to WhatsEase</h2>
                <p>
                  {isConnected 
                    ? 'Select a chat to start messaging'
                    : 'Connecting to server...'}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default ChatDashboard;