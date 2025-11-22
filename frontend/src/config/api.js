// 🎯 PRODUCTION READY: API configuration
import { CONFIG } from '../constants/config';

const API_BASE_URL = CONFIG.API_BASE_URL;

// API endpoints
export const API_ENDPOINTS = {
  ORDERS: `${API_BASE_URL}/api/orders`,
  TABLES: `${API_BASE_URL}/api/tables`,
  PAYMENTS: `${API_BASE_URL}/api/payments`,
  MENU: `${API_BASE_URL}/api/menu`,
  HEALTH: `${API_BASE_URL}/api/health`,
  CUSTOMERS: `${API_BASE_URL}/api/customers`,
  PING: `${API_BASE_URL}/api/ping`
};

// Enhanced fetch function with error handling
const apiFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API fetch error:', error.message);
    throw error;
  }
};

// API functions
export const fetchOrders = () => apiFetch(API_ENDPOINTS.ORDERS);
export const fetchTables = () => apiFetch(API_ENDPOINTS.TABLES);
export const fetchMenu = () => apiFetch(API_ENDPOINTS.MENU);
export const fetchPayments = () => apiFetch(API_ENDPOINTS.PAYMENTS);

export const createOrder = (orderData) => 
  apiFetch(API_ENDPOINTS.ORDERS, {
    method: 'POST',
    body: JSON.stringify(orderData)
  });

export const updateOrderStatus = (orderId, status) => 
  apiFetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });

export const createPayment = (paymentData) => 
  apiFetch(API_ENDPOINTS.PAYMENTS, {
    method: 'POST',
    body: JSON.stringify(paymentData)
  });

export const healthCheck = () => apiFetch(API_ENDPOINTS.HEALTH);
export const ping = () => apiFetch(API_ENDPOINTS.PING);

// Export for backward compatibility
export default {
  fetchOrders,
  fetchTables,
  fetchMenu,
  fetchPayments,
  createOrder,
  updateOrderStatus,
  createPayment,
  healthCheck,
  ping,
  API_ENDPOINTS
};