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

// In CustomerContext.jsx - Add localStorage persistence
export const CustomerProvider = ({ children }) => {
  const [customer, dispatch] = useReducer(customerReducer, null);

  // 🛠️ FIX: Load customer from localStorage on component mount
  useEffect(() => {
    const savedCustomer = localStorage.getItem('restaurant_customer');
    if (savedCustomer) {
      try {
        const customerData = JSON.parse(savedCustomer);
        dispatch({ type: 'SET_CUSTOMER', payload: customerData });
        console.log('✅ Loaded customer from localStorage:', customerData);
      } catch (error) {
        console.error('❌ Error loading customer from storage:', error);
        localStorage.removeItem('restaurant_customer');
      }
    }
  }, []);

  // 🛠️ FIX: Enhanced registerCustomer with immediate persistence
  const registerCustomer = async (phone, name = '') => {
    try {
      console.log('📝 CustomerContext: Registering customer', phone);
      
      // Validation
      if (!phone || phone === 'undefined') {
        throw new Error('Please enter a valid phone number');
      }

      const cleanPhone = phone.replace(/\D/g, '');
      
      const response = await fetch('https://restaurant-saas-backend-hbdz.onrender.com/api/customers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: cleanPhone, name }),
      });

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.status}`);
      }

      const result = await response.json();
      
      // 🛠️ CRITICAL: Create customer object and persist immediately
      const customerPayload = {
        _id: result.customer?._id || result._id,
        phone: cleanPhone,
        name: name || result.customer?.name || `Customer-${cleanPhone.slice(-4)}`,
        points: result.customer?.points || 0,
        isRegistered: true
      };
      
      // 🛠️ FIX: Save to localStorage BEFORE dispatching to state
      localStorage.setItem('restaurant_customer', JSON.stringify(customerPayload));
      
      dispatch({ 
        type: 'SET_CUSTOMER', 
        payload: customerPayload
      });
      
      console.log('✅ Customer registered and persisted:', customerPayload);
      return customerPayload;
      
    } catch (error) {
      console.error('❌ CustomerContext: Registration error', error);
      throw error;
    }
  };

  // 🛠️ FIX: Enhanced addPoints with customer validation
  const addPoints = async (points, orderTotal = 0) => {
    try {
      // Get customer from localStorage as fallback
      let currentCustomer = customer;
      if (!currentCustomer) {
        const savedCustomer = localStorage.getItem('restaurant_customer');
        if (savedCustomer) {
          currentCustomer = JSON.parse(savedCustomer);
          console.log('🔄 Recovered customer from localStorage for points');
        }
      }

      if (!currentCustomer?.phone) {
        console.error('❌ No customer available for points addition');
        return { success: false, message: 'Customer not registered' };
      }

      console.log('➕ Adding points to customer:', currentCustomer.phone);
      
      const response = await fetch(`https://restaurant-saas-backend-hbdz.onrender.com/api/customers/${currentCustomer.phone}/points`, {
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
        throw new Error(`Points update failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Points added successfully');
      
      return { success: true, ...result };
      
    } catch (error) {
      console.error('❌ Add points error:', error);
      return { success: false, message: error.message };
    }
  };

  // Add clearCustomer function to clean up
  const clearCustomer = () => {
    localStorage.removeItem('restaurant_customer');
    dispatch({ type: 'CLEAR_CUSTOMER' });
  };

  return (
    <CustomerContext.Provider value={{ 
      customer, 
      registerCustomer, 
      addPoints, 
      clearCustomer,
      validateCustomer: () => !!(customer?.phone || localStorage.getItem('restaurant_customer'))
    }}>
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