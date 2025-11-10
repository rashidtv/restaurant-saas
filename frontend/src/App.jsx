import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Components
import Dashboard from './components/Dashboard';
import TableManagement from './components/TableManagement';
import KitchenDisplay from './components/KitchenDisplay';
import PaymentSystem from './components/PaymentSystem';
import DigitalMenu from './components/DigitalMenu';
import QRGenerator from './components/QRGenerator';

// Styles
import './App.css';

function App() {
  // State management
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [payments, setPayments] = useState([]);
  const [menu, setMenu] = useState([]);
  const [apiConnected, setApiConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  // WebSocket connection - PRESERVING EXISTING FUNCTIONALITY
  useEffect(() => {
    console.log('🔌 Initializing WebSocket connection...');
    
    const newSocket = io('https://restaurant-saas-backend-hbdz.onrender.com', {
      transports: ['websocket', 'polling'],
      timeout: 10000
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('🔌 Connected to backend via WebSocket');
      setApiConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from backend:', reason);
      setApiConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      setApiConnected(false);
    });

    // REAL-TIME EVENT LISTENERS - PRESERVING EXISTING WORKFLOW
    newSocket.on('newOrder', (order) => {
      console.log('🔔 WebSocket - New order received:', order.orderNumber);
      setOrders(prev => {
        // Avoid duplicates
        const exists = prev.find(o => o._id === order._id || o.orderNumber === order.orderNumber);
        if (exists) {
          console.log('📝 Order already exists, updating:', order.orderNumber);
          return prev.map(o => o._id === order._id ? order : o);
        }
        console.log('📦 Adding new order to state:', order.orderNumber);
        return [...prev, order];
      });
    });

    newSocket.on('orderUpdated', (order) => {
      console.log('🔔 WebSocket - Order updated:', order.orderNumber);
      setOrders(prev => prev.map(o => 
        (o._id === order._id || o.orderNumber === order.orderNumber) ? order : o
      ));
    });

    newSocket.on('tableUpdated', (table) => {
      console.log('🔔 WebSocket - Table updated:', table.number);
      setTables(prev => prev.map(t => 
        t._id === table._id ? table : t
      ));
    });

    newSocket.on('paymentProcessed', (payment) => {
      console.log('🔔 WebSocket - Payment processed for order:', payment.orderId);
      setPayments(prev => [...prev, payment]);
    });

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      newSocket.close();
    };
  }, []);

  // API FUNCTIONS - PRESERVING EXISTING WORKING LOGIC
  const createNewOrder = async (tableId, items, orderType = 'dine-in', customerData = {}) => {
    try {
      console.log('🔄 createNewOrder called with:', { 
        tableId, 
        itemCount: items.length, 
        orderType 
      });

      // Ensure tableId is properly formatted
      const formattedTableId = tableId?.toString() || '';
      if (!formattedTableId) {
        throw new Error('Table ID is required');
      }

      const orderData = {
        tableId: formattedTableId,
        items: items.map(item => ({
          menuItemId: item._id || item.id,
          quantity: item.quantity,
          price: item.price,
          specialInstructions: item.specialInstructions || ''
        })),
        orderType,
        ...customerData
      };

      console.log('📦 Sending order data to API:', orderData);

      const response = await fetch('https://restaurant-saas-backend-hbdz.onrender.com/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Order created successfully:', result.orderNumber);
      
      return result;
    } catch (error) {
      console.error('❌ Failed to create order:', error);
      throw error;
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      console.log(`🔄 Updating order ${orderId} to status: ${status}`);
      
      const response = await fetch(`https://restaurant-saas-backend-hbdz.onrender.com/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Order status updated successfully:', result.orderNumber);
      return result;
    } catch (error) {
      console.error('❌ Failed to update order status:', error);
      throw error;
    }
  };

  // DATA FETCHING - PRESERVING EXISTING LOGIC
  useEffect(() => {
    const fetchInitialData = async () => {
      console.log('📡 Fetching initial data from backend...');
      
      try {
        // Fetch orders
        const ordersResponse = await fetch('https://restaurant-saas-backend-hbdz.onrender.com/api/orders');
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          console.log('✅ Orders loaded:', ordersData.length);
          setOrders(ordersData);
        } else {
          console.warn('⚠️ Failed to fetch orders');
        }

        // Fetch tables
        const tablesResponse = await fetch('https://restaurant-saas-backend-hbdz.onrender.com/api/tables');
        if (tablesResponse.ok) {
          const tablesData = await tablesResponse.json();
          console.log('✅ Tables loaded:', tablesData.length);
          setTables(tablesData);
        } else {
          console.warn('⚠️ Failed to fetch tables');
        }

        // Fetch menu
        const menuResponse = await fetch('https://restaurant-saas-backend-hbdz.onrender.com/api/menu');
        if (menuResponse.ok) {
          const menuData = await menuResponse.json();
          console.log('✅ Menu items loaded:', menuData.length);
          setMenu(menuData);
        } else {
          console.warn('⚠️ Failed to fetch menu');
        }

        // Fetch payments
        const paymentsResponse = await fetch('https://restaurant-saas-backend-hbdz.onrender.com/api/payments');
        if (paymentsResponse.ok) {
          const paymentsData = await paymentsResponse.json();
          console.log('✅ Payments loaded:', paymentsData.length);
          setPayments(paymentsData);
        }

      } catch (error) {
        console.error('❌ Initial data fetch failed:', error);
      }
    };

    fetchInitialData();
  }, []);

  // Utility functions
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getPrepTimeRemaining = (order) => {
    if (!order.preparationStart || order.status !== 'preparing') return null;
    
    const now = new Date();
    const startTime = new Date(order.preparationStart);
    const elapsedMs = now - startTime;
    const totalMs = (order.estimatedPrepTime || 15) * 60000;
    const remainingMs = Math.max(0, totalMs - elapsedMs);
    
    if (remainingMs === 0) return 'Overdue';
    
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    return `${remainingMinutes}m`;
  };

  // Props for all components - PRESERVING EXISTING STRUCTURE
  const componentProps = {
    // State
    orders,
    setOrders,
    tables,
    setTables,
    payments, 
    setPayments,
    menu,
    setMenu,
    apiConnected,
    
    // API Functions
    onCreateOrder: createNewOrder,
    onUpdateOrderStatus: updateOrderStatus,
    
    // Utility Functions
    getTimeAgo,
    getPrepTimeRemaining,
    
    // WebSocket (for components that might need it)
    socket,
    
    // Mobile detection
    isMobile: window.innerWidth < 768
  };

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Dashboard {...componentProps} />} />
          <Route path="/table-management" element={<TableManagement {...componentProps} />} />
          <Route path="/kitchen-display" element={<KitchenDisplay {...componentProps} />} />
          <Route path="/payment-system" element={<PaymentSystem {...componentProps} />} />
          <Route path="/menu" element={<DigitalMenu {...componentProps} isCustomerView={true} />} />
          <Route path="/qr-generator" element={<QRGenerator {...componentProps} />} />
          
          {/* Fallback route */}
          <Route path="*" element={<Dashboard {...componentProps} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;