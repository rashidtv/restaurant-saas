import { CONFIG } from '../constants/config';
import { validateOrderData } from '../utils/validators';
import { OrderUtils } from '../utils/orderUtils';

class OrderService {
  constructor() {
    this.baseURL = CONFIG.API_BASE_URL;
  }

  async fetchTableOrders(tableNumber) {
    try {
      const response = await fetch(`${this.baseURL}/api/orders`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const allOrders = await response.json();
      
      // Validate response structure
      if (!Array.isArray(allOrders)) {
        console.warn('Orders API returned non-array response:', allOrders);
        return [];
      }
      
      // Filter orders for the table with proper validation
      const tableOrders = allOrders.filter(order => {
        // Basic order validation
        if (!validateOrderData(order)) return false;
        
        // Check if order belongs to the target table
        const orderTable = order.tableId || order.table;
        if (!OrderUtils.isTableMatch(orderTable, tableNumber)) return false;
        
        // Check if order status is valid
        return OrderUtils.isValidStatus(order.status);
      });

      // Return sorted orders
      return OrderUtils.sortOrdersByDate(tableOrders);

    } catch (error) {
      console.error('Error fetching orders:', error);
      throw new Error('Failed to load orders. Please try again.');
    }
  }

  async createOrder(orderData) {
    try {
      // Validate order data before sending
      if (!this.validateOrderCreationData(orderData)) {
        throw new Error('Invalid order data');
      }

      const response = await fetch(`${this.baseURL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Order creation failed: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create order. Please try again.');
    }
  }

  validateOrderCreationData(orderData) {
    return orderData && 
           orderData.tableId && 
           orderData.items && 
           Array.isArray(orderData.items) && 
           orderData.items.length > 0;
  }

  calculateOrderTotal(items) {
    if (!items || !Array.isArray(items)) return 0;
    
    return items.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return total + (price * quantity);
    }, 0);
  }

  // Additional utility methods
  async getOrderById(orderId) {
    try {
      const response = await fetch(`${this.baseURL}/api/orders/${orderId}`);
      if (!response.ok) throw new Error('Order not found');
      return await response.json();
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId, status) {
    try {
      if (!OrderUtils.isValidStatus(status)) {
        throw new Error('Invalid order status');
      }

      const response = await fetch(`${this.baseURL}/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update order status');
      return await response.json();
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }
}

export const orderService = new OrderService();