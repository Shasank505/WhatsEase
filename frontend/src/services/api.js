// Base API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

console.log('API Base URL:', API_BASE_URL);

/**
 * Make an authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('accessToken');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  // Add body if present
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`[API Request] ${options.method || 'GET'} ${url}`);
  console.log('[API Request] Body:', options.body);

  try {
    const response = await fetch(url, config);

    console.log(`[API Response] ${response.status} ${response.statusText}`);

    // Handle 401 Unauthorized
    if (response.status === 401) {
      console.warn('[API] Unauthorized - clearing auth data');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      
      throw new Error('Unauthorized. Please login again.');
    }

    // Try to parse response as JSON
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
        console.log('[API Response] Data:', data);
      } catch (parseError) {
        console.error('[API] JSON parse error:', parseError);
        throw new Error('Invalid JSON response from server');
      }
    } else {
      const text = await response.text();
      console.log('[API Response] Non-JSON response:', text);
      data = text ? { message: text } : {};
    }

    // Handle errors
    if (!response.ok) {
      console.error('[API Error]', {
        status: response.status,
        statusText: response.statusText,
        data
      });
      
      // Extract error message
      let message = 'An error occurred';
      
      if (typeof data === 'string') {
        message = data;
      } else if (data?.detail) {
        // FastAPI returns errors in 'detail' field
        if (typeof data.detail === 'string') {
          message = data.detail;
        } else if (Array.isArray(data.detail)) {
          // Validation errors
          message = data.detail.map(err => `${err.loc?.join('.')}: ${err.msg}`).join(', ');
        }
      } else if (data?.message) {
        message = data.message;
      } else {
        message = `Request failed with status ${response.status}`;
      }
      
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    console.log('[API Success]');
    return data;
    
  } catch (error) {
    console.error('[API Request Failed]', {
      url,
      method: options.method || 'GET',
      error: error.message,
      stack: error.stack
    });
    
    // Check for network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkError = new Error(
        `Cannot connect to server at ${API_BASE_URL}. Please ensure:\n` +
        `1. Backend server is running\n` +
        `2. CORS is configured correctly\n` +
        `3. API URL is correct (currently: ${API_BASE_URL})`
      );
      networkError.isNetworkError = true;
      throw networkError;
    }
    
    throw error;
  }
}

// API Service
const apiService = {
  // ============================================================================
  // Authentication
  // ============================================================================
  
  async register(userData) {
    console.log('[API] Registering user:', { ...userData, password: '***' });
    return await apiRequest('/api/auth/register', {
      method: 'POST',
      body: userData,
    });
  },

  async login(credentials) {
    console.log('[API] Logging in user:', { ...credentials, password: '***' });
    return await apiRequest('/api/auth/login', {
      method: 'POST',
      body: credentials,
    });
  },

  async logout() {
    return await apiRequest('/api/auth/logout', {
      method: 'POST',
    });
  },

  async getCurrentUser() {
    return await apiRequest('/api/auth/me', {
      method: 'GET',
    });
  },

  // ============================================================================
  // Users
  // ============================================================================
  
  async searchUsers(query, limit = 20) {
    const params = new URLSearchParams({ query, limit: limit.toString() });
    return await apiRequest(`/api/users/search?${params}`, {
      method: 'GET',
    });
  },

  async getUserProfile(email) {
    return await apiRequest(`/api/users/${email}`, {
      method: 'GET',
    });
  },

  async updateProfile(userData) {
    return await apiRequest('/api/users/me', {
      method: 'PUT',
      body: userData,
    });
  },

  async getAllUsers(skip = 0, limit = 20, onlineOnly = false) {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
      online_only: onlineOnly.toString(),
    });
    return await apiRequest(`/api/users/?${params}`, {
      method: 'GET',
    });
  },

  // ============================================================================
  // Messages
  // ============================================================================
  
  async sendMessage(messageData) {
    return await apiRequest('/api/messages/', {
      method: 'POST',
      body: messageData,
    });
  },

  async sendBotMessage(messageData) {
    return await apiRequest('/api/messages/bot', {
      method: 'POST',
      body: messageData,
    });
  },

  async getConversation(otherUserEmail, limit = 50, offset = 0) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    return await apiRequest(`/api/messages/conversation/${otherUserEmail}?${params}`, {
      method: 'GET',
    });
  },

  async editMessage(messageId, content) {
    return await apiRequest(`/api/messages/${messageId}`, {
      method: 'PUT',
      body: { content },
    });
  },

  async updateMessageStatus(messageId, status) {
    return await apiRequest(`/api/messages/${messageId}/status`, {
      method: 'PATCH',
      body: { status },
    });
  },

  async deleteMessage(messageId) {
    return await apiRequest(`/api/messages/${messageId}`, {
      method: 'DELETE',
    });
  },

  async getChatList() {
    return await apiRequest('/api/messages/chats', {
      method: 'GET',
    });
  },

  // ============================================================================
  // Health Check
  // ============================================================================
  
  async healthCheck() {
    return await apiRequest('/health', {
      method: 'GET',
    });
  },
};

export default apiService;