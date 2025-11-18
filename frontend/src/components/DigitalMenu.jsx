import React, { useState, useEffect, useRef } from 'react';
import './DigitalMenu.css';

// Simple Registration Form for Marketing Only
const RegistrationForm = ({ 
  selectedTable, 
  onRegister, 
  onClose 
}) => {
  const [formData, setFormData] = useState({ phone: '', name: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.phone.trim()) {
      onRegister(formData);
    }
  };

  return (
    <div className="registration-overlay">
      <div className="registration-form">
        <form onSubmit={handleSubmit}>
          <div className="registration-header">
            <h2>Welcome to Table {selectedTable}! 🎉</h2>
            <p>Enter your details for special offers</p>
          </div>
          
          <div className="form-group">
            <label htmlFor="phone-input">📱 Phone Number *</label>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="e.g., 0123456789"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="form-input"
              required
            />
            <small>For promotions and special offers only</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="name-input">👤 Your Name (Optional)</label>
            <input
              type="text"
              placeholder="e.g., John"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="form-input"
            />
            <small>So we can personalize your experience</small>
          </div>
          
          <div className="registration-actions">
            <button 
              type="submit"
              className="register-btn"
              disabled={!formData.phone.trim()}
            >
              Start Ordering ✅
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="skip-btn"
            >
              Maybe Later
            </button>
          </div>
        </form>
        
        <div className="registration-benefits">
          <h4>Why share your number? 🤔</h4>
          <ul>
            <li>🎁 <strong>Exclusive offers</strong> and discounts</li>
            <li>📱 <strong>Loyalty rewards</strong> program</li>
            <li>✨ <strong>Special promotions</strong> just for you</li>
            <li>📧 <strong>Personalized service</strong> on future visits</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const DigitalMenu = ({ cart, setCart, onCreateOrder, isMobile, menu, apiConnected, currentTable, isCustomerView = false }) => {
  const [selectedTable, setSelectedTable] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [tableOrders, setTableOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [showRegistration, setShowRegistration] = useState(false);
  
  const orderRefreshRef = useRef(null);

  // Detect table from URL
  useEffect(() => {
    if (isCustomerView) {
      const detectTable = () => {
        console.log('🔍 Detecting table from URL...');
        let detectedTable = null;
        
        // Check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        detectedTable = urlParams.get('table');
        
        // Check hash
        if (!detectedTable && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
          detectedTable = hashParams.get('table');
        }

        if (detectedTable) {
          // Simple table formatting
          detectedTable = detectedTable.toString().toUpperCase();
          if (!detectedTable.startsWith('T')) {
            detectedTable = 'T' + detectedTable;
          }
          console.log('✅ Table detected:', detectedTable);
          setSelectedTable(detectedTable);
          loadTableOrders(detectedTable);
          
          // Show registration if no customer info
          if (!customerInfo) {
            setShowRegistration(true);
          }
        } else {
          console.log('❌ No table detected in URL');
          setSelectedTable('');
        }
      };

      detectTable();
      
      const handleHashChange = () => {
        detectTable();
      };
      
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }
  }, [isCustomerView, customerInfo]);

  // Auto-refresh orders every 10 seconds
  useEffect(() => {
    if (isCustomerView && selectedTable) {
      orderRefreshRef.current = setInterval(() => {
        loadTableOrders(selectedTable);
      }, 10000);
      
      return () => {
        if (orderRefreshRef.current) {
          clearInterval(orderRefreshRef.current);
        }
      };
    }
  }, [isCustomerView, selectedTable]);

  // Load ONLY active orders for the table (pending, preparing, ready)
  const loadTableOrders = async (tableNumber) => {
    if (!tableNumber) return;
    
    try {
      setIsLoading(true);
      console.log('📦 Loading ACTIVE orders for table:', tableNumber);
      
      const response = await fetch('https://restaurant-saas-backend-hbdz.onrender.com/api/orders');
      
      if (response.ok) {
        const allOrders = await response.json();
        
        // Filter by table AND only active statuses
        const activeOrders = allOrders.filter(order => {
          if (!order) return false;
          
          const orderTable = (order.tableId || order.table || '').toString().toUpperCase();
          const targetTable = tableNumber.toUpperCase();
          const isActiveStatus = ['pending', 'preparing', 'ready'].includes(order.status);
          
          return orderTable === targetTable && isActiveStatus;
        });
        
        // Sort by newest first
        const sortedOrders = activeOrders.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.timestamp || 0);
          const dateB = new Date(b.createdAt || b.timestamp || 0);
          return dateB - dateA;
        });
        
        console.log('🎯 Found', sortedOrders.length, 'ACTIVE orders for table', tableNumber);
        setTableOrders(sortedOrders);
      }
    } catch (error) {
      console.error('❌ Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration for marketing only
  const handleRegistrationSubmit = (formData) => {
    const { phone, name } = formData;
    
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
    
    console.log('✅ Customer registered for marketing:', customerData);
    // Here you can send this data to your marketing system
  };

  // Add to cart
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
      description: item.description,
      menuItemId: item.id || item._id
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

  // Place order with customer info for marketing
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

    try {
      const orderData = cart.map(item => ({
        menuItemId: item.menuItemId || item.id,
        name: item.name,
        price: parseFloat(item.price),
        quantity: parseInt(item.quantity),
        category: item.category
      }));

      console.log('🛒 Placing order for table:', selectedTable);
      console.log('📦 Order items:', orderData);
      console.log('👤 Customer info (for marketing):', customerInfo);
      
      // Pass customer info for marketing (4th parameter)
      const result = await onCreateOrder(
        selectedTable, 
        orderData, 
        'dine-in',
        { 
          customerPhone: customerInfo.phone, 
          customerName: customerInfo.name 
        }
      );
      
      if (result && result.success !== false) {
        setCart([]);
        setCartOpen(false);
        
        // Reload orders to show the new one immediately
        setTimeout(() => {
          loadTableOrders(selectedTable);
        }, 1000);
        
        const orderNumber = result.orderNumber || result.data?.orderNumber || 'N/A';
        alert(`Order placed successfully, ${customerInfo.name}! Order number: ${orderNumber}\n\nYour food will be served soon.`);
      } else {
        throw new Error(result?.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('❌ Order failed:', error);
      alert('Failed to place order: ' + (error.message || 'Please try again.'));
    }
  };

  // Get status display
  const getStatusDisplay = (status) => {
    const statusConfig = {
      'pending': { label: 'Pending', color: '#f59e0b', icon: '⏳' },
      'preparing': { label: 'Preparing', color: '#3b82f6', icon: '👨‍🍳' },
      'ready': { label: 'Ready', color: '#10b981', icon: '✅' }
    };
    
    const config = statusConfig[status] || { label: status, color: '#6b7280', icon: '❓' };
    
    return (
      <span 
        className="status-badge"
        style={{ 
          backgroundColor: config.color + '20',
          color: config.color,
          border: `1px solid ${config.color}40`
        }}
      >
        {config.icon} {config.label}
      </span>
    );
  };

  // Format order items properly
  const formatOrderItems = (items) => {
    if (!items || items.length === 0) return 'No items';
    
    const itemList = items.map(item => {
      // Handle both item structures properly
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

  // Format date properly
  const formatOrderTime = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Invalid time';
      
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return 'Invalid time';
    }
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
    
    const activeOrderCount = tableOrders.length;
    
    return (
      <div className="table-success">
        <div className="success-icon">🍽️</div>
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

  // Orders History Section - Only shows active orders
  const OrdersHistorySection = () => {
    if (!selectedTable || !customerInfo) return null;

    return (
      <div className="orders-history-section">
        <div className="orders-header">
          <h3>📋 Active Orders - Table {selectedTable}</h3>
          <button 
            onClick={() => loadTableOrders(selectedTable)}
            disabled={isLoading}
            className="refresh-orders-btn"
            title="Refresh orders"
          >
            {isLoading ? '🔄' : '🔄'}
          </button>
        </div>
        
        {isLoading ? (
          <div className="orders-loading">
            <p>Loading orders...</p>
          </div>
        ) : tableOrders.length === 0 ? (
          <div className="no-orders">
            <p>No active orders for this table</p>
            <small>Active orders will appear here</small>
          </div>
        ) : (
          <div className="orders-active">
            <div className="orders-list">
              {tableOrders.map((order, index) => (
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
                      Ordered: {formatOrderTime(order.createdAt || order.timestamp)}
                    </span>
                    {order.status === 'pending' && (
                      <span className="order-note">Order received, waiting for kitchen</span>
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
        {/* Registration Form for Marketing */}
        {showRegistration && (
          <RegistrationForm
            selectedTable={selectedTable}
            onRegister={handleRegistrationSubmit}
            onClose={() => setShowRegistration(false)}
          />
        )}

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

        {!selectedTable && (
          <div className="warning-banner">
            <p>📱 Please scan your table's QR code to start ordering</p>
          </div>
        )}

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
                  Ordering as: <strong>{customerInfo.name}</strong>
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