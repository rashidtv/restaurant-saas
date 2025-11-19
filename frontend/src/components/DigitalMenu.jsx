import React, { useState, useEffect, useRef } from 'react';
import './DigitalMenu.css';

// Purchase-Based Registration Form
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
        <form onSubmit={handleSubmit}>
          <div className="registration-header">
            <h2>Welcome to Table {selectedTable}! 🎉</h2>
            <p>Enter your phone number to earn loyalty points with purchases</p>
          </div>
          
          <div className="form-group">
            <label htmlFor="phone-input">📱 Phone Number *</label>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="e.g., 0123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="form-input"
              required
              autoFocus
            />
            <small>Required to earn points on your orders</small>
          </div>
          
          <div className="registration-actions">
            <button 
              type="submit"
              className="register-btn"
              disabled={!phone.trim()}
            >
              Start Earning Points 🎯
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="skip-btn"
            >
              Skip for Now
            </button>
          </div>
        </form>
        
        <div className="registration-benefits">
          <h4>🎁 Loyalty Points Program</h4>
          <ul>
            <li>✅ <strong>+1 point</strong> for every RM 1 spent</li>
            <li>✅ <strong>Double points</strong> on weekends</li>
            <li>✅ <strong>Birthday bonus</strong> +100 points</li>
            <li>✅ <strong>Redeem points</strong> for free meals & drinks</li>
            <li>✅ <strong>VIP tiers</strong> with exclusive benefits</li>
            <li>✅ <strong>Point milestones</strong> with special rewards</li>
          </ul>
          
          <div className="points-example">
            <strong>Example Order:</strong><br/>
            RM 50 order = <strong>50 points</strong><br/>
            RM 50 order on weekend = <strong>100 points!</strong>
          </div>

          <div className="redemption-info">
            <strong>Redeem Points:</strong><br/>
            100 pts = Free drink 🍹<br/>
            500 pts = Free main course 🍛<br/>
            1000 pts = Free meal for two 👫
          </div>
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
          console.log('✅ Loaded saved customer:', customerData);
          
          // Load points if available
          if (savedPoints) {
            setCustomerPoints(parseInt(savedPoints) || 0);
          }
        } catch (error) {
          console.error('❌ Error loading customer data:', error);
          localStorage.removeItem('flavorflow_customer');
          localStorage.removeItem('flavorflow_points');
        }
      }
    }
  }, [isCustomerView]);

  // Save customer info and points to localStorage
  useEffect(() => {
    if (customerInfo && isCustomerView) {
      localStorage.setItem('flavorflow_customer', JSON.stringify(customerInfo));
      localStorage.setItem('flavorflow_points', customerPoints.toString());
      console.log('💾 Saved customer info and points to localStorage');
    }
  }, [customerInfo, customerPoints, isCustomerView]);

  // Detect table from URL
  useEffect(() => {
    if (isCustomerView) {
      const detectTable = () => {
        console.log('🔍 Detecting table from URL...');
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

  // Load ONLY active orders for the table
  const loadTableOrders = async (tableNumber) => {
    if (!tableNumber) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('https://restaurant-saas-backend-hbdz.onrender.com/api/orders');
      
      if (response.ok) {
        const allOrders = await response.json();
        
        const activeOrders = allOrders.filter(order => {
          if (!order) return false;
          const orderTable = (order.tableId || order.table || '').toString().toUpperCase();
          const targetTable = tableNumber.toUpperCase();
          const isActiveStatus = ['pending', 'preparing', 'ready'].includes(order.status);
          return orderTable === targetTable && isActiveStatus;
        });
        
        const sortedOrders = activeOrders.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.timestamp || 0);
          const dateB = new Date(b.createdAt || b.timestamp || 0);
          return dateB - dateA;
        });
        
        setTableOrders(sortedOrders);
      }
    } catch (error) {
      console.error('❌ Error loading orders:', error);
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
    
    console.log('✅ New customer registered:', customerData);
  };

  // Clear customer info
  const handleClearCustomer = () => {
    console.log('🔄 Clearing customer info...');
    setCustomerInfo(null);
    setCustomerPoints(0);
    localStorage.removeItem('flavorflow_customer');
    localStorage.removeItem('flavorflow_points');
    setShowRegistration(true);
    console.log('✅ Customer info cleared');
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

  // Calculate points from order total (ONLY from purchases)
  const calculateOrderPoints = (total) => {
    const basePoints = Math.floor(total); // 1 point per RM 1 spent
    const isWeekend = [0, 6].includes(new Date().getDay()); // Saturday or Sunday
    const pointsEarned = isWeekend ? basePoints * 2 : basePoints; // Double points on weekends
    
    return pointsEarned;
  };

  // Get customer tier based on points
  const getCustomerTier = (points) => {
    if (points >= 1000) return { name: 'VIP Diamond', color: '#e74c3c', icon: '💎' };
    if (points >= 500) return { name: 'VIP Gold', color: '#f39c12', icon: '🥇' };
    if (points >= 100) return { name: 'VIP Silver', color: '#95a5a6', icon: '🥈' };
    return { name: 'Member', color: '#3498db', icon: '👤' };
  };

  // Place order and award points
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
      alert('Please enter your phone number to earn points on this order.');
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

      console.log('🛒 Placing order for:', customerInfo.phone);
      console.log('💰 Order total:', orderTotal, 'Points to earn:', pointsEarned);
      
      const result = await onCreateOrder(
        selectedTable, 
        orderData, 
        'dine-in',
        { 
          customerPhone: customerInfo.phone
        }
      );
      
      if (result && result.success !== false) {
        // ✅ AWARD POINTS ONLY AFTER SUCCESSFUL PURCHASE
        setCustomerPoints(prev => {
          const newPoints = prev + pointsEarned;
          console.log(`🎯 Awarded ${pointsEarned} points for purchase! Total: ${newPoints}`);
          return newPoints;
        });

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
        const tier = getCustomerTier(customerPoints + pointsEarned);
        
        alert(`✅ Order placed successfully!\n\n📦 Order #: ${orderNumber}\n💰 Total: RM ${orderTotal.toFixed(2)}\n🎯 Points Earned: +${pointsEarned}\n💰 Total Points: ${customerPoints + pointsEarned}\n${tier.icon} Tier: ${tier.name}\n\nYour food will be served soon!`);
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

  // Table Status Component with Points Display
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
            <small>Enter phone to earn points on orders</small>
          </div>
        </div>
      );
    }
    
    const activeOrderCount = tableOrders.length;
    const tier = getCustomerTier(customerPoints);
    
    return (
      <div className="table-success">
        <div className="success-icon">🍽️</div>
        <div className="success-text">
          <strong>Table {selectedTable}</strong>
          <small>
            {customerInfo.phone} • {tier.icon} {tier.name}
          </small>
          <small>
            🎯 {customerPoints} points • {customerInfo.totalOrders || 0} orders
          </small>
          <small>
            {isLoading ? 'Checking...' : 
             activeOrderCount > 0 ? `${activeOrderCount} active order(s)` : 'Ready to order'
            }
          </small>
          <button 
            onClick={handleClearCustomer}
            className="change-customer-btn"
            title="Change phone number"
          >
            🔄
          </button>
        </div>
      </div>
    );
  };

  // Orders History Section
  const OrdersHistorySection = () => {
    if (!selectedTable || !customerInfo) return null;

    const tier = getCustomerTier(customerPoints);

    return (
      <div className="orders-history-section">
        <div className="orders-header">
          <h3>📋 Active Orders - Table {selectedTable}</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div className="points-display" style={{ backgroundColor: tier.color + '20', color: tier.color }}>
              {tier.icon} {customerPoints} pts
            </div>
            <button 
              onClick={() => loadTableOrders(selectedTable)}
              disabled={isLoading}
              className="refresh-orders-btn"
              title="Refresh orders"
            >
              {isLoading ? '🔄' : '🔄'}
            </button>
            <button 
              onClick={handleClearCustomer}
              className="logout-btn"
              title="Change phone"
            >
              📱
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="orders-loading">
            <p>Loading orders...</p>
          </div>
        ) : tableOrders.length === 0 ? (
          <div className="no-orders">
            <p>No active orders for this table</p>
            <small>Place an order to start earning points!</small>
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
    const tier = getCustomerTier(customerPoints);
    const pointsToEarn = calculateOrderPoints(total);

    return (
      <div className="simple-customer-view">
        {/* Purchase-Based Registration Form */}
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
            <p>📱 Please scan your table's QR code to order and earn points</p>
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
                <p>Scan your table's QR code to order and earn loyalty points</p>
              </div>
            </div>
          ) : !customerInfo ? (
            <div className="disabled-overlay">
              <div className="disabled-message">
                <div className="message-icon">🎯</div>
                <h3>Earn Points on Orders</h3>
                <p>Enter your phone number to earn points with every purchase</p>
                <button 
                  onClick={() => setShowRegistration(true)}
                  className="register-prompt-btn"
                >
                  Start Earning Points
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
                  <div className="item-points">
                    🎯 Earn {Math.floor(item.price)} pts when purchased
                  </div>
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
                  <div>📱 {customerInfo.phone}</div>
                  <div style={{ color: tier.color }}>{tier.icon} {tier.name} • {customerPoints} pts</div>
                  <button 
                    onClick={handleClearCustomer}
                    className="change-customer-small"
                  >
                    Change
                  </button>
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
                          <div className="item-points-small">
                            +{Math.floor(item.price * item.quantity)} pts
                          </div>
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
                  
                  <div className="cart-summary">
                    <div className="cart-total">
                      <strong>Total: RM {total.toFixed(2)}</strong>
                    </div>
                    <div className="points-summary">
                      <strong>Points to earn: +{pointsToEarn}</strong>
                      <small>{pointsToEarn > total ? '🎉 Double points weekend!' : '1 point per RM 1 spent'}</small>
                    </div>
                  </div>
                  
                  <button 
                    className="place-order-btn"
                    onClick={handlePlaceOrder}
                  >
                    🎯 Place Order & Earn {pointsToEarn} Points
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
            Order ({itemCount}) - {pointsToEarn} pts
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