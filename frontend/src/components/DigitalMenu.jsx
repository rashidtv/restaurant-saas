import React, { useState, useEffect } from 'react';
import './DigitalMenu.css';

const DigitalMenu = ({ cart, setCart, onCreateOrder, isMobile, menu, apiConnected, currentTable, isCustomerView = false }) => {
  const [selectedTable, setSelectedTable] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [previousOrders, setPreviousOrders] = useState([]);

  // FIXED: Single useEffect for table detection and order loading
  useEffect(() => {
    if (!isCustomerView) return;

    console.log('=== TABLE DETECTION STARTED ===');
    
    const detectTableAndLoadOrders = () => {
      // Get table from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      let table = urlParams.get('table');

      // If not in URL params, check hash
      if (!table && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
        table = hashParams.get('table') || window.location.hash.replace('#', '');
      }

      // Clean table number
      if (table) {
        table = table.toString().toUpperCase().trim();
        if (/^\d+$/.test(table)) {
          table = 'T' + table;
        }
        table = table.replace(/[^T0-9]/gi, '');
        
        console.log('🟢 Table detected:', table);
        setSelectedTable(table);
        
        // CRITICAL: Load orders immediately after setting table
        setTimeout(() => {
          loadOrdersForTable(table);
        }, 100);
      } else {
        console.log('🔴 No table detected');
        setSelectedTable('');
        setPreviousOrders([]);
      }
    };

    const loadOrdersForTable = (tableNumber) => {
      try {
        console.log('📦 Loading orders for table:', tableNumber);
        const storageKey = `flavorflow_orders_${tableNumber}`;
        const stored = localStorage.getItem(storageKey);
        
        if (stored) {
          const orders = JSON.parse(stored);
          console.log('✅ Orders loaded:', orders);
          setPreviousOrders(Array.isArray(orders) ? orders : []);
        } else {
          console.log('ℹ️ No orders found for table:', tableNumber);
          setPreviousOrders([]);
        }
      } catch (error) {
        console.error('❌ Error loading orders:', error);
        setPreviousOrders([]);
      }
    };

    // Run detection immediately
    detectTableAndLoadOrders();

    // Listen for URL changes
    window.addEventListener('hashchange', detectTableAndLoadOrders);
    
    return () => window.removeEventListener('hashchange', detectTableAndLoadOrders);
  }, [isCustomerView]);

  // FIXED: Simple and reliable order saving
  const saveOrderToHistory = (tableNumber, orderData, orderNumber) => {
    try {
      console.log('💾 Saving order for table:', tableNumber);
      
      const orderRecord = {
        orderNumber: orderNumber || `ORDER-${Date.now()}`,
        items: orderData,
        total: orderData.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        timestamp: new Date().toISOString(),
        table: tableNumber
      };

      const storageKey = `flavorflow_orders_${tableNumber}`;
      const existingOrders = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updatedOrders = [orderRecord, ...existingOrders];
      
      localStorage.setItem(storageKey, JSON.stringify(updatedOrders));
      setPreviousOrders(updatedOrders);
      
      console.log('✅ Order saved successfully. Total orders:', updatedOrders.length);
      
    } catch (error) {
      console.error('❌ Error saving order:', error);
    }
  };

  // Rest of your functions remain the same
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
    const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);
    
    if (existingItemIndex !== -1) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (id, change) => {
    const updatedCart = cart.map(item =>
      item.id === id ? { ...item, quantity: Math.max(0, item.quantity + change) } : item
    ).filter(item => item.quantity > 0);
    setCart(updatedCart);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty. Please add some items first.');
      return;
    }

    if (!selectedTable) {
      alert('Table number not detected. Please scan the QR code again.');
      return;
    }

    try {
      const orderData = cart.map(item => ({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category
      }));

      const result = await onCreateOrder(selectedTable, orderData, 'dine-in');
      
      // Save order history
      saveOrderToHistory(selectedTable, orderData, result.orderNumber);
      
      setCart([]);
      setCartOpen(false);
      alert(`Order placed successfully for Table ${selectedTable}! Order number: ${result.orderNumber || 'N/A'}`);
      
    } catch (error) {
      console.error('Order failed:', error);
      alert('Failed to place order: ' + (error.message || 'Unknown error'));
    }
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

    console.log('🔄 Rendering PreviousOrdersSection, orders count:', previousOrders.length);

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
        <h3>📋 Your Order History ({previousOrders.length} orders)</h3>
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

  // Customer View - Keep your existing JSX exactly as is
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

  // Admin View - Keep your existing JSX
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