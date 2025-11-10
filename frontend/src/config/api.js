// API configuration with fallbacks
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://restaurant-saas-backend-hbdz.onrender.com';

export const API_ENDPOINTS = {
  ORDERS: `${API_BASE_URL}/api/orders`,
  TABLES: `${API_BASE_URL}/api/tables`,
  PAYMENTS: `${API_BASE_URL}/api/payments`,
  MENU: `${API_BASE_URL}/api/menu`,
  HEALTH: `${API_BASE_URL}/api/health`,
  INIT: `${API_BASE_URL}/api/init`
};

// Enhanced fetch function with error handling
export const apiFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
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

// Order-specific API functions
export const updateOrderStatus = async (orderId, status) => {
  return apiFetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
};

export const createOrder = async (orderData) => {
  return apiFetch(`${API_BASE_URL}/api/orders`, {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
};

export const fetchOrders = async () => {
  return apiFetch(`${API_BASE_URL}/api/orders`);
};

export const fetchTables = async () => {
  return apiFetch(`${API_BASE_URL}/api/tables`);
};

export const fetchMenu = async () => {
  return apiFetch(`${API_BASE_URL}/api/menu`);
};

export default API_BASE_URL;