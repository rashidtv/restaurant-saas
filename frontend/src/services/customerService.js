import { CONFIG } from '../constants/config';

class CustomerService {
  constructor() {
    this.baseURL = CONFIG.API_BASE_URL;
    this.sessionKey = 'customer_session';
  }

async registerCustomer(phone) {
  try {
    console.log('🔧 Attempting customer registration:', phone);
    
    const response = await fetch(`${this.baseURL}/api/customers/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
      timeout: 10000 // 10 second timeout
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Registration failed: ${response.status}`);
    }

    const customer = await response.json();
    
    // Store session (phone only)
    this.saveSession(customer.phone);
    
    console.log('✅ Customer registered successfully:', phone);
    return customer;
  } catch (error) {
    console.error('❌ Customer registration failed:', error);
    
    // 🎯 PRODUCTION: Provide specific error messages
    if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      throw new Error('Registration service is currently unavailable. Please contact staff.');
    }
    
    throw new Error(error.message || 'Registration failed. Please try again.');
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

  // 🆕 ADD THIS METHOD - Customer Orders
  async getCustomerOrders(phone) {
    try {
      const response = await fetch(`${this.baseURL}/api/customers/${phone}/orders`);
      
      if (!response.ok) {
        // If endpoint doesn't exist yet, return empty array
        if (response.status === 404) {
          console.log('Customer orders endpoint not implemented, returning empty array');
          return [];
        }
        throw new Error('Failed to fetch customer orders');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch customer orders:', error);
      // Return empty array for now since backend might not have this endpoint
      return [];
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

  // Fallback methods for offline/local development
  getCustomerFromStorage(phone) {
    try {
      const customers = JSON.parse(localStorage.getItem('customers') || '{}');
      return customers[phone] || null;
    } catch (error) {
      return null;
    }
  }

  saveCustomerToStorage(phone, customerData) {
    try {
      const customers = JSON.parse(localStorage.getItem('customers') || '{}');
      customers[phone] = {
        ...customerData,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('customers', JSON.stringify(customers));
      return customers[phone];
    } catch (error) {
      console.error('Error saving customer to storage:', error);
      return null;
    }
  }
}

// Create singleton instance
export const customerService = new CustomerService();