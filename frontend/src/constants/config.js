// 🎯 PRODUCTION READY: Simple, non-circular config
const config = {
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

// Export as default (prevents circular imports)
export default config;

// Named exports for individual values (backward compatibility)
export const API_BASE_URL = config.API_BASE_URL;
export const SOCKET_URL = config.SOCKET_URL;
export const ORDER_STATUS = config.ORDER_STATUS;