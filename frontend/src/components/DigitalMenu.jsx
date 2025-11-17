import React, { useState, useEffect } from 'react';
import './DigitalMenu.css';

const DigitalMenu = ({ cart, setCart, onCreateOrder, isMobile, menu, apiConnected, currentTable, isCustomerView = false }) => {
  const [selectedTable, setSelectedTable] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [previousOrders, setPreviousOrders] = useState([]);

  useEffect(() => {
  if (isCustomerView && selectedTable) {
    console.log('🔄 Loading orders for table:', selectedTable);
    const storedOrders = localStorage.getItem(`flavorflow_orders_${selectedTable}`);
    if (storedOrders) {
      try {
        const orders = JSON.parse(storedOrders);
        setPreviousOrders(Array.isArray(orders) ? orders : []);
      } catch (error) {
        console.error('Error loading orders:', error);
        setPreviousOrders([]);
      }
    }
  }
}, [selectedTable, isCustomerView]); // THIS DEPENDENCY ARRAY IS CRITICAL
  const [isLoading, setIsLoading] = useState(false);

  // FIXED: Reliable table detection with persistent order history
  useEffect(() => {
    if (!isCustomerView) return;

    console.log('🔍 Starting table detection...');
    
    const detectTableFromURL = () => {
      let detectedTable = null;

      // Method 1: URL search params (most reliable)
      const urlParams = new URLSearchParams(window.location.search);
      detectedTable = urlParams.get('table');
      console.log('📋 From URL params:', detectedTable);

      // Method 2: Hash parameters
      if (!detectedTable && window.location.hash) {
        const hashContent = window.location.hash.replace('#', '');
        if (hashContent.includes('table=')) {
          const hashMatch = hashContent.match(/table=([^&]+)/);
          detectedTable = hashMatch ? hashMatch[1] : null;
        } else {
          detectedTable = hashContent;
        }
        console.log('📋 From hash:', detectedTable);
      }

      // Method 3: Path parameters
      if (!detectedTable) {
        const pathMatch = window.location.pathname.match(/\/(T\d+)/i);
        detectedTable = pathMatch ? pathMatch[1] : null;
        console.log('📋 From path:', detectedTable);
      }

      // Method 4: Props
      if (!detectedTable && currentTable) {
        detectedTable = currentTable;
        console.log('📋 From props:', detectedTable);
      }

      // Clean and validate table number
      if (detectedTable) {
        detectedTable = detectedTable.toString().toUpperCase().trim();
        
        // Ensure it starts with T if it's a number
        if (/^\d+$/.test(detectedTable)) {
          detectedTable = 'T' + detectedTable;
        }
        
        // Clean any unwanted characters
        detectedTable = detectedTable.replace(/[^T0-9]/gi, '');
        
        console.log('✅ Final table detected:', detectedTable);
        
        // Set table and load orders
        setSelectedTable(detectedTable);
        loadPreviousOrders(detectedTable);
      } else {
        console.log('❌ No table detected in URL');
        setSelectedTable('');
        setPreviousOrders([]);
      }
    };

    // Add small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      detectTableFromURL();
    }, 100);

    // Listen for hash changes
    window.addEventListener('hashchange', detectTableFromURL);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('hashchange', detectTableFromURL);
    };
  }, [isCustomerView, currentTable]);

  // FIXED: Reliable order loading
  const loadPreviousOrders = (tableNumber) => {
    try {
      console.log('📦 Loading orders for table:', tableNumber);
      
      const storageKey = `flavorflow_orders_${tableNumber}`;
      const storedData = localStorage.getItem(storageKey);
      
      console.log('📦 Storage key:', storageKey);
      console.log('📦 Raw data from storage:', storedData);
      
      if (!storedData) {
        console.log('📦 No orders found in storage');
        setPreviousOrders([]);
        return;
      }

      const orders = JSON.parse(storedData);
      console.log('📦 Parsed orders:', orders);
      
      if (Array.isArray(orders) && orders.length > 0) {
        // Sort by timestamp (newest first)
        const sortedOrders = orders.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        console.log('📦 Sorted orders to display:', sortedOrders);
        setPreviousOrders(sortedOrders);
      } else {
        console.log('📦 Invalid or empty orders array');
        setPreviousOrders([]);
      }
      
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      setPreviousOrders([]);
    }
  };

 // REPLACE your existing saveOrderToHistory with this:
