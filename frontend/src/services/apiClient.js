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
        credentials: 'include',
        ...options,
      };

      const response = await fetch(url, config);

      // Handle 401 without breaking
      if (response.status === 401) {
        return { 
          success: false, 
          error: 'SESSION_EXPIRED'
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: 'REQUEST_FAILED'
        };
      }

      return await response.json();

    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error.message);
      return { 
        success: false, 
        error: 'NETWORK_ERROR' 
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
}

export const apiClient = new ApiClient();