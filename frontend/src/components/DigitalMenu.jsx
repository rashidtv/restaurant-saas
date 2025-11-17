import React, { useState, useEffect } from 'react';
import './DigitalMenu.css';

const DigitalMenu = ({ cart, setCart, onCreateOrder, isMobile, menu, apiConnected, currentTable, isCustomerView = false }) => {
  const [selectedTable, setSelectedTable] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [previousOrders, setPreviousOrders] = useState([]);
  const [showPreviousOrders, setShowPreviousOrders] = useState(false);

  // FIXED: Improved table detection with better order loading
  useEffect(() => {
    const detectTableFromURL = () => {
      console.log('🔄 Detecting table from URL...');
      
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
        
        console.log('✅ Final table detected:', detectedTable);
        setSelectedTable(detectedTable);
        
      } else {
        console.log('❌ No table detected in URL');
        setSelectedTable('');
      }
    };

    if (isCustomerView) {
      detectTableFromURL();
      window.addEventListener('hashchange', detectTableFromURL);
      return () => window.removeEventListener('hashchange', detectTableFromURL);
    }
  }, [isCustomerView]);

  // FIXED: Load previous orders whenever selectedTable changes
  useEffect(() => {
    if (selectedTable) {
      console.log('📦 Loading orders for table:', selectedTable);
      loadPreviousOrders(selectedTable);
    } else {
      setPreviousOrders([]);
      setShowPreviousOrders(false);
    }
  }, [selectedTable]);

  // FIXED: Improved order loading
  const loadPreviousOrders = (tableNumber) => {
    try {
      const storedOrders = localStorage.getItem(`flavorflow_orders_${tableNumber}`);
      if (storedOrders) {
        const orders = JSON.parse(storedOrders);
        setPreviousOrders(orders);
        setShowPreviousOrders(orders.length > 0);
        console.log('📦 Loaded previous orders:', orders.length, 'orders');
        
        // Show welcome message if orders exist
        if (orders.length > 0) {
          setTimeout(() => {
            alert(`Welcome back to Table ${tableNumber}! You have ${orders.length} previous order(s). Click "Order History" to view or reorder.`);
          }, 500);
        }
      } else {
        setPreviousOrders([]);
        setShowPreviousOrders(false);
        console.log('📦 No previous orders found for table:', tableNumber);
      }
    } catch (error) {
      console.error('❌ Error loading previous orders:', error);
      setPreviousOrders([]);
      setShowPreviousOrders(false);
    }
  };

  // FIXED: Original working order saving
  const saveOrderToHistory = (tableNumber, orderData, orderNumber) => {
    try {
      const orderRecord = {
        orderNumber,
        items: orderData,
        total: orderData.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        timestamp: new Date().toISOString(),
        table: tableNumber
      };

      const existingOrders = JSON.parse(localStorage.getItem(`flavorflow_orders_${tableNumber}`) || '[]');
      const updatedOrders = [orderRecord, ...existingOrders].slice(0, 10); // Keep last 10 orders
      
      localStorage.setItem(`flavorflow_orders_${tableNumber}`, JSON.stringify(updatedOrders));
      setPreviousOrders(updatedOrders);
      setShowPreviousOrders(true);
      console.log('💾 Saved order to history:', orderRecord);
    } catch (error) {
      console.error('❌ Error saving order history:', error);
    }
  };

  // NEW: Quick reorder functionality
  const quickReorder = (previousOrder) => {
    if (!selectedTable) {
      alert('Please scan the QR code first to detect your table.');
      return;
    }

    // Clear current cart first
    setCart([]);
    
    // Add a small delay to ensure cart is cleared
    setTimeout(() => {
      const newCart = previousOrder.items.map(item => ({
        id: item.menuItemId || item.id,
        _id: item.menuItemId || item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category
      }));
      
      setCart(newCart);
      setCartOpen(true);
      
      // Scroll to top and show confirmation
      window.scrollTo(0, 0);
      console.log('🔄 Reordered items:', newCart);
    }, 100);
  };

  // FIXED: Original working add to cart
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

  // FIXED: Original working remove from cart
  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // FIXED: Original working update quantity
  const updateQuantity = (id, change) => {
    const updatedCart = cart.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(0, item.quantity + change) }
        : item
    ).filter(item => item.quantity > 0);
    
    setCart(updatedCart);
  };

  // FIXED: Original working place order
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty. Please add some items first.');
      return;
    }

    // FIXED: No fallback table - require proper detection
    if (!selectedTable) {
      alert('Table number not detected. Please scan the QR code again.\n\nIf this continues, please contact staff for assistance.');
      return;
    }

    console.log('🛒 Placing order for table:', selectedTable);

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
      
    } catch (error) {
      console.error('❌ Order failed:', error);
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
          <small>Ready to order</small>
        </div>
      </div>
    );
  };

  // FIXED: Enhanced Previous Orders Component with reorder functionality
  const PreviousOrdersSection = () => {
    if (!selectedTable || previousOrders.length === 0) return null;

    return (
      <div className="previous-orders-section">
        <div className="previous-orders-header">
          <h3>📋 Order History - Table {selectedTable}</h3>
          <button 
            className="toggle-orders-btn"
            onClick={() => setShowPreviousOrders(!showPreviousOrders)}
          >
            {showPreviousOrders ? '▲ Hide' : '▼ Show'} ({previousOrders.length})
          </button>
        </div>
        
        {showPreviousOrders && (
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

  // SIMPLE CUSTOMER VIEW - ENHANCED WITH ORDER HISTORY
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
        {selectedTable && previousOrders.length > 0 && (
          <div className="welcome-back-banner">
            <p>🎉 Welcome back to Table {selectedTable}! You have {previousOrders.length} previous order(s).</p>
          </div>
        )}

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