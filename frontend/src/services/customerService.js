import { CONFIG } from '../constants/config';

class CustomerService {
  async registerCustomer(phone, name = '') {
    try {
      console.log('🔧 Attempting customer registration:', { phone, name });
      
      // 🎯 FIX: Ensure phone is clean string
      const phoneString = String(phone).replace(/\D/g, '');
      const nameString = String(name || `Customer-${phoneString.slice(-4)}`);
      
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          phone: phoneString, 
          name: nameString 
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Registration failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Registration failed');
      }

      console.log('✅ Customer registered successfully:', phoneString);
      return result.customer;

    } catch (error) {
      console.error('❌ Customer registration failed:', error);
      throw error;
    }
  }

  async getCurrentCustomer() {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/customers/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.customer) {
          return result.customer;
        }
      }
      return null;
    } catch (error) {
      console.log('ℹ️ No active customer session or error:', error.message);
      return null;
    }
  }

  async addPoints(phone, pointsToAdd, orderTotal = 0) {
    try {
      const phoneString = String(phone).replace(/\D/g, '');
      
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/customers/${phoneString}/points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          points: pointsToAdd,
          orderTotal: orderTotal
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update points');
      }

      const result = await response.json();
      return result.customer.points;
    } catch (error) {
      console.error('❌ Failed to add points:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await fetch(`${CONFIG.API_BASE_URL}/api/customers/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      console.log('✅ Customer logged out successfully');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    }
  }

  async getCustomerOrders(phone) {
    try {
      const phoneString = String(phone).replace(/\D/g, '');
      console.log('📋 Fetching orders for customer:', phoneString);
      
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/customers/${phoneString}/orders`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const orders = await response.json();
      console.log('✅ Retrieved customer orders:', orders.length);
      return orders;
    } catch (error) {
      console.error('❌ Failed to get customer orders:', error);
      return [];
    }
  }

  async refreshCustomerData(phone) {
    try {
      const phoneString = String(phone).replace(/\D/g, '');
      console.log('🔄 Refreshing customer data for:', phoneString);
      
      const customer = await this.getCustomer(phoneString);
      console.log('✅ Customer data refreshed, points:', customer?.points);
      return customer;
    } catch (error) {
      console.error('Failed to refresh customer data:', error);
      return null;
    }
  }

  async getCustomer(phone) {
    try {
      const phoneString = String(phone).replace(/\D/g, '');
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/customers/${phoneString}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch customer:', error);
      return null;
    }
  }
}

export const customerService = new CustomerService();