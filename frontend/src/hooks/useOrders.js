import { useState, useCallback } from 'react';
import { orderService } from '../services/orderService';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTableOrders = useCallback(async (tableNumber) => {
    if (!tableNumber) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tableOrders = await orderService.fetchTableOrders(tableNumber);
      // FIX: Handle null/undefined response
      setOrders(tableOrders || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading orders:', err);
      setOrders([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createOrder = useCallback(async (orderData) => {
    try {
      const result = await orderService.createOrder(orderData);
      return result;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }, []);

  const refreshOrders = useCallback(async (tableNumber) => {
    if (tableNumber) {
      await loadTableOrders(tableNumber);
    }
  }, [loadTableOrders]);

  return {
    orders,
    isLoading,
    error,
    loadTableOrders,
    createOrder,
    refreshOrders
  };
};