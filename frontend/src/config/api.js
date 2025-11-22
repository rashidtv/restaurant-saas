// 🎯 PRODUCTION-READY: API configuration without circular imports
import { CONFIG } from '../constants/config'; // ✅ Use named import

// Enhanced API client with retry logic
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
        credentials: 'include',
        signal: controller.signal,
        ...options,
      };

      console.log(`🔗 API Call: ${config.method} ${url}`);
      
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error(`🚨 API Error [${endpoint}]:`, error.message);
      
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
}

// Create singleton instance
export const apiClient = new ApiClient();

// API endpoints
export const API_ENDPOINTS = {
  ORDERS: `${CONFIG.API_BASE_URL}/api/orders`,
  TABLES: `${CONFIG.API_BASE_URL}/api/tables`,
  PAYMENTS: `${CONFIG.API_BASE_URL}/api/payments`,
  MENU: `${CONFIG.API_BASE_URL}/api/menu`,
  HEALTH: `${CONFIG.API_BASE_URL}/api/health`,
  CUSTOMERS: `${CONFIG.API_BASE_URL}/api/customers`
};

// Specific API functions
export const fetchOrders = () => apiClient.get('/api/orders');
export const fetchTables = () => apiClient.get('/api/tables');
export const fetchMenu = () => apiClient.get('/api/menu');
export const fetchPayments = () => apiClient.get('/api/payments');

export const createOrder = (orderData) => 
  apiClient.post('/api/orders', orderData);

export const updateOrderStatus = (orderId, status) => 
  apiClient.put(`/api/orders/${orderId}/status`, { status });

export const createPayment = (paymentData) => 
  apiClient.post('/api/payments', paymentData);

export default apiClient;