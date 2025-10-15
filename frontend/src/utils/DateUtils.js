/**
 * Date and Time Utilities
 * Handles UTC to local time conversion and formatting
 */

/**
 * Convert UTC timestamp to local Date object
 */
export const utcToLocal = (utcTimestamp) => {
  if (!utcTimestamp) return null;
  
  try {
    // Handle different timestamp formats
    let date;
    
    if (typeof utcTimestamp === 'string') {
      // If string ends with 'Z', it's already in UTC format
      if (utcTimestamp.endsWith('Z')) {
        date = new Date(utcTimestamp);
      } else {
        // Add 'Z' to indicate UTC
        date = new Date(utcTimestamp + 'Z');
      }
    } else if (utcTimestamp instanceof Date) {
      date = utcTimestamp;
    } else {
      date = new Date(utcTimestamp);
    }
    
    // Check if valid date
    if (isNaN(date.getTime())) {
      console.error('Invalid timestamp:', utcTimestamp);
      return null;
    }
    
    return date;
  } catch (error) {
    console.error('Error converting timestamp:', error);
    return null;
  }
};

/**
 * Format time (HH:MM AM/PM)
 */
export const formatTime = (timestamp) => {
  const date = utcToLocal(timestamp);
  if (!date) return '';
  
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

/**
 * Format date (MMM DD, YYYY)
 */
export const formatDate = (timestamp) => {
  const date = utcToLocal(timestamp);
  if (!date) return '';
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Format relative time (e.g., "2 hours ago", "yesterday")
 */
export const formatRelativeTime = (timestamp) => {
  const date = utcToLocal(timestamp);
  if (!date) return '';
  
  const now = new Date();
  const diffInMs = now - date;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return formatDate(timestamp);
  }
};

/**
 * Format full datetime
 */
export const formatDateTime = (timestamp) => {
  const date = utcToLocal(timestamp);
  if (!date) return '';
  
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Check if two timestamps are on the same day
 */
export const isSameDay = (timestamp1, timestamp2) => {
  const date1 = utcToLocal(timestamp1);
  const date2 = utcToLocal(timestamp2);
  
  if (!date1 || !date2) return false;
  
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Get date separator text (e.g., "Today", "Yesterday", "Dec 25, 2024")
 */
export const getDateSeparator = (timestamp) => {
  const date = utcToLocal(timestamp);
  if (!date) return '';
  
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
};

/**
 * Format timestamp for chat list (e.g., "2m ago", "5h ago", "Yesterday", "Dec 25")
 */
export const formatChatTimestamp = (timestamp) => {
  const date = utcToLocal(timestamp);
  if (!date) return '';
  
  const now = new Date();
  const diffInMs = now - date;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

/**
 * Get time ago in words (e.g., "2 minutes ago", "5 hours ago")
 */
export const getTimeAgo = (timestamp) => {
  const date = utcToLocal(timestamp);
  if (!date) return '';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(timestamp);
  }
};