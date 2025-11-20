import React, { createContext, useContext, useReducer } from 'react';

// Customer context
const CustomerContext = createContext();

// Customer reducer for state management
const customerReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CUSTOMER':
      console.log('✅ CustomerContext: Setting customer', action.payload);
      return { 
        ...action.payload,
        isRegistered: true 
      };
    case 'UPDATE_CUSTOMER':
      console.log('🔄 CustomerContext: Updating customer', action.payload);
      return { 
        ...state, 
        ...action.payload 
      };
    case 'CLEAR_CUSTOMER':
      console.log('🧹 CustomerContext: Clearing customer');
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

// Customer provider component
export const CustomerProvider = ({ children }) => {
  const [customer, dispatch] = useReducer(customerReducer, null);

  // Register customer function
  const registerCustomer = async (phone, name = '') => {
    try {
      console.log('📝 CustomerContext: Registering customer', phone);
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const cleanPhone = phone.replace(/\D/g, '');
      
      const response = await fetch('https://restaurant-saas-backend-hbdz.onrender.com/api/customers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: cleanPhone, name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const customerData = await response.json();
      console.log('✅ CustomerContext: Registration successful', customerData);
      
      // Set customer in context
      dispatch({ 
        type: 'SET_CUSTOMER', 
        payload: {
          ...customerData.customer,
          phone: cleanPhone,
          name: name || customerData.customer?.name || `Customer-${cleanPhone.slice(-4)}`
        }
      });
      
      return customerData;
    } catch (error) {
      console.error('❌ CustomerContext: Registration error', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  // Add points to customer
  const addPoints = async (points, orderTotal = 0) => {
    try {
      if (!customer?.phone) {
        throw new Error('No customer registered');
      }

      console.log('➕ CustomerContext: Adding points', points, 'to customer', customer.phone);
      
      const response = await fetch(`https://restaurant-saas-backend-hbdz.onrender.com/api/customers/${customer.phone}/points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points: points,
          orderTotal: orderTotal
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add points');
      }

      const updatedCustomer = await response.json();
      console.log('✅ CustomerContext: Points added successfully', updatedCustomer);
      
      // Update customer with new points
      dispatch({ 
        type: 'UPDATE_CUSTOMER', 
        payload: updatedCustomer.customer || updatedCustomer 
      });
      
      return updatedCustomer;
    } catch (error) {
      console.error('❌ CustomerContext: Add points error', error);
      throw error;
    }
  };

  // Get customer by phone
  const getCustomer = async (phone) => {
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const response = await fetch(`https://restaurant-saas-backend-hbdz.onrender.com/api/customers/${cleanPhone}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch customer');
      }

      const customerData = await response.json();
      dispatch({ type: 'SET_CUSTOMER', payload: customerData });
      return customerData;
    } catch (error) {
      console.error('❌ CustomerContext: Get customer error', error);
      throw error;
    }
  };

  // Clear customer (logout)
  const clearCustomer = () => {
    dispatch({ type: 'CLEAR_CUSTOMER' });
  };

  // Validate if customer exists and has phone
  const validateCustomer = () => {
    const isValid = !!(customer?.phone);
    console.log('🔍 CustomerContext: Validation check', { isValid, customer });
    return isValid;
  };

  // Get current customer phone with validation
  const getCustomerPhone = () => {
    if (!customer?.phone) {
      console.error('❌ CustomerContext: No customer phone available');
      return null;
    }
    return customer.phone;
  };

  const value = {
    customer,
    registerCustomer,
    addPoints,
    getCustomer,
    clearCustomer,
    validateCustomer,
    getCustomerPhone,
    isRegistered: !!customer?.phone
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};

// Custom hook to use customer context
export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within CustomerProvider');
  }
  return context;
};