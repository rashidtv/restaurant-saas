import { useState, useCallback } from 'react';
import { orderService } from '../services/orderService';
import { CONFIG } from '../constants/config';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🎯 FIX: Add missing isTableMatch function
  const isTableMatch = (order, tableId) => {
    if (!order || !tableId) return false;
    
    // Handle different table ID formats
    const normalizedTableId = tableId.toString().toUpperCase().replace('T', '');
    const orderTableId = (order.tableId || order.table || '').toString().toUpperCase().replace('T', '');
    
    return orderTableId === normalizedTableId;
  };

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const ordersData = await orderService.getOrders();
      setOrders(ordersData);
      return ordersData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTableOrders = useCallback(async (tableId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get all orders and filter by table
      const allOrders = await orderService.getOrders();
      
      // 🎯 FIX: Use the isTableMatch function
      const tableOrders = allOrders.filter(order => 
        isTableMatch(order, tableId)
      );
      
      setOrders(tableOrders);
      return tableOrders;
    } catch (err) {
      const errorMsg = 'Failed to load orders. Please try again.';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createOrder = useCallback(async (orderData) => {
    try {
      setIsLoading(true);
      setError(null);
      const newOrder = await orderService.createOrder(orderData);
      setOrders(prev => [newOrder, ...prev]);
      return newOrder;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId, status) => {
    try {
      setError(null);
      const updatedOrder = await orderService.updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(order => 
        order._id === updatedOrder._id ? updatedOrder : order
      ));
      return updatedOrder;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const loadTableOrders = fetchTableOrders;

  return {
    orders,
    isLoading,
    error,
    fetchOrders,
    fetchTableOrders,
    createOrder,
    updateOrderStatus,
    loadTableOrders,
    // 🎯 FIX: Export the function
    isTableMatch
  };
};