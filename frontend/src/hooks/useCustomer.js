import { useState, useEffect, useCallback } from 'react';
import { customerService } from '../services/customerService';
import { validatePhoneNumber } from '../utils/validators';

export const useCustomer = () => {
  const [customer, setCustomer] = useState(null);
  const [points, setPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load customer from session on component mount
  useEffect(() => {
    const loadCustomerFromSession = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (customerService.hasActiveSession()) {
          const phone = customerService.getSessionPhone();
          const customerData = await customerService.getCustomer(phone);
          
          if (customerData) {
            setCustomer(customerData);
            setPoints(customerData.points || 0);
            console.log('✅ Customer session restored:', phone);
          } else {
            // Session exists but customer not found in DB - clear session
            customerService.clearSession();
            console.log('❌ Session invalid, customer not found in DB');
          }
        }
      } catch (error) {
        console.error('Failed to load customer session:', error);
        setError(error.message);
        // Don't clear session on temporary network errors
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomerFromSession();
  }, []);

  // Register new customer - PRODUCTION READY
  const registerCustomer = useCallback(async (phone) => {
    try {
      setError(null);
      
      if (!validatePhoneNumber(phone)) {
        throw new Error('Please enter a valid phone number (at least 10 digits)');
      }

      const cleanPhone = phone.replace(/\D/g, '');
      
      // Register with backend
      const customerData = await customerService.registerCustomer(cleanPhone);
      
      setCustomer(customerData);
      setPoints(customerData.points || 0);
      
      console.log('✅ Customer registered successfully:', cleanPhone);
      return customerData;
    } catch (error) {
      console.error('Customer registration failed:', error);
      setError(error.message);
      throw error;
    }
  }, []);

  // Add points after order - PRODUCTION READY
  const addPoints = useCallback(async (pointsToAdd, orderTotal = 0) => {
    if (!customer) {
      throw new Error('No customer found');
    }

    try {
      const updatedCustomer = await customerService.addPoints(
        customer.phone, 
        pointsToAdd, 
        orderTotal
      );
      
      setCustomer(updatedCustomer);
      setPoints(updatedCustomer.points);
      
      console.log('✅ Points added:', pointsToAdd, 'Total:', updatedCustomer.points);
      return updatedCustomer.points;
    } catch (error) {
      console.error('Failed to add points:', error);
      setError(error.message);
      throw error;
    }
  }, [customer]);

  // Update customer after order
  const updateCustomerAfterOrder = useCallback(async (orderTotal) => {
    if (!customer) return;

    // Points are already added via addPoints, just update local state if needed
    const updatedCustomer = {
      ...customer,
      totalOrders: (customer.totalOrders || 0) + 1,
      totalSpent: (customer.totalSpent || 0) + orderTotal,
      updatedAt: new Date().toISOString()
    };
    
    setCustomer(updatedCustomer);
  }, [customer]);

  // Clear customer session
  const clearCustomer = useCallback(() => {
    const confirmClear = window.confirm(
      'Are you sure you want to change number? Your points and order history will be lost.'
    );
    
    if (confirmClear) {
      customerService.clearSession();
      setCustomer(null);
      setPoints(0);
      setError(null);
      console.log('🧹 Customer session cleared');
    }
  }, []);

  // Get customer orders
  const getCustomerOrders = useCallback(async () => {
    if (!customer) return [];
    
    try {
      return await customerService.getCustomerOrders(customer.phone);
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
    updateCustomerAfterOrder,
    addPoints,
    clearCustomer,
    getCustomerOrders,
    
    // Utilities
    hasCustomer: !!customer,
    customerPhone: customer?.phone
  };
};