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
          console.log('🔍 Loading customer session for:', phone);
          
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
        } else {
          console.log('ℹ️ No active customer session found');
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
      setIsLoading(true);
      
      if (!validatePhoneNumber(phone)) {
        throw new Error('Please enter a valid phone number (at least 10 digits)');
      }

      const cleanPhone = phone.replace(/\D/g, '');
      console.log('📝 Registering customer:', cleanPhone);
      
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add points after order - PRODUCTION READY
  const addPoints = useCallback(async (pointsToAdd, orderTotal = 0) => {
    if (!customer) {
      throw new Error('No customer found');
    }

    try {
      console.log('➕ Adding points:', pointsToAdd, 'for customer:', customer.phone);
      
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

  // 🆕 GET CUSTOMER ORDERS - PRODUCTION READY
  const getCustomerOrders = useCallback(async () => {
    if (!customer) {
      console.log('❌ No customer found, returning empty orders array');
      return [];
    }
    
    try {
      console.log('📋 Fetching orders for customer:', customer.phone);
      const orders = await customerService.getCustomerOrders(customer.phone);
      console.log('✅ Retrieved orders:', orders.length, 'orders');
      return orders;
    } catch (error) {
      console.error('❌ Failed to get customer orders:', error);
      // Return empty array instead of failing
      return [];
    }
  }, [customer]);

  // Clear customer session
  const clearCustomer = useCallback(() => {
    const confirmClear = window.confirm(
      `Are you sure you want to change number? ${points > 0 ? `You will lose ${points} points. ` : ''}Continue?`
    );
    
    if (confirmClear) {
      customerService.clearSession();
      setCustomer(null);
      setPoints(0);
      setError(null);
      console.log('🧹 Customer session cleared');
    }
  }, [points]);

  // Check if customer has valid session
  const hasValidSession = useCallback(() => {
    return !!customer && customerService.hasActiveSession();
  }, [customer]);

  // Get customer phone (safe method)
  const getCustomerPhone = useCallback(() => {
    return customer?.phone || customerService.getSessionPhone();
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
    customerPhone: getCustomerPhone(),
    hasValidSession: hasValidSession(),
    
    // Status
    isRegistered: !!customer,
    isGuest: !customer
  };
};