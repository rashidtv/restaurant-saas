// 🎯 PRODUCTION-READY: Non-circular config with proper structure

// Phase 1: Define all base values (no interdependencies)
const BASE_URLS = {
  API: import.meta.env.VITE_API_URL || 'https://restaurant-saas-backend-hbdz.onrender.com',
  SOCKET: import.meta.env.VITE_SOCKET_URL || 'https://restaurant-saas-backend-hbdz.onrender.com'
};

// Phase 2: Define status constants as plain strings
const ORDER_STATUS = Object.freeze({
  PENDING: 'pending',
  PREPARING: 'preparing', 
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
});

const TABLE_STATUS = Object.freeze({
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  NEEDS_CLEANING: 'needs_cleaning'
});

// Phase 3: Define display configurations (reference phase 2 constants)
const ORDER_STATUS_CONFIG = Object.freeze({
  [ORDER_STATUS.PENDING]: {
    label: 'Pending',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    borderColor: '#f59e0b',
    icon: '⏳'
  },
  [ORDER_STATUS.PREPARING]: {
    label: 'Preparing',
    color: '#3b82f6',
    bgColor: '#dbeafe', 
    borderColor: '#3b82f6',
    icon: '👨‍🍳'
  },
  [ORDER_STATUS.READY]: {
    label: 'Ready',
    color: '#10b981',
    bgColor: '#d1fae5',
    borderColor: '#10b981',
    icon: '✅'
  },
  [ORDER_STATUS.COMPLETED]: {
    label: 'Completed',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    borderColor: '#6b7280',
    icon: '📦'
  },
  [ORDER_STATUS.CANCELLED]: {
    label: 'Cancelled',
    color: '#ef4444',
    bgColor: '#fef2f2',
    borderColor: '#ef4444',
    icon: '❌'
  }
});

const TABLE_STATUS_CONFIG = Object.freeze({
  [TABLE_STATUS.AVAILABLE]: {
    label: 'Available',
    color: '#10b981',
    bgColor: '#d1fae5',
    icon: '✅'
  },
  [TABLE_STATUS.OCCUPIED]: {
    label: 'Occupied',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    icon: '🟡'
  },
  [TABLE_STATUS.RESERVED]: {
    label: 'Reserved', 
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    icon: '📅'
  },
  [TABLE_STATUS.NEEDS_CLEANING]: {
    label: 'Needs Cleaning',
    color: '#ef4444',
    bgColor: '#fef2f2',
    icon: '🧹'
  }
});

// Phase 4: Define main configuration (reference all previous phases)
const CONFIG = Object.freeze({
  // URLs
  API_BASE_URL: BASE_URLS.API,
  SOCKET_URL: BASE_URLS.SOCKET,
  
  // Socket settings
  SOCKET: Object.freeze({
    RECONNECTION_ATTEMPTS: 5,
    RECONNECTION_DELAY: 1000,
    TIMEOUT: 10000
  }),
  
  // Storage keys
  STORAGE_KEYS: Object.freeze({
    CUSTOMER: 'flavorflow_customer',
    SESSION: 'flavorflow_session',
    POINTS: 'flavorflow_points'
  }),
  
  // Points system
  POINTS: Object.freeze({
    POINTS_PER_RINGGIT: 1,
    WEEKEND_MULTIPLIER: 2,
    WEEKEND_DAYS: [0, 6] // Sunday, Saturday
  }),
  
  // Order system
  ORDER_STATUS: ORDER_STATUS,
  ORDER_CONFIG: Object.freeze({
    DEFAULT_PREP_TIME: 15,
    STATUS_FLOW: [ORDER_STATUS.PENDING, ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.COMPLETED],
    URGENT_THRESHOLD: 30
  }),
  
  // Customer tiers
  TIERS: Object.freeze({
    MEMBER: Object.freeze({ name: 'Member', threshold: 0, color: '#6b7280', icon: '👤' }),
    SILVER: Object.freeze({ name: 'Silver', threshold: 100, color: '#9ca3af', icon: '🥈' }),
    GOLD: Object.freeze({ name: 'Gold', threshold: 500, color: '#f59e0b', icon: '🥇' }),
    PLATINUM: Object.freeze({ name: 'Platinum', threshold: 1000, color: '#10b981', icon: '💎' })
  })
});

// Phase 5: Export everything (no circular references)
export default CONFIG;
export { 
  ORDER_STATUS, 
  ORDER_STATUS_CONFIG, 
  TABLE_STATUS_CONFIG,
  TABLE_STATUS 
};

// Backward compatibility exports
export const API_BASE_URL = CONFIG.API_BASE_URL;
export const SOCKET_URL = CONFIG.SOCKET_URL;