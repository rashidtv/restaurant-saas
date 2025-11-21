import React, { createContext, useContext, useReducer } from 'react';

// 🛠️ ADD VALIDATION FUNCTION HERE - RIGHT AFTER IMPORTS
const validateCustomerPhone = (phone) => {
  if (!phone || phone === 'undefined' || phone === 'null') {
    console.error('❌ Invalid customer phone:', phone);
    return false;
  }
  
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10; // Minimum 10 digits
};

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

  // 🛠️ FIXED: Enhanced registerCustomer function
  const registerCustomer = async (phone, name = '') => {
    try {
      console.log('📝 CustomerContext: Registering customer', phone);
      
      // SIMPLE VALIDATION
      if (!phone || phone === 'undefined') {
        throw new Error('Please enter a valid phone number');
      }

      const cleanPhone = phone.replace(/\D/g, '');
      
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await fetch('https://restaurant-saas-backend-hbdz.onrender.com/api/customers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: cleanPhone, name }),
      });

      // DEBUG: Check what the backend returns
      console.log('🔍 Registration Response Status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Registration failed: ${response.status}`);
      }

      const customerData = await response.json();
      console.log('✅ CustomerContext: Registration response:', customerData);
      
      // SIMPLIFIED: Set basic customer data
      const customerPayload = {
        phone: cleanPhone,
        name: name || `Customer-${cleanPhone.slice(-4)}`,
        points: 0, // Start with 0 points
        isRegistered: true
      };
      
      dispatch({ 
        type: 'SET_CUSTOMER', 
        payload: customerPayload
      });
      
      return customerData;
    } catch (error) {
      console.error('❌ CustomerContext: Registration error', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

// In CustomerContext.jsx - ENHANCED addPoints function
const addPoints = async (points, orderTotal = 0) => {
  try {
    // CRITICAL: Check if we have a valid customer
    if (!customer?.phone || !validateCustomerPhone(customer.phone)) {
      console.warn('⚠️ Cannot add points: No valid customer registered');
      return { success: false, message: 'No customer registered' };
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

    console.log('📥 Add points response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Add points failed:', errorText);
      
      // Try to parse error message
      let errorMessage = 'Failed to update points';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ CustomerContext: Points added successfully', result);
    
    // Update customer with new points
    if (result.customer) {
      dispatch({ 
        type: 'UPDATE_CUSTOMER', 
        payload: { 
          ...customer, 
          points: result.customer.points || (customer.points || 0) + points 
        }
      });
    } else {
      // Fallback: Update points locally
      dispatch({ 
        type: 'UPDATE_CUSTOMER', 
        payload: { 
          ...customer, 
          points: (customer.points || 0) + points 
        }
      });
    }
    
    return { success: true, ...result };
    
  } catch (error) {
    console.error('❌ CustomerContext: Add points error', error);
    // Return failure but don't break the flow
    return { success: false, message: error.message };
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
    const isValid = !!(customer?.phone && validateCustomerPhone(customer.phone));
    console.log('🔍 CustomerContext: Validation check', { isValid, customer });
    return isValid;
  };

  // Get current customer phone with validation
  const getCustomerPhone = () => {
    if (!customer?.phone || !validateCustomerPhone(customer.phone)) {
      console.error('❌ CustomerContext: No valid customer phone available');
      return null;
    }
    return customer.phone;
  };

  // Update customer after order (without adding points)
  const updateCustomerAfterOrder = (orderTotal = 0) => {
    // This function now only updates order stats, not points
    // Points are added separately after payment
    if (customer) {
      dispatch({ 
        type: 'UPDATE_CUSTOMER', 
        payload: {
          ...customer,
          lastOrder: new Date().toISOString(),
          totalOrders: (customer.totalOrders || 0) + 1,
          totalSpent: (customer.totalSpent || 0) + orderTotal
        }
      });
    }
  };

  const value = {
    customer,
    registerCustomer,
    addPoints,
    getCustomer,
    clearCustomer,
    validateCustomer,
    getCustomerPhone,
    updateCustomerAfterOrder,
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