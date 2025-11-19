import { useState, useEffect, useCallback } from 'react';
import { customerService } from '../services/customerService';
import { validatePhoneNumber } from '../utils/validators';

export const useCustomer = () => {
  const [customer, setCustomer] = useState(null);
  const [points, setPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load customer data on mount
  useEffect(() => {
    const loadCustomerData = () => {
      try {
        const customerData = customerService.getCustomer();
        const customerPoints = customerService.getPoints();
        
        setCustomer(customerData);
        setPoints(customerPoints);
      } catch (error) {
        console.error('Error loading customer data:', error);
        // Clear corrupted data
        customerService.clearCustomer();
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomerData();
  }, []);

  // Register new customer
  const registerCustomer = useCallback((phone) => {
    if (!validatePhoneNumber(phone)) {
      throw new Error('Please enter a valid phone number (at least 10 digits)');
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const customerData = {
      phone: cleanPhone,
      totalOrders: 0,
      totalSpent: 0
    };

    const savedCustomer = customerService.saveCustomer(customerData);
    setCustomer(savedCustomer);
    
    return savedCustomer;
  }, []);

  // Update customer stats after order
  const updateCustomerAfterOrder = useCallback((orderTotal) => {
    if (!customer) return;

    const updatedCustomer = customerService.updateCustomer({
      totalOrders: (customer.totalOrders || 0) + 1,
      totalSpent: (customer.totalSpent || 0) + orderTotal
    });

    setCustomer(updatedCustomer);
  }, [customer]);

  // Add points
  const addPoints = useCallback((pointsToAdd) => {
    const newPoints = customerService.addPoints(pointsToAdd);
    setPoints(newPoints);
    return newPoints;
  }, []);

  // Clear customer data
  const clearCustomer = useCallback(() => {
    customerService.clearCustomer();
    setCustomer(null);
    setPoints(0);
  }, []);

  return {
    customer,
    points,
    isLoading,
    registerCustomer,
    updateCustomerAfterOrder,
    addPoints,
    clearCustomer
  };
};