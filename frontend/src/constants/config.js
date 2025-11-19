export const CONFIG = {
  API_BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-backend-url.com'
    : 'https://restaurant-saas-backend-hbdz.onrender.com',
  
  STORAGE_KEYS: {
    CUSTOMER: 'flavorflow_customer',
    SESSION: 'flavorflow_session',
    POINTS: 'flavorflow_points'
  },
  
  POINTS: {
    POINTS_PER_RINGGIT: 1,
    WEEKEND_MULTIPLIER: 2,
    WEEKEND_DAYS: [0, 6] // Sunday, Saturday
  },
  
  TIERS: {
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
  }
};