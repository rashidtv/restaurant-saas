// frontend/src/services/orderService.js - FINAL VERSION
import { CONFIG } from '../constants/config';
import { OrderUtils } from '../utils/orderUtils';

class OrderService {
  constructor() {
    this.baseURL = CONFIG.API_BASE_URL;
  }

  // 🎯 FIX: Add getOrders method that useOrders hook expects
  async getOrders() {
    try {
      console.log('📋 Fetching all orders from API...');
      const response = await fetch(`${this.baseURL}/api/orders`, {
        credentials: 'include' // 🎯 CRITICAL: For session cookies
      });
      
      if (!response.ok) {
        // Handle 401 and other errors gracefully
        if (response.status === 401) {
          console.log('🔐 No active session - returning empty orders');
          return [];
        }
        console.warn(`⚠️ Orders API returned ${response.status}`);
        return [];
      }

      const result = await response.json();
      
      // Handle different response formats
      if (Array.isArray(result)) {
        console.log(`✅ Received ${result.length} orders`);
        return result;
      } else if (result && Array.isArray(result.orders)) {
        console.log(`✅ Received ${result.orders.length} orders from nested response`);
        return result.orders;
      } else if (result && result.success && Array.isArray(result.data)) {
        console.log(`✅ Received ${result.data.length} orders from data field`);
        return result.data;
      } else {
        console.warn('⚠️ Unexpected orders response format:', result);
        return [];
      }

    } catch (error) {
      console.error('❌ Network error fetching orders:', error);
      return []; // 🎯 Graceful degradation
    }
  }

  // 🎯 IMPROVED: Use OrderUtils for validation
  async fetchTableOrders(tableNumber) {
    try {
      console.log(`🔄 Fetching orders for table: ${tableNumber}`);
      const allOrders = await this.getOrders();
      
      // Filter orders for the table
      const tableOrders = allOrders.filter(order => {
        if (!OrderUtils.validateOrderData(order)) return false;
        
        const orderTable = order.tableId || order.table;
        return OrderUtils.isTableMatch(orderTable, tableNumber);
      });

      console.log(`✅ Found ${tableOrders.length} orders for table ${tableNumber}`);
      return OrderUtils.sortOrdersByDate(tableOrders);

    } catch (error) {
      console.error('❌ Error fetching table orders:', error);
      return [];
    }
  }

  // 🎯 IMPROVED: Better error handling
  async createOrder(orderData) {
    try {
      console.log('📦 Creating order:', orderData);
      
      // Validate order data
      if (!this.validateOrderCreationData(orderData)) {
        throw new Error('Invalid order data: tableId and items array required');
      }

      const response = await fetch(`${this.baseURL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 🎯 CRITICAL: For session cookies
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Order creation failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Order created successfully:', result.orderNumber);
      return result;

    } catch (error) {
      console.error('❌ Error creating order:', error);
      throw error;
    }
  }

  // 🎯 IMPROVED: Better validation
  validateOrderCreationData(orderData) {
    return orderData && 
           orderData.tableId && 
           orderData.items && 
           Array.isArray(orderData.items) && 
           orderData.items.length > 0 &&
           orderData.items.every(item => item.quantity > 0);
  }

  // 🎯 FIX: updateOrderStatus method that useOrders hook expects
  async updateOrderStatus(orderId, status) {
    try {
      console.log(`🔄 Updating order ${orderId} status to: ${status}`);
      
      if (!OrderUtils.isValidStatus(status)) {
        throw new Error('Invalid order status');
      }

      const response = await fetch(`${this.baseURL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update order status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Order ${orderId} updated to: ${status}`);
      return result.order || result;

    } catch (error) {
      console.error(`❌ Error updating order status for ${orderId}:`, error);
      throw error;
    }
  }

  // 🎯 KEEP existing utility methods
  calculateOrderTotal(items) {
    return OrderUtils.calculateOrderTotal(items);
  }

  async getOrderById(orderId) {
    try {
      const response = await fetch(`${this.baseURL}/api/orders/${orderId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Order not found');
      return await response.json();
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }
}

export const orderService = new OrderService();