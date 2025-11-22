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
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/customers/me`, {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.customer) {
            setCustomer(result.customer);
            setPoints(result.customer.points || 0);
          }
        }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkActiveSession();
  }, []);

  // Register customer
  const registerCustomer = useCallback(async (phone, name = '') => {
    try {
      setError(null);
      
      if (!validatePhoneNumber(phone)) {
        throw new Error('Please enter a valid phone number');
      }

      const cleanPhone = phone.replace(/\D/g, '');
      
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/customers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: cleanPhone, 
          name: name || `Customer-${cleanPhone.slice(-4)}` 
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Registration failed');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Registration failed');
      }

      setCustomer(result.customer);
      setPoints(result.customer.points || 0);
      return result.customer;
      
    } catch (error) {
      console.error('Customer registration failed:', error);
      setError(error.message);
      throw error;
    }
  }, []);

  // Add points
  const addPoints = useCallback(async (pointsToAdd, orderTotal = 0) => {
    if (!customer) {
      throw new Error('No customer found');
    }

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/customers/${customer.phone}/points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: pointsToAdd, orderTotal }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Points update failed');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Points update failed');
      }

      setCustomer(result.customer);
      setPoints(result.customer.points);
      return result.customer.points;
      
    } catch (error) {
      console.error('Failed to add points:', error);
      throw error;
    }
  }, [customer]);

  // Logout customer
  const clearCustomer = useCallback(async () => {
    try {
      await fetch(`${CONFIG.API_BASE_URL}/api/customers/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      
      setCustomer(null);
      setPoints(0);
      setError(null);
    } catch (error) {
      console.error('Logout error:', error);
      setCustomer(null);
      setPoints(0);
    }
  }, []);

  // Refresh customer data
  const refreshCustomerData = useCallback(async () => {
    if (!customer) return null;
    
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/customers/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.customer) {
          setCustomer(result.customer);
          setPoints(result.customer.points || 0);
          return result.customer;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to refresh customer data:', error);
      return null;
    }
  }, [customer]);

  // Get customer orders
  const getCustomerOrders = useCallback(async () => {
    if (!customer) return [];
    
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/customers/${customer.phone}/orders`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get customer orders:', error);
      return [];
    }
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
    
    // Status
    hasCustomer: !!customer,
    isRegistered: !!customer
  };
};