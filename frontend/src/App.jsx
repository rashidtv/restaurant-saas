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
import { API_ENDPOINTS, apiFetch } from './config/api';
import './App.css';

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
  const [isMenuRoute, setIsMenuRoute] = useState(false);
  const [currentTable, setCurrentTable] = useState(null);


  
// Check URL on component mount and URL changes
useEffect(() => {
  const checkRoute = () => {
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(hash.split('?')[1]);
    const tableParam = searchParams.get('table');
    
    if (hash.includes('#menu')) {
      setIsMenuRoute(true);
      setCurrentPage('menu');
      if (tableParam) {
        setCurrentTable(tableParam);
      }
    } else {
      setIsMenuRoute(false);
    }
  };

  checkRoute();
  
  // Listen for URL changes
  const handleHashChange = () => {
    checkRoute();
  };
  
  window.addEventListener('hashchange', handleHashChange);
  return () => window.removeEventListener('hashchange', handleHashChange);
}, []);

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
        
        // Check API health with timeout
        const healthCheck = async () => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(API_ENDPOINTS.HEALTH, {
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (response.ok) {
              setApiConnected(true);
              return true;
            }
            return false;
          } catch (error) {
            console.log('Health check failed:', error.message);
            return false;
          }
        };

        const isHealthy = await healthCheck();
        
        if (isHealthy) {
          setApiConnected(true);
          
          // Initialize sample data
          await fetch(API_ENDPOINTS.INIT, { method: 'POST' });
          
          // Fetch all data
          const [tablesData, ordersData, menuData, paymentsData] = await Promise.all([
            apiFetch(API_ENDPOINTS.TABLES),
            apiFetch(API_ENDPOINTS.ORDERS),
            apiFetch(API_ENDPOINTS.MENU),
            apiFetch(API_ENDPOINTS.PAYMENTS)
          ]);
          
          setTables(tablesData || []);
          setOrders(ordersData || []);
          setMenu(menuData || []);
          setPayments(paymentsData || []);
          
          setNotifications([
            { id: 1, message: 'System connected successfully', type: 'success', time: 'Just now', read: false }
          ]);
        } else {
          throw new Error('Backend API is not accessible');
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        setApiConnected(false);
        setNotifications([
          { 
            id: 1, 
            message: `Running in offline mode: ${error.message}`, 
            type: 'warning', 
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
          _id: '1',
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
        { _id: '1', number: 'T01', status: 'available', capacity: 4, lastCleaned: new Date() },
        { _id: '2', number: 'T02', status: 'occupied', capacity: 2, orderId: '1', lastCleaned: new Date() },
        { _id: '3', number: 'T03', status: 'available', capacity: 6, lastCleaned: new Date() },
        { _id: '4', number: 'T04', status: 'reserved', capacity: 4, lastCleaned: new Date() },
        { _id: '5', number: 'T05', status: 'occupied', capacity: 4, orderId: '1', lastCleaned: new Date() },
        { _id: '6', number: 'T06', status: 'available', capacity: 2, lastCleaned: new Date() },
        { _id: '7', number: 'T07', status: 'needs_cleaning', capacity: 4, lastCleaned: new Date() },
        { _id: '8', number: 'T08', status: 'available', capacity: 8, lastCleaned: new Date() }
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
      setPayments([]);
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
    
    // Update URL for menu route
    if (page === 'menu') {
      window.history.pushState({}, '', '/menu');
      setIsMenuRoute(true);
    } else {
      window.history.pushState({}, '', '/');
      setIsMenuRoute(false);
    }
  };

  const markNotificationAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

const createNewOrder = async (tableNumber, orderItems, orderType = 'dine-in') => {
  try {
    // SIMPLE: Generate order data
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    
    const orderData = {
      id: orderNumber,
      orderNumber: orderNumber,
      table: tableNumber,
      tableId: tableNumber,
      items: orderItems,
      orderType: orderType,
      status: 'pending',
      total: orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      createdAt: new Date(),
      time: 'Just now'
    };

    console.log('Creating order:', orderData);

    // SIMPLE: Add to orders
    setOrders(prev => [orderData, ...prev]);
    
    // SIMPLE: Update table status
    setTables(prev => prev.map(table => 
      table.number === tableNumber 
        ? { ...table, status: 'occupied', orderId: orderNumber }
        : table
    ));

    return orderData; // RETURN THE ORDER DATA

  } catch (error) {
    console.error('Error creating order:', error);
    
    // SIMPLE fallback
    return {
      id: `ORD-${Date.now()}`,
      orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
      table: tableNumber,
      status: 'pending'
    };
  }
};

// Enhanced handleCustomerOrder for QR code orders
const handleCustomerOrder = async (tableNumber, orderItems, orderType = 'dine-in') => {
  console.log('🔵 handleCustomerOrder called:', { tableNumber, orderItems, orderType });
  
  // Process the order same as staff orders
  const newOrder = await createNewOrder(tableNumber, orderItems, orderType);
  
  console.log('🔵 New customer order created:', newOrder);
  
  // Additional notification for customer orders
  setNotifications(prev => [{
    id: Date.now(),
    message: `New customer QR order from Table ${tableNumber}`,
    type: 'order',
    time: 'Just now',
    read: false
  }, ...prev]);
  
  return newOrder;
};

// Add this useEffect hook in your App.jsx:
useEffect(() => {
  // Initialize Socket.io connection
  const socket = io('https://restaurant-saas-backend-hbdz.onrender.com');
  
  socket.on('connect', () => {
    console.log('🔌 Connected to backend via WebSocket');
  });
  
  socket.on('newOrder', (order) => {
    console.log('📦 New order received:', order);
    setOrders(prev => [...prev, order]);
  });
  
  socket.on('orderUpdated', (updatedOrder) => {
    console.log('🔄 Order updated:', updatedOrder);
    setOrders(prev => prev.map(order => 
      (order._id === updatedOrder._id || order.id === updatedOrder.id) 
        ? updatedOrder 
        : order
    ));
  });
  
  socket.on('paymentProcessed', (payment) => {
    console.log('💵 Payment processed:', payment);
    // Refresh orders to update payment status
    fetchOrders();
  });
  
  return () => {
    socket.disconnect();
  };
}, []);

// Also add this useEffect to ensure menu data is loaded
useEffect(() => {
  if (menu.length === 0) {
    console.log('Menu is empty, loading default menu data...');
    // Load default menu data
    const defaultMenu = [
      { id: '1', _id: '1', name: 'Nasi Lemak Royal', price: 16.90, category: 'signature' },
      { id: '2', _id: '2', name: 'Teh Tarik', price: 6.50, category: 'drinks' },
      { id: '3', _id: '3', name: 'Rendang Tok', price: 22.90, category: 'signature' },
      { id: '4', _id: '4', name: 'Mango Sticky Rice', price: 12.90, category: 'desserts' },
      { id: '5', _id: '5', name: 'Satay Set', price: 18.90, category: 'signature' },
      { id: '6', _id: '6', name: 'Iced Lemon Tea', price: 5.90, category: 'drinks' },
      { id: '7', _id: '7', name: 'Chicken Curry', price: 14.90, category: 'main' },
      { id: '8', _id: '8', name: 'Fried Rice Special', price: 12.90, category: 'main' },
      { id: '9', _id: '9', name: 'Fresh Coconut', price: 8.90, category: 'drinks' },
      { id: '10', _id: '10', name: 'Cendol Delight', price: 7.90, category: 'desserts' },
      { id: '11', _id: '11', name: 'Char Kway Teow', price: 14.90, category: 'signature' },
      { id: '12', _id: '12', name: 'Beef Rendang', price: 19.90, category: 'main' },
      { id: '13', _id: '13', name: 'Iced Coffee', price: 7.50, category: 'drinks' },
      { id: '14', _id: '14', name: 'Pisang Goreng', price: 8.90, category: 'desserts' },
      { id: '15', _id: '15', name: 'Spring Rolls', price: 9.90, category: 'appetizers' },
      { id: '16', _id: '16', name: 'Prawn Crackers', price: 6.90, category: 'appetizers' }
    ];
    setMenu(defaultMenu);
  }
}, [menu.length]);

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
    // Fallback to local state - update only the specific table
    setTables(prev => prev.map(table => 
      table.number === tableNumber 
        ? { ...table, status: 'needs_cleaning', orderId: null }
        : table
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

  // For menu route, don't show sidebar and header (customer-facing view)
  if (isMenuRoute) {
    return (
      <div className="app-container">
        <main className="main-content">
          <DigitalMenu 
            cart={cart} 
            setCart={setCart}
            onCreateOrder={createNewOrder}
            isMobile={isMobile}
            menu={menu}
            apiConnected={apiConnected}
            currentTable={currentTable}
            isCustomerView={true}
          />
        </main>
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
              ⚠️ Running in offline mode. Data will reset on page refresh.
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
    onCreateOrder={isCustomerView ? handleCustomerOrder : createNewOrder}
    isMobile={isMobile}
    menu={menu}
    apiConnected={apiConnected}
    currentTable={currentTable}
    isCustomerView={isCustomerView}
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