import React, { useState, useEffect } from 'react';
import './DigitalMenu.css';

const DigitalMenu = ({ cart, setCart, onCreateOrder, isMobile, menu, apiConnected, currentTable, isCustomerView = false }) => {
  const [selectedTable, setSelectedTable] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [previousOrders, setPreviousOrders] = useState([]);
  const [showPreviousOrders, setShowPreviousOrders] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // FIXED: Enhanced table detection
  useEffect(() => {
    const detectTableFromURL = () => {
      console.log('🔄 DigitalMenu: Detecting table from URL...');
      
      let detectedTable = null;
      
      // Check URL search params first
      const urlParams = new URLSearchParams(window.location.search);
      detectedTable = urlParams.get('table');
      console.log('📱 URL Search Params table:', detectedTable);

      // Check hash if not found in search params
      if (!detectedTable && window.location.hash) {
        const hashContent = window.location.hash.replace('#', '');
        console.log('📱 Hash content:', hashContent);
        
        if (hashContent.includes('table=')) {
          const hashMatch = hashContent.match(/table=([^&]+)/);
          detectedTable = hashMatch ? hashMatch[1] : null;
        } else if (hashContent.includes('/menu')) {
          const hashParams = new URLSearchParams(hashContent.split('?')[1]);
          detectedTable = hashParams.get('table');
        } else {
          detectedTable = hashContent;
        }
      }

      // Clean and validate table number
      if (detectedTable) {
        detectedTable = detectedTable.toString().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        if (/^\d+$/.test(detectedTable)) {
          detectedTable = 'T' + detectedTable;
        }
        
        console.log('✅ DigitalMenu: Final table detected:', detectedTable);
        setSelectedTable(detectedTable);
        
      } else {
        console.log('❌ DigitalMenu: No table detected in URL');
        setSelectedTable('');
      }
    };

    if (isCustomerView) {
      console.log('👤 DigitalMenu: Customer view activated');
      detectTableFromURL();
      window.addEventListener('hashchange', detectTableFromURL);
      return () => window.removeEventListener('hashchange', detectTableFromURL);
    }
  }, [isCustomerView]);

  // FIXED: Enhanced order loading
  useEffect(() => {
    if (selectedTable && isCustomerView) {
      console.log('📦 DigitalMenu: Loading orders for table:', selectedTable);
      setIsLoading(true);
      
      // Load from localStorage first
      loadPreviousOrders(selectedTable);
      
      // Then try to sync with backend
      setTimeout(() => {
        syncWithBackendOrders(selectedTable);
      }, 500);
    } else {
      setPreviousOrders([]);
      setShowPreviousOrders(false);
    }
  }, [selectedTable, isCustomerView]);

  // NEW: Enhanced sync with backend orders
  const syncWithBackendOrders = async (tableNumber) => {
    try {
      console.log('🔄 DigitalMenu: Syncing with backend orders for table:', tableNumber);
      
      const response = await fetch(`https://restaurant-saas-backend-hbdz.onrender.com/api/orders`);
      if (response.ok) {
        const allOrders = await response.json();
        console.log('📊 DigitalMenu: All backend orders:', allOrders.length);
        
        // Filter orders for this table (case insensitive)
        const tableOrders = allOrders.filter(order => {
          if (!order.table) return false;
          const orderTable = order.table.toString().toUpperCase().replace(/[^A-Z0-9]/g, '');
          const targetTable = tableNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
          return orderTable === targetTable;
        });
        
        console.log('📊 DigitalMenu: Backend orders for table', tableNumber, ':', tableOrders.length);
        
        if (tableOrders.length > 0) {
          // Convert backend orders to local format
          const localOrders = tableOrders.map(order => ({
            orderNumber: order.orderNumber || order._id || `ORDER_${Date.now()}`,
            items: order.items || [],
            total: order.totalAmount || (order.items ? order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0),
            timestamp: order.createdAt || order.updatedAt || new Date().toISOString(),
            table: order.table
          }));
          
          console.log('💾 DigitalMenu: Converted backend orders:', localOrders);
          
          // Get existing localStorage orders
          const storageKey = `flavorflow_orders_${tableNumber}`;
          const existingOrders = JSON.parse(localStorage.getItem(storageKey) || '[]');
          
          // Merge orders, avoiding duplicates
          const mergedOrders = [...localOrders];
          existingOrders.forEach(existingOrder => {
            if (!mergedOrders.some(order => order.orderNumber === existingOrder.orderNumber)) {
              mergedOrders.push(existingOrder);
            }
          });
          
          // Sort by timestamp (newest first) and keep only last 10
          const sortedOrders = mergedOrders
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);
          
          // Save to localStorage
          localStorage.setItem(storageKey, JSON.stringify(sortedOrders));
          
          console.log('💾 DigitalMenu: Saved merged orders to localStorage:', sortedOrders.length, 'orders');
          
          // Update state
          setPreviousOrders(sortedOrders);
          setShowPreviousOrders(sortedOrders.length > 0);
        }
      }
    } catch (error) {
      console.log('⚠️ DigitalMenu: Could not sync with backend orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // FIXED: Enhanced order loading from localStorage
  const loadPreviousOrders = (tableNumber) => {
    try {
      console.log('🔍 DigitalMenu: Checking localStorage for table:', tableNumber);
      const storageKey = `flavorflow_orders_${tableNumber}`;
      const storedOrders = localStorage.getItem(storageKey);
      
      if (storedOrders) {
        const orders = JSON.parse(storedOrders);
        console.log('📦 DigitalMenu: Loaded previous orders from localStorage:', orders.length, 'orders');
        
        if (orders.length > 0) {
          setPreviousOrders(orders);
          setShowPreviousOrders(true);
          
          console.log('🎉 DigitalMenu: Found orders in localStorage:', orders);
        } else {
          console.log('📦 DigitalMenu: No orders in localStorage for table:', tableNumber);
          setPreviousOrders([]);
          setShowPreviousOrders(false);
        }
      } else {
        console.log('📦 DigitalMenu: No localStorage data for table:', tableNumber);
        setPreviousOrders([]);
        setShowPreviousOrders(false);
      }
    } catch (error) {
      console.error('❌ DigitalMenu: Error loading previous orders:', error);
      setPreviousOrders([]);
      setShowPreviousOrders(false);
    }
  };

  // FIXED: Enhanced order saving - CRITICAL FIX
  const saveOrderToHistory = (tableNumber, orderData, orderNumber) => {
    try {
      console.log('💾 DigitalMenu: SAVING ORDER TO HISTORY - Table:', tableNumber, 'Order:', orderNumber, 'Items:', orderData.length);
      
      const orderRecord = {
        orderNumber: orderNumber || `LOCAL_${Date.now()}`,
        items: orderData.map(item => ({
          menuItemId: item.menuItemId || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category
        })),
        total: orderData.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        timestamp: new Date().toISOString(),
        table: tableNumber
      };

      const storageKey = `flavorflow_orders_${tableNumber}`;
      const existingOrders = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      console.log('💾 DigitalMenu: Existing orders before save:', existingOrders.length);
      
      // Check if this order already exists
      const orderExists = existingOrders.some(order => order.orderNumber === orderRecord.orderNumber);
      
      if (!orderExists) {
        const updatedOrders = [orderRecord, ...existingOrders].slice(0, 10);
        localStorage.setItem(storageKey, JSON.stringify(updatedOrders));
        
        console.log('💾 DigitalMenu: SUCCESS - Saved NEW order to localStorage:', orderRecord);
        console.log('💾 DigitalMenu: Total orders now:', updatedOrders.length);
        console.log('💾 DigitalMenu: Storage key used:', storageKey);
        
        // Update state immediately
        setPreviousOrders(updatedOrders);
        setShowPreviousOrders(true);
        
        // Verify the save
        const verify = localStorage.getItem(storageKey);
        console.log('💾 DigitalMenu: Verification - stored data:', verify ? JSON.parse(verify).length + ' orders' : 'NOT FOUND');
      } else {
        console.log('ℹ️ DigitalMenu: Order already exists in history:', orderRecord.orderNumber);
      }
      
    } catch (error) {
      console.error('❌ DigitalMenu: ERROR saving order history:', error);
    }
  };

  // NEW: Enhanced debug function
  const debugStoredOrders = () => {
    console.log('🔍 DigitalMenu: === DEBUG STORED ORDERS ===');
    console.log('📊 Current State:', {
      selectedTable,
      previousOrders: previousOrders.length,
      showPreviousOrders,
      isLoading
    });
    
    // Check all flavorflow storage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('flavorflow_orders_')) {
        try {
          const value = JSON.parse(localStorage.getItem(key));
          console.log(`📁 ${key}:`, value.length, 'orders', value);
        } catch (e) {
          console.log(`📁 ${key}: RAW:`, localStorage.getItem(key));
        }
      }
    }
    
    // Check current table specifically
    if (selectedTable) {
      const currentKey = `flavorflow_orders_${selectedTable}`;
      const currentData = localStorage.getItem(currentKey);
      console.log(`🎯 Current table ${selectedTable} storage:`, currentData ? JSON.parse(currentData).length + ' orders' : 'EMPTY');
    }
    
    alert('Debug information logged to console. Check browser developer tools.');
  };

  // NEW: Test order creation
  const createTestOrder = () => {
    if (!selectedTable) {
      alert('Please select a table first');
      return;
    }
    
    const testOrder = {
      orderNumber: `TEST_${Date.now()}`,
      items: [
        { name: 'Test Item 1', price: 10.50, quantity: 2, category: 'test' },
        { name: 'Test Item 2', price: 8.75, quantity: 1, category: 'test' }
      ],
      total: 29.75,
      timestamp: new Date().toISOString(),
      table: selectedTable
    };
    
    const storageKey = `flavorflow_orders_${selectedTable}`;
    const existingOrders = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const updatedOrders = [testOrder, ...existingOrders].slice(0, 10);
    
    localStorage.setItem(storageKey, JSON.stringify(updatedOrders));
    setPreviousOrders(updatedOrders);
    setShowPreviousOrders(true);
    
    console.log('🧪 TEST: Created test order:', testOrder);
    alert('Test order created! Check order history.');
  };

  // Quick reorder functionality
  const quickReorder = (previousOrder) => {
    if (!selectedTable) {
      alert('Please scan the QR code first to detect your table.');
      return;
    }

    console.log('🔄 DigitalMenu: Quick reorder for order:', previousOrder.orderNumber);
    
    setCart([]);
    
    setTimeout(() => {
      const newCart = previousOrder.items.map(item => ({
        id: item.menuItemId || item.id || `item_${Date.now()}_${Math.random()}`,
        _id: item.menuItemId || item.id || `item_${Date.now()}_${Math.random()}`,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category
      }));
      
      setCart(newCart);
      setCartOpen(true);
      
      window.scrollTo(0, 0);
      console.log('🔄 DigitalMenu: Reordered items:', newCart.length, 'items');
    }, 100);
  };

  // FIXED: Enhanced add to cart
  const addToCart = (item) => {
    console.log('➕ DigitalMenu: Adding to cart:', item.name);
    
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

  // FIXED: Remove from cart
  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // FIXED: Update quantity
  const updateQuantity = (id, change) => {
    const updatedCart = cart.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(0, item.quantity + change) }
        : item
    ).filter(item => item.quantity > 0);
    
    setCart(updatedCart);
  };

  // FIXED: Enhanced place order - ENSURES ORDER IS SAVED
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty. Please add some items first.');
      return;
    }

    if (!selectedTable) {
      alert('Table number not detected. Please scan the QR code again.\n\nIf this continues, please contact staff for assistance.');
      return;
    }

    console.log('🛒 DigitalMenu: Placing order for table:', selectedTable, 'Items:', cart.length);

    try {
      const orderData = cart.map(item => ({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category
      }));

      let result;
      if (onCreateOrder) {
        result = await onCreateOrder(selectedTable, orderData, 'dine-in');
      } else {
        // Fallback for demo
        result = { orderNumber: `DEMO_${Date.now()}` };
      }
      
      console.log('🛒 DigitalMenu: Backend order result:', result);
      
      // CRITICAL: Save to localStorage with the actual order number from backend
      saveOrderToHistory(selectedTable, orderData, result.orderNumber);
      
      setCart([]);
      setCartOpen(false);
      
      alert(`Order placed successfully for Table ${selectedTable}! Order number: ${result.orderNumber || 'N/A'}`);
      
    } catch (error) {
      console.error('❌ DigitalMenu: Order failed:', error);
      alert('Failed to place order: ' + (error.message || 'Unknown error'));
    }
  };

  // View previous order details
  const viewPreviousOrderDetails = (previousOrder) => {
    const orderDetails = previousOrder.items.map(item => 
      `• ${item.name} x${item.quantity} - RM ${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');
    
    alert(`Order #${previousOrder.orderNumber}\n\nItems:\n${orderDetails}\n\nTotal: RM ${previousOrder.total.toFixed(2)}\nDate: ${new Date(previousOrder.timestamp).toLocaleString()}`);
  };

  // Simple menu data fallback
  const displayMenu = menu && menu.length > 0 ? menu : [
    { id: '1', name: 'Teh Tarik', price: 4.50, category: 'drinks', description: 'Famous Malaysian pulled tea' },
    { id: '2', name: 'Nasi Lemak', price: 12.90, category: 'main', description: 'Coconut rice with sambal' },
    { id: '3', name: 'Roti Canai', price: 3.50, category: 'main', description: 'Flaky flatbread with curry' },
    { id: '4', name: 'Cendol', price: 6.90, category: 'desserts', description: 'Shaved ice dessert' }
  ];

  // Simple categories
  const categories = ['all', ...new Set(displayMenu.map(item => item.category))];
  
  // Simple filtered items
  const filteredItems = displayMenu.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Simple totals
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // FIXED: Show table detection status
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
    
    return (
      <div className="table-success">
        <div className="success-icon">✅</div>
        <div className="success-text">
          <strong>Table {selectedTable}</strong>
          <small>
            {isLoading ? 'Loading...' : 
             previousOrders.length > 0 ? `${previousOrders.length} previous order(s)` : 'Ready to order'
            }
          </small>
        </div>
      </div>
    );
  };

  // FIXED: Enhanced Previous Orders Component
  const PreviousOrdersSection = () => {
    if (!selectedTable) return null;

    return (
      <div className="previous-orders-section">
        <div className="previous-orders-header">
          <h3>
            {isLoading ? '⏳ Loading...' : `📋 Order History - Table ${selectedTable}`}
            {previousOrders.length > 0 && ` (${previousOrders.length})`}
          </h3>
          <div className="order-history-controls">
            {previousOrders.length > 0 && (
              <button 
                className="toggle-orders-btn"
                onClick={() => setShowPreviousOrders(!showPreviousOrders)}
              >
                {showPreviousOrders ? '▲ Hide' : '▼ Show'}
              </button>
            )}
            <button 
              className="debug-btn"
              onClick={debugStoredOrders}
              title="Debug storage"
            >
              🔍
            </button>
            <button 
              className="test-btn"
              onClick={createTestOrder}
              title="Create test order"
            >
              🧪
            </button>
            <button 
              className="refresh-btn"
              onClick={() => selectedTable && (loadPreviousOrders(selectedTable), syncWithBackendOrders(selectedTable))}
              title="Refresh orders"
            >
              🔄
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="loading-orders">
            <div className="loading-spinner-small"></div>
            <span>Loading order history...</span>
          </div>
        ) : previousOrders.length === 0 ? (
          <div className="no-previous-orders">
            <p>No previous orders found for this table</p>
            <small>Orders will appear here after you place them</small>
          </div>
        ) : showPreviousOrders && (
          <div className="previous-orders-list">
            {previousOrders.map((order, index) => (
              <div key={index} className="previous-order-card">
                <div className="order-header">
                  <span className="order-number">Order #{order.orderNumber}</span>
                  <span className="order-date">
                    {new Date(order.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div className="order-items">
                  {order.items.slice(0, 3).map((item, itemIndex) => (
                    <span key={itemIndex} className="order-item-tag">
                      {item.name} x{item.quantity}
                    </span>
                  ))}
                  {order.items.length > 3 && (
                    <span className="more-items">+{order.items.length - 3} more</span>
                  )}
                </div>
                <div className="order-footer">
                  <span className="order-total">RM {order.total.toFixed(2)}</span>
                  <div className="order-actions">
                    <button 
                      className="view-order-btn"
                      onClick={() => viewPreviousOrderDetails(order)}
                    >
                      Details
                    </button>
                    <button 
                      className="reorder-btn"
                      onClick={() => quickReorder(order)}
                    >
                      Reorder
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (isLoading && !selectedTable) {
    return (
      <div className="simple-customer-view">
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading your order history...</p>
        </div>
      </div>
    );
  }

  // SIMPLE CUSTOMER VIEW
  if (isCustomerView) {
    return (
      <div className="simple-customer-view">
        {/* Header */}
        <header className="simple-header">
          <h1>FlavorFlow</h1>
          <div className="header-actions">
            <TableStatus />
            <button 
              className="cart-button"
              onClick={() => setCartOpen(true)}
              disabled={!selectedTable}
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

        {/* Show previous orders if available */}
        {selectedTable && <PreviousOrdersSection />}

        {/* Welcome back message */}
        {selectedTable && !isLoading && previousOrders.length > 0 && (
          <div className="welcome-back-banner">
            <p>🎉 Welcome back to Table {selectedTable}! You have {previousOrders.length} previous order(s).</p>
          </div>
        )}

        {/* Search & Categories */}
        <div className="simple-search">
          <input
            type="text"
            placeholder="Search menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            disabled={!selectedTable}
          />
        </div>

        <div className="simple-categories">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
              disabled={!selectedTable}
            >
              {category}
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
                  <div className="item-price">RM {item.price}</div>
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
              
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <p>Your cart is empty</p>
                  {previousOrders.length > 0 && (
                    <button 
                      className="view-previous-orders-btn"
                      onClick={() => setShowPreviousOrders(true)}
                    >
                      View Order History
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="cart-items">
                    {cart.map(item => (
                      <div key={item.id} className="cart-item">
                        <div className="item-details">
                          <strong>{item.name}</strong>
                          <div>Qty: {item.quantity}</div>
                          <div>RM {item.price} each</div>
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
                    Place Order for Table {selectedTable}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Mobile Cart Button */}
        {isMobile && cart.length > 0 && !cartOpen && selectedTable && (
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
              <div className="item-price">RM {item.price}</div>
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