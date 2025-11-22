import { CONFIG } from '../constants/config';

class ApiClient {
  constructor() {
    this.baseURL = CONFIG.API_BASE_URL;
    this.timeout = 10000;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const config = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include', // Important for cookies
        signal: controller.signal,
        ...options,
      };

      console.log(`🔗 API Call: ${config.method} ${url}`);
      
      const response = await fetch(url, config);

      if (!response.ok) {
        // Handle specific HTTP status codes
        if (response.status === 401) {
          // Session expired
          throw new Error('Session expired. Please register again.');
        }
        if (response.status === 503) {
          // Service unavailable
          throw new Error('Service temporarily unavailable. Please try again.');
        }
        
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ API Success: ${endpoint}`);
      return data;

    } catch (error) {
      console.error(`🚨 API Error [${endpoint}]:`, error.message);
      
      // Handle specific error types
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection.');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      
      throw error;
    } finally {
      clearTimeout(timeoutId);
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