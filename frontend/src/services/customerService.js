import { CONFIG } from '../constants/config';

class CustomerService {
  constructor() {
    this.baseURL = CONFIG.API_BASE_URL;
    this.sessionKey = 'customer_session';
  }

  // 🎯 PRODUCTION: Backend-first approach
  async registerCustomer(phone) {
    try {
      const response = await fetch(`${this.baseURL}/api/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const customer = await response.json();
      
      // Store session (phone only - no sensitive data)
      this.saveSession(customer.phone);
      
      return customer;
    } catch (error) {
      console.error('Customer registration failed:', error);
      throw new Error(error.message || 'Unable to register. Please try again.');
    }
  }

  async getCustomer(phone) {
    try {
      const response = await fetch(`${this.baseURL}/api/customers/${phone}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // Customer not found
        }
        throw new Error('Failed to fetch customer data');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch customer:', error);
      throw new Error('Unable to load customer data. Please check your connection.');
    }
  }

  async addPoints(phone, pointsToAdd, orderTotal = 0) {
    try {
      const response = await fetch(`${this.baseURL}/api/customers/${phone}/points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points: pointsToAdd,
          orderTotal: orderTotal
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update points');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to add points:', error);
      throw new Error('Points update failed. Please contact staff.');
    }
  }

  async getCustomerOrders(phone) {
    try {
      const response = await fetch(`${this.baseURL}/api/customers/${phone}/orders`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch customer orders:', error);
      return []; // Return empty array instead of failing
    }
  }

  // Session management (stores only phone in localStorage)
  saveSession(phone) {
    const session = {
      phone,
      lastActive: new Date().toISOString(),
      sessionId: this.generateSessionId()
    };
    localStorage.setItem(this.sessionKey, JSON.stringify(session));
  }

  getSession() {
    try {
      const sessionData = localStorage.getItem(this.sessionKey);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      return null;
    }
  }

  clearSession() {
    localStorage.removeItem(this.sessionKey);
  }

  generateSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Check if customer has active session
  hasActiveSession() {
    const session = this.getSession();
    return !!(session && session.phone);
  }

  getSessionPhone() {
    const session = this.getSession();
    return session ? session.phone : null;
  }
}

// Create singleton instance
export const customerService = new CustomerService();