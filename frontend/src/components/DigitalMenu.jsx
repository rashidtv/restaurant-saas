import React, { useState, useEffect } from 'react';
import './DigitalMenu.css';

const DigitalMenu = ({ cart, setCart, onCreateOrder, isMobile, menu, apiConnected, currentTable, isCustomerView = false }) => {
  const [selectedTable, setSelectedTable] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [previousOrders, setPreviousOrders] = useState([]);

  // FIXED: Simplified and more reliable table detection
  useEffect(() => {
    if (!isCustomerView) return;

    const detectTableFromURL = () => {
      console.log('🔄 TABLE DETECTION STARTED...');
      
      let detectedTable = null;

      // Check all possible URL locations for table parameter
      const urlParams = new URLSearchParams(window.location.search);
      detectedTable = urlParams.get('table');

      if (!detectedTable && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
        detectedTable = hashParams.get('table') || window.location.hash.replace('#', '');
      }

      if (!detectedTable && window.location.pathname) {
        const pathMatch = window.location.pathname.match(/\/(T\d+)/i);
        detectedTable = pathMatch ? pathMatch[1] : null;
      }

      if (!detectedTable && currentTable) {
        detectedTable = currentTable;
      }

      // Clean and validate table number
      if (detectedTable) {
        detectedTable = detectedTable.toString().toUpperCase().trim();
        
        // Ensure it starts with T if it's a number
        if (/^\d+$/.test(detectedTable)) {
          detectedTable = 'T' + detectedTable;
        }
        
        // Remove any non-alphanumeric characters except T and numbers
        detectedTable = detectedTable.replace(/[^T0-9]/gi, '');
        
        console.log('✅ FINAL TABLE DETECTED:', detectedTable);
        
        // Set table and load orders IMMEDIATELY
        setSelectedTable(detectedTable);
        loadPreviousOrders(detectedTable);
      } else {
        console.log('❌ NO TABLE DETECTED');
        setSelectedTable('');
        setPreviousOrders([]);
      }
    };

    // Detect table immediately and on hash changes
    detectTableFromURL();
    window.addEventListener('hashchange', detectTableFromURL);
    
    return () => window.removeEventListener('hashchange', detectTableFromURL);
  }, [isCustomerView, currentTable]);

  // FIXED: Much simpler and more reliable order loading
  const loadPreviousOrders = (tableNumber) => {
    try {
      console.log('📦 LOADING ORDERS FOR TABLE:', tableNumber);
      
      const storageKey = `flavorflow_orders_${tableNumber}`;
      const storedData = localStorage.getItem(storageKey);
      
      console.log('📦 RAW STORED DATA:', storedData);
      
      if (!storedData) {
        console.log('📦 NO ORDERS FOUND IN STORAGE');
        setPreviousOrders([]);
        return;
      }

      const orders = JSON.parse(storedData);
      console.log('📦 PARSED ORDERS:', orders);
      
      if (Array.isArray(orders) && orders.length > 0) {
        // Sort by timestamp (newest first)
        const sortedOrders = orders.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        console.log('📦 SORTED ORDERS TO DISPLAY:', sortedOrders);
        setPreviousOrders(sortedOrders);
      } else {
        console.log('📦 INVALID ORDERS DATA');
        setPreviousOrders([]);
      }
      
    } catch (error) {
      console.error('❌ ERROR LOADING ORDERS:', error);
      setPreviousOrders([]);
    }
  };

  // FIXED: Much simpler and more reliable order saving
  const saveOrderToHistory = (tableNumber, orderData, orderNumber) => {
    try {
      console.log('💾 SAVING ORDER TO HISTORY...');
      console.log('💾 TABLE:', tableNumber);
      console.log('💾 ORDER DATA:', orderData);
      
      const orderRecord = {
        orderNumber: orderNumber || `ORDER-${Date.now()}`,
        items: orderData.map(item => ({
          menuItemId: item.menuItemId || item.id,
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
          category: item.category || 'general'
        })),
        total: orderData.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0),
        timestamp: new Date().toISOString(),
        table: tableNumber
      };

      console.log('💾 ORDER RECORD:', orderRecord);

      const storageKey = `flavorflow_orders_${tableNumber}`;
      
      // Get existing orders or initialize empty array
      let existingOrders = [];
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          existingOrders = JSON.parse(stored);
          if (!Array.isArray(existingOrders)) {
            console.warn('💾 Existing orders not array, resetting...');
            existingOrders = [];
          }
        }
      } catch (e) {
        console.error('💾 Error reading existing orders:', e);
        existingOrders = [];
      }

      console.log('💾 EXISTING ORDERS:', existingOrders);

      // Add new order and keep only last 10
      const updatedOrders = [orderRecord, ...existingOrders].slice(0, 10);
      
      console.log('💾 UPDATED ORDERS TO SAVE:', updatedOrders);
      
      // Save to localStorage
      localStorage.setItem(storageKey, JSON.stringify(updatedOrders));
      
      // Verify save worked
      const verify = localStorage.getItem(storageKey);
      console.log('💾 VERIFICATION - SAVED DATA:', verify);
      
      // Update state
      setPreviousOrders(updatedOrders);
      
      console.log('💾 ✅ ORDER SAVED SUCCESSFULLY!');
      console.log('💾 Total orders for table:', updatedOrders.length);
      
    } catch (error) {
      console.error('❌ ERROR SAVING ORDER:', error);
    }
  };

  // FIXED: Better place order function
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty. Please add some items first.');
      return;
    }

    if (!selectedTable) {
      alert('Table number not detected. Please scan the QR code again.');
      return;
    }

    console.log('🛒 PLACING ORDER FOR TABLE:', selectedTable);

    try {
      const orderData = cart.map(item => ({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category
      }));

      console.log('🛒 ORDER DATA:', orderData);

      // Create the order
      const result = await onCreateOrder(selectedTable, orderData, 'dine-in');
      
      console.log('🛒 ORDER RESULT:', result);

      // FIXED: Save to history and wait for it to complete
      await saveOrderToHistory(selectedTable, orderData, result.orderNumber);
      
      // Clear cart and close
      setCart([]);
      setCartOpen(false);
      
      alert(`✅ Order placed successfully for Table ${selectedTable}!`);
      
    } catch (error) {
      console.error('❌ ORDER FAILED:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  // Rest of your existing functions remain exactly the same...
  const viewPreviousOrderDetails = (previousOrder) => {
    const orderDetails = previousOrder.items.map(item => 
      `• ${item.name} x${item.quantity} - RM ${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');
    
    alert(`Order #${previousOrder.orderNumber}\n\nItems:\n${orderDetails}\n\nTotal: RM ${previousOrder.total.toFixed(2)}\nDate: ${new Date(previousOrder.timestamp).toLocaleString()}`);
  };

  const displayMenu = menu && menu.length > 0 ? menu : [
    { id: '1', name: 'Teh Tarik', price: 4.50, category: 'drinks', description: 'Famous Malaysian pulled tea' },
    { id: '2', name: 'Nasi Lemak', price: 12.90, category: 'main', description: 'Coconut rice with sambal' },
    { id: '3', name: 'Roti Canai', price: 3.50, category: 'main', description: 'Flaky flatbread with curry' },
    { id: '4', name: 'Cendol', price: 6.90, category: 'desserts', description: 'Shaved ice dessert' }
  ];

  const addToCart = (item) => {
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

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (id, change) => {
    const updatedCart = cart.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(0, item.quantity + change) }
        : item
    ).filter(item => item.quantity > 0);
    
    setCart(updatedCart);
  };

  const categories = ['all', ...new Set(displayMenu.map(item => item.category))];
  const filteredItems = displayMenu.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
          <small>Ready to order</small>
        </div>
      </div>
    );
  };

  const PreviousOrdersSection = () => {
    if (!selectedTable) return null;

    console.log('📋 RENDERING PREVIOUS ORDERS SECTION');
    console.log('📋 previousOrders:', previousOrders);
    console.log('📋 previousOrders.length:', previousOrders.length);

    if (previousOrders.length === 0) {
      return (
        <div className="previous-orders-section">
          <h3>📋 Your Order History</h3>
          <div className="no-previous-orders">
            <p>No previous orders found for Table {selectedTable}</p>
            <small>Orders will appear here after you place them</small>
          </div>
        </div>
      );
    }

    return (
      <div className="previous-orders-section">
        <h3>📋 Your Order History</h3>
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
                <span className="order-total">RM {order.total?.toFixed(2)}</span>
                <button 
                  className="view-order-btn"
                  onClick={() => viewPreviousOrderDetails(order)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Keep the rest of your JSX exactly as it was...
  // [Your existing JSX return structure remains unchanged]
  if (isCustomerView) {
    return (
      <div className="simple-customer-view">
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

        {!selectedTable && (
          <div className="warning-banner">
            <p>📱 Please scan your table's QR code to start ordering</p>
          </div>
        )}

        {selectedTable && <PreviousOrdersSection />}

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
              {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

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

  // Admin view remains unchanged...
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