import React, { useState, useEffect, useRef } from 'react';
import './DigitalMenu.css';

// Simple Points Registration Form
const RegistrationForm = ({ 
  selectedTable, 
  onRegister, 
  onClose 
}) => {
  const [phone, setPhone] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (phone.trim()) {
      onRegister({ phone: phone.trim() });
    }
  };

  return (
    <div className="registration-overlay">
      <div className="registration-form">
        <div className="registration-header">
          <h2>Welcome! 🎉</h2>
          <p>Table {selectedTable}</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Enter your phone number to earn points</label>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="0123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="form-input"
              required
              autoFocus
            />
          </div>
          
          <div className="registration-actions">
            <button 
              type="submit"
              className="register-btn"
              disabled={!phone.trim()}
            >
              Continue
            </button>
          </div>
        </form>
        
        <div className="points-info">
          <h4>Earn Points</h4>
          <div className="points-item">
            <span>• 1 point per RM 1 spent</span>
          </div>
          <div className="points-item">
            <span>• Double points on weekends</span>
          </div>
          <div className="points-item">
            <span>• Redeem for free items</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Points Display Component
const PointsDisplay = ({ points, phone, onClear }) => {
  const getTier = (points) => {
    if (points >= 1000) return { name: 'Diamond', color: '#e74c3c' };
    if (points >= 500) return { name: 'Gold', color: '#f39c12' };
    if (points >= 100) return { name: 'Silver', color: '#95a5a6' };
    return { name: 'Member', color: '#3498db' };
  };

  const tier = getTier(points);

  return (
    <div className="points-display-section">
      <div className="points-card">
        <div className="points-header">
          <div className="points-info">
            <div className="phone-number">{phone}</div>
            <div className="points-count">{points} points</div>
          </div>
          <div className="tier-badge" style={{ backgroundColor: tier.color }}>
            {tier.name}
          </div>
        </div>
        <div className="points-breakdown">
          <div className="breakdown-item">
            <span>Current Points</span>
            <span>{points}</span>
          </div>
          <div className="breakdown-item">
            <span>Next Reward</span>
            <span>{100 - (points % 100)} to go</span>
          </div>
        </div>
        <button 
          onClick={onClear}
          className="change-number-btn"
        >
          Change Number
        </button>
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
  const [customerPoints, setCustomerPoints] = useState(0);
  
  const orderRefreshRef = useRef(null);

  // Load customer info and points from localStorage
  useEffect(() => {
    if (isCustomerView) {
      const savedCustomer = localStorage.getItem('flavorflow_customer');
      const savedPoints = localStorage.getItem('flavorflow_points');
      
      if (savedCustomer) {
        try {
          const customerData = JSON.parse(savedCustomer);
          setCustomerInfo(customerData);
          
          if (savedPoints) {
            setCustomerPoints(parseInt(savedPoints) || 0);
          }
        } catch (error) {
          localStorage.removeItem('flavorflow_customer');
          localStorage.removeItem('flavorflow_points');
        }
      }
    }
  }, [isCustomerView]);

  // Save customer info and points
  useEffect(() => {
    if (customerInfo && isCustomerView) {
      localStorage.setItem('flavorflow_customer', JSON.stringify(customerInfo));
      localStorage.setItem('flavorflow_points', customerPoints.toString());
    }
  }, [customerInfo, customerPoints, isCustomerView]);

  // Detect table from URL
  useEffect(() => {
    if (isCustomerView) {
      const detectTable = () => {
        let detectedTable = null;
        
        const urlParams = new URLSearchParams(window.location.search);
        detectedTable = urlParams.get('table');
        
        if (!detectedTable && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
          detectedTable = hashParams.get('table');
        }

        if (detectedTable) {
          detectedTable = detectedTable.toString().toUpperCase();
          if (!detectedTable.startsWith('T')) {
            detectedTable = 'T' + detectedTable;
          }
          setSelectedTable(detectedTable);
          loadTableOrders(detectedTable);
          
          if (!customerInfo) {
            setShowRegistration(true);
          }
        } else {
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

  // Auto-refresh orders
  useEffect(() => {
    if (isCustomerView && selectedTable && customerInfo) {
      orderRefreshRef.current = setInterval(() => {
        loadTableOrders(selectedTable);
      }, 10000);
      
      return () => {
        if (orderRefreshRef.current) {
          clearInterval(orderRefreshRef.current);
        }
      };
    }
  }, [isCustomerView, selectedTable, customerInfo]);

  // Load orders for the table (including completed)
  const loadTableOrders = async (tableNumber) => {
    if (!tableNumber) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('https://restaurant-saas-backend-hbdz.onrender.com/api/orders');
      
      if (response.ok) {
        const allOrders = await response.json();
        
        // Include completed orders in the filter
        const tableOrders = allOrders.filter(order => {
          if (!order) return false;
          const orderTable = (order.tableId || order.table || '').toString().toUpperCase();
          const targetTable = tableNumber.toUpperCase();
          const validStatus = ['pending', 'preparing', 'ready', 'completed'].includes(order.status);
          return orderTable === targetTable && validStatus;
        });
        
        const sortedOrders = tableOrders.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.timestamp || 0);
          const dateB = new Date(b.createdAt || b.timestamp || 0);
          return dateB - dateA;
        });
        
        setTableOrders(sortedOrders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration
  const handleRegistrationSubmit = (formData) => {
    const { phone } = formData;
    
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      alert('Please enter a valid phone number (at least 10 digits).');
      return;
    }
    
    const customerData = {
      phone: cleanPhone,
      registeredAt: new Date().toISOString(),
      totalOrders: 0,
      totalSpent: 0
    };
    
    setCustomerInfo(customerData);
    setShowRegistration(false);
  };

  // Clear customer info
  const handleClearCustomer = () => {
    setCustomerInfo(null);
    setCustomerPoints(0);
    localStorage.removeItem('flavorflow_customer');
    localStorage.removeItem('flavorflow_points');
    setShowRegistration(true);
  };

  // Add to cart
  const addToCart = (item) => {
    if (!customerInfo) {
      setShowRegistration(true);
      return;
    }
    
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

  // Calculate points from order total
  const calculateOrderPoints = (total) => {
    const basePoints = Math.floor(total);
    const isWeekend = [0, 6].includes(new Date().getDay());
    return isWeekend ? basePoints * 2 : basePoints;
  };

  // Place order and award points
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    if (!selectedTable) {
      alert('Table not detected.');
      return;
    }

    if (!customerInfo) {
      alert('Please enter your phone number.');
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

      const orderTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const pointsEarned = calculateOrderPoints(orderTotal);

      const result = await onCreateOrder(
        selectedTable, 
        orderData, 
        'dine-in',
        { 
          customerPhone: customerInfo.phone
        }
      );
      
      if (result && result.success !== false) {
        // Award points for purchase
        setCustomerPoints(prev => prev + pointsEarned);

        // Update customer stats
        setCustomerInfo(prev => ({
          ...prev,
          totalOrders: (prev.totalOrders || 0) + 1,
          totalSpent: (prev.totalSpent || 0) + orderTotal
        }));

        setCart([]);
        setCartOpen(false);
        
        setTimeout(() => {
          loadTableOrders(selectedTable);
        }, 1000);
        
        const orderNumber = result.orderNumber || result.data?.orderNumber || 'N/A';
        alert(`Order #${orderNumber} placed!\n+${pointsEarned} points earned`);
      } else {
        throw new Error(result?.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order failed:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  // Get status display with proper styling
  const getStatusDisplay = (status) => {
    const statusConfig = {
      'pending': { label: 'Order Received', color: '#f59e0b', icon: '⏳' },
      'preparing': { label: 'Cooking', color: '#3b82f6', icon: '👨‍🍳' },
      'ready': { label: 'Ready', color: '#10b981', icon: '✅' },
      'completed': { label: 'Completed', color: '#6b7280', icon: '🎉' }
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

  // Format order items with proper data handling
  const formatOrderItems = (items) => {
    if (!items || !Array.isArray(items) || items.length === 0) return 'No items';
    
    return items.map((item, index) => {
      const itemName = item.name || 'Menu Item';
      const quantity = item.quantity || 1;
      const price = item.price ? `RM ${parseFloat(item.price).toFixed(2)}` : '';
      
      return (
        <div key={index} className="order-item-detail">
          <span className="item-name">{itemName} x{quantity}</span>
          {price && <span className="item-price">{price}</span>}
        </div>
      );
    });
  };

  // Format date properly
  const formatOrderTime = (timestamp) => {
    if (!timestamp) return 'Time not available';
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Invalid time';
      
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      return 'Time not available';
    }
  };

  // Format date
  const formatOrderDate = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return '';
    }
  };

  // Calculate order total properly
  const calculateOrderTotal = (order) => {
    if (order.total) return parseFloat(order.total).toFixed(2);
    
    if (order.items && Array.isArray(order.items)) {
      const total = order.items.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 1;
        return sum + (price * quantity);
      }, 0);
      return total.toFixed(2);
    }
    
    return '0.00';
  };

  // Separate orders by status
  const activeOrders = tableOrders.filter(order => 
    order && ['pending', 'preparing', 'ready'].includes(order.status)
  );
  
  const completedOrders = tableOrders.filter(order => 
    order && order.status === 'completed'
  );

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
  const pointsToEarn = calculateOrderPoints(total);

  // CUSTOMER VIEW
  if (isCustomerView) {
    return (
      <div className="customer-view">
        {/* Registration Form */}
        {showRegistration && (
          <RegistrationForm
            selectedTable={selectedTable}
            onRegister={handleRegistrationSubmit}
            onClose={() => setShowRegistration(false)}
          />
        )}

        {/* Header */}
        <header className="customer-header">
          <div className="header-content">
            <h1 className="restaurant-name">FlavorFlow</h1>
            {selectedTable && (
              <div className="table-info">
                Table {selectedTable}
              </div>
            )}
          </div>
          
          {customerInfo && (
            <div className="header-actions">
              <button 
                className="cart-btn"
                onClick={() => setCartOpen(true)}
              >
                Cart ({itemCount})
              </button>
            </div>
          )}
        </header>

        {!selectedTable && (
          <div className="scan-prompt">
            <div className="scan-icon">📱</div>
            <h3>Scan QR Code</h3>
            <p>Scan your table QR code to start ordering</p>
          </div>
        )}

        {/* Points Display */}
        {selectedTable && customerInfo && (
          <PointsDisplay 
            points={customerPoints} 
            phone={customerInfo.phone}
            onClear={handleClearCustomer}
          />
        )}

        {/* Orders Section */}
        {selectedTable && customerInfo && (
          <div className="orders-section">
            <div className="section-header">
              <h2>Your Orders</h2>
              <button 
                onClick={() => loadTableOrders(selectedTable)}
                disabled={isLoading}
                className="refresh-btn"
              >
                {isLoading ? '...' : '↻'}
              </button>
            </div>

            {isLoading ? (
              <div className="loading-state">Loading orders...</div>
            ) : (
              <>
                {/* Active Orders */}
                {activeOrders.length > 0 && (
                  <div className="orders-group">
                    <h3 className="group-title">Active Orders</h3>
                    <div className="orders-list">
                      {activeOrders.map((order, index) => (
                        <div key={order._id || index} className="order-card">
                          <div className="order-header">
                            <div className="order-meta">
                              <span className="order-number">Order #{order.orderNumber}</span>
                              <span className="order-date">
                                {formatOrderDate(order.createdAt || order.timestamp)}
                              </span>
                            </div>
                            {getStatusDisplay(order.status)}
                          </div>
                          
                          <div className="order-items">
                            {formatOrderItems(order.items)}
                          </div>
                          
                          <div className="order-footer">
                            <span className="order-time">
                              {formatOrderTime(order.createdAt || order.timestamp)}
                            </span>
                            <span className="order-total">
                              RM {calculateOrderTotal(order)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Orders */}
                {completedOrders.length > 0 && (
                  <div className="orders-group">
                    <h3 className="group-title">Order History</h3>
                    <div className="orders-list">
                      {completedOrders.map((order, index) => (
                        <div key={order._id || index} className="order-card completed">
                          <div className="order-header">
                            <div className="order-meta">
                              <span className="order-number">Order #{order.orderNumber}</span>
                              <span className="order-date">
                                {formatOrderDate(order.createdAt || order.timestamp)}
                              </span>
                            </div>
                            {getStatusDisplay(order.status)}
                          </div>
                          
                          <div className="order-items">
                            {formatOrderItems(order.items)}
                          </div>
                          
                          <div className="order-footer">
                            <span className="order-time">
                              {formatOrderTime(order.updatedAt || order.createdAt || order.timestamp)}
                            </span>
                            <span className="order-total">
                              RM {calculateOrderTotal(order)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tableOrders.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">📦</div>
                    <p>No orders yet</p>
                    <p className="empty-subtitle">Your orders will appear here</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Menu Section */}
        {selectedTable && customerInfo && (
          <div className="menu-section">
            <div className="search-section">
              <input
                type="text"
                placeholder="Search menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="categories">
              {categories.map(category => (
                <button
                  key={category}
                  className={`category-btn ${activeCategory === category ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            <div className="menu-items">
              {filteredItems.length === 0 ? (
                <div className="no-items">
                  <p>No items found</p>
                </div>
              ) : (
                filteredItems.map(item => (
                  <div key={item.id} className="menu-item">
                    <div className="item-content">
                      <div className="item-details">
                        <h3 className="item-name">{item.name}</h3>
                        <p className="item-description">{item.description}</p>
                        <div className="item-price">RM {item.price.toFixed(2)}</div>
                      </div>
                      <button 
                        className="add-to-cart-btn"
                        onClick={() => addToCart(item)}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Cart Overlay */}
        {cartOpen && (
          <div className="cart-overlay" onClick={() => setCartOpen(false)}>
            <div className="cart-panel" onClick={(e) => e.stopPropagation()}>
              <div className="cart-header">
                <h2>Your Order</h2>
                <button 
                  onClick={() => setCartOpen(false)}
                  className="close-cart"
                >
                  ×
                </button>
              </div>
              
              <div className="cart-content">
                {cart.length === 0 ? (
                  <div className="empty-cart">
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="cart-items">
                      {cart.map(item => (
                        <div key={item.id} className="cart-item">
                          <div className="cart-item-details">
                            <div className="cart-item-name">{item.name}</div>
                            <div className="cart-item-price">RM {item.price.toFixed(2)}</div>
                          </div>
                          <div className="cart-item-controls">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="quantity-btn"
                            >
                              -
                            </button>
                            <span className="quantity">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
                              className="quantity-btn"
                            >
                              +
                            </button>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="remove-btn"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="cart-item-total">
                            RM {(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="cart-summary">
                      <div className="total-line">
                        <span>Total:</span>
                        <span>RM {total.toFixed(2)}</span>
                      </div>
                      <div className="points-line">
                        <span>Points to earn:</span>
                        <span>+{pointsToEarn}</span>
                      </div>
                    </div>
                    
                    <button 
                      className="place-order-btn"
                      onClick={handlePlaceOrder}
                    >
                      Place Order • RM {total.toFixed(2)}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Cart FAB */}
        {isMobile && cart.length > 0 && !cartOpen && selectedTable && customerInfo && (
          <button 
            className="mobile-cart-fab"
            onClick={() => setCartOpen(true)}
          >
            🛒 {itemCount} • RM {total.toFixed(2)}
          </button>
        )}
      </div>
    );
  }

  // ADMIN VIEW (simplified)
  return (
    <div className="admin-view">
      <h2>Menu Management</h2>
      <div className="admin-controls">
        <select 
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
        >
          <option value="">Select Table</option>
          {['T01','T02','T03','T04','T05','T06','T07','T08'].map(table => (
            <option key={table} value={table}>{table}</option>
          ))}
        </select>
      </div>
      
      <div className="menu-items">
        {displayMenu.map(item => (
          <div key={item.id} className="menu-item">
            <div className="item-details">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <div className="item-price">RM {item.price.toFixed(2)}</div>
            </div>
            <button 
              className="add-btn"
              onClick={() => addToCart(item)}
            >
              Add
            </button>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="admin-cart">
          <h3>Order for Table {selectedTable}</h3>
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
            Place Order
          </button>
        </div>
      )}
    </div>
  );
};

export default DigitalMenu;