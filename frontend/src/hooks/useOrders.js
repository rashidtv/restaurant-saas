// frontend/src/hooks/useOrders.js - IMPROVED VERSION
import { useState, useCallback } from 'react';
import { orderService } from '../services/orderService';
import { CONFIG } from '../constants/config';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🎯 IMPROVED: Better table matching with fallbacks
  const isTableMatch = (order, tableId) => {
    if (!order || !tableId) return false;
    
    try {
      // Handle different table ID formats
      const normalizedTableId = String(tableId).toUpperCase().replace(/^T/, '');
      const orderTableId = String(order.tableId || order.table || '').toUpperCase().replace(/^T/, '');
      
      return orderTableId === normalizedTableId;
    } catch (error) {
      console.warn('Table matching error:', error);
      return false;
    }
  };

  // 🎯 IMPROVED: Better error handling for fetchOrders
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Fetching all orders...');
      
      const ordersData = await orderService.getOrders();
      
      if (!Array.isArray(ordersData)) {
        console.warn('⚠️ Orders data is not an array:', ordersData);
        setOrders([]);
        return [];
      }
      
      console.log(`✅ Loaded ${ordersData.length} orders`);
      setOrders(ordersData);
      return ordersData;
      
    } catch (err) {
      console.error('❌ Failed to fetch orders:', err);
      const errorMsg = 'Failed to load orders. Please check connection.';
      setError(errorMsg);
      setOrders([]); // 🎯 Set empty array instead of throwing
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 🎯 IMPROVED: Graceful table orders fetching
  const fetchTableOrders = useCallback(async (tableId) => {
    if (!tableId) {
      console.log('ℹ️ No table ID provided for orders');
      setOrders([]);
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log(`🔄 Fetching orders for table: ${tableId}`);
      
      // Get all orders and filter by table
      const allOrders = await orderService.getOrders();
      
      if (!Array.isArray(allOrders)) {
        console.warn('⚠️ Received invalid orders data');
        setOrders([]);
        return [];
      }
      
      // Filter orders for this table
      const tableOrders = allOrders.filter(order => 
        order && isTableMatch(order, tableId)
      );
      
      console.log(`✅ Found ${tableOrders.length} orders for table ${tableId}`);
      setOrders(tableOrders);
      return tableOrders;
      
    } catch (err) {
      console.error(`❌ Failed to load orders for table ${tableId}:`, err);
      const errorMsg = 'Failed to load table orders.';
      setError(errorMsg);
      setOrders([]); // 🎯 Graceful fallback
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 🎯 NEW: Safe order creation with validation
  const createOrder = useCallback(async (orderData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate order data
      if (!orderData || !orderData.items || !Array.isArray(orderData.items)) {
        throw new Error('Invalid order data: items array required');
      }
      
      if (orderData.items.length === 0) {
        throw new Error('Order must contain at least one item');
      }

      console.log('📦 Creating new order...');
      const newOrder = await orderService.createOrder(orderData);
      
      if (!newOrder) {
        throw new Error('Failed to create order: no response from server');
      }
      
      // Update local state
      setOrders(prev => {
        const updatedOrders = [newOrder, ...prev];
        console.log(`✅ Order created. Total orders: ${updatedOrders.length}`);
        return updatedOrders;
      });
      
      return newOrder;
      
    } catch (err) {
      console.error('❌ Order creation failed:', err);
      setError(err.message);
      throw err; // Re-throw for component handling
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 🎯 IMPROVED: Safe status updates
  const updateOrderStatus = useCallback(async (orderId, status) => {
    try {
      setError(null);
      
      if (!orderId || !status) {
        throw new Error('Order ID and status are required');
      }

      console.log(`🔄 Updating order ${orderId} to: ${status}`);
      const updatedOrder = await orderService.updateOrderStatus(orderId, status);
      
      if (!updatedOrder) {
        throw new Error('Failed to update order status');
      }

      // Update local state
      setOrders(prev => prev.map(order => 
        order._id === updatedOrder._id ? updatedOrder : order
      ));
      
      console.log(`✅ Order ${orderId} updated to: ${status}`);
      return updatedOrder;
      
    } catch (err) {
      console.error(`❌ Failed to update order ${orderId}:`, err);
      setError(err.message);
      throw err;
    }
  }, []);

  // 🎯 NEW: Clear errors manually
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Alias for backward compatibility
  const loadTableOrders = fetchTableOrders;

  return {
    // State
    orders,
    isLoading,
    error,
    
    // Actions
    fetchOrders,
    fetchTableOrders,
    createOrder,
    updateOrderStatus,
    loadTableOrders,
    clearError,
    
    // Utilities
    isTableMatch
  };
};