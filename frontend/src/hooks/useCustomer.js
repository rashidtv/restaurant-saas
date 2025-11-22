// frontend/src/hooks/useCustomer.js - FIXED VERSION
import { useState, useEffect, useCallback } from 'react';
import { validatePhoneNumber } from '../utils/validators';
import { CONFIG } from '../constants/config';

export const useCustomer = () => {
  const [customer, setCustomer] = useState(null);
  const [points, setPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check active session on component mount
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('🔍 Checking for active customer session...');
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/customers/me`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.customer) {
            setCustomer(result.customer);
            setPoints(result.customer.points || 0);
            console.log('✅ Active session restored:', result.customer.phone);
          } else {
            console.log('ℹ️ No active customer session found');
          }
        } else if (response.status === 401) {
          console.log('ℹ️ No authenticated session (new user)');
        } else {
          console.warn('⚠️ Session check returned:', response.status);
        }
      } catch (error) {
        console.error('❌ Session check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkActiveSession();
  }, []);

  // Register customer with session
  const registerCustomer = useCallback(async (phone, name = '') => {
    try {
      setError(null);
      setIsLoading(true);
      
      if (!validatePhoneNumber(phone)) {
        throw new Error('Please enter a valid phone number (at least 10 digits)');
      }

      const cleanPhone = phone.replace(/\D/g, '');
      console.log('📝 Registering customer with session:', cleanPhone);
      
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: cleanPhone, 
          name: name || `Customer-${cleanPhone.slice(-4)}` 
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Registration failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Registration failed');
      }

      setCustomer(result.customer);
      setPoints(result.customer.points || 0);
      
      console.log('✅ Customer registered with session:', cleanPhone);
      return result.customer;
      
    } catch (error) {
      console.error('❌ Customer registration failed:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add points with session validation
  const addPoints = useCallback(async (pointsToAdd, orderTotal = 0) => {
    if (!customer) {
      throw new Error('No customer found. Please register first.');
    }

    try {
      console.log('➕ Adding points via session:', pointsToAdd, 'for customer:', customer.phone);
      
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/customers/${customer.phone}/points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points: pointsToAdd,
          orderTotal: orderTotal
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Points update failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Points update failed');
      }

      setCustomer(result.customer);
      setPoints(result.customer.points);
      
      console.log('✅ Points added via session:', pointsToAdd, 'Total:', result.customer.points);
      return result.customer.points;
      
    } catch (error) {
      console.error('❌ Failed to add points:', error);
      setError(error.message);
      throw error;
    }
  }, [customer]);

  // Logout customer
  const clearCustomer = useCallback(async () => {
    try {
      console.log('🚪 Logging out customer...');
      
      await fetch(`${CONFIG.API_BASE_URL}/api/customers/logout`, {
        method: 'POST',
        credentials: 'include',
      }).catch(error => {
        console.warn('Logout API call failed:', error);
      });

      setCustomer(null);
      setPoints(0);
      setError(null);
      
      console.log('✅ Customer logged out successfully');
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      setCustomer(null);
      setPoints(0);
    }
  }, []);

  // Refresh customer data - FIXED (no saveSession)
  const refreshCustomerData = useCallback(async () => {
    if (!customer) return null;
    
    try {
      console.log('🔄 Refreshing customer data...');
      
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/customers/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.customer) {
          setCustomer(result.customer);
          setPoints(result.customer.points || 0);
          console.log('✅ Customer data refreshed');
          return result.customer;
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to refresh customer data:', error);
      return null;
    }
  }, [customer]);

  // Get customer orders via session
  const getCustomerOrders = useCallback(async () => {
    if (!customer) {
      console.log('❌ No customer found for orders');
      return [];
    }
    
    try {
      console.log('📋 Fetching orders for customer:', customer.phone);
      
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/customers/${customer.phone}/orders`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const orders = await response.json();
      console.log('✅ Retrieved customer orders:', orders.length);
      return orders;
      
    } catch (error) {
      console.error('❌ Failed to get customer orders:', error);
      return [];
    }
  }, [customer]);

  // Update customer after order (local state only)
  const updateCustomerAfterOrder = useCallback(async (orderTotal) => {
    if (!customer) return;

    console.log('🔄 Updating customer stats after order, total:', orderTotal);
    
    const updatedCustomer = {
      ...customer,
      totalOrders: (customer.totalOrders || 0) + 1,
      totalSpent: (customer.totalSpent || 0) + orderTotal,
      updatedAt: new Date().toISOString()
    };
    
    setCustomer(updatedCustomer);
    return updatedCustomer;
  }, [customer]);

  return {
    // State
    customer,
    points,
    isLoading,
    error,
    
    // Actions
    registerCustomer,
    addPoints,
    clearCustomer,
    refreshCustomerData,
    getCustomerOrders,
    updateCustomerAfterOrder,
    
    // Utilities
    hasCustomer: !!customer,
    customerPhone: customer?.phone || null,
    hasValidSession: !!customer,
    
    // Status
    isRegistered: !!customer,
    isGuest: !customer
  };
};