const saveOrderToHistory = (tableNumber, orderData, orderNumber) => {
  try {
    const orderRecord = {
      orderNumber: orderNumber || `ORDER-${Date.now()}`,
      items: orderData,
      total: orderData.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      timestamp: new Date().toISOString(),
      table: tableNumber
    };

    const storageKey = `flavorflow_orders_${tableNumber}`;
    const existingOrders = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const updatedOrders = [orderRecord, ...existingOrders].slice(0, 10);
    
    localStorage.setItem(storageKey, JSON.stringify(updatedOrders));
    setPreviousOrders(updatedOrders); // THIS LINE UPDATES THE STATE IMMEDIATELY
    
  } catch (error) {
    console.error('Error saving order:', error);
  }
};

  // View previous order details
  const viewPreviousOrderDetails = (previousOrder) => {
    const orderDetails = previousOrder.items.map(item => 
      `• ${item.name} x${item.quantity} - RM ${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');
    
    alert(`Order #${previousOrder.orderNumber}\n\nItems:\n${orderDetails}\n\nTotal: RM ${previousOrder.total.toFixed(2)}\nDate: ${new Date(previousOrder.timestamp).toLocaleString()}`);
  };

  // Menu data - ready for CMS integration
  const displayMenu = menu && menu.length > 0 ? menu : [
    { 
      id: '1', 
      name: 'Teh Tarik', 
      price: 4.50, 
      category: 'drinks', 
      description: 'Famous Malaysian pulled tea'
    },
    { 
      id: '2', 
      name: 'Nasi Lemak', 
      price: 12.90, 
      category: 'main', 
      description: 'Coconut rice with sambal'
    },
    { 
      id: '3', 
      name: 'Roti Canai', 
      price: 3.50, 
      category: 'main', 
      description: 'Flaky flatbread with curry'
    },
    { 
      id: '4', 
      name: 'Cendol', 
      price: 6.90, 
      category: 'desserts', 
      description: 'Shaved ice dessert'
    },
    { 
      id: '5', 
      name: 'Satay', 
      price: 8.90, 
      category: 'main', 
      description: 'Grilled meat skewers with peanut sauce'
    },
    { 
      id: '6', 
      name: 'Laksa', 
      price: 10.90, 
      category: 'main', 
      description: 'Spicy noodle soup'
    }
  ];

  // Add to cart function
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

  // FIXED: Place order with reliable history saving
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty. Please add some items first.');
      return;
    }

    if (!selectedTable) {
      alert('Table number not detected. Please scan the QR code again.');
      return;
    }

    console.log('🛒 Starting order placement...');
    setIsLoading(true);

    try {
      const orderData = cart.map(item => ({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category
      }));

      console.log('🛒 Order data prepared');

      // Create the order
      const result = await onCreateOrder(selectedTable, orderData, 'dine-in');
      
      console.log('🛒 Order created, saving to history...');

      // Save to history - this is crucial
      saveOrderToHistory(selectedTable, orderData, result.orderNumber);
      
      // Clear cart and close
      setCart([]);
      setCartOpen(false);
      
      alert(`✅ Order placed successfully for Table ${selectedTable}!`);
      
    } catch (error) {
      console.error('❌ Order failed:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Categories and filtering
  const categories = ['all', ...new Set(displayMenu.map(item => item.category))];
  
  const filteredItems = displayMenu.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Totals
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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

  // Previous Orders Component
  const PreviousOrdersSection = () => {
    if (!selectedTable) return null;

    console.log('📋 Rendering PreviousOrdersSection');
    console.log('📋 previousOrders count:', previousOrders.length);

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

  // CUSTOMER VIEW
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
              disabled={!selectedTable || isLoading}
            >
              {isLoading ? 'Loading...' : `Cart (${itemCount})`}
            </button>
          </div>
        </header>

        {/* Warning banner */}
        {!selectedTable && (
          <div className="warning-banner">
            <p>📱 Please scan your table's QR code to start ordering</p>
          </div>
        )}

        {/* Previous orders */}
        {selectedTable && <PreviousOrdersSection />}

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
              {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
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
                  <div className="item-price">RM {item.price.toFixed(2)}</div>
                </div>
                <button 
                  className="add-btn"
                  onClick={() => addToCart(item)}
                  disabled={isLoading}
                >
                  Add +
                </button>
              </div>
            ))
          )}
        </div>

        {/* Cart Overlay */}
        {cartOpen && (
          <div className="simple-cart-overlay" onClick={() => !isLoading && setCartOpen(false)}>
            <div className="simple-cart" onClick={(e) => e.stopPropagation()}>
              <div className="cart-header">
                <h2>Your Order - Table {selectedTable}</h2>
                <button 
                  onClick={() => setCartOpen(false)}
                  disabled={isLoading}
                >
                  Close
                </button>
              </div>
              
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <p>Your cart is empty</p>
                  {previousOrders.length > 0 && (
                    <button 
                      className="view-previous-orders-btn"
                      onClick={() => setCartOpen(false)}
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
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            disabled={isLoading}
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            disabled={isLoading}
                          >
                            +
                          </button>
                          <button 
                            className="remove-btn"
                            onClick={() => removeFromCart(item.id)}
                            disabled={isLoading}
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
                    disabled={isLoading}
                  >
                    {isLoading ? 'Placing Order...' : `Place Order for Table ${selectedTable}`}
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
            disabled={isLoading}
          >
            🛒 {itemCount} items - RM {total.toFixed(2)}
          </button>
        )}
      </div>
    );
  }

  // ADMIN VIEW
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
            disabled={!selectedTable || isLoading}
          >
            {selectedTable ? `Place Order for Table ${selectedTable}` : 'Select a table first'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DigitalMenu;