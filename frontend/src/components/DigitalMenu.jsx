import React, { useState, useEffect } from 'react';
import './DigitalMenu.css';

const DigitalMenu = ({ cart, setCart, onCreateOrder, isMobile, menu, apiConnected, currentTable, isCustomerView = false }) => {
  const [selectedTable, setSelectedTable] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [previousOrders, setPreviousOrders] = useState([]);

  // FIXED: Proper table detection with persistent order history
  useEffect(() => {
    const detectTableFromURL = () => {
      console.log('🔄 Detecting table from URL...');
      
      let detectedTable = null;

      // Method 1: Check URL search params
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

      // Method 4: Check currentTable prop
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
        
        // FIXED: Load previous orders for this table from localStorage
        loadPreviousOrders(detectedTable);
      } else {
        console.log('❌ No table detected in URL');
        setSelectedTable('');
        setPreviousOrders([]);
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

  // FIXED: Properly load previous orders from localStorage
  const loadPreviousOrders = (tableNumber) => {
    try {
      console.log('📦 Loading orders for table:', tableNumber);
      const storageKey = `flavorflow_orders_${tableNumber}`;
      const storedOrders = localStorage.getItem(storageKey);
      
      if (storedOrders) {
        const orders = JSON.parse(storedOrders);
        console.log('📦 Parsed orders:', orders);
        
        // Ensure it's an array and sort by timestamp (newest first)
        const sortedOrders = Array.isArray(orders) 
          ? orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          : [];
        
        setPreviousOrders(sortedOrders);
        console.log('📦 Final orders to display:', sortedOrders);
      } else {
        console.log('📦 No stored orders found for table:', tableNumber);
        setPreviousOrders([]);
      }
    } catch (error) {
      console.error('❌ Error loading previous orders:', error);
      setPreviousOrders([]);
    }
  };

  // FIXED: Properly save order to localStorage
  const saveOrderToHistory = (tableNumber, orderData, orderNumber) => {
    try {
      console.log('💾 Starting to save order...');
      console.log('💾 Table:', tableNumber);
      console.log('💾 Order data:', orderData);
      console.log('💾 Order number:', orderNumber);

      const orderRecord = {
        orderNumber: orderNumber || `ORDER-${Date.now()}`,
        items: orderData.map(item => ({
          menuItemId: item.menuItemId || item.id,
          name: item.name,
          price: parseFloat(item.price),
          quantity: parseInt(item.quantity),
          category: item.category
        })),
        total: orderData.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)), 0),
        timestamp: new Date().toISOString(),
        table: tableNumber
      };

      console.log('💾 Order record to save:', orderRecord);

      const storageKey = `flavorflow_orders_${tableNumber}`;
      
      // Get existing orders
      const stored = localStorage.getItem(storageKey);
      console.log('💾 Existing stored data:', stored);
      
      let existingOrders = [];
      if (stored) {
        try {
          existingOrders = JSON.parse(stored);
          // Ensure it's an array
          if (!Array.isArray(existingOrders)) {
            console.warn('💾 Existing orders is not an array, resetting...');
            existingOrders = [];
          }
        } catch (parseError) {
          console.error('💾 Error parsing existing orders:', parseError);
          existingOrders = [];
        }
      }

      console.log('💾 Existing orders:', existingOrders);

      // Add new order and keep only last 10 orders
      const updatedOrders = [orderRecord, ...existingOrders].slice(0, 10);
      
      console.log('💾 Updated orders to save:', updatedOrders);
      
      // Save to localStorage
      localStorage.setItem(storageKey, JSON.stringify(updatedOrders));
      
      // Update state
      setPreviousOrders(updatedOrders);
      
      console.log('💾 ✅ Order successfully saved to localStorage');
      console.log('💾 Storage key:', storageKey);
      console.log('💾 Total orders now:', updatedOrders.length);
      
    } catch (error) {
      console.error('❌ Error saving order history:', error);
      alert('Error saving order history. Please contact staff.');
    }
  };

  // View-only previous orders
  const viewPreviousOrderDetails = (previousOrder) => {
    const orderDetails = previousOrder.items.map(item => 
      `• ${item.name} x${item.quantity} - RM ${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');
    
    alert(`Order #${previousOrder.orderNumber}\n\nItems:\n${orderDetails}\n\nTotal: RM ${previousOrder.total.toFixed(2)}\nDate: ${new Date(previousOrder.timestamp).toLocaleString()}`);
  };

  // SIMPLE menu data - ready for CMS integration
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
    }
  ];

  // EXISTING add to cart function - UNCHANGED
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

  // EXISTING remove from cart - UNCHANGED
  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // EXISTING update quantity - UNCHANGED
  const updateQuantity = (id, change) => {
    const updatedCart = cart.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(0, item.quantity + change) }
        : item
    ).filter(item => item.quantity > 0);
    
    setCart(updatedCart);
  };

  // FIXED: Place order with proper history saving
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
    console.log('🛒 Cart items:', cart);

    try {
      const orderData = cart.map(item => ({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category
      }));

      console.log('🛒 Order data prepared:', orderData);

      // Call the order creation function
      const result = await onCreateOrder(selectedTable, orderData, 'dine-in');
      
      console.log('🛒 Order creation result:', result);

      // FIXED: Save to history BEFORE clearing cart
      saveOrderToHistory(selectedTable, orderData, result.orderNumber);
      
      // Clear cart and close cart modal
      setCart([]);
      setCartOpen(false);
      
      alert(`Order placed successfully for Table ${selectedTable}! Order number: ${result.orderNumber || 'N/A'}`);
      
    } catch (error) {
      console.error('❌ Order failed:', error);
      alert('Failed to place order: ' + (error.message || 'Unknown error'));
    }
  };

  // EXISTING categories and filtering - UNCHANGED
  const categories = ['all', ...new Set(displayMenu.map(item => item.category))];
  
  const filteredItems = displayMenu.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // EXISTING totals - UNCHANGED
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // EXISTING TableStatus component - UNCHANGED
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

  // UPDATED: Previous Orders Component - View Only with Debug Info
  const PreviousOrdersSection = () => {
    if (!selectedTable) return null;

    console.log('📋 Rendering PreviousOrdersSection');
    console.log('📋 previousOrders:', previousOrders);
    console.log('📋 previousOrders length:', previousOrders.length);

    if (previousOrders.length === 0) {
      return (
        <div className="previous-orders-section">
          <h3>📋 Your Order History</h3>
          <div className="no-previous-orders">
            <p>No previous orders found for Table {selectedTable}</p>
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

  // Rest of the component remains exactly the same...
  // [Keep all the existing JSX return structure from the previous working version]
  // SIMPLE CUSTOMER VIEW - UNCHANGED STRUCTURE
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

  // ADMIN VIEW - UNCHANGED
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