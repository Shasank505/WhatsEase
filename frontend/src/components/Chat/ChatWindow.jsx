import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../../context/WebSocketContext';
import apiService from '../../services/api';
import Message from './Message';
import MessageInput from './MessageInput';
import Loading from '../Common/Loading';
import '../../styles/chat.css';

function ChatWindow({ chat, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const { addMessageHandler, sendChatMessage, markAsRead, isConnected } = useWebSocket();

  useEffect(() => {
    if (chat && chat.other_user_email) {
      loadMessages();
    }
  }, [chat?.other_user_email]);

  const loadMessages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getConversation(chat.other_user_email);
      
      if (response && response.messages) {
        setMessages(response.messages.reverse());
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Failed to load messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!addMessageHandler) return;

    const cleanup = addMessageHandler((wsMessage) => {
      if (wsMessage.type === 'new_message' || wsMessage.type === 'message') {
        const messageData = wsMessage.data || wsMessage;
        
        if (
          (messageData.sender === chat.other_user_email && messageData.recipient === currentUser.email) ||
          (messageData.sender === currentUser.email && messageData.recipient === chat.other_user_email)
        ) {
          setMessages(prev => {
            const exists = prev.some(m => m.message_id === messageData.message_id);
            if (exists) return prev;
            return [...prev, messageData];
          });

          if (messageData.sender === chat.other_user_email && markAsRead) {
            markAsRead(messageData.message_id, chat.other_user_email);
          }
        }
      } else if (wsMessage.type === 'typing') {
        const typingData = wsMessage.data;
        if (typingData.sender === chat.other_user_email) {
          setIsTyping(typingData.is_typing);
        }
      }
    });

    return cleanup;
  }, [chat?.other_user_email, currentUser?.email, addMessageHandler, markAsRead]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content, replyToId = null) => {
    if (!content || !content.trim() || isSending) {
      return;
    }

    setIsSending(true);
    setError(null);

    // Create optimistic message for immediate display
    const optimisticMessage = {
      message_id: `temp-${Date.now()}`,
      sender: currentUser.email,
      recipient: chat.other_user_email,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      status: 'Sending',
      reply_to: replyToId || null,
      edited: false
    };

    // Add message immediately to UI
    setMessages(prev => [...prev, optimisticMessage]);
    setReplyTo(null);

    try {
      const messageData = {
        recipient: chat.other_user_email,
        content: content.trim(),
        reply_to: replyToId || null
      };

      const isBotMessage = chat.other_user_email === 'bot@whatsease.com';
      
      let newMessage;
      if (isBotMessage) {
        newMessage = await apiService.sendBotMessage(messageData);
      } else {
        newMessage = await apiService.sendMessage(messageData);
      }

      // Replace optimistic message with real one
      setMessages(prev => 
        prev.map(msg => 
          msg.message_id === optimisticMessage.message_id ? newMessage : msg
        )
      );

      // Send via WebSocket if connected
      if (isConnected && sendChatMessage && !isBotMessage) {
        sendChatMessage(chat.other_user_email, content.trim(), replyToId);
      }

    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
      
      // Remove optimistic message on error
      setMessages(prev => 
        prev.filter(msg => msg.message_id !== optimisticMessage.message_id)
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleReply = (message) => {
    setReplyTo(message);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  const handleEditMessage = async (messageId, content) => {
    try {
      const updatedMessage = await apiService.editMessage(messageId, content);
      setMessages(prev => 
        prev.map(msg => msg.message_id === messageId ? updatedMessage : msg)
      );
    } catch (err) {
      console.error('Failed to edit message:', err);
      setError('Failed to edit message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await apiService.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.message_id !== messageId));
    } catch (err) {
      console.error('Failed to delete message:', err);
      setError('Failed to delete message');
    }
  };

  if (loading) {
    return (
      <div className="chat-window">
        <Loading message="Loading messages..." />
      </div>
    );
  }

  if (!chat || !chat.other_user_email) {
    return (
      <div className="chat-window">
        <div className="no-chat-selected">
          <p>Invalid chat data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-avatar">
            {chat.other_user_avatar ? (
              <img src={chat.other_user_avatar} alt={chat.other_user_username} />
            ) : (
              <div className="avatar-placeholder">
                {chat.other_user_username?.substring(0, 2).toUpperCase() || '??'}
              </div>
            )}
            {chat.is_online && <span className="online-dot"></span>}
          </div>
          <div className="chat-user-info">
            <h3>{chat.other_user_username || 'Unknown User'}</h3>
            <span className="user-status">
              {isTyping ? 'typing...' : chat.is_online ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="chat-header-actions">
          <button className="btn-icon" title="Search" onClick={() => alert('Search not implemented')}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="chat-error" role="alert">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Messages area */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <svg width="80" height="80" viewBox="0 0 16 16" fill="currentColor" opacity="0.3">
              <path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105z"/>
            </svg>
            <p>No messages yet</p>
            <small>Start the conversation by sending a message</small>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const showDateSeparator = index === 0 || 
                !isSameDay(messages[index - 1].timestamp, message.timestamp);

              return (
                <div key={message.message_id}>
                  {showDateSeparator && (
                    <div className="date-separator">
                      <span>{getDateSeparator(message.timestamp)}</span>
                    </div>
                  )}
                  <Message
                    message={message}
                    currentUserEmail={currentUser.email}
                    onReply={handleReply}
                    onDelete={handleDeleteMessage}
                    onEdit={handleEditMessage}
                  />
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <MessageInput
        onSend={handleSendMessage}
        replyTo={replyTo}
        onCancelReply={handleCancelReply}
        disabled={isSending}
        recipientEmail={chat.other_user_email}
      />
    </div>
  );
}

// Helper functions
function isSameDay(timestamp1, timestamp2) {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function getDateSeparator(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffInDays = Math.floor((today - messageDate) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
}

export default ChatWindow;