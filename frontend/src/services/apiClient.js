import { CONFIG } from '../constants/config';

class ApiClient {
  constructor() {
    this.baseURL = CONFIG.API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const config = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include', // 🎯 CRITICAL FIX - This sends cookies
        ...options,
      };

      console.log(`🔗 API Call: ${config.method} ${url}`);
      
      const response = await fetch(url, config);

      // Handle 401 gracefully
      if (response.status === 401) {
        console.log('🔐 Session expired or invalid');
        return { 
          success: false, 
          error: 'SESSION_EXPIRED',
          message: 'Session expired' 
        };
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ API Success: ${endpoint}`);
      return data;

    } catch (error) {
      console.error(`🚨 API Error [${endpoint}]:`, error.message);
      
      if (error.message.includes('Failed to fetch')) {
        return {
          success: false,
          error: 'NETWORK_ERROR',
          message: 'Network error. Please check your connection.'
        };
      }
      
      return {
        success: false,
        error: 'REQUEST_FAILED', 
        message: error.message
      };
    }
  }

  get(endpoint) {
    return this.request(endpoint);
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();