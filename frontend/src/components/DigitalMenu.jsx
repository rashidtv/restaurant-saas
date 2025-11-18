import React, { useState, useEffect } from 'react';
import './DigitalMenu.css';

const DigitalMenu = ({ cart, setCart, onCreateOrder, isMobile, menu, apiConnected, currentTable, isCustomerView = false }) => {
  const [selectedTable, setSelectedTable] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [currentOrders, setCurrentOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Table detection - ORIGINAL WORKING VERSION
  useEffect(() => {
    const detectTableFromURL = () => {
      console.log('🔄 DigitalMenu: Detecting table from URL...');
      
      let detectedTable = null;
      const urlParams = new URLSearchParams(window.location.search);
      detectedTable = urlParams.get('table');

      if (!detectedTable && window.location.hash) {
        const hashContent = window.location.hash.replace('#', '');
        if (hashContent.includes('table=')) {
          const hashMatch = hashContent.match(/table=([^&]+)/);
          detectedTable = hashMatch ? hashMatch[1] : null;
        } else {
          detectedTable = hashContent;
        }
      }

      if (detectedTable) {
        detectedTable = detectedTable.toString().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        if (/^\d+$/.test(detectedTable)) {
          detectedTable = 'T' + detectedTable;
        }
        
        console.log('✅ DigitalMenu: Final table detected:', detectedTable);
        setSelectedTable(detectedTable);
        
        // Load current orders for this table
        loadCurrentOrders(detectedTable);
        
      } else {
        console.log('❌ DigitalMenu: No table detected in URL');
        setSelectedTable('');
        setCurrentOrders([]);
      }
    };

    if (isCustomerView) {
      detectTableFromURL();
      window.addEventListener('hashchange', detectTableFromURL);
      return () => window.removeEventListener('hashchange', detectTableFromURL);
    }
  }, [isCustomerView]);

  // NEW: Load current orders from backend for this specific table
  const loadCurrentOrders = async (tableNumber) => {
    if (!tableNumber) return;
    
    try {
      setIsLoadingOrders(true);
      console.log('📦 DigitalMenu: Loading current orders for table:', tableNumber);
      
      const response = await fetch('https://restaurant-saas-backend-hbdz.onrender.com/api/orders');
      
      if (response.ok) {
        const allOrders = await response.json();
        console.log('📊 DigitalMenu: All orders from backend:', allOrders.length);
        
        // Filter orders for this specific table
        const tableOrders = allOrders.filter(order => {
          if (!order.table) return false;
          const orderTable = order.table.toString().toUpperCase().replace(/[^A-Z0-9]/g, '');
          const targetTable = tableNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
          return orderTable === targetTable;
        });
        
        console.log('📊 DigitalMenu: Orders for table', tableNumber, ':', tableOrders.length);
        
        // Sort by creation date (newest first) and filter out very old completed orders
        const recentOrders = tableOrders
          .filter(order => {
            // Keep orders from last 4 hours or non-completed orders
            if (order.status !== 'completed') return true;
            const orderTime = new Date(order.createdAt || order.timestamp);
            const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
            return orderTime > fourHoursAgo;
          })
          .sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp));
        
        setCurrentOrders(recentOrders);
        console.log('📦 DigitalMenu: Set current orders:', recentOrders.length);
      } else {
        console.error('❌ DigitalMenu: Failed to fetch orders');
        setCurrentOrders([]);
      }
    } catch (error) {
      console.error('❌ DigitalMenu: Error loading current orders:', error);
      setCurrentOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // ORIGINAL: Working order saving
  const saveOrderToHistory = (tableNumber, orderData, orderNumber) => {
    try {
      console.log('💾 DigitalMenu: Saving order to history for table:', tableNumber);
      
      const orderRecord = {
        orderNumber,
        items: orderData,
        total: orderData.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        timestamp: new Date().toISOString(),
        table: tableNumber
      };

      const existingOrders = JSON.parse(localStorage.getItem(`flavorflow_orders_${tableNumber}`) || '[]');
      const updatedOrders = [orderRecord, ...existingOrders].slice(0, 10);
      
      localStorage.setItem(`flavorflow_orders_${tableNumber}`, JSON.stringify(updatedOrders));
      
      console.log('💾 DigitalMenu: Saved order to history');
    } catch (error) {
      console.error('❌ DigitalMenu: Error saving order history:', error);
    }
  };

  // ORIGINAL: Working add to cart
  const addToCart = (item) => {
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

  // ORIGINAL: Working remove from cart
  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // ORIGINAL: Working update quantity
  const updateQuantity = (id, change) => {
    const updatedCart = cart.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(0, item.quantity + change) }
        : item
    ).filter(item => item.quantity > 0);
    
    setCart(updatedCart);
  };

  // ORIGINAL: Working place order
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty. Please add some items first.');
      return;
    }

    if (!selectedTable) {
      alert('Table number not detected. Please scan the QR code again.\n\nIf this continues, please contact staff for assistance.');
      return;
    }

    console.log('🛒 DigitalMenu: Placing order for table:', selectedTable);

    try {
      const orderData = cart.map(item => ({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category
      }));

      const result = await onCreateOrder(selectedTable, orderData, 'dine-in');
      
      setCart([]);
      setCartOpen(false);
      alert(`Order placed successfully for Table ${selectedTable}! Order number: ${result.orderNumber || 'N/A'}`);
      
      // Save to history after successful order
      saveOrderToHistory(selectedTable, orderData, result.orderNumber);
      
      // Reload current orders to show the new order
      loadCurrentOrders(selectedTable);
      
    } catch (error) {
      console.error('❌ DigitalMenu: Order failed:', error);
      alert('Failed to place order: ' + (error.message || 'Unknown error'));
    }
  };

  // NEW: Get status badge with appropriate color and icon
  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { label: 'Pending', color: '#f59e0b', icon: '⏳', bgColor: '#fffbeb' },
      'preparing': { label: 'Preparing', color: '#3b82f6', icon: '👨‍🍳', bgColor: '#eff6ff' },
      'ready': { label: 'Ready', color: '#10b981', icon: '✅', bgColor: '#ecfdf5' },
      'completed': { label: 'Completed', color: '#6b7280', icon: '📦', bgColor: '#f9fafb' }
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

  // NEW: Format order items for display
  const formatOrderItems = (items) => {
    if (!items || items.length === 0) return 'No items';
    
    const itemList = items.slice(0, 3).map(item => 
      `${item.name} x${item.quantity}`
    ).join(', ');
    
    if (items.length > 3) {
      return `${itemList} +${items.length - 3} more`;
    }
    
    return itemList;
  };

  // NEW: Current Orders Section
  const CurrentOrdersSection = () => {
    if (!selectedTable || currentOrders.length === 0) return null;

    // Group orders by status
    const ordersByStatus = {
      'pending': currentOrders.filter(order => order.status === 'pending'),
      'preparing': currentOrders.filter(order => order.status === 'preparing'),
      'ready': currentOrders.filter(order => order.status === 'ready'),
      'completed': currentOrders.filter(order => order.status === 'completed')
    };

    const hasActiveOrders = ordersByStatus.pending.length > 0 || 
                           ordersByStatus.preparing.length > 0 || 
                           ordersByStatus.ready.length > 0;

    return (
      <div className="current-orders-section">
        <h3>📋 Your Orders - Table {selectedTable}</h3>
        
        {hasActiveOrders && (
          <div className="orders-active">
            <h4>🔄 Current Status</h4>
            <div className="orders-grid">
              {/* Pending Orders */}
              {ordersByStatus.pending.map((order, index) => (
                <div key={order._id || index} className="order-card pending">
                  <div className="order-header">
                    <span className="order-number">Order #{order.orderNumber}</span>
                    {getStatusBadge('pending')}
                  </div>
                  <div className="order-items">
                    {formatOrderItems(order.items)}
                  </div>
                  <div className="order-time">
                    Ordered: {new Date(order.createdAt || order.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              
              {/* Preparing Orders */}
              {ordersByStatus.preparing.map((order, index) => (
                <div key={order._id || index} className="order-card preparing">
                  <div className="order-header">
                    <span className="order-number">Order #{order.orderNumber}</span>
                    {getStatusBadge('preparing')}
                  </div>
                  <div className="order-items">
                    {formatOrderItems(order.items)}
                  </div>
                  <div className="order-time">
                    Started: {new Date(order.updatedAt || order.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              
              {/* Ready Orders */}
              {ordersByStatus.ready.map((order, index) => (
                <div key={order._id || index} className="order-card ready">
                  <div className="order-header">
                    <span className="order-number">Order #{order.orderNumber}</span>
                    {getStatusBadge('ready')}
                  </div>
                  <div className="order-items">
                    {formatOrderItems(order.items)}
                  </div>
                  <div className="order-time">
                    Ready at: {new Date(order.updatedAt || order.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Recent Completed Orders */}
        {ordersByStatus.completed.length > 0 && (
          <div className="orders-completed">
            <h4>📦 Recently Served</h4>
            <div className="orders-grid">
              {ordersByStatus.completed.slice(0, 3).map((order, index) => (
                <div key={order._id || index} className="order-card completed">
                  <div className="order-header">
                    <span className="order-number">Order #{order.orderNumber}</span>
                    {getStatusBadge('completed')}
                  </div>
                  <div className="order-items">
                    {formatOrderItems(order.items)}
                  </div>
                  <div className="order-time">
                    Served: {new Date(order.updatedAt || order.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Refresh Button */}
        <div className="refresh-orders">
          <button 
            onClick={() => loadCurrentOrders(selectedTable)}
            disabled={isLoadingOrders}
            className="refresh-btn"
          >
            {isLoadingOrders ? '🔄 Loading...' : '🔄 Refresh Status'}
          </button>
        </div>
      </div>
    );
  };

  // ORIGINAL: Show table detection status
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
    
    const activeOrders = currentOrders.filter(order => 
      order.status === 'pending' || order.status === 'preparing' || order.status === 'ready'
    ).length;
    
    return (
      <div className="table-success">
        <div className="success-icon">✅</div>
        <div className="success-text">
          <strong>Table {selectedTable}</strong>
          <small>
            {isLoadingOrders ? 'Checking orders...' : 
             activeOrders > 0 ? `${activeOrders} active order(s)` : 'Ready to order'
            }
          </small>
        </div>
      </div>
    );
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

        {/* Show current orders if available */}
        {selectedTable && <CurrentOrdersSection />}

        {/* Search */}
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

        {/* Categories */}
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

        {/* Simple Cart */}
        {cartOpen && (
          <div className="simple-cart-overlay" onClick={() => setCartOpen(false)}>
            <div className="simple-cart" onClick={(e) => e.stopPropagation()}>
              <div className="cart-header">
                <h2>Your Order - Table {selectedTable}</h2>
                <button onClick={() => setCartOpen(false)}>Close</button>
              </div>
              
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

  // Simple Admin View (for staff) - ORIGINAL
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
      
      {/* Menu display */}
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

      {/* Admin Cart */}
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