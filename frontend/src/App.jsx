import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import TableManagement from './components/TableManagement';
import QRGenerator from './components/QRGenerator';
import { DigitalMenu } from './components/DigitalMenu';
import KitchenDisplay from './components/KitchenDisplay';
import PaymentSystem from './components/PaymentSystem';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
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
  const [customerCart, setCustomerCart] = useState([]); // Customer cart - ADD THIS
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

  // FIXED: Enhanced health check that actually works
  const healthCheck = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Reduced timeout
      
      // Try multiple endpoints to confirm backend is actually working
      const response = await fetch('https://restaurant-saas-backend-hbdz.onrender.com/api/menu', {
        signal: controller.signal,
        method: 'GET'
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('✅ Health check passed - Backend is responsive');
        return true;
      }
      return false;
    } catch (error) {
      console.log('⚠️ Health check failed:', error.message);
      return false;
    }
  };

  // FIXED: WebSocket initialization - Simplified and more reliable
  useEffect(() => {
    console.log('🔌 Initializing WebSocket connection...');
    
    let socketInstance;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;

    const initializeWebSocket = () => {
      try {
        socketInstance = io('https://restaurant-saas-backend-hbdz.onrender.com', {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnectionAttempts: maxReconnectAttempts
        });

        setSocket(socketInstance);

        socketInstance.on('connect', () => {
          console.log('🔌 Connected to backend via WebSocket');
          setApiConnected(true);
          reconnectAttempts = 0; // Reset on successful connection
        });

        socketInstance.on('connect_error', (error) => {
          console.log('❌ WebSocket connection error:', error.message);
          // Don't set apiConnected to false here - HTTP APIs might still work
          reconnectAttempts++;
          
          if (reconnectAttempts >= maxReconnectAttempts) {
            console.log('⚠️ Max WebSocket reconnection attempts reached, using HTTP fallback');
            // WebSocket failed but HTTP might still work
          }
        });

        socketInstance.on('disconnect', (reason) => {
          console.log('❌ WebSocket disconnected:', reason);
          // Don't set apiConnected to false - HTTP APIs might still work
        });

        // Socket event listeners
        socketInstance.on('newOrder', (order) => {
          console.log('📦 New order received via WebSocket:', order.orderNumber);
          setOrders(prev => {
            const exists = prev.some(o => o._id === order._id);
            return exists ? prev : [...prev, order];
          });
        });

        socketInstance.on('orderUpdated', (updatedOrder) => {
          console.log('🔄 Order updated via WebSocket:', updatedOrder.orderNumber);
          setOrders(prev => prev.map(order => 
            order._id === updatedOrder._id ? { ...order, ...updatedOrder } : order
          ));
        });

        socketInstance.on('tableUpdated', (updatedTable) => {
          console.log('🔄 Table updated via WebSocket:', updatedTable.number, updatedTable.status);
          setTables(prev => prev.map(table => {
            if (table._id === updatedTable._id) {
              if (table.status !== updatedTable.status) {
                console.log('✅ Updating table:', table.number, 'from', table.status, 'to', updatedTable.status);
                return updatedTable;
              } else {
                console.log('⚠️ Table status unchanged, skipping:', table.number);
                return table;
              }
            }
            return table;
          }));
        });

        socketInstance.on('paymentProcessed', (payment) => {
          console.log('💰 Payment processed via WebSocket:', payment.orderId);
          setPayments(prev => [...prev, payment]);
        });

      } catch (error) {
        console.error('WebSocket initialization error:', error);
      }
    };

    // Always try to initialize WebSocket, but don't block on it
    initializeWebSocket();
    
    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []); // Removed apiConnected dependency to prevent loops

  // FIXED: Better API connection monitoring
  useEffect(() => {
    const checkConnection = async () => {
      console.log('🔄 Checking backend connection...');
      
      // Test actual API endpoints instead of just health check
      try {
        const [menuResponse, tablesResponse] = await Promise.all([
          fetch('https://restaurant-saas-backend-hbdz.onrender.com/api/menu').catch(() => null),
          fetch('https://restaurant-saas-backend-hbdz.onrender.com/api/tables').catch(() => null)
        ]);

        const menuOk = menuResponse && menuResponse.ok;
        const tablesOk = tablesResponse && tablesResponse.ok;
        
        if (menuOk || tablesOk) {
          console.log('✅ Backend APIs are responsive');
          if (!apiConnected) {
            setApiConnected(true);
          }
        } else {
          console.log('⚠️ Some API endpoints are not responding');
          // Don't set apiConnected to false immediately - might be temporary
        }
      } catch (error) {
        console.log('⚠️ API check failed:', error.message);
        // Don't set apiConnected to false on single failure
      }
    };

    // Initial check
    checkConnection();

    // Periodic checks - less frequent
    const interval = setInterval(checkConnection, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [apiConnected]);

  // FIXED: Polling fallback for data refresh - only if API is connected
  useEffect(() => {
    const loadData = async () => {
      if (!apiConnected) return;
      
      try {
        const [ordersData, tablesData] = await Promise.all([
          fetchOrders().catch(() => null),
          fetchTables().catch(() => null)
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
  useEffect(() => {
    const checkRoute = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      
      console.log('🔍 Route check - Hash:', hash, 'Path:', path);
      
      if (hash.includes('#/menu') || path.includes('/menu')) {
        console.log('✅ Menu route detected');
        setIsMenuRoute(true);
        setIsCustomerView(true);
        setCurrentPage('menu');
        
        const urlParams = new URLSearchParams(window.location.search);
        const tableParam = urlParams.get('table');
        
        if (tableParam) {
          console.log('🎯 Table parameter found:', tableParam);
          setCurrentTable(tableParam);
        }
      } else {
        console.log('📊 Staff view detected');
        setIsMenuRoute(false);
        setIsCustomerView(false);
      }
    };

    checkRoute();
    
    const handleHashChange = () => {
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

  // FIXED: Load initial data with better connection detection
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        console.log('🚀 Initializing application data...');
        
        // Try to load data first - this is the real test of connectivity
        try {
          const [menuData, tablesData, ordersData] = await Promise.all([
            fetchMenu().catch(error => {
              console.log('❌ Menu fetch failed:', error.message);
              return [];
            }),
            fetchTables().catch(error => {
              console.log('❌ Tables fetch failed:', error.message);
              return [];
            }),
            fetchOrders().catch(error => {
              console.log('❌ Orders fetch failed:', error.message);
              return [];
            })
          ]);
          
          // If we got any data back, consider API connected
          const hasData = menuData.length > 0 || tablesData.length > 0 || ordersData.length > 0;
          
          if (hasData) {
            console.log('✅ API is connected - data loaded successfully');
            setApiConnected(true);
            setMenu(menuData);
            setTables(tablesData);
            setOrders(ordersData);
            setPayments([]);
          } else {
            console.log('⚠️ No data received from API, using fallback');
            setApiConnected(false);
            useFallbackData();
          }
          
        } catch (error) {
          console.log('❌ Data load failed, using fallback:', error.message);
          setApiConnected(false);
          useFallbackData();
        }

        setNotifications([
          { 
            id: 1, 
            message: `System ${apiConnected ? 'connected' : 'running in offline mode'}`, 
            type: apiConnected ? 'success' : 'warning', 
            time: 'Just now', 
            read: false 
          }
        ]);

      } catch (error) {
        console.error('Error initializing data:', error);
        setApiConnected(false);
        useFallbackData();
      } finally {
        setLoading(false);
      }
    };

    const useFallbackData = () => {
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
      
      setMenu(backendMenu);
      setTables([]);
      setOrders([]);
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
      console.log('🔄 createNewOrder called for table:', tableNumber);
      
      if (!orderItems || !Array.isArray(orderItems)) {
        throw new Error('Order items are required');
      }

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
        
        newOrder = await apiCreateOrder(orderData);
      } else {
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
          createdAt: new Date()
        };

        setOrders(prev => [newOrder, ...prev]);
        
        setTables(prev => prev.map(table => 
          table.number === tableNumber 
            ? { ...table, status: 'occupied', orderId: orderNumber }
            : table
        ));
      }

      console.log('✅ Order created successfully:', newOrder.orderNumber);
      return newOrder;

    } catch (error) {
      console.error('❌ Error creating order:', error);
      
      const fallbackOrder = {
        id: `ORD-${Date.now()}`,
        _id: `ORD-${Date.now()}`,
        orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
        table: tableNumber,
        status: 'pending',
        items: orderItems || [],
        total: 0
      };
      
      setOrders(prev => [fallbackOrder, ...prev]);
      
      return fallbackOrder;
    }
  };
const handleCustomerOrder = async (tableNumber, orderItems, orderType = 'dine-in') => {
  console.log('🛒 Creating order for table:', tableNumber);
  
  if (!tableNumber) throw new Error('Table number required');
  if (!orderItems.length) throw new Error('No items in order');

  if (apiConnected) {
    const orderData = {
      tableId: tableNumber,
      items: orderItems.map(item => ({
        menuItemId: item.menuItemId || item.id,
        name: item.name,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price)
      })),
      orderType: orderType,
      status: 'pending'
    };
    
    console.log('📤 Sending order:', orderData);
    
    const response = await fetch('https://restaurant-saas-backend-hbdz.onrender.com/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    
    return await response.json();
  } else {
    // Offline fallback
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const newOrder = {
      orderNumber,
      table: tableNumber,
      items: orderItems,
      status: 'pending',
      total: orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    
    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  }
};

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      let updatedOrder;
      
      if (apiConnected) {
        updatedOrder = await apiUpdateOrderStatus(orderId, newStatus);
      } else {
        setOrders(prev => prev.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
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
        const tablesData = await fetchTables();
        setTables(tablesData);
      } else {
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
          {/* FIXED: Only show warning if API is actually disconnected */}
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
            <QRGenerator tables={tables} isMobile={isMobile} apiConnected={apiConnected} />
          )}
          {currentPage === 'menu' && (
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