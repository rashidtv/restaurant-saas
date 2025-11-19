import { CONFIG } from '../constants/config';
import { validateOrderData } from '../utils/validators';

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
      
      // Filter and validate orders for the table
      const tableOrders = allOrders.filter(order => {
        if (!validateOrderData(order)) return false;
        
        const orderTable = (order.tableId || order.table || '').toString().toUpperCase();
        const targetTable = tableNumber.toUpperCase();
        const validStatus = Object.values(CONFIG.ORDER_STATUS).includes(order.status);
        
        return orderTable === targetTable && validStatus;
      });

      // Sort by creation date (newest first)
      return tableOrders.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.timestamp || 0);
        const dateB = new Date(b.createdAt || b.timestamp || 0);
        return dateB - dateA;
      });

    } catch (error) {
      console.error('Error fetching orders:', error);
      throw new Error('Failed to load orders. Please try again.');
    }
  }

  async createOrder(orderData) {
    try {
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

  calculateOrderTotal(items) {
    if (!items || !Array.isArray(items)) return 0;
    
    return items.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return total + (price * quantity);
    }, 0);
  }
}

export const orderService = new OrderService();