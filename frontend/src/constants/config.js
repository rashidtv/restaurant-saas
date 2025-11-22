// 🛠️ FIXED: Remove circular dependencies and fix variable hoisting

// Base configuration
const BASE_CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_URL || 'https://restaurant-saas-backend-hbdz.onrender.com',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'https://restaurant-saas-backend-hbdz.onrender.com',
};

// Socket configuration
const SOCKET_CONFIG = {
  RECONNECTION_ATTEMPTS: 5,
  RECONNECTION_DELAY: 1000,
  TIMEOUT: 10000
};

// Storage keys
const STORAGE_KEYS = {
  CUSTOMER: 'flavorflow_customer',
  SESSION: 'flavorflow_session',
  POINTS: 'flavorflow_points'
};

// Points configuration
const POINTS_CONFIG = {
  POINTS_PER_RINGGIT: 1,
  WEEKEND_MULTIPLIER: 2,
  WEEKEND_DAYS: [0, 6] // Sunday, Saturday
};

// Order status configuration
const ORDER_STATUS_VALUES = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready', 
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Tiers configuration
const TIERS_CONFIG = {
  MEMBER: {
    name: 'Member',
    threshold: 0,
    color: '#6b7280',
    icon: '👤'
  },
  SILVER: {
    name: 'Silver',
    threshold: 100,
    color: '#9ca3af', 
    icon: '🥈'
  },
  GOLD: {
    name: 'Gold',
    threshold: 500,
    color: '#f59e0b',
    icon: '🥇'
  },
  PLATINUM: {
    name: 'Platinum', 
    threshold: 1000,
    color: '#10b981',
    icon: '💎'
  }
};

// Order status display configuration
const ORDER_STATUS_DISPLAY = {
  pending: {
    label: 'Pending',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    borderColor: '#f59e0b',
    icon: '⏳'
  },
  preparing: {
    label: 'Preparing',
    color: '#3b82f6', 
    bgColor: '#dbeafe',
    borderColor: '#3b82f6',
    icon: '👨‍🍳'
  },
  ready: {
    label: 'Ready',
    color: '#10b981',
    bgColor: '#d1fae5',
    borderColor: '#10b981',
    icon: '✅'
  },
  completed: {
    label: 'Completed',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    borderColor: '#6b7280',
    icon: '📦'
  },
  cancelled: {
    label: 'Cancelled',
    color: '#ef4444',
    bgColor: '#fef2f2',
    borderColor: '#ef4444',
    icon: '❌'
  }
};

// Order flow configuration
const ORDER_FLOW_CONFIG = {
  DEFAULT_PREP_TIME: 15, // minutes
  STATUS_FLOW: ['pending', 'preparing', 'ready', 'completed'],
  URGENT_THRESHOLD: 30 // minutes
};

// Table status configuration
const TABLE_STATUS_CONFIG = {
  available: {
    label: 'Available',
    color: '#10b981',
    bgColor: '#d1fae5',
    icon: '✅'
  },
  occupied: {
    label: 'Occupied',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    icon: '🟡'
  },
  reserved: {
    label: 'Reserved',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    icon: '📅'
  },
  needs_cleaning: {
    label: 'Needs Cleaning',
    color: '#ef4444',
    bgColor: '#fef2f2',
    icon: '🧹'
  }
};

// Export main config (avoid circular references)
export const CONFIG = {
  ...BASE_CONFIG,
  SOCKET: SOCKET_CONFIG,
  STORAGE_KEYS: STORAGE_KEYS,
  POINTS: POINTS_CONFIG,
  ORDER_STATUS: ORDER_STATUS_VALUES,
  TIERS: TIERS_CONFIG
};

// Export individual configs for specific use cases
export const ORDER_STATUS_CONFIG = ORDER_STATUS_DISPLAY;
export const ORDER_CONFIG = ORDER_FLOW_CONFIG;

// Cookie settings (dynamic based on environment)
export const getCookieSettings = () => {
  const isProduction = import.meta.env.PROD;
  return {
    httpOnly: false, // For client-side access if needed
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    ...(isProduction && { domain: '.onrender.com' })
  };
};