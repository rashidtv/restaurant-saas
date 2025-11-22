// 🎯 PRODUCTION READY: Simple API configuration
import config from '../constants/config';

// Direct URL constants (no imports that could cause circular deps)
const API_BASE_URL = config.API_BASE_URL;

// API endpoints
export const API_ENDPOINTS = {
  ORDERS: `${API_BASE_URL}/api/orders`,
  TABLES: `${API_BASE_URL}/api/tables`,
  PAYMENTS: `${API_BASE_URL}/api/payments`,
  MENU: `${API_BASE_URL}/api/menu`,
  HEALTH: `${API_BASE_URL}/api/health`,
  CUSTOMERS: `${API_BASE_URL}/api/customers`
};

// Enhanced fetch function
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API fetch error:', error);
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

export default {
  fetchOrders,
  fetchTables,
  fetchMenu,
  fetchPayments,
  createOrder,
  updateOrderStatus,
  createPayment,
  API_ENDPOINTS
};