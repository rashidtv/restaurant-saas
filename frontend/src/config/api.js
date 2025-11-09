const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  ORDERS: `${API_BASE_URL}/api/orders`,
  TABLES: `${API_BASE_URL}/api/tables`,
  PAYMENTS: `${API_BASE_URL}/api/payments`,
  HEALTH: `${API_BASE_URL}/api/health`,
  INIT: `${API_BASE_URL}/api/init`
};

export default API_BASE_URL;