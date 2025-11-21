import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Customer context
const CustomerContext = createContext();

// Customer reducer for state management
const customerReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CUSTOMER':
      console.log('✅ CustomerContext: Setting customer', action.payload);
      // Persist to localStorage
      if (action.payload) {
        localStorage.setItem('customer_data', JSON.stringify(action.payload));
      }
      return { 
        ...action.payload,
        isRegistered: true 
      };
    case 'UPDATE_CUSTOMER':
      console.log('🔄 CustomerContext: Updating customer', action.payload);
      const updatedCustomer = { ...state, ...action.payload };
      // Persist updates
      localStorage.setItem('customer_data', JSON.stringify(updatedCustomer));
      return updatedCustomer;
    case 'CLEAR_CUSTOMER':
      console.log('🧹 CustomerContext: Clearing customer');
      localStorage.removeItem('customer_data');
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

  // 🛠️ FIX: Load customer from localStorage on mount
  useEffect(() => {
    const loadCustomerFromStorage = () => {
      try {
        const storedCustomer = localStorage.getItem('customer_data');
        if (storedCustomer) {
          const customerData = JSON.parse(storedCustomer);
          console.log('📂 Loaded customer from storage:', customerData);
          dispatch({ type: 'SET_CUSTOMER', payload: customerData });
        }
      } catch (error) {
        console.error('❌ Error loading customer from storage:', error);
        localStorage.removeItem('customer_data');
      }
    };

    loadCustomerFromStorage();
  }, []);

  // 🛠️ FIX: Enhanced registerCustomer with proper error handling
  const registerCustomer = async (phone, name = '') => {
    try {
      console.log('📝 CustomerContext: Registering customer', phone);
      
      // Validation
      if (!phone || phone === 'undefined') {
        throw new Error('Please enter a valid phone number');
      }

      const cleanPhone = phone.replace(/\D/g, '');
      
      if (cleanPhone.length < 10) {
        throw new Error('Phone number must be at least 10 digits');
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await fetch('https://restaurant-saas-backend-hbdz.onrender.com/api/customers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: cleanPhone, name }),
      });

      console.log('🔍 Registration Response Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Registration failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ CustomerContext: Registration API result:', result);
      
      // Create customer object
      const customerPayload = {
        _id: result.customer?._id || result._id,
        phone: cleanPhone,
        name: name || result.customer?.name || result.name || `Customer-${cleanPhone.slice(-4)}`,
        points: result.customer?.points || result.points || 0,
        totalOrders: result.customer?.totalOrders || result.totalOrders || 0,
        totalSpent: result.customer?.totalSpent || result.totalSpent || 0,
        isRegistered: true
      };
      
      console.log('✅ CustomerContext: Setting customer payload:', customerPayload);
      
      dispatch({ 
        type: 'SET_CUSTOMER', 
        payload: customerPayload
      });
      
      return customerPayload;
    } catch (error) {
      console.error('❌ CustomerContext: Registration error', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  // 🛠️ FIX: Enhanced addPoints with proper validation
  const addPoints = async (points, orderTotal = 0) => {
    try {
      // CRITICAL: Check if we have a valid customer
      if (!customer?.phone) {
        console.error('❌ Cannot add points: No customer in context');
        throw new Error('No customer registered. Please register first.');
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
        throw new Error(`Points update failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ CustomerContext: Points added successfully', result);
      
      // Update customer with new points
      const updatedPoints = result.customer?.points || result.points || (customer.points || 0) + points;
      
      dispatch({ 
        type: 'UPDATE_CUSTOMER', 
        payload: { 
          points: updatedPoints
        }
      });
      
      return { success: true, points: updatedPoints, ...result };
      
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
    const isValid = !!(customer?.phone && customer.phone !== 'undefined');
    console.log('🔍 CustomerContext: Validation check', { isValid, customer });
    return isValid;
  };

  // Get current customer phone with validation
  const getCustomerPhone = () => {
    if (!customer?.phone || customer.phone === 'undefined') {
      console.error('❌ CustomerContext: No valid customer phone available');
      return null;
    }
    return customer.phone;
  };

  // 🛠️ FIX: Remove points from order creation - only update stats
  const updateCustomerAfterOrder = (orderTotal = 0) => {
    if (customer) {
      // Only update order stats, NOT points
      dispatch({ 
        type: 'UPDATE_CUSTOMER', 
        payload: {
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