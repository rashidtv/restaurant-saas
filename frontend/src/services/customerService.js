import { apiClient } from './apiClient';
import { CONFIG } from '../constants/config';

class CustomerService {
  async registerCustomer(phone, name = '') {
    try {
      console.log('🔧 Attempting customer registration:', phone);
      
      const result = await apiClient.post('/api/customers/register', {
        phone,
        name: name || `Customer-${phone.slice(-4)}`
      });

      if (!result.success) {
        throw new Error(result.message || 'Registration failed');
      }

      console.log('✅ Customer registered successfully:', phone);
      return result.customer;

    } catch (error) {
      console.error('❌ Customer registration failed:', error);
      throw error;
    }
  }

  async getCurrentCustomer() {
    try {
      const result = await apiClient.get('/api/customers/me');
      
      if (result.success && result.customer) {
        return result.customer;
      }
      return null;
    } catch (error) {
      console.log('ℹ️ No active customer session');
      return null;
    }
  }

  async addPoints(pointsToAdd, orderTotal = 0) {
    try {
      const result = await apiClient.post(`/api/customers/${this.currentCustomer.phone}/points`, {
        points: pointsToAdd,
        orderTotal: orderTotal
      });

      if (!result.success) {
        throw new Error(result.message || 'Points update failed');
      }

      return result.customer.points;
    } catch (error) {
      console.error('❌ Failed to add points:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await apiClient.post('/api/customers/logout');
      console.log('✅ Customer logged out successfully');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    }
  }

  async getCustomerOrders(phone) {
    try {
      console.log('📋 Fetching orders for customer:', phone);
      const orders = await apiClient.get(`/api/customers/${phone}/orders`);
      console.log('✅ Retrieved customer orders:', orders.length);
      return orders;
    } catch (error) {
      console.error('❌ Failed to fetch customer orders:', error);
      return [];
    }
  }

  async refreshCustomerData(phone) {
    try {
      console.log('🔄 Refreshing customer data for:', phone);
      const customer = await this.getCustomer(phone);
      console.log('✅ Customer data refreshed, points:', customer?.points);
      return customer;
    } catch (error) {
      console.error('Failed to refresh customer data:', error);
      return null;
    }
  }

  async getCustomer(phone) {
    try {
      return await apiClient.get(`/api/customers/${phone}`);
    } catch (error) {
      console.error('Failed to fetch customer:', error);
      return null;
    }
  }
}

export const customerService = new CustomerService();