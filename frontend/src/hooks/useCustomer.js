import { useState, useEffect, useCallback } from 'react';
import { customerService } from '../services/customerService';
import { validatePhoneNumber } from '../utils/validators';

export const useCustomer = () => {
  const [customer, setCustomer] = useState(null);
  const [points, setPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load customer data on mount - IMPROVED PERSISTENCE
  useEffect(() => {
    const loadCustomerData = () => {
      try {
        const customerData = customerService.getCustomer();
        const customerPoints = customerService.getPoints();
        
        console.log('👤 Loading customer data:', { 
          hasCustomer: !!customerData, 
          points: customerPoints 
        });
        
        setCustomer(customerData);
        setPoints(customerPoints);
      } catch (error) {
        console.error('Error loading customer data:', error);
        // Don't clear data on error - might be temporary
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomerData();
  }, []);

  // Register new customer - IMPROVED ERROR HANDLING
  const registerCustomer = useCallback(async (phone) => {
    if (!validatePhoneNumber(phone)) {
      throw new Error('Please enter a valid phone number (at least 10 digits)');
    }

    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if customer already exists
    const existingCustomer = customerService.getCustomer();
    if (existingCustomer && existingCustomer.phone === cleanPhone) {
      console.log('👤 Customer already exists, restoring session');
      setCustomer(existingCustomer);
      setPoints(customerService.getPoints());
      return existingCustomer;
    }

    const customerData = {
      phone: cleanPhone,
      totalOrders: 0,
      totalSpent: 0,
      sessionId: Date.now().toString() // Add session tracking
    };

    const savedCustomer = customerService.saveCustomer(customerData);
    setCustomer(savedCustomer);
    
    console.log('✅ New customer registered:', cleanPhone);
    return savedCustomer;
  }, []);

  // Update customer stats after order
  const updateCustomerAfterOrder = useCallback((orderTotal) => {
    if (!customer) return;

    const updatedCustomer = customerService.updateCustomer({
      totalOrders: (customer.totalOrders || 0) + 1,
      totalSpent: (customer.totalSpent || 0) + orderTotal,
      lastOrderAt: new Date().toISOString()
    });

    setCustomer(updatedCustomer);
    return updatedCustomer;
  }, [customer]);

  // Add points with better persistence
  const addPoints = useCallback((pointsToAdd) => {
    const newPoints = customerService.addPoints(pointsToAdd);
    setPoints(newPoints);
    console.log('🎯 Points added:', pointsToAdd, 'Total:', newPoints);
    return newPoints;
  }, []);

  // Clear customer data - IMPROVED with confirmation
  const clearCustomer = useCallback(() => {
    const confirmClear = window.confirm(
      'Are you sure you want to change number? Your points and order history will be lost.'
    );
    
    if (confirmClear) {
      customerService.clearCustomer();
      setCustomer(null);
      setPoints(0);
      console.log('🧹 Customer data cleared');
    }
  }, []);

  // Check if customer session is valid
  const hasValidSession = useCallback(() => {
    return !!customer && !!customer.phone;
  }, [customer]);

  return {
    customer,
    points,
    isLoading,
    registerCustomer,
    updateCustomerAfterOrder,
    addPoints,
    clearCustomer,
    hasValidSession
  };
};