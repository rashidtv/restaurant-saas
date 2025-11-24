// frontend/src/contexts/CustomerContext.jsx - COMPLETE REWRITE
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

const CustomerContext = createContext();

// 🎯 FIX: Remove useState dependency entirely
const customerReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CUSTOMER':
      return {
        ...action.payload,
        isRegistered: true,
        lastUpdated: Date.now(),
        isInitialized: true
      };
    case 'UPDATE_CUSTOMER':
      return { 
        ...state, 
        ...action.payload,
        lastUpdated: Date.now()
      };
    case 'CLEAR_CUSTOMER':
      return { isInitialized: true }; // 🎯 Keep initialized true
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
    case 'SET_INITIALIZED':
      return {
        ...state,
        isInitialized: true
      };
    default:
      return state;
  }
};

const initialState = {
  customer: null,
  isInitialized: false,
  isLoading: false,
  error: null
};

export const CustomerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(customerReducer, initialState);

  // Initialize customer from session
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
        } else {
          dispatch({ type: 'SET_INITIALIZED' });
        }
      } catch (error) {
        console.log('ℹ️ No active customer session or error:', error.message);
        dispatch({ type: 'SET_INITIALIZED' });
      }
    };

    initializeCustomer();
  }, []);

  // Register customer
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

  // Add points
  const addPoints = async (points, orderTotal = 0) => {
    if (!state.customer?.phone) {
      throw new Error('No customer available for points addition');
    }

    try {
      const response = await apiClient.post(`/api/customers/${state.customer.phone}/points`, {
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
      
      if (error.message.includes('SESSION_EXPIRED') || error.message.includes('401')) {
        dispatch({ type: 'CLEAR_CUSTOMER' });
      }
      
      return { success: false, message: error.message };
    }
  };

  // Clear customer
  const clearCustomer = async () => {
    try {
      await apiClient.post('/api/customers/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      dispatch({ type: 'CLEAR_CUSTOMER' });
    }
  };

  // Get customer orders
  const getCustomerOrders = async () => {
    if (!state.customer?.phone) return [];
    
    try {
      const response = await apiClient.get(`/api/customers/${state.customer.phone}/orders`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to get customer orders:', error);
      return [];
    }
  };

  const value = {
    // State
    customer: state.customer,
    isInitialized: state.isInitialized,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    registerCustomer,
    addPoints,
    clearCustomer,
    getCustomerOrders,
    
    // Computed
    isRegistered: !!state.customer
  };

  return (
    <CustomerContext.Provider value={value}>
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