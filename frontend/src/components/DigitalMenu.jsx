import React, { useState, useEffect, useRef } from 'react';
import './DigitalMenu.css';

const DigitalMenu = ({ cart, setCart, onCreateOrder, isMobile, menu, apiConnected, currentTable, isCustomerView = false }) => {
  const [selectedTable, setSelectedTable] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [tableOrders, setTableOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [customerInfo, setCustomerInfo] = useState(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({ phone: '', name: '' });
  
  const wsRef = useRef(null);
  const orderRefreshRef = useRef(null);

  // Load customer info from localStorage - FIXED
  useEffect(() => {
    if (isCustomerView) {
      console.log('🔍 Checking for saved customer data...');
      const savedCustomer = localStorage.getItem('restaurantCustomer');
      console.log('📦 Saved customer data:', savedCustomer);
      
      if (savedCustomer) {
        try {
          const customerData = JSON.parse(savedCustomer);
          setCustomerInfo(customerData);
          console.log('✅ Loaded saved customer:', customerData);
          
          // If we have a table detected, load orders immediately
          if (selectedTable) {
            loadCustomerOrders(selectedTable, customerData.phone);
          }
        } catch (error) {
          console.error('❌ Error loading customer data:', error);
          localStorage.removeItem('restaurantCustomer'); // Clear corrupted data
        }
      }
    }
  }, [isCustomerView]);

  // Save customer info to localStorage when it changes - FIXED
  useEffect(() => {
    if (customerInfo && isCustomerView) {
      console.log('💾 Saving customer info:', customerInfo);
      localStorage.setItem('restaurantCustomer', JSON.stringify(customerInfo));
    }
  }, [customerInfo, isCustomerView]);

  // WebSocket for real-time order updates
  useEffect(() => {
    if (isCustomerView && selectedTable && customerInfo) {
      console.log('🔌 DigitalMenu: Setting up WebSocket for customer:', customerInfo.phone);
      
      // Clear any existing interval
      if (orderRefreshRef.current) {
        clearInterval(orderRefreshRef.current);
      }
      
      // Set up WebSocket connection
      const setupWebSocket = () => {
        try {
          const websocket = new WebSocket('wss://restaurant-saas-backend-hbdz.onrender.com');
          
          websocket.onopen = () => {
            console.log('✅ DigitalMenu: WebSocket connected for customer:', customerInfo.phone);
            wsRef.current = websocket;
          };
          
          websocket.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              console.log('📦 DigitalMenu: WebSocket message:', data);
              
              // Handle different message types
              if (data.type === 'orderUpdate' || data.type === 'newOrder' || data.type === 'statusUpdate') {
                console.log('🔄 DigitalMenu: Order update received, reloading orders...');
                setLastUpdate(Date.now());
                loadCustomerOrders(selectedTable, customerInfo.phone);
              }
              
            } catch (error) {
              console.error('❌ DigitalMenu: WebSocket message error:', error);
            }
          };
          
          websocket.onerror = (error) => {
            console.error('❌ DigitalMenu: WebSocket error:', error);
          };
          
          websocket.onclose = (event) => {
            console.log('🔌 DigitalMenu: WebSocket disconnected');
            wsRef.current = null;
            
            // Attempt reconnect after delay
            setTimeout(() => {
              if (isCustomerView && selectedTable && customerInfo) {
                console.log('🔄 DigitalMenu: Attempting WebSocket reconnection...');
                setupWebSocket();
              }
            }, 3000);
          };
          
        } catch (error) {
          console.error('❌ DigitalMenu: WebSocket setup failed:', error);
        }
      };
      
      setupWebSocket();
      
      // Set up periodic refresh as backup
      orderRefreshRef.current = setInterval(() => {
        console.log('🔄 DigitalMenu: Periodic order refresh for customer:', customerInfo.phone);
        loadCustomerOrders(selectedTable, customerInfo.phone);
      }, 8000);
      
      // Load initial orders
      loadCustomerOrders(selectedTable, customerInfo.phone);
      
      return () => {
        console.log('🔌 DigitalMenu: Cleaning up WebSocket and intervals');
        if (wsRef.current) {
          wsRef.current.close();
        }
        if (orderRefreshRef.current) {
          clearInterval(orderRefreshRef.current);
        }
      };
    }
  }, [isCustomerView, selectedTable, customerInfo]);

  // Table detection from URL - IMPROVED
  useEffect(() => {
    const detectTableFromURL = () => {
      console.log('🔄 DigitalMenu: Detecting table from URL...');
      
      let detectedTable = null;
      
      // Check hash route (/#/menu?table=T01)
      if (window.location.hash) {
        const hashPath = window.location.hash.substring(1);
        if (hashPath.includes('/menu')) {
          const hashParams = new URLSearchParams(hashPath.split('?')[1]);
          detectedTable = hashParams.get('table');
        }
      }
      
      // Check regular query params as fallback
      if (!detectedTable) {
        const urlParams = new URLSearchParams(window.location.search);
        detectedTable = urlParams.get('table');
      }

      if (detectedTable) {
        // Clean and format table number
        detectedTable = detectedTable.toString().toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        if (/^T\d+$/.test(detectedTable)) {
          // Already in correct format
        } else if (/^\d+$/.test(detectedTable)) {
          detectedTable = 'T' + detectedTable.padStart(2, '0');
        } else {
          detectedTable = 'T' + detectedTable.replace(/[^0-9]/g, '').padStart(2, '0');
        }
        
        console.log('✅ DigitalMenu: Table detected:', detectedTable);
        setSelectedTable(detectedTable);
        
        // Show registration if no customer info
        if (isCustomerView && !customerInfo) {
          console.log('👤 No customer info, showing registration form');
          setShowRegistration(true);
        } else if (isCustomerView && customerInfo) {
          console.log('👤 Customer found, loading their orders:', customerInfo.phone);
          // Load orders for existing customer
          loadCustomerOrders(detectedTable, customerInfo.phone);
        }
        
      } else {
        console.log('❌ DigitalMenu: No table detected in URL');
        setSelectedTable('');
        setTableOrders([]);
        setDebugInfo('No table detected. Please scan QR code again.');
      }
    };

    if (isCustomerView) {
      detectTableFromURL();
      
      const handleHashChange = () => {
        console.log('🔗 DigitalMenu: Hash changed, detecting table...');
        detectTableFromURL();
      };
      
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }
  }, [isCustomerView, customerInfo]);

  // Load orders for specific customer at table - IMPROVED
  const loadCustomerOrders = async (tableNumber, customerPhone) => {
    if (!tableNumber || !customerPhone) {
      console.log('❌ DigitalMenu: Missing table or customer phone');
      setDebugInfo('Missing table or customer information');
      return;
    }
    
    try {
      setIsLoading(true);
      const debugMsg = `Loading orders for ${customerInfo?.name || 'customer'} (${customerPhone}) at table ${tableNumber}`;
      setDebugInfo(debugMsg);
      console.log('📦 DigitalMenu:', debugMsg);
      
      const response = await fetch('https://restaurant-saas-backend-hbdz.onrender.com/api/orders');
      
      if (response.ok) {
        const allOrders = await response.json();
        console.log('📊 DigitalMenu: Received', allOrders.length, 'total orders from backend');
        
        // Debug: Log all orders to see what's available
        console.log('🔍 All orders for debugging:', allOrders);
        
        // Filter orders for this specific customer at this table
        const filteredOrders = allOrders.filter(order => {
          if (!order) return false;
          
          // Check table match
          const orderTableId = (order.tableId || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, '');
          const orderTable = (order.table || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, '');
          const targetTable = tableNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
          
          const tableMatches = orderTableId === targetTable || orderTable === targetTable;
          
          // Check customer phone match
          const orderCustomerPhone = (order.customerPhone || '').toString().trim();
          const phoneMatches = orderCustomerPhone === customerPhone;
          
          console.log(`🔍 Order ${order.orderNumber}: tableMatches=${tableMatches}, phoneMatches=${phoneMatches}, customerPhone=${orderCustomerPhone}`);
          
          return tableMatches && phoneMatches;
        });
        
        console.log('🎯 DigitalMenu: Found', filteredOrders.length, 'orders for customer', customerPhone, 'at table', tableNumber);
        console.log('📝 Filtered orders:', filteredOrders);
        
        // Sort by creation date (newest first)
        const sortedOrders = filteredOrders.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.updatedAt || a.timestamp || 0);
          const dateB = new Date(b.createdAt || b.updatedAt || b.timestamp || 0);
          return dateB - dateA;
        });
        
        setTableOrders(sortedOrders);
        setDebugInfo(`Found ${sortedOrders.length} orders for ${customerInfo?.name || 'you'}. Last update: ${new Date().toLocaleTimeString()}`);
        
      } else {
        console.error('❌ DigitalMenu: Failed to fetch orders, status:', response.status);
        setTableOrders([]);
        setDebugInfo(`Failed to load orders: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ DigitalMenu: Error loading orders:', error);
      setTableOrders([]);
      setDebugInfo(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle customer registration - FIXED
  const handleRegistration = () => {
    const { phone, name } = registrationForm;
    
    if (!phone.trim()) {
      alert('Please enter your phone number to track your order.');
      return;
    }
    
    // Basic phone validation
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      alert('Please enter a valid phone number (at least 10 digits).');
      return;
    }
    
    const customerData = {
      phone: cleanPhone,
      name: name.trim() || 'Guest',
      table: selectedTable,
      registeredAt: new Date().toISOString()
    };
    
    setCustomerInfo(customerData);
    setShowRegistration(false);
    setRegistrationForm({ phone: '', name: '' });
    
    console.log('✅ Customer registered:', customerData);
    
    // Load orders for this customer
    loadCustomerOrders(selectedTable, cleanPhone);
  };

  // Clear customer info (logout) - FIXED
  const handleClearCustomer = () => {
    console.log('🔄 Clearing customer info...');
    setCustomerInfo(null);
    setTableOrders([]);
    localStorage.removeItem('restaurantCustomer');
    setShowRegistration(true);
    console.log('✅ Customer info cleared');
  };

  // Add to cart function
  const addToCart = (item) => {
    if (!customerInfo) {
      setShowRegistration(true);
      return;
    }
    
    console.log('➕ Adding to cart:', item.name);
    
    const cartItem = {
      id: item.id || item._id,
      _id: item._id || item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      category: item.category,
      description: item.description
    };

    const existingItemIndex = cart.findIndex(cartItem => 
      cartItem.id === (item.id || item._id)
    );
    
    if (existingItemIndex !== -1) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: updatedCart[existingItemIndex].quantity + 1
      };
      setCart(updatedCart);
    } else {
      setCart([...cart, cartItem]);
    }
  };

  // Remove from cart
  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // Update quantity
  const updateQuantity = (id, change) => {
    const updatedCart = cart.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(0, item.quantity + change) }
        : item
    ).filter(item => item.quantity > 0);
    
    setCart(updatedCart);
  };

  // Place order function - FIXED to include customer info
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty. Please add some items first.');
      return;
    }

    if (!selectedTable) {
      alert('Table number not detected. Please scan the QR code again.');
      return;
    }

    if (!customerInfo) {
      alert('Please register with your phone number to place an order.');
      setShowRegistration(true);
      return;
    }

    console.log('🛒 DigitalMenu: Placing order for:', customerInfo.name, 'at table:', selectedTable);
    console.log('📦 Order items:', cart);
    console.log('👤 Customer info:', customerInfo);

    try {
      const orderData = {
        items: cart.map(item => ({
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category
        })),
        customerPhone: customerInfo.phone,
        customerName: customerInfo.name,
        tableId: selectedTable,
        type: 'dine-in'
      };

      console.log('📤 Sending order data to backend:', orderData);

      // Call onCreateOrder with customer info - THIS IS THE KEY FIX
      const result = await onCreateOrder(
        selectedTable, 
        orderData.items, 
        'dine-in', 
        { customerPhone: customerInfo.phone, customerName: customerInfo.name }
      );
      
      if (result && result.success !== false) {
        setCart([]);
        setCartOpen(false);
        
        const orderNumber = result.orderNumber || result.data?.orderNumber || 'N/A';
        alert(`Order placed successfully, ${customerInfo.name}! Order number: ${orderNumber}\n\nYou can track your order status by scanning the QR code again.`);
        
        // Reload orders to show the new order immediately
        setTimeout(() => {
          loadCustomerOrders(selectedTable, customerInfo.phone);
        }, 2000);
        
      } else {
        throw new Error(result?.message || 'Failed to place order');
      }
      
    } catch (error) {
      console.error('❌ DigitalMenu: Order failed:', error);
      alert('Failed to place order: ' + (error.message || 'Unknown error. Please try again.'));
    }
  };

  // Get status display with colors and icons
  const getStatusDisplay = (status) => {
    const statusConfig = {
      'pending': { label: 'Pending', color: '#f59e0b', icon: '⏳', bgColor: '#fffbeb' },
      'preparing': { label: 'Preparing', color: '#3b82f6', icon: '👨‍🍳', bgColor: '#eff6ff' },
      'ready': { label: 'Ready', color: '#10b981', icon: '✅', bgColor: '#ecfdf5' },
      'completed': { label: 'Completed', color: '#6b7280', icon: '📦', bgColor: '#f9fafb' },
      'served': { label: 'Served', color: '#6b7280', icon: '🍽️', bgColor: '#f9fafb' }
    };
    
    const config = statusConfig[status] || { label: status, color: '#6b7280', icon: '❓', bgColor: '#f9fafb' };
    
    return (
      <span 
        className="status-badge"
        style={{ 
          backgroundColor: config.bgColor,
          color: config.color,
          border: `1px solid ${config.color}20`
        }}
      >
        {config.icon} {config.label}
      </span>
    );
  };

  // Format order items for display
  const formatOrderItems = (items) => {
    if (!items || items.length === 0) return 'No items';
    
    const itemList = items.map(item => {
      const itemName = item.name || 'Unknown Item';
      const quantity = item.quantity || 1;
      return `${itemName} x${quantity}`;
    });
    
    if (itemList.length <= 3) {
      return itemList.join(', ');
    } else {
      return `${itemList.slice(0, 3).join(', ')} and ${itemList.length - 3} more...`;
    }
  };

  // Get active orders (pending, preparing, ready)
  const getActiveOrders = () => {
    return tableOrders.filter(order => 
      order && ['pending', 'preparing', 'ready'].includes(order.status)
    );
  };

  // Get completed orders
  const getCompletedOrders = () => {
    return tableOrders.filter(order => 
      order && ['completed', 'served'].includes(order.status)
    );
  };

  // Debug Info Component
  const DebugInfo = () => {
    if (!isCustomerView) return null;
    
    const activeOrders = getActiveOrders();
    const completedOrders = getCompletedOrders();
    
    return (
      <div className="debug-info">
        <strong>Customer:</strong> {customerInfo?.name || 'Not registered'} | 
        <strong> Phone:</strong> {customerInfo?.phone || 'None'} | 
        <strong> Table:</strong> {selectedTable || 'None'} | 
        <strong> Orders:</strong> {activeOrders.length} active, {completedOrders.length} completed |
        <strong> Last Update:</strong> {new Date().toLocaleTimeString()}
      </div>
    );
  };

  // Customer Registration Form
  const RegistrationForm = () => {
    if (!showRegistration) return null;

    return (
      <div className="registration-overlay">
        <div className="registration-form">
          <div className="registration-header">
            <h2>Welcome to Table {selectedTable}! 🎉</h2>
            <p>Enter your details to track your order</p>
          </div>
          
          <div className="form-group">
            <label>📱 Phone Number *</label>
            <input
              type="tel"
              placeholder="e.g., 0123456789"
              value={registrationForm.phone}
              onChange={(e) => setRegistrationForm({...registrationForm, phone: e.target.value})}
              className="form-input"
            />
            <small>Required to track your order status</small>
          </div>
          
          <div className="form-group">
            <label>👤 Your Name (Optional)</label>
            <input
              type="text"
              placeholder="e.g., John"
              value={registrationForm.name}
              onChange={(e) => setRegistrationForm({...registrationForm, name: e.target.value})}
              className="form-input"
            />
            <small>So we can personalize your experience</small>
          </div>
          
          <div className="registration-actions">
            <button 
              onClick={handleRegistration}
              className="register-btn"
              disabled={!registrationForm.phone.trim()}
            >
              Start Ordering ✅
            </button>
            <button 
              onClick={() => setShowRegistration(false)}
              className="skip-btn"
            >
              Maybe Later
            </button>
          </div>
          
          <div className="registration-benefits">
            <h4>Why register? 🤔</h4>
            <ul>
              <li>📱 <strong>Track your order</strong> in real-time</li>
              <li>🔔 <strong>Get notifications</strong> when order is ready</li>
              <li>👤 <strong>Personalized service</strong> from our staff</li>
              <li>📊 <strong>See only your orders</strong> - no confusion with others</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // Orders History Section - CUSTOMER SPECIFIC
  const OrdersHistorySection = () => {
    if (!selectedTable || !customerInfo) return null;

    const activeOrders = getActiveOrders();
    const completedOrders = getCompletedOrders();
    const allOrders = [...activeOrders, ...completedOrders];

    return (
      <div className="orders-history-section">
        <div className="orders-header">
          <div>
            <h3>📋 Your Orders - Table {selectedTable}</h3>
            <p className="customer-greeting">Hello, {customerInfo.name}! 👋</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ 
              fontSize: '0.7rem', 
              color: wsRef.current ? '#10b981' : '#dc2626',
              background: wsRef.current ? '#ecfdf5' : '#fef2f2',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              border: `1px solid ${wsRef.current ? '#a7f3d0' : '#fecaca'}`
            }}>
              {wsRef.current ? '🟢 LIVE' : '🔴 OFFLINE'}
            </span>
            <button 
              onClick={() => loadCustomerOrders(selectedTable, customerInfo.phone)}
              disabled={isLoading}
              className="refresh-orders-btn"
              title="Refresh orders"
            >
              {isLoading ? '🔄' : '🔄'}
            </button>
            <button 
              onClick={handleClearCustomer}
              className="logout-btn"
              title="Switch customer"
            >
              🔄
            </button>
          </div>
        </div>
        
        <DebugInfo />
        
        {isLoading ? (
          <div className="orders-loading">
            <p>Loading your orders...</p>
          </div>
        ) : allOrders.length === 0 ? (
          <div className="no-orders">
            <p>No orders found for {customerInfo.name}</p>
            <small>Your orders will appear here once placed</small>
            <br />
            <small className="debug-hint">You will only see YOUR orders, not others at this table</small>
          </div>
        ) : (
          <>
            {/* Active Orders */}
            {activeOrders.length > 0 && (
              <div className="orders-active">
                <h4>🟡 Active Orders ({activeOrders.length})</h4>
                <div className="orders-list">
                  {activeOrders.map((order, index) => (
                    <div key={order._id || index} className={`order-card ${order.status}`}>
                      <div className="order-header">
                        <span className="order-number">Order #{order.orderNumber}</span>
                        {getStatusDisplay(order.status)}
                      </div>
                      <div className="order-items">
                        {formatOrderItems(order.items)}
                      </div>
                      <div className="order-meta">
                        <span className="order-time">
                          Ordered: {new Date(order.createdAt || order.timestamp).toLocaleTimeString()}
                        </span>
                        {order.status === 'pending' && (
                          <span className="order-note">Order received, waiting for kitchen confirmation</span>
                        )}
                        {order.status === 'preparing' && (
                          <span className="order-note">👨‍🍳 Kitchen is preparing your order</span>
                        )}
                        {order.status === 'ready' && (
                          <span className="order-note ready">🎉 Your order is ready for serving!</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Completed Orders */}
            {completedOrders.length > 0 && (
              <div className="orders-completed">
                <h4>✅ Order History ({completedOrders.length})</h4>
                <div className="orders-list">
                  {completedOrders.map((order, index) => (
                    <div key={order._id || index} className={`order-card ${order.status}`}>
                      <div className="order-header">
                        <span className="order-number">Order #{order.orderNumber}</span>
                        {getStatusDisplay(order.status)}
                      </div>
                      <div className="order-items">
                        {formatOrderItems(order.items)}
                      </div>
                      <div className="order-meta">
                        <span className="order-time">
                          {order.status === 'completed' ? 'Completed' : 'Served'}: {new Date(order.updatedAt || order.createdAt || order.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="order-note">
                          Total: RM {(order.total || order.items?.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0) || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Refresh reminder */}
            <div className="refresh-orders">
              <small style={{ color: '#666', display: 'block', marginBottom: '0.5rem' }}>
                💡 Orders update automatically. Last refresh: {new Date().toLocaleTimeString()}
              </small>
              <button 
                onClick={() => loadCustomerOrders(selectedTable, customerInfo.phone)}
                disabled={isLoading}
                className="refresh-btn"
              >
                {isLoading ? 'Refreshing...' : 'Refresh Now'}
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  // Table Status Component
  const TableStatus = () => {
    if (!selectedTable) {
      return (
        <div className="table-error">
          <div className="error-icon">⚠️</div>
          <div className="error-text">
            <strong>Table not detected</strong>
            <small>Please scan the QR code again</small>
          </div>
        </div>
      );
    }
    
    if (!customerInfo) {
      return (
        <div className="table-warning">
          <div className="warning-icon">📱</div>
          <div className="warning-text">
            <strong>Table {selectedTable}</strong>
            <small>Register to start ordering</small>
          </div>
        </div>
      );
    }
    
    const activeOrders = getActiveOrders();
    const activeOrderCount = activeOrders.length;
    
    return (
      <div className="table-success">
        <div className="success-icon">✅</div>
        <div className="success-text">
          <strong>Table {selectedTable}</strong>
          <small>
            {customerInfo.name} • {isLoading ? 'Checking...' : 
             activeOrderCount > 0 ? `${activeOrderCount} active order(s)` : 'Ready to order'
            }
          </small>
        </div>
      </div>
    );
  };

  // Menu data
  const displayMenu = menu && menu.length > 0 ? menu : [
    { id: '1', name: 'Teh Tarik', price: 4.50, category: 'drinks', description: 'Famous Malaysian pulled tea' },
    { id: '2', name: 'Nasi Lemak', price: 12.90, category: 'main', description: 'Coconut rice with sambal' },
    { id: '3', name: 'Roti Canai', price: 3.50, category: 'main', description: 'Flaky flatbread with curry' },
    { id: '4', name: 'Cendol', price: 6.90, category: 'desserts', description: 'Shaved ice dessert' }
  ];

  // Categories
  const categories = ['all', ...new Set(displayMenu.map(item => item.category))];
  
  // Filtered items
  const filteredItems = displayMenu.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Cart totals
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // CUSTOMER VIEW
  if (isCustomerView) {
    return (
      <div className="simple-customer-view">
        {/* Registration Form Overlay */}
        <RegistrationForm />

        {/* Header */}
        <header className="simple-header">
          <h1>FlavorFlow</h1>
          <div className="header-actions">
            <TableStatus />
            <button 
              className="cart-button"
              onClick={() => {
                if (!customerInfo) {
                  setShowRegistration(true);
                  return;
                }
                setCartOpen(true);
              }}
              disabled={!selectedTable || !customerInfo}
            >
              Cart ({itemCount})
            </button>
          </div>
        </header>

        {/* Show warning if no table detected */}
        {!selectedTable && (
          <div className="warning-banner">
            <p>📱 Please scan your table's QR code to start ordering</p>
          </div>
        )}

        {/* Welcome back banner if returning customer */}
        {selectedTable && customerInfo && tableOrders.length > 0 && (
          <div className="welcome-back-banner">
            <p>Welcome back, {customerInfo.name}! 🎉</p>
          </div>
        )}

        {/* Orders History Section */}
        {selectedTable && customerInfo && <OrdersHistorySection />}

        {/* Search */}
        <div className="simple-search">
          <input
            type="text"
            placeholder="Search menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            disabled={!selectedTable || !customerInfo}
          />
        </div>

        {/* Categories */}
        <div className="simple-categories">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
              disabled={!selectedTable || !customerInfo}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {/* Menu Items */}
        <div className="simple-menu">
          {!selectedTable ? (
            <div className="disabled-overlay">
              <div className="disabled-message">
                <div className="message-icon">📱</div>
                <h3>Scan QR Code to Order</h3>
                <p>Please scan your table's QR code to view the menu and place orders</p>
              </div>
            </div>
          ) : !customerInfo ? (
            <div className="disabled-overlay">
              <div className="disabled-message">
                <div className="message-icon">👤</div>
                <h3>Register to Order</h3>
                <p>Please register with your phone number to start ordering</p>
                <button 
                  onClick={() => setShowRegistration(true)}
                  className="register-prompt-btn"
                >
                  Register Now
                </button>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="no-items">
              <p>No items found. Try a different search or category.</p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} className="menu-item">
                <div className="item-info">
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <div className="item-price">RM {item.price.toFixed(2)}</div>
                </div>
                <button 
                  className="add-btn"
                  onClick={() => addToCart(item)}
                >
                  Add +
                </button>
              </div>
            ))
          )}
        </div>

        {/* Cart */}
        {cartOpen && (
          <div className="simple-cart-overlay" onClick={() => setCartOpen(false)}>
            <div className="simple-cart" onClick={(e) => e.stopPropagation()}>
              <div className="cart-header">
                <h2>Your Order - Table {selectedTable}</h2>
                <button onClick={() => setCartOpen(false)}>Close</button>
              </div>
              
              {customerInfo && (
                <div className="customer-info-banner">
                  Ordering as: <strong>{customerInfo.name}</strong> ({customerInfo.phone})
                </div>
              )}
              
              {cart.length === 0 ? (
                <p>Your cart is empty</p>
              ) : (
                <>
                  <div className="cart-items">
                    {cart.map(item => (
                      <div key={item.id} className="cart-item">
                        <div className="item-details">
                          <strong>{item.name}</strong>
                          <div>Qty: {item.quantity}</div>
                          <div>RM {item.price.toFixed(2)} each</div>
                        </div>
                        <div className="item-controls">
                          <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                          <button 
                            className="remove-btn"
                            onClick={() => removeFromCart(item.id)}
                          >
                            Remove
                          </button>
                        </div>
                        <div className="item-total">
                          RM {(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="cart-total">
                    <strong>Total: RM {total.toFixed(2)}</strong>
                  </div>
                  
                  <button 
                    className="place-order-btn"
                    onClick={handlePlaceOrder}
                  >
                    Place Order for {customerInfo?.name || 'You'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Mobile Cart Button */}
        {isMobile && cart.length > 0 && !cartOpen && selectedTable && customerInfo && (
          <button 
            className="mobile-cart-btn"
            onClick={() => setCartOpen(true)}
          >
            View Cart ({itemCount}) - RM {total.toFixed(2)}
          </button>
        )}
      </div>
    );
  }

  // ADMIN VIEW (unchanged)
  return (
    <div className="simple-admin-view">
      <h2>Menu Management - Staff View</h2>
      <div className="admin-controls">
        <select 
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
        >
          <option value="">Select Table</option>
          <option value="T01">Table T01</option>
          <option value="T02">Table T02</option>
          <option value="T03">Table T03</option>
          <option value="T04">Table T04</option>
          <option value="T05">Table T05</option>
          <option value="T06">Table T06</option>
          <option value="T07">Table T07</option>
          <option value="T08">Table T08</option>
        </select>
        
        <div className="table-display">
          Current Table: <strong>{selectedTable || 'None selected'}</strong>
        </div>
      </div>
      
      <div className="simple-menu">
        {displayMenu.map(item => (
          <div key={item.id} className="menu-item">
            <div className="item-info">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <div className="item-price">RM {item.price.toFixed(2)}</div>
            </div>
            <button 
              className="add-btn"
              onClick={() => addToCart(item)}
            >
              Add +
            </button>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="admin-cart">
          <h3>Current Order ({itemCount} items) - Table {selectedTable}</h3>
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <span>{item.name} x {item.quantity}</span>
                <span>RM {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="cart-total">Total: RM {total.toFixed(2)}</div>
          <button 
            className="place-order-btn"
            onClick={handlePlaceOrder}
            disabled={!selectedTable}
          >
            {selectedTable ? `Place Order for Table ${selectedTable}` : 'Select a table first'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DigitalMenu;