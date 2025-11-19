export const CONFIG = {
  API_BASE_URL: 'https://restaurant-saas-backend-hbdz.onrender.com',
  POINTS: {
    POINTS_PER_RINGGIT: 1,
    WEEKEND_MULTIPLIER: 2,
    WEEKEND_DAYS: [0, 6], // Sunday, Saturday
  },
  STORAGE_KEYS: {
    CUSTOMER: 'flavorflow_customer_v2',
    POINTS: 'flavorflow_points_v2',
    SESSION: 'flavorflow_session_v2'
  },
  ORDER_STATUS: {
    PENDING: 'pending',
    PREPARING: 'preparing',
    READY: 'ready',
    COMPLETED: 'completed'
  },
  TIERS: {
    MEMBER: { threshold: 0, name: 'Member', color: '#10B981', icon: '👤' },
    SILVER: { threshold: 100, name: 'Silver', color: '#6B7280', icon: '⭐' },
    GOLD: { threshold: 500, name: 'Gold', color: '#F59E0B', icon: '🌟' },
    DIAMOND: { threshold: 1000, name: 'Diamond', color: '#8B5CF6', icon: '💎' }
  }
};

export const ORDER_STATUS_CONFIG = {
  [CONFIG.ORDER_STATUS.PENDING]: { label: 'Order Received', color: '#F59E0B', icon: '⏳' },
  [CONFIG.ORDER_STATUS.PREPARING]: { label: 'Preparing', color: '#3B82F6', icon: '👨‍🍳' },
  [CONFIG.ORDER_STATUS.READY]: { label: 'Ready', color: '#10B981', icon: '✅' },
  [CONFIG.ORDER_STATUS.COMPLETED]: { label: 'Completed', color: '#6B7280', icon: '🎉' }
};