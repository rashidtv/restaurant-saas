// 🎯 PRODUCTION READY: Complete config with ALL exports
const CONFIG = {
  // URLs
  API_BASE_URL: import.meta.env.VITE_API_URL || 'https://restaurant-saas-backend-hbdz.onrender.com',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'https://restaurant-saas-backend-hbdz.onrender.com',
  
  // Socket settings
  SOCKET: {
    RECONNECTION_ATTEMPTS: 5,
    RECONNECTION_DELAY: 1000,
    TIMEOUT: 10000
  },
  
  // Storage keys
  STORAGE_KEYS: {
    CUSTOMER: 'flavorflow_customer',
    SESSION: 'flavorflow_session',
    POINTS: 'flavorflow_points'
  },
  
  // Points system
  POINTS: {
    POINTS_PER_RINGGIT: 1,
    WEEKEND_MULTIPLIER: 2,
    WEEKEND_DAYS: [0, 6]
  },
  
  // Order status
  ORDER_STATUS: {
    PENDING: 'pending',
    PREPARING: 'preparing',
    READY: 'ready',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },
  
  // Order configuration
  ORDER_CONFIG: {
    DEFAULT_PREP_TIME: 15,
    STATUS_FLOW: ['pending', 'preparing', 'ready', 'completed'],
    URGENT_THRESHOLD: 30
  },
  
  // Customer tiers
  TIERS: {
    MEMBER: { name: 'Member', threshold: 0, color: '#6b7280', icon: '👤' },
    SILVER: { name: 'Silver', threshold: 100, color: '#9ca3af', icon: '🥈' },
    GOLD: { name: 'Gold', threshold: 500, color: '#f59e0b', icon: '🥇' },
    PLATINUM: { name: 'Platinum', threshold: 1000, color: '#10b981', icon: '💎' }
  }
};

// 🎯 COMPLETE DISPLAY CONFIGS (for UI components)
const ORDER_STATUS_CONFIG = {
  [CONFIG.ORDER_STATUS.PENDING]: {
    label: 'Pending',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    borderColor: '#f59e0b',
    icon: '⏳'
  },
  [CONFIG.ORDER_STATUS.PREPARING]: {
    label: 'Preparing',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    borderColor: '#3b82f6',
    icon: '👨‍🍳'
  },
  [CONFIG.ORDER_STATUS.READY]: {
    label: 'Ready',
    color: '#10b981',
    bgColor: '#d1fae5',
    borderColor: '#10b981',
    icon: '✅'
  },
  [CONFIG.ORDER_STATUS.COMPLETED]: {
    label: 'Completed',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    borderColor: '#6b7280',
    icon: '📦'
  },
  [CONFIG.ORDER_STATUS.CANCELLED]: {
    label: 'Cancelled',
    color: '#ef4444',
    bgColor: '#fef2f2',
    borderColor: '#ef4444',
    icon: '❌'
  }
};

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

// 🎯 PERMANENT FIX: Export EVERYTHING your components need
export { 
  CONFIG,
  ORDER_STATUS_CONFIG,
  TABLE_STATUS_CONFIG 
};

// Individual exports for backward compatibility
export const API_BASE_URL = CONFIG.API_BASE_URL;
export const SOCKET_URL = CONFIG.SOCKET_URL;
export const ORDER_STATUS = CONFIG.ORDER_STATUS;
export const ORDER_CONFIG = CONFIG.ORDER_CONFIG;

// Default export for flexibility
export default CONFIG;