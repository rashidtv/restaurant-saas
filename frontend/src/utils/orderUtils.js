// 🎯 PRODUCTION READY: Order utilities with proper imports
import { CONFIG } from '../constants/config';

export class OrderUtils {
  static calculatePreparationTime(order) {
    if (!order || !order.items) return CONFIG.ORDER_CONFIG.DEFAULT_PREP_TIME;
    
    const maxPrepTime = Math.max(
      ...order.items.map(item => item.preparationTime || 0)
    );
    
    return maxPrepTime || CONFIG.ORDER_CONFIG.DEFAULT_PREP_TIME;
  }

  static calculateOrderTotal(items) {
    if (!items || !Array.isArray(items)) return 0;
    
    return items.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return total + (price * quantity);
    }, 0);
  }

  static isOrderUrgent(order) {
    if (!order || !order.orderedAt) return false;
    
    const orderedTime = new Date(order.orderedAt);
    const now = new Date();
    const elapsedMinutes = (now - orderedTime) / (1000 * 60);
    
    return elapsedMinutes > CONFIG.ORDER_CONFIG.URGENT_THRESHOLD;
  }

  static getOrderStatusDisplay(status) {
    const statusConfigs = {
      [CONFIG.ORDER_STATUS.PENDING]: { label: 'Pending', color: '#f59e0b', icon: '⏳' },
      [CONFIG.ORDER_STATUS.PREPARING]: { label: 'Preparing', color: '#3b82f6', icon: '👨‍🍳' },
      [CONFIG.ORDER_STATUS.READY]: { label: 'Ready', color: '#10b981', icon: '✅' },
      [CONFIG.ORDER_STATUS.COMPLETED]: { label: 'Completed', color: '#6b7280', icon: '📦' },
      [CONFIG.ORDER_STATUS.CANCELLED]: { label: 'Cancelled', color: '#ef4444', icon: '❌' }
    };
    
    return statusConfigs[status] || statusConfigs[CONFIG.ORDER_STATUS.PENDING];
  }

  static validateOrderItems(items) {
    if (!items || !Array.isArray(items)) {
      throw new Error('Order items must be an array');
    }
    
    if (items.length === 0) {
      throw new Error('Order must contain at least one item');
    }
    
    const validItems = items.filter(item => 
      item && 
      item.quantity > 0 && 
      item.price >= 0
    );
    
    if (validItems.length === 0) {
      throw new Error('No valid items in order');
    }
    
    return validItems;
  }

  static generateOrderSummary(order) {
    if (!order) return null;
    
    const total = this.calculateOrderTotal(order.items);
    const itemCount = order.items.reduce((count, item) => count + (item.quantity || 1), 0);
    const statusDisplay = this.getOrderStatusDisplay(order.status);
    
    return {
      orderNumber: order.orderNumber,
      total,
      itemCount,
      status: order.status,
      statusDisplay,
      tableId: order.tableId,
      customerName: order.customerName || 'Guest'
    };
  }
}

// Utility functions (backward compatibility)
export const calculatePoints = (orderTotal) => {
  const pointsPerRinggit = CONFIG.POINTS.POINTS_PER_RINGGIT;
  const isWeekend = CONFIG.POINTS.WEEKEND_DAYS.includes(new Date().getDay());
  const multiplier = isWeekend ? CONFIG.POINTS.WEEKEND_MULTIPLIER : 1;
  
  return Math.floor(orderTotal * pointsPerRinggit * multiplier);
};

export const formatOrderTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default OrderUtils;