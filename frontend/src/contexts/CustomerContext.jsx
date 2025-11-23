import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';

const CustomerContext = createContext();

// Customer state reducer
const customerReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CUSTOMER':
      return {
        ...action.payload,
        isRegistered: true,
        lastUpdated: Date.now()
      };
    case 'UPDATE_CUSTOMER':
      return { 
        ...state, 
        ...action.payload,
        lastUpdated: Date.now()
      };
    case 'CLEAR_CUSTOMER':
      return null;
    case 'SET_LOADING':
      return { 
        ...state, 
        isLoading: action.payload 
      };
    case 'SET_ERROR':
      return { 
        ...state, 
        error: action.payload,
        isLoading: false 
      };
    default:
      return state;
  }
};

export const CustomerProvider = ({ children }) => {
  const [customer, dispatch] = useReducer(customerReducer, null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 🎯 PRODUCTION: Initialize customer from session
  useEffect(() => {
    const initializeCustomer = async () => {
      try {
        console.log('🔐 Initializing customer session...');
        
        const response = await apiClient.get('/api/customers/me');
        
        if (response.success && response.customer) {
          dispatch({ 
            type: 'SET_CUSTOMER', 
            payload: response.customer 
          });
          console.log('✅ Customer session initialized:', response.customer.phone);
        }
      } catch (error) {
        console.log('ℹ️ No active customer session or error:', error.message);
        // Don't throw error - just means no session exists
      } finally {
        setIsInitialized(true);
      }
    };

    initializeCustomer();
  }, []);

  // 🎯 PRODUCTION: Session refresh on activity
  useEffect(() => {
    if (!customer) return;

    const refreshSession = async () => {
      try {
        await apiClient.post('/api/customers/session/refresh');
        console.log('🔄 Customer session refreshed');
      } catch (error) {
        console.error('Session refresh failed:', error);
        // Don't clear session immediately - wait for actual 401
      }
    };

    // Refresh every 30 minutes
    const interval = setInterval(refreshSession, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [customer]);

  // 🎯 PRODUCTION: Enhanced registerCustomer
  const registerCustomer = async (phone, name = '') => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      if (!phone || phone === 'undefined') {
        throw new Error('Please enter a valid phone number');
      }

      const cleanPhone = phone.replace(/\D/g, '');
      
      const response = await apiClient.post('/api/customers/register', {
        phone: cleanPhone, 
        name: name || `Customer-${cleanPhone.slice(-4)}`
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Registration failed');
      }

      const customerPayload = {
        _id: response.customer?._id,
        phone: cleanPhone,
        name: name || response.customer?.name,
        points: response.customer?.points || 0,
        isRegistered: true
      };
      
      dispatch({ 
        type: 'SET_CUSTOMER', 
        payload: customerPayload 
      });
      
      console.log('✅ Customer registered successfully:', cleanPhone);
      return customerPayload;
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.message 
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // 🎯 PRODUCTION: Enhanced addPoints
  const addPoints = async (points, orderTotal = 0) => {
    if (!customer?.phone) {
      throw new Error('No customer available for points addition');
    }

    try {
      const response = await apiClient.post(`/api/customers/${customer.phone}/points`, {
        points: points,
        orderTotal: orderTotal
      });

      if (!response.success) {
        throw new Error(response.message || 'Points update failed');
      }

      dispatch({ 
        type: 'UPDATE_CUSTOMER', 
        payload: response.customer 
      });
      
      console.log('✅ Points added successfully');
      return { success: true, ...response };
      
    } catch (error) {
      console.error('❌ Add points error:', error);
      
      // Handle session expiration
      if (error.message.includes('SESSION_EXPIRED') || error.message.includes('401')) {
        dispatch({ type: 'CLEAR_CUSTOMER' });
      }
      
      return { success: false, message: error.message };
    }
  };

  // 🎯 PRODUCTION: Enhanced clearCustomer
  const clearCustomer = async () => {
    try {
      await apiClient.post('/api/customers/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      dispatch({ type: 'CLEAR_CUSTOMER' });
    }
  };

  // 🎯 NEW: Silent session validation
  const validateSession = async () => {
    try {
      const response = await apiClient.get('/api/customers/me');
      return response.success;
    } catch (error) {
      console.log('Session validation failed:', error.message);
      return false;
    }
  };

  // 🎯 NEW: Get customer orders
  const getCustomerOrders = async () => {
    if (!customer?.phone) return [];
    
    try {
      const response = await apiClient.get(`/api/customers/${customer.phone}/orders`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to get customer orders:', error);
      return [];
    }
  };

  return (
    <CustomerContext.Provider value={{ 
      // State
      customer,
      isInitialized,
      
      // Actions
      registerCustomer,
      addPoints,
      clearCustomer,
      validateSession,
      getCustomerOrders,
      
      // Computed
      isRegistered: !!customer,
      isLoading: customer?.isLoading || false,
      error: customer?.error
    }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within CustomerProvider');
  }
  return context;
};