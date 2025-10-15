import { useState, useRef, useEffect } from 'react';
import { formatTime } from '../../utils/DateUtils';
import '../../styles/chat.css';

function Message({ message, currentUserEmail, onReply, onDelete, onEdit }) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const menuRef = useRef(null);
  
  const isOwnMessage = message.sender === currentUserEmail;
  const isBotMessage = message.is_bot_response || message.sender === 'bot@whatsease.com';

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const handleMenuToggle = () => {
    setShowMenu(!showMenu);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(message.message_id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleReply = () => {
    onReply(message);
    setShowMenu(false);
  };

  const handleDelete = () => {
    setShowMenu(false);
    onDelete(message.message_id);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className={`message ${isOwnMessage ? 'own-message' : 'other-message'} ${isBotMessage ? 'bot-message' : ''}`}>
      <div className="message-content-wrapper">
        {!isOwnMessage && (
          <div className="message-avatar">
            {isBotMessage ? (
              <div className="avatar-placeholder bot-avatar">
                🤖
              </div>
            ) : (
              <div className="avatar-placeholder">
                {message.sender.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        )}

        <div className="message-bubble-wrapper">
          {/* Reply indicator */}
          {message.reply_to && (
            <div className="reply-indicator-msg">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8.5 4.5a.5.5 0 0 0-1 0v3.793L6.354 7.146a.5.5 0 1 0-.708.708l2 2a.5.5 0 0 0 .708 0l2-2a.5.5 0 0 0-.708-.708L8.5 8.293V4.5z"/>
              </svg>
              <span>Reply to message</span>
            </div>
          )}

          <div className={`message-bubble ${message.edited ? 'edited' : ''}`}>
            {isEditing ? (
              <div className="message-edit-form">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="message-edit-input"
                  autoFocus
                  rows={3}
                />
                <div className="message-edit-actions">
                  <button onClick={handleCancelEdit} className="btn-cancel-edit">
                    Cancel
                  </button>
                  <button onClick={handleSaveEdit} className="btn-save-edit">
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="message-text">{message.content}</p>
                <div className="message-meta">
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                  {message.edited && <span className="edited-indicator">Edited</span>}
                  {isOwnMessage && (
                    <span className={`message-status status-${message.status?.toLowerCase()}`}>
                      {message.status === 'Read' && '✓✓'}
                      {message.status === 'Delivered' && '✓✓'}
                      {message.status === 'Sent' && '✓'}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Message menu */}
          {!isEditing && (
            <div className="message-actions" ref={menuRef}>
              <button 
                className="btn-message-menu" 
                onClick={handleMenuToggle}
                title="Message options"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                </svg>
              </button>

              {showMenu && (
                <div className={`message-menu ${isOwnMessage ? 'menu-left' : 'menu-right'}`}>
                  <button onClick={handleReply} className="menu-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path fillRule="evenodd" d="M1.5 1.5A.5.5 0 0 0 1 2v4.8a2.5 2.5 0 0 0 2.5 2.5h9.793l-3.347 3.346a.5.5 0 0 0 .708.708l4.2-4.2a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 8.3H3.5A1.5 1.5 0 0 1 2 6.8V2a.5.5 0 0 0-.5-.5z"/>
                    </svg>
                    Reply
                  </button>
                  
                  {isOwnMessage && !isBotMessage && (
                    <>
                      <button onClick={handleEdit} className="menu-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                        </svg>
                        Edit
                      </button>
                      <button onClick={handleDelete} className="menu-item danger">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
                          <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
                        </svg>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Message;