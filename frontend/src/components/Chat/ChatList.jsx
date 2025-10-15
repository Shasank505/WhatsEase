import { useState, useMemo } from 'react';
import '../../styles/chat.css';

function ChatList({ 
  chats, 
  selectedChat, 
  onChatSelect, 
  onSearch, 
  onRefresh, 
  loading, 
  searchQuery 
}) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Process chats: ensure only ONE AI Assistant at the top
  const processedChats = useMemo(() => {
    // Separate bot and regular chats
    const botChat = chats.find(chat => chat.other_user_email === 'bot@whatsease.com');
    const regularChats = chats.filter(chat => chat.other_user_email !== 'bot@whatsease.com');

    // If bot exists in API response, use it; otherwise create default
    const finalBotChat = botChat || {
      id: 'bot-chat',
      other_user_email: 'bot@whatsease.com',
      other_user_username: 'AI Assistant',
      other_user_avatar: null,
      last_message: 'Hello! 👋 How can I help you today?',
      last_message_time: new Date().toISOString(),
      unread_count: 0,
      is_online: true
    };

    // Ensure bot is always marked as online
    finalBotChat.is_online = true;

    // Return bot at the top, followed by regular chats
    return [finalBotChat, ...regularChats];
  }, [chats]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return minutes < 1 ? 'Just now' : `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const truncateMessage = (message, maxLength = 40) => {
    if (!message) return 'No messages yet';
    return message.length > maxLength 
      ? message.substring(0, maxLength) + '...' 
      : message;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    if (name === 'AI Assistant') return '🤖';
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const filteredChats = processedChats.filter(chat =>
    chat.other_user_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.other_user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (chat.last_message && chat.last_message.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="chat-list">
      {/* Search Header */}
      <div className="chat-list-header">
        <h2>Messages</h2>
        <button 
          onClick={onRefresh} 
          className="btn-refresh"
          title="Refresh chats"
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
        </button>
      </div>

      {/* Search Bar */}
      <div className={`search-container ${isSearchFocused ? 'focused' : ''}`}>
        <svg 
          className="search-icon" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          className="search-input"
        />
        {searchQuery && (
          <button 
            onClick={() => onSearch('')}
            className="btn-clear-search"
            title="Clear search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Chat Items */}
      <div className="chat-items">
        {loading ? (
          <div className="chat-list-loading">
            <div className="spinner"></div>
            <p>Loading chats...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="empty-chat-list">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p>{searchQuery ? 'No chats found' : 'No chats yet'}</p>
            <small>Start a conversation to see it here</small>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.id || chat.other_user_email}
              className={`chat-item ${selectedChat?.other_user_email === chat.other_user_email ? 'active' : ''}`}
              onClick={() => onChatSelect(chat)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onChatSelect(chat);
                }
              }}
            >
              <div className="chat-avatar">
                {chat.other_user_avatar ? (
                  <img src={chat.other_user_avatar} alt={chat.other_user_username} />
                ) : (
                  <div className={`avatar-placeholder ${chat.other_user_email === 'bot@whatsease.com' ? 'bot-avatar' : ''}`}>
                    {getInitials(chat.other_user_username)}
                  </div>
                )}
                {chat.is_online && <span className="online-indicator"></span>}
              </div>

              <div className="chat-info">
                <div className="chat-header-row">
                  <h3 className="chat-name">{chat.other_user_username}</h3>
                  <span className="chat-time">
                    {formatTimestamp(chat.last_message_time)}
                  </span>
                </div>
                <div className="chat-message-row">
                  <p className="chat-last-message">
                    {truncateMessage(chat.last_message)}
                  </p>
                  {chat.unread_count > 0 && (
                    <span className="unread-badge">{chat.unread_count}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ChatList;