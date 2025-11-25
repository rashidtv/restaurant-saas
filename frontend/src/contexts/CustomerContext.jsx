import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'; // 🎯 FIXED: Add useCallback import
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

// Reducer (keep your existing reducer)
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

export const CustomerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(customerReducer, initialState);

  // 🎯 KEEP YOUR EXISTING refreshCustomer METHOD
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
      return state.customer; // Return current state on error
    }
  }, []);

  // 🎯 ENHANCE: Replace JUST the initialization useEffect with retry logic
  useEffect(() => {
    const initializeSessionWithRetry = async (retryCount = 0) => {
      try {
        console.log('🔄 Initializing customer session...');
        const response = await apiClient.get('/api/customers/me');
        
        if (response.success && response.customer) {
          console.log('✅ Customer session initialized:', response.customer.phone);
          dispatch({ type: ACTION_TYPES.SET_CUSTOMER, payload: response.customer });
        } else {
          console.log('ℹ️ No active customer session');
          dispatch({ type: ACTION_TYPES.SET_INITIALIZED });
          
          // 🎯 NEW: Retry logic for mobile devices
          if (retryCount < 2) {
            console.log(`🔄 Retrying session initialization (${retryCount + 1}/2)...`);
            setTimeout(() => initializeSessionWithRetry(retryCount + 1), 1000);
          }
        }
      } catch (error) {
        console.log('ℹ️ Session initialization failed:', error.message);
        dispatch({ type: ACTION_TYPES.SET_INITIALIZED });
        
        // 🎯 NEW: Retry on network errors (common on mobile)
        if (retryCount < 3 && error.message.includes('Network')) {
          console.log(`🔄 Retrying due to network error (${retryCount + 1}/3)...`);
          setTimeout(() => initializeSessionWithRetry(retryCount + 1), 2000);
        }
      }
    };

    initializeSessionWithRetry();
  }, []);

  // 🎯 KEEP YOUR EXISTING registerCustomer method but ENHANCE it
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

      // 🎯 ENHANCED: Session verification for mobile
      console.log('✅ Registration successful, verifying session...');
      
      // Small delay to ensure cookie is set
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Verify session was actually established
      const sessionResponse = await apiClient.get('/api/customers/me');
      if (sessionResponse.success && sessionResponse.customer) {
        dispatch({ type: ACTION_TYPES.SET_CUSTOMER, payload: sessionResponse.customer });
        console.log('✅ Customer registered and session verified:', cleanPhone);
      } else {
        console.warn('⚠️ Session not established after registration, using fallback');
        // Fallback: Use the customer data from registration response
        const customerPayload = {
          _id: response.customer?._id,
          phone: cleanPhone,
          name: name || response.customer?.name,
          points: response.customer?.points || 0,
          isRegistered: true
        };
        dispatch({ type: ACTION_TYPES.SET_CUSTOMER, payload: customerPayload });
      }
      
      return state.customer;
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
    }
  };

  // Clear customer
  const clearCustomer = async () => {
    try {
      await apiClient.post('/api/customers/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      dispatch({ type: ACTION_TYPES.CLEAR_CUSTOMER });
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

      dispatch({ type: ACTION_TYPES.SET_CUSTOMER, payload: response.customer });
      return { success: true, ...response };
      
    } catch (error) {
      console.error('❌ Add points error:', error);
      return { success: false, message: error.message };
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
    refreshCustomer, // 🎯 CRITICAL ADDITION
    
    // Computed
    isRegistered: !!state.customer
  };

  console.log('🔄 CustomerContext state:', {
    customer: state.customer?.phone,
    isInitialized: state.isInitialized,
    isLoading: state.isLoading
  });

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