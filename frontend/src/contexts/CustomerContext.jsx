// frontend/src/contexts/CustomerContext.jsx - COMPLETE REWRITE
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

const CustomerContext = createContext();

// Action types
const ACTION_TYPES = {
  SET_CUSTOMER: 'SET_CUSTOMER',
  CLEAR_CUSTOMER: 'CLEAR_CUSTOMER',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_INITIALIZED: 'SET_INITIALIZED'
};

// Reducer
const customerReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_CUSTOMER:
      return {
        ...state,
        customer: action.payload,
        isInitialized: true,
        isLoading: false,
        error: null
      };
    case ACTION_TYPES.CLEAR_CUSTOMER:
      return {
        ...state,
        customer: null,
        isInitialized: true,
        isLoading: false,
        error: null
      };
    case ACTION_TYPES.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    case ACTION_TYPES.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    case ACTION_TYPES.SET_INITIALIZED:
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

// Add this method to your existing CustomerContext
export const CustomerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(customerReducer, initialState);

  // 🎯 NEW: Production-ready customer refresh method
  const refreshCustomer = useCallback(async () => {
    try {
      console.log('🔄 Production: Refreshing customer context...');
      const response = await apiClient.get('/api/customers/me');
      
      if (response.success && response.customer) {
        console.log('✅ Production: CustomerContext refreshed with points:', response.customer.points);
        dispatch({ type: ACTION_TYPES.SET_CUSTOMER, payload: response.customer });
        return response.customer;
      } else {
        console.log('ℹ️ Production: No active customer session during refresh');
        dispatch({ type: ACTION_TYPES.CLEAR_CUSTOMER });
        return null;
      }
    } catch (error) {
      console.error('❌ Production: Failed to refresh customer context:', error);
      // Don't clear customer on network errors - maintain current state
      return state.customer;
    }
  }, []);

  // 🎯 ENHANCE: Update existing registerCustomer to use refresh
  const registerCustomer = async (phone, name = '') => {
    try {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });
      
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

      // 🎯 Use refresh to get full customer data
      await refreshCustomer();
      
      console.log('✅ Production: Customer registered and context updated:', cleanPhone);
      return state.customer; // Return the refreshed customer
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
    }
  };

  // Update the value object
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
    refreshCustomer, // 🎯 CRITICAL ADDITION
    
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