// API configuration with fallbacks
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://restaurant-saas-backend-hbdz.onrender.com';


// Export for use in socket service
export const SOCKET_CONFIG = {
  URL: API_BASE_URL,
  OPTIONS: {
    transports: ['websocket', 'polling'],
    timeout: 10000
  }
};

export const API_ENDPOINTS = {
  ORDERS: `${API_BASE_URL}/api/orders`,
  TABLES: `${API_BASE_URL}/api/tables`,
  PAYMENTS: `${API_BASE_URL}/api/payments`,
  MENU: `${API_BASE_URL}/api/menu`,
  HEALTH: `${API_BASE_URL}/api/health`,
  INIT: `${API_BASE_URL}/api/init`,
  CUSTOMERS: `${API_BASE_URL}/api/customers`
};

// Enhanced fetch function with error handling
export const apiFetch = async (url, options = {}) => {
  try {
    console.log(`🔗 API Call: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error ${response.status}:`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ API Success:`, data);
    return data;
  } catch (error) {
    console.error('🚨 API fetch error:', error);
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

export const fetchPayments = async () => {
  return apiFetch(`${API_BASE_URL}/api/payments`);
};

export const createPayment = async (paymentData) => {
  return apiFetch(`${API_BASE_URL}/api/payments`, {
    method: 'POST',
    body: JSON.stringify(paymentData)
  });
};

export default API_BASE_URL;