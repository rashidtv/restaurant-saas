import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import TableManagement from './components/TableManagement';
import QRGenerator from './components/QRGenerator';
import DigitalMenu from './components/DigitalMenu';
import KitchenDisplay from './components/KitchenDisplay';
import PaymentSystem from './components/PaymentSystem';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import './App.css';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_ENDPOINTS = {
  ORDERS: `${API_BASE_URL}/api/orders`,
  TABLES: `${API_BASE_URL}/api/tables`,
  PAYMENTS: `${API_BASE_URL}/api/payments`,
  MENU: `${API_BASE_URL}/api/menu`,
  HEALTH: `${API_BASE_URL}/api/health`,
  INIT: `${API_BASE_URL}/api/init`
};

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [menu, setMenu] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when clicking on overlay or navigating
  useEffect(() => {
    if (sidebarOpen && isMobile) {
      document.body.classList.add('sidebar-open');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('sidebar-open');
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.classList.remove('sidebar-open');
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen, isMobile]);

  // Load initial data
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Check API health
        const healthResponse = await fetch(API_ENDPOINTS.HEALTH);
        if (healthResponse.ok) {
          setApiConnected(true);
          
          // Initialize sample data
          await fetch(API_ENDPOINTS.INIT, { method: 'POST' });
          
          // Fetch all data in parallel
          const [tablesResponse, ordersResponse, menuResponse, paymentsResponse] = await Promise.all([
            fetch(API_ENDPOINTS.TABLES),
            fetch(API_ENDPOINTS.ORDERS),
            fetch(API_ENDPOINTS.MENU),
            fetch(API_ENDPOINTS.PAYMENTS)
          ]);
          
          const tablesData = await tablesResponse.json();
          const ordersData = await ordersResponse.json();
          const menuData = await menuResponse.json();
          const paymentsData = await paymentsResponse.json();
          
          setTables(tablesData);
          setOrders(ordersData);
          setMenu(menuData);
          setPayments(paymentsData);
          
          setNotifications([
            { id: 1, message: 'System connected successfully', type: 'success', time: 'Just now', read: false }
          ]);
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        setApiConnected(false);
        setNotifications([
          { 
            id: 1, 
            message: `Failed to connect to backend API: ${error.message}`, 
            type: 'error', 
            time: 'Just now', 
            read: false 
          }
        ]);
        
        // Fallback to sample data
        initializeSampleData();
      } finally {
        setLoading(false);
      }
    };

    const initializeSampleData = () => {
      const sampleOrders = [
        {
          id: 'ORD-2847',
          orderNumber: 'MESRA2847',
          tableId: 'T05',
          items: [
            { 
              menuItem: { name: 'Nasi Lemak Special', price: 12.90 }, 
              quantity: 2, 
              price: 12.90 
            },
            { 
              menuItem: { name: 'Teh Tarik', price: 4.50 }, 
              quantity: 2, 
              price: 4.50 
            }
          ],
          total: 34.80,
          status: 'preparing',
          orderedAt: new Date(Date.now() - 2 * 60 * 1000),
          orderType: 'dine-in'
        }
      ];

      const sampleTables = [
        { _id: '1', number: 'T01', status: 'available', capacity: 4, lastCleaned: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        { _id: '2', number: 'T02', status: 'occupied', capacity: 2, orderId: 'ORD-2847', lastCleaned: new Date(Date.now() - 1 * 60 * 60 * 1000) },
        { _id: '3', number: 'T03', status: 'available', capacity: 6, lastCleaned: new Date(Date.now() - 30 * 60 * 1000) },
        { _id: '4', number: 'T04', status: 'reserved', capacity: 4, lastCleaned: new Date(Date.now() - 45 * 60 * 1000) },
        { _id: '5', number: 'T05', status: 'occupied', capacity: 4, orderId: 'ORD-2847', lastCleaned: new Date(Date.now() - 3 * 60 * 60 * 1000) },
        { _id: '6', number: 'T06', status: 'available', capacity: 2, lastCleaned: new Date(Date.now() - 15 * 60 * 1000) },
        { _id: '7', number: 'T07', status: 'needs_cleaning', capacity: 4, lastCleaned: new Date(Date.now() - 4 * 60 * 60 * 1000) },
        { _id: '8', number: 'T08', status: 'available', capacity: 8, lastCleaned: new Date(Date.now() - 20 * 60 * 1000) }
      ];

      const sampleMenu = [
        { _id: '1', name: 'Nasi Lemak', price: 12.90, category: 'main', preparationTime: 15 },
        { _id: '2', name: 'Teh Tarik', price: 4.50, category: 'drinks', preparationTime: 5 },
        { _id: '3', name: 'Char Kuey Teow', price: 14.50, category: 'main', preparationTime: 12 },
        { _id: '4', name: 'Roti Canai', price: 3.50, category: 'main', preparationTime: 8 },
        { _id: '5', name: 'Satay Set', price: 18.90, category: 'main', preparationTime: 20 },
        { _id: '6', name: 'Cendol', price: 6.90, category: 'desserts', preparationTime: 7 }
      ];

      setOrders(sampleOrders);
      setTables(sampleTables);
      setMenu(sampleMenu);
      setNotifications([
        { id: 1, message: 'New order from Table T05', type: 'order', time: '2 mins ago', read: false },
        { id: 2, message: 'Low stock: Coconut milk', type: 'inventory', time: '15 mins ago', read: false },
        { id: 3, message: 'Table T07 needs cleaning', type: 'table', time: '25 mins ago', read: true }
      ]);
    };

    initializeData();
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleNavigation = (page) => {
    setCurrentPage(page);
    if (isMobile) {
      closeSidebar();
    }
  };

  const markNotificationAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const createNewOrder = async (tableNumber, orderItems, orderType = 'dine-in') => {
    try {
      const orderData = {
        tableId: tableNumber,
        items: orderItems.map(item => ({
          menuItemId: item.id || item._id,
          quantity: item.quantity,
          price: item.price,
          specialInstructions: item.specialInstructions || ''
        })),
        orderType,
        customerName: '',
        customerPhone: ''
      };

      if (apiConnected) {
        const response = await fetch(API_ENDPOINTS.ORDERS, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        });

        const newOrder = await response.json();
        setOrders(prev => [newOrder, ...prev]);
        
        // Refresh tables to get updated status
        const tablesResponse = await fetch(API_ENDPOINTS.TABLES);
        const updatedTables = await tablesResponse.json();
        setTables(updatedTables);
        
        setNotifications(prev => [{
          id: Date.now(),
          message: `New ${orderType} order from ${tableNumber}`,
          type: 'order',
          time: 'Just now',
          read: false
        }, ...prev]);

        return newOrder;
      } else {
        // Fallback to local state
        const newOrder = {
          id: `ORD-${Date.now().toString().slice(-4)}`,
          orderNumber: `MESRA${Date.now().toString().slice(-6)}`,
          tableId: tableNumber,
          items: orderItems,
          total: orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          status: 'pending',
          orderedAt: new Date(),
          orderType
        };

        setOrders(prev => [newOrder, ...prev]);
        setTables(prev => prev.map(table => 
          table.number === tableNumber ? { ...table, status: 'occupied', orderId: newOrder.id } : table
        ));

        setNotifications(prev => [{
          id: Date.now(),
          message: `New ${orderType} order from ${tableNumber}`,
          type: 'order',
          time: 'Just now',
          read: false
        }, ...prev]);

        return newOrder;
      }
    } catch (error) {
      console.error('Error creating order:', error);
      setNotifications(prev => [{
        id: Date.now(),
        message: 'Failed to create order',
        type: 'error',
        time: 'Just now',
        read: false
      }, ...prev]);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      if (apiConnected) {
        const response = await fetch(`${API_ENDPOINTS.ORDERS}/${orderId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });

        const updatedOrder = await response.json();
        setOrders(prev => prev.map(order => 
          order._id === orderId ? updatedOrder : order
        ));
      } else {
        // Fallback to local state
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const completeOrder = async (orderId, tableNumber) => {
    await updateOrderStatus(orderId, 'completed');
    
    if (apiConnected) {
      // Tables will be updated via socket or we can refresh
      const tablesResponse = await fetch(API_ENDPOINTS.TABLES);
      const updatedTables = await tablesResponse.json();
      setTables(updatedTables);
    } else {
      // Fallback to local state
      setTables(prev => prev.map(table => 
        table.number === tableNumber ? { ...table, status: 'needs_cleaning', orderId: null } : table
      ));
    }

    setNotifications(prev => [{
      id: Date.now(),
      message: `Order ${orderId} completed. Table ${tableNumber} needs cleaning`,
      type: 'table',
      time: 'Just now',
      read: false
    }, ...prev]);
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  };

  const getPrepTimeRemaining = (order) => {
    if (!order.orderedAt || order.status === 'ready' || order.status === 'completed') {
      return null;
    }
    
    const now = new Date();
    const orderTime = new Date(order.orderedAt);
    const elapsedMs = now - orderTime;
    const prepTimeMs = (order.preparationTime || 15) * 60000;
    const remainingMs = prepTimeMs - elapsedMs;
    
    if (remainingMs <= 0) return 'Overdue';
    
    const remainingMins = Math.ceil(remainingMs / 60000);
    return `${remainingMins} min${remainingMins === 1 ? '' : 's'}`;
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Restaurant Management System...</p>
          <p className="loading-subtitle">Connecting to backend services</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header 
        notifications={notifications}
        isMobile={isMobile}
        toggleSidebar={toggleSidebar}
        apiConnected={apiConnected}
      />
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && isMobile && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}

      <div className="app-body">
        <Sidebar 
          currentPage={currentPage}
          onNavigate={handleNavigation}
          sidebarOpen={sidebarOpen}
          isMobile={isMobile}
          orders={orders}
          tables={tables}
        />

        {/* Main Content */}
        <main className="main-content">
          {!apiConnected && (
            <div className="api-warning">
              ⚠️ Running in offline mode. Some features may be limited.
            </div>
          )}
          
          {currentPage === 'dashboard' && (
            <Dashboard 
              orders={orders} 
              tables={tables}
              payments={payments}
              notifications={notifications}
              onNotificationRead={markNotificationAsRead}
              getPrepTimeRemaining={getPrepTimeRemaining}
              isMobile={isMobile}
              apiConnected={apiConnected}
            />
          )}
          {currentPage === 'tables' && (
            <TableManagement 
              tables={tables} 
              setTables={setTables}
              orders={orders}
              setOrders={setOrders}
              onCreateOrder={createNewOrder}
              onCompleteOrder={completeOrder}
              getTimeAgo={getTimeAgo}
              isMobile={isMobile}
              apiConnected={apiConnected}
            />
          )}
          {currentPage === 'qr-generator' && (
            <QRGenerator tables={tables} isMobile={isMobile} />
          )}
          {currentPage === 'menu' && (
            <DigitalMenu 
              cart={cart} 
              setCart={setCart}
              onCreateOrder={createNewOrder}
              isMobile={isMobile}
              menu={menu}
              apiConnected={apiConnected}
            />
          )}
          {currentPage === 'kitchen' && (
            <KitchenDisplay 
              orders={orders} 
              setOrders={setOrders}
              getPrepTimeRemaining={getPrepTimeRemaining}
              isMobile={isMobile}
              onUpdateOrderStatus={updateOrderStatus}
              apiConnected={apiConnected}
            />
          )}
          {currentPage === 'payments' && (
            <PaymentSystem 
              orders={orders}
              payments={payments}
              setPayments={setPayments}
              isMobile={isMobile}
              apiConnected={apiConnected}
            />
          )}
          {currentPage === 'analytics' && (
            <AnalyticsDashboard 
              orders={orders} 
              payments={payments} 
              tables={tables} 
              isMobile={isMobile} 
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;