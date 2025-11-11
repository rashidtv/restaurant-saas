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
//testing
import { 
  API_ENDPOINTS, 
  fetchOrders, 
  fetchTables, 
  fetchMenu, 
  updateOrderStatus as apiUpdateOrderStatus, 
  createOrder as apiCreateOrder 
} from './config/api';
import { io } from 'socket.io-client';
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
  const [isCustomerView, setIsCustomerView] = useState(false);

const [socket, setSocket] = useState(null);

  useEffect(() => {
    let socketInstance;

    const initializeWebSocket = () => {
      try {
        console.log('🔌 Initializing WebSocket connection...');
        socketInstance = io('https://restaurant-saas-backend-hbdz.onrender.com', {
          transports: ['websocket', 'polling'],
          timeout: 10000
        });

        setSocket(socketInstance);

        socketInstance.on('connect', () => {
          console.log('🔌 Connected to backend via WebSocket');
          setApiConnected(true);
        });

        socketInstance.on('connect_error', (error) => {
          console.log('❌ WebSocket connection error:', error);
          setApiConnected(false);
        });

        socketInstance.on('disconnect', () => {
          console.log('❌ WebSocket disconnected');
          setApiConnected(false);
        });

        // ALL socket event listeners in one place
        socketInstance.on('newOrder', (order) => {
          console.log('📦 New order received via WebSocket:', order);
          setOrders(prev => {
            const exists = prev.some(o => 
              o._id === order._id || o.orderNumber === order.orderNumber
            );
            return exists ? prev : [...prev, order];
          });
        });

        socketInstance.on('orderUpdated', (updatedOrder) => {
          console.log('🔄 Order updated via WebSocket:', updatedOrder);
          setOrders(prev => prev.map(order => 
            (order._id === updatedOrder._id || order.orderNumber === updatedOrder.orderNumber) 
              ? { ...order, ...updatedOrder }
              : order
          ));
        });

       // In App.jsx - REPLACE the tableUpdated handler
socketInstance.on('tableUpdated', (updatedTable) => {
  console.log('🔄 Table updated via WebSocket:', updatedTable.number, updatedTable.status);
  
  setTables(prev => prev.map(t => {
    // Find the current table in state
    const currentTable = prev.find(table => table._id === updatedTable._id);
    
    if (currentTable) {
      // Only update if status actually changed to prevent loops
      if (currentTable.status !== updatedTable.status) {
        console.log('✅ Updating table status from', currentTable.status, 'to', updatedTable.status);
        return updatedTable;
      } else {
        console.log('⚠️ Table status unchanged, skipping update');
        return t;
      }
    }
    return t;
  }));
});

        socketInstance.on('paymentProcessed', (payment) => {
          console.log('💰 Payment processed via WebSocket:', payment);
          setPayments(prev => [...prev, payment]);
        });

      } catch (error) {
        console.error('WebSocket initialization error:', error);
      }
    };

    if (apiConnected) {
      initializeWebSocket();
    }
    
    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [apiConnected]);

  // Polling fallback for data refresh
  useEffect(() => {
    const loadData = async () => {
      if (!apiConnected) return;
      
      try {
        const [ordersData, tablesData] = await Promise.all([
          fetchOrders().catch(() => []),
          fetchTables().catch(() => [])
        ]);
        
        if (ordersData) setOrders(ordersData);
        if (tablesData) setTables(tablesData);
      } catch (error) {
        console.error('Error polling data:', error);
      }
    };

    if (apiConnected) {
      loadData();
      const interval = setInterval(loadData, 10000);
      return () => clearInterval(interval);
    }
  }, [apiConnected]);

  // Check URL for menu route
  // In App.jsx, update the route detection to handle QR URLs properly
useEffect(() => {
  const checkRoute = () => {
    const hash = window.location.hash;
    const path = window.location.pathname;
    
    console.log('🔍 Route check - Hash:', hash, 'Path:', path);
    
    // Handle both /#/menu and /menu routes
    if (hash.includes('#/menu') || path.includes('/menu')) {
      console.log('✅ Menu route detected');
      setIsMenuRoute(true);
      setIsCustomerView(true);
      setCurrentPage('menu');
      
      // Extract table parameter from URL
      const urlParams = new URLSearchParams(window.location.search);
      const tableParam = urlParams.get('table');
      
      if (tableParam) {
        console.log('🎯 Table parameter found:', tableParam);
        setCurrentTable(tableParam);
      } else {
        console.log('❌ No table parameter in URL');
      }
    } else {
      console.log('📊 Staff view detected');
      setIsMenuRoute(false);
      setIsCustomerView(false);
    }
  };

  checkRoute();
  
  const handleHashChange = () => {
    console.log('🔄 Hash changed');
    checkRoute();
  };
  
  window.addEventListener('hashchange', handleHashChange);
  window.addEventListener('popstate', checkRoute);
  
  return () => {
    window.removeEventListener('hashchange', handleHashChange);
    window.removeEventListener('popstate', checkRoute);
  };
}, []);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sidebar management
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

  // Load initial data - FIXED VERSION
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
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
          try {
            await fetch(API_ENDPOINTS.INIT, { method: 'POST' });
          } catch (error) {
            console.log('Init endpoint not available, continuing...');
          }
          
          // CRITICAL: Fetch menu FIRST and use it everywhere
          const menuData = await fetchMenu().catch(() => []);
          console.log('📋 Menu data loaded:', menuData);
          
          // Only then fetch other data
          const [tablesData, ordersData] = await Promise.all([
            fetchTables().catch(() => []),
            fetchOrders().catch(() => [])
          ]);
          
          // SET MENU FIRST - This becomes the single source of truth
          setMenu(menuData || []);
          setTables(tablesData || []);
          setOrders(ordersData || []);
          setPayments([]);
          
          setNotifications([
            { id: 1, message: 'System connected successfully', type: 'success', time: 'Just now', read: false }
          ]);
        } else {
          throw new Error('Backend API is not accessible');
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        setApiConnected(false);
        
        // Use backend menu data even in offline mode
        const backendMenu = [
          { _id: '1', name: "Teh Tarik", price: 4.50, category: "drinks", preparationTime: 5 },
          { _id: '2', name: "Kopi O", price: 3.80, category: "drinks", preparationTime: 3 },
          { _id: '3', name: "Milo Dinosaur", price: 6.50, category: "drinks", preparationTime: 4 },
          { _id: '4', name: "Nasi Lemak", price: 12.90, category: "main", preparationTime: 15 },
          { _id: '5', name: "Char Kuey Teow", price: 14.50, category: "main", preparationTime: 12 },
          { _id: '6', name: "Roti Canai", price: 3.50, category: "main", preparationTime: 8 },
          { _id: '7', name: "Satay Set", price: 18.90, category: "main", preparationTime: 20 },
          { _id: '8', name: "Cendol", price: 6.90, category: "desserts", preparationTime: 7 },
          { _id: '9', name: "Apam Balik", price: 5.50, category: "desserts", preparationTime: 10 }
        ];
        
        setMenu(backendMenu); // SINGLE SOURCE OF TRUTH
        setTables([]);
        setOrders([]);
        setPayments([]);
        
        setNotifications([
          { 
            id: 1, 
            message: `Running in offline mode with backend menu`, 
            type: 'warning', 
            time: 'Just now', 
            read: false 
          }
        ]);
      } finally {
        setLoading(false);
      }
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
    
    if (page === 'menu') {
      window.history.pushState({}, '', '/menu');
      setIsMenuRoute(true);
      setIsCustomerView(true);
    } else {
      window.history.pushState({}, '', '/');
      setIsMenuRoute(false);
      setIsCustomerView(false);
    }
  };

  const markNotificationAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const createNewOrder = async (tableNumber, orderItems, orderType = 'dine-in') => {
    try {
      console.log('🔄 createNewOrder called with:', { tableNumber, orderItems, orderType });
      
      // VALIDATE orderItems to prevent undefined errors
      if (!orderItems || !Array.isArray(orderItems)) {
        console.error('❌ Invalid orderItems:', orderItems);
        throw new Error('Order items are required and must be an array');
      }

      // Filter out items with quantity 0 and validate
      const validOrderItems = orderItems
        .filter(item => item && item.quantity > 0)
        .map(item => ({
          ...item,
          quantity: item.quantity || 1,
          price: item.price || 0
        }));

      if (validOrderItems.length === 0) {
        throw new Error('No valid items in order');
      }

      let newOrder;
      
      if (apiConnected) {
        const orderData = {
          tableId: tableNumber,
          items: validOrderItems.map(item => ({
            menuItemId: item._id || item.id,
            quantity: item.quantity,
            price: item.price,
            specialInstructions: item.specialInstructions || ''
          })),
          orderType: orderType
        };
        
        console.log('📦 Sending order data to API:', orderData);
        newOrder = await apiCreateOrder(orderData);
      } else {
        // Fallback: Generate order locally
        const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
        newOrder = {
          id: orderNumber,
          _id: orderNumber,
          orderNumber: orderNumber,
          table: tableNumber,
          tableId: tableNumber,
          items: validOrderItems,
          orderType: orderType,
          status: 'pending',
          total: validOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          createdAt: new Date(),
          time: 'Just now'
        };

        console.log('📦 Creating local order:', newOrder);
        setOrders(prev => [newOrder, ...prev]);
        
        // Update table status
        setTables(prev => prev.map(table => 
          table.number === tableNumber 
            ? { ...table, status: 'occupied', orderId: orderNumber }
            : table
        ));
      }

      console.log('✅ Order created successfully:', newOrder);
      return newOrder;

    } catch (error) {
      console.error('❌ Error creating order:', error);
      
      // Provide a basic fallback order
      const fallbackOrder = {
        id: `ORD-${Date.now()}`,
        _id: `ORD-${Date.now()}`,
        orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
        table: tableNumber,
        status: 'pending',
        items: orderItems && Array.isArray(orderItems) ? orderItems : [],
        total: 0
      };
      
      // Still add to orders even if there was an error
      setOrders(prev => [fallbackOrder, ...prev]);
      
      return fallbackOrder;
    }
  };

  const handleCustomerOrder = async (tableNumber, orderItems, orderType = 'dine-in') => {
    console.log('🔵 handleCustomerOrder called:', { tableNumber, orderItems, orderType });
    
    // Validate inputs
    if (!tableNumber) {
      console.error('❌ Table number is required');
      throw new Error('Table number is required');
    }

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      console.error('❌ No items in order');
      throw new Error('Please add items to your order');
    }

    const newOrder = await createNewOrder(tableNumber, orderItems, orderType);
    
    console.log('🔵 New customer order created:', newOrder);
    
    setNotifications(prev => [{
      id: Date.now(),
      message: `New customer QR order from Table ${tableNumber}`,
      type: 'order',
      time: 'Just now',
      read: false
    }, ...prev]);
    
    return newOrder;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      let updatedOrder;
      
      if (apiConnected) {
        updatedOrder = await apiUpdateOrderStatus(orderId, newStatus);
      } else {
        // Fallback to local state
        setOrders(prev => prev.map(order => 
          (order.id === orderId || order._id === orderId || order.orderNumber === orderId) 
            ? { ...order, status: newStatus }
            : order
        ));
        updatedOrder = { id: orderId, status: newStatus };
      }

      console.log(`Order ${orderId} status updated to: ${newStatus}`);
      return updatedOrder;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  const completeOrder = async (orderId, tableNumber) => {
    try {
      await updateOrderStatus(orderId, 'completed');
      
      if (apiConnected) {
        // Refresh tables data
        const tablesData = await fetchTables();
        setTables(tablesData);
      } else {
        // Fallback to local state
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
    } catch (error) {
      console.error('Error completing order:', error);
    }
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

  // For menu route (customer-facing view)
  if (isMenuRoute) {
    return (
      <div className="app-container">
        <main className="main-content">
          <DigitalMenu 
            cart={cart} 
            setCart={setCart}
            onCreateOrder={handleCustomerOrder}
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

  // Staff/admin view
  return (
    <div className="app-container">
      <Header 
        notifications={notifications}
        isMobile={isMobile}
        toggleSidebar={toggleSidebar}
        apiConnected={apiConnected}
      />
      
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
              menu={menu}
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
              currentTable={null}
              isCustomerView={false}
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