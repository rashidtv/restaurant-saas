import React, { useState, useEffect } from 'react';
import './DigitalMenu.css';

const DigitalMenu = ({ cart, setCart, onCreateOrder, isMobile, menu, apiConnected, currentTable, isCustomerView = false }) => {
  const [selectedTable, setSelectedTable] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [previousOrders, setPreviousOrders] = useState([]);

  // FIXED: Proper table detection without fallback
  useEffect(() => {
    const detectTableFromURL = () => {
      console.log('🔄 Detecting table from URL...');
      
      let detectedTable = null;

      // Method 1: Check URL search params (most common for QR codes)
      const urlParams = new URLSearchParams(window.location.search);
      detectedTable = urlParams.get('table');

      // Method 2: Check hash parameters
      if (!detectedTable && window.location.hash) {
        const hashContent = window.location.hash.replace('#', '');
        if (hashContent.includes('table=')) {
          const hashMatch = hashContent.match(/table=([^&]+)/);
          detectedTable = hashMatch ? hashMatch[1] : null;
        } else {
          detectedTable = hashContent;
        }
      }

      // Method 3: Check path parameters
      if (!detectedTable) {
        const pathMatch = window.location.pathname.match(/\/(T\d+)$/);
        detectedTable = pathMatch ? pathMatch[1] : null;
      }

      // Method 4: Check currentTable prop from parent component
      if (!detectedTable && currentTable) {
        detectedTable = currentTable;
      }

      // Clean and validate the table number
      if (detectedTable) {
        detectedTable = detectedTable.toString().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        
        if (/^\d+$/.test(detectedTable)) {
          detectedTable = 'T' + detectedTable;
        }
        
        console.log('✅ Final table detected:', detectedTable);
        setSelectedTable(detectedTable);
        loadPreviousOrders(detectedTable);
      } else {
        console.log('❌ No table detected in URL');
        setSelectedTable('');
      }
    };

    if (isCustomerView) {
      detectTableFromURL();
      window.addEventListener('hashchange', detectTableFromURL);
      
      return () => {
        window.removeEventListener('hashchange', detectTableFromURL);
      };
    }
  }, [isCustomerView, currentTable]);

  // Load previous orders from localStorage
  const loadPreviousOrders = (tableNumber) => {
    try {
      const storedOrders = localStorage.getItem(`flavorflow_orders_${tableNumber}`);
      if (storedOrders) {
        const orders = JSON.parse(storedOrders);
        setPreviousOrders(orders);
        console.log('📦 Loaded previous orders:', orders);
      } else {
        setPreviousOrders([]);
      }
    } catch (error) {
      console.error('❌ Error loading previous orders:', error);
      setPreviousOrders([]);
    }
  };

  // Save order to localStorage
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
      const updatedOrders = [orderRecord, ...existingOrders].slice(0, 10);
      
      localStorage.setItem(`flavorflow_orders_${tableNumber}`, JSON.stringify(updatedOrders));
      setPreviousOrders(updatedOrders);
      console.log('💾 Saved order to history:', orderRecord);
    } catch (error) {
      console.error('❌ Error saving order history:', error);
    }
  };

  // UPDATED: View-only previous orders - no add to cart functionality
  const viewPreviousOrderDetails = (previousOrder) => {
    alert(`Order #${previousOrder.orderNumber}\n\nItems:\n${
      previousOrder.items.map(item => `• ${item.name} x${item.quantity} - RM ${(item.price * item.quantity).toFixed(2)}`).join('\n')
    }\n\nTotal: RM ${previousOrder.total.toFixed(2)}\nDate: ${new Date(previousOrder.timestamp).toLocaleString()}`);
  };

  // Enhanced menu data with images
  const displayMenu = menu && menu.length > 0 ? menu : [
    { 
      id: '1', 
      name: 'Teh Tarik', 
      price: 4.50, 
      category: 'drinks', 
      description: 'Famous Malaysian pulled tea',
      image: 'https://images.unsplash.com/photo-1568564325436-64e5f5d46d97?w=400&h=300&fit=crop'
    },
    { 
      id: '2', 
      name: 'Nasi Lemak', 
      price: 12.90, 
      category: 'main', 
      description: 'Coconut rice with sambal',
      image: 'https://images.unsplash.com/photo-1559314809-0f155186aed0?w=400&h=300&fit=crop'
    },
    { 
      id: '3', 
      name: 'Roti Canai', 
      price: 3.50, 
      category: 'main', 
      description: 'Flaky flatbread with curry',
      image: 'https://images.unsplash.com/photo-1555073545-06e8b495d709?w=400&h=300&fit=crop'
    },
    { 
      id: '4', 
      name: 'Cendol', 
      price: 6.90, 
      category: 'desserts', 
      description: 'Shaved ice dessert',
      image: 'https://images.unsplash.com/photo-1570194065650-1d58cc34575a?w=400&h=300&fit=crop'
    },
    { 
      id: '5', 
      name: 'Satay', 
      price: 8.90, 
      category: 'main', 
      description: 'Grilled meat skewers with peanut sauce',
      image: 'https://images.unsplash.com/photo-1553909943-7bde3c3c0b56?w=400&h=300&fit=crop'
    },
    { 
      id: '6', 
      name: 'Laksa', 
      price: 10.90, 
      category: 'main', 
      description: 'Spicy noodle soup',
      image: 'https://images.unsplash.com/photo-1555126634-323283c090fa?w=400&h=300&fit=crop'
    }
  ];

  // FIXED: Better add to cart - ensures unique items
  const addToCart = (item) => {
    console.log('➕ Adding to cart:', item.name);
    
    const cartItem = {
      id: item.id || item._id,
      _id: item._id || item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      category: item.category,
      description: item.description,
      image: item.image
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

  // Simple remove from cart
  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // Simple update quantity
  const updateQuantity = (id, change) => {
    const updatedCart = cart.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(0, item.quantity + change) }
        : item
    ).filter(item => item.quantity > 0);
    
    setCart(updatedCart);
  };

  // FIXED: Better place order with proper table validation AND save to history
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty. Please add some items first.');
      return;
    }

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
      
      saveOrderToHistory(selectedTable, orderData, result.orderNumber || `TEMP-${Date.now()}`);
      
      setCart([]);
      setCartOpen(false);
      alert(`Order placed successfully for Table ${selectedTable}! Order number: ${result.orderNumber || 'N/A'}`);
      
    } catch (error) {
      console.error('❌ Order failed:', error);
      alert('Failed to place order: ' + (error.message || 'Unknown error'));
    }
  };

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

  // UPDATED: Previous Orders Component - View Only
  const PreviousOrdersSection = () => {
    if (!selectedTable || previousOrders.length === 0) return null;

    return (
      <div className="previous-orders-section">
        <h3>📋 Your Order History</h3>
        <div className="previous-orders-list">
          {previousOrders.map((order, index) => (
            <div key={index} className="previous-order-card view-only">
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
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {/* Menu Items with Images */}
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
              <div key={item.id} className="menu-item-with-image">
                <div className="item-image-container">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="item-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                <div className="item-content">
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
              </div>
            ))
          )}
        </div>

        {/* Simple Cart */}
        {cartOpen && (
          <div className="simple-cart-overlay" onClick={() => setCartOpen(false)}>
            <div className="simple-cart-popup" onClick={(e) => e.stopPropagation()}>
              <div className="cart-header">
                <h2>Your Order - Table {selectedTable}</h2>
                <button className="close-cart-btn" onClick={() => setCartOpen(false)}>✕</button>
              </div>
              
              {cart.length === 0 ? (
                <div className="empty-cart-message">
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
                  <div className="cart-items-scrollable">
                    {cart.map(item => (
                      <div key={item.id} className="cart-item">
                        <div className="item-details">
                          <strong>{item.name}</strong>
                          <div>RM {item.price} each</div>
                        </div>
                        <div className="item-controls">
                          <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                          <span className="quantity-display">{item.quantity}</span>
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
                  
                  <div className="cart-footer">
                    <div className="cart-total">
                      <strong>Total: RM {total.toFixed(2)}</strong>
                    </div>
                    
                    <button 
                      className="place-order-btn"
                      onClick={handlePlaceOrder}
                    >
                      Place Order for Table {selectedTable}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Mobile Cart Button */}
        {isMobile && cart.length > 0 && !cartOpen && selectedTable && (
          <button 
            className="mobile-cart-btn-fixed"
            onClick={() => setCartOpen(true)}
          >
            🛒 {itemCount} items - RM {total.toFixed(2)}
          </button>
        )}
      </div>
    );
  }

  // Simple Admin View (for staff) - unchanged
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