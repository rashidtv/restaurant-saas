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

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Initialize sample data
  useEffect(() => {
    const sampleOrders = [
      {
        id: 'ORD-2847',
        table: 'T05',
        items: [
          { id: 1, name: 'Nasi Lemak Special', quantity: 2, price: 12.90 },
          { id: 2, name: 'Teh Tarik', quantity: 2, price: 4.50 }
        ],
        total: 34.80,
        status: 'preparing',
        time: '2 mins ago',
        type: 'dine-in',
        createdAt: new Date(Date.now() - 2 * 60 * 1000),
        preparationStart: new Date(Date.now() - 1 * 60 * 1000),
        estimatedPrepTime: 15
      }
    ];

    const sampleTables = [
      { id: 1, number: 'T01', status: 'available', capacity: 4, lastCleaned: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { id: 2, number: 'T02', status: 'occupied', capacity: 2, orderId: 'ORD-2847', lastCleaned: new Date(Date.now() - 1 * 60 * 60 * 1000) },
      { id: 3, number: 'T03', status: 'available', capacity: 6, lastCleaned: new Date(Date.now() - 30 * 60 * 1000) },
      { id: 4, number: 'T04', status: 'reserved', capacity: 4, lastCleaned: new Date(Date.now() - 45 * 60 * 1000) },
      { id: 5, number: 'T05', status: 'occupied', capacity: 4, orderId: 'ORD-2847', lastCleaned: new Date(Date.now() - 3 * 60 * 60 * 1000) },
      { id: 6, number: 'T06', status: 'available', capacity: 2, lastCleaned: new Date(Date.now() - 15 * 60 * 1000) },
      { id: 7, number: 'T07', status: 'needs_cleaning', capacity: 4, lastCleaned: new Date(Date.now() - 4 * 60 * 60 * 1000) },
      { id: 8, number: 'T08', status: 'available', capacity: 8, lastCleaned: new Date(Date.now() - 20 * 60 * 1000) }
    ];

    setOrders(sampleOrders);
    setTables(sampleTables);
    setNotifications([
      { id: 1, message: 'New order from Table T05', type: 'order', time: '2 mins ago', read: false },
      { id: 2, message: 'Low stock: Coconut milk', type: 'inventory', time: '15 mins ago', read: false },
      { id: 3, message: 'Table T07 needs cleaning', type: 'table', time: '25 mins ago', read: true }
    ]);
  }, []);

  // Timer effect for order preparation tracking
  useEffect(() => {
    const timer = setInterval(() => {
      setOrders(currentOrders => 
        currentOrders.map(order => ({
          ...order,
          time: getTimeAgo(order.createdAt)
        }))
      );
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const markNotificationAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const createNewOrder = (tableNumber, orderItems, orderType = 'dine-in') => {
    const newOrder = {
      id: `ORD-${Date.now().toString().slice(-4)}`,
      table: tableNumber,
      items: orderItems,
      total: orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: 'pending',
      time: 'Just now',
      type: orderType,
      createdAt: new Date(),
      preparationStart: null,
      estimatedPrepTime: calculatePrepTime(orderItems)
    };

    setOrders(prev => [newOrder, ...prev]);
    
    // Update table status
    setTables(prev => prev.map(table => 
      table.number === tableNumber ? { ...table, status: 'occupied', orderId: newOrder.id } : table
    ));

    // Add notification
    setNotifications(prev => [{
      id: Date.now(),
      message: `New ${orderType} order from ${tableNumber}`,
      type: 'order',
      time: 'Just now',
      read: false
    }, ...prev]);

    return newOrder;
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const completeOrder = (orderId, tableNumber) => {
    updateOrderStatus(orderId, 'completed');
    
    // Mark table for cleaning
    setTables(prev => prev.map(table => 
      table.number === tableNumber ? { ...table, status: 'needs_cleaning', orderId: null } : table
    ));

    // Add notification
    setNotifications(prev => [{
      id: Date.now(),
      message: `Order ${orderId} completed. Table ${tableNumber} needs cleaning`,
      type: 'table',
      time: 'Just now',
      read: false
    }, ...prev]);
  };

  const calculatePrepTime = (items) => {
    return Math.max(10, items.reduce((time, item) => time + 5, 0));
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
    if (!order.preparationStart || order.status === 'ready' || order.status === 'completed') {
      return null;
    }
    
    const now = new Date();
    const startTime = new Date(order.preparationStart);
    const elapsedMs = now - startTime;
    const remainingMs = (order.estimatedPrepTime * 60000) - elapsedMs;
    
    if (remainingMs <= 0) return 'Overdue';
    
    const remainingMins = Math.ceil(remainingMs / 60000);
    return `${remainingMins} min${remainingMins === 1 ? '' : 's'}`;
  };

  return (
    <div className="app-container">
      <Header 
        notifications={notifications}
        isMobile={isMobile}
        toggleSidebar={toggleSidebar}
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
          {currentPage === 'dashboard' && (
            <Dashboard 
              orders={orders} 
              tables={tables}
              payments={payments}
              notifications={notifications}
              onNotificationRead={markNotificationAsRead}
              getPrepTimeRemaining={getPrepTimeRemaining}
              isMobile={isMobile}
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
            />
          )}
          {currentPage === 'kitchen' && (
            <KitchenDisplay 
              orders={orders} 
              setOrders={setOrders}
              getPrepTimeRemaining={getPrepTimeRemaining}
              isMobile={isMobile}
            />
          )}
          {currentPage === 'payments' && (
            <PaymentSystem 
              orders={orders}
              payments={payments}
              setPayments={setPayments}
              isMobile={isMobile}
            />
          )}
          {currentPage === 'analytics' && (
            <AnalyticsDashboard orders={orders} payments={payments} tables={tables} isMobile={isMobile} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;