import { useState, useRef, useEffect } from 'react';
import '../../styles/chat.css';

function MessageInput({ onSend, replyTo, onCancelReply, disabled = false, recipientEmail }) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  /**
   * Auto-resize textarea
   */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  /**
   * Focus textarea when reply is set
   */
  useEffect(() => {
    if (replyTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyTo]);

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    setMessage(e.target.value);
    
    // Handle typing indicator
    if (!isTyping) {
      setIsTyping(true);
      // You can emit typing event here via WebSocket
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // Emit stop typing event
    }, 1000);
  };

  /**
   * Handle send message
   */
  const handleSend = () => {
    const trimmedMessage = message.trim();
    
    console.log('MessageInput - Sending:', {
      message: trimmedMessage,
      disabled,
      replyTo: replyTo?.message_id
    });
    
    if (!trimmedMessage || disabled) {
      console.log('MessageInput - Send blocked:', { 
        emptyMessage: !trimmedMessage, 
        disabled 
      });
      return;
    }

    onSend(trimmedMessage, replyTo?.message_id);
    setMessage('');
    setIsTyping(false);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  /**
   * Handle key press
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Handle emoji (placeholder for future emoji picker)
   */
  const handleEmoji = () => {
    // Placeholder for emoji picker
    console.log('Emoji picker not implemented yet');
  };

  /**
   * Handle file attachment (placeholder)
   */
  const handleAttachment = () => {
    // Placeholder for file upload
    console.log('File attachment not implemented yet');
  };

  return (
    <div className="message-input-container">
      {/* Reply indicator */}
      {replyTo && (
        <div className="reply-indicator">
          <div className="reply-content">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8.5 4.5a.5.5 0 0 0-1 0v3.793L6.354 7.146a.5.5 0 1 0-.708.708l2 2a.5.5 0 0 0 .708 0l2-2a.5.5 0 0 0-.708-.708L8.5 8.293V4.5z"/>
            </svg>
            <div>
              <strong>Replying to:</strong>
              <p>{replyTo.content.substring(0, 50)}{replyTo.content.length > 50 ? '...' : ''}</p>
            </div>
          </div>
          <button 
            onClick={onCancelReply} 
            className="reply-cancel"
            title="Cancel reply"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
            </svg>
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="message-input-wrapper">
        <button
          onClick={handleEmoji}
          className="input-action-btn"
          title="Add emoji"
          disabled={disabled}
        >
          <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M4.285 9.567a.5.5 0 0 1 .683.183A3.498 3.498 0 0 0 8 11.5a3.498 3.498 0 0 0 3.032-1.75.5.5 0 1 1 .866.5A4.498 4.498 0 0 1 8 12.5a4.498 4.498 0 0 1-3.898-2.25.5.5 0 0 1 .183-.683zM7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5zm4 0c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S9.448 5 10 5s1 .672 1 1.5z"/>
          </svg>
        </button>

        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          className="message-input"
          rows="1"
          disabled={disabled}
        />

        <button
          onClick={handleAttachment}
          className="input-action-btn"
          title="Attach file"
          disabled={disabled}
        >
          <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0V3z"/>
          </svg>
        </button>

        <button
          onClick={handleSend}
          className={`btn-send ${message.trim() ? 'active' : ''}`}
          disabled={!message.trim() || disabled}
          title="Send message"
        >
          <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default MessageInput;