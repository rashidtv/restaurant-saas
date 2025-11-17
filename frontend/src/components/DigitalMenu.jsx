import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './DigitalMenu.css';

const DigitalMenu = ({ cart, setCart, onCreateOrder, isMobile, menu, apiConnected, currentTable, isCustomerView = false }) => {
  const [selectedTable, setSelectedTable] = useState(currentTable || '');
  const [activeCategory, setActiveCategory] = useState('all');
  const [orderType, setOrderType] = useState('dine-in');
  const [showPayment, setShowPayment] = useState(false);
  const [tableNumber, setTableNumber] = useState(currentTable || '');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [viewMode, setViewMode] = useState('menu'); // 'menu' or 'orderStatus'
  const [customerOrders, setCustomerOrders] = useState([]);
  const [tableDetected, setTableDetected] = useState(false);


  // Add this at the top of your DigitalMenu component
useEffect(() => {
  console.log('📱 Device Info:', {
    userAgent: navigator.userAgent,
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
  });
  
  // Check if component mounted properly
  console.log('✅ DigitalMenu mounted on iOS');
}, []);

  // CRITICAL: Table detection from QR code
  useEffect(() => {
    const detectTableFromURL = () => {
      console.log('🔍 Scanning URL for table number...');
      
      const url = new URL(window.location.href);
      const hash = window.location.hash;
      const searchParams = url.searchParams;
      
      let detectedTable = null;

      // Check URL search params first
      if (searchParams.has('table')) {
        detectedTable = searchParams.get('table');
        console.log('✅ Table detected from search params:', detectedTable);
      }
      
      // Check URL hash params
      if (hash.includes('?')) {
        const hashParams = new URLSearchParams(hash.split('?')[1]);
        if (hashParams.has('table')) {
          detectedTable = hashParams.get('table');
          console.log('✅ Table detected from hash params:', detectedTable);
        }
      }

      // Check path parameters
      const path = window.location.pathname;
      if (path.includes('/menu/')) {
        const pathParts = path.split('/');
        const tableIndex = pathParts.indexOf('menu') + 1;
        if (tableIndex < pathParts.length && pathParts[tableIndex]) {
          detectedTable = pathParts[tableIndex];
          console.log('✅ Table detected from path:', detectedTable);
        }
      }

      if (detectedTable) {
        setTableNumber(detectedTable);
        setSelectedTable(detectedTable);
        setTableDetected(true);
        console.log('🎯 Table number set to:', detectedTable);
        
        // Check for existing orders for this table
        checkExistingOrders(detectedTable);
      } else {
        console.log('❌ No table number found in URL');
        setTableDetected(false);
      }
    };

    if (isCustomerView) {
      detectTableFromURL();
      
      // Listen for URL changes
      window.addEventListener('hashchange', detectTableFromURL);
      window.addEventListener('popstate', detectTableFromURL);
      
      return () => {
        window.removeEventListener('hashchange', detectTableFromURL);
        window.removeEventListener('popstate', detectTableFromURL);
      };
    }
  }, [isCustomerView]);

  // Check for existing orders when table is detected
  const checkExistingOrders = async (tableNum) => {
    try {
      // In a real app, you would fetch orders from your backend
      // For now, we'll use localStorage to simulate order persistence
      const savedOrders = localStorage.getItem(`table_${tableNum}_orders`);
      if (savedOrders) {
        const orders = JSON.parse(savedOrders);
        setCustomerOrders(orders);
        if (orders.length > 0) {
          setViewMode('orderStatus');
          console.log('📋 Found existing orders:', orders);
        }
      }
    } catch (error) {
      console.log('No existing orders found for table', tableNum);
    }
  };

  // Save order to localStorage (simulate backend)
  const saveOrderToStorage = (order) => {
    try {
      const savedOrders = localStorage.getItem(`table_${selectedTable}_orders`) || '[]';
      const orders = JSON.parse(savedOrders);
      orders.push(order);
      localStorage.setItem(`table_${selectedTable}_orders`, JSON.stringify(orders));
      setCustomerOrders(orders);
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

// iOS-SAFE SEARCH COMPONENT
const SearchComponent = () => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const inputRef = useRef(null);

  // Simple change handler - NO focus management
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    setSearchTerm(value);
  };

  const handleClearSearch = () => {
    setLocalSearchTerm('');
    setSearchTerm('');
  };

  if (!showSearch) return null;

  return (
    <div className="search-section">
      <div className="search-container">
        <input
          ref={inputRef}
          type="search" // Use type="search" for better iOS handling
          placeholder="Search menu..."
          value={localSearchTerm}
          onChange={handleSearchChange}
          className="search-input"
          enterKeyHint="search"
          // REMOVE all touch handlers that might interfere with iOS
        />
        {localSearchTerm && (
          <button 
            className="clear-search"
            onClick={handleClearSearch}
            type="button"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

// DEBUGGABLE DELETE FUNCTION - Replace your current removeFromCart
// SIMPLE DELETE FUNCTION (iOS Safe)
const removeFromCart = (itemId) => {
  console.log('iOS DELETE: Removing item', itemId);
  
  // Simple immutable update
  const updatedCart = cart.filter(item => {
    console.log(`Checking: ${item.id} === ${itemId}? ${item.id === itemId}`);
    return item.id !== itemId;
  });
  
  console.log('Cart before:', cart.length, 'Cart after:', updatedCart.length);
  setCart(updatedCart);
};
// TEST COMPONENT - Add this temporarily to verify functionality
const TestComponent = () => {
  const [testCart, setTestCart] = useState([
    { id: 1, name: 'Test Item 1', price: 10, quantity: 1 },
    { id: 2, name: 'Test Item 2', price: 15, quantity: 2 }
  ]);
  
  const [testSearch, setTestSearch] = useState('');
  
  const testRemoveFromCart = (itemId) => {
    console.log('TEST: Removing item', itemId);
    const updated = testCart.filter(item => item.id !== itemId);
    setTestCart(updated);
  };
  
  return (
    <div style={{ padding: '20px', background: 'white' }}>
      <h3>TEST COMPONENT</h3>
      
      {/* Test Search */}
      <input
        type="text"
        placeholder="Test search input..."
        value={testSearch}
        onChange={(e) => setTestSearch(e.target.value)}
        style={{ padding: '10px', margin: '10px', width: '200px' }}
      />
      
      {/* Test Cart */}
      <div>
        <h4>Test Cart Items:</h4>
        {testCart.map(item => (
          <div key={item.id} style={{ padding: '10px', border: '1px solid #ccc', margin: '5px' }}>
            {item.name} - Qty: {item.quantity}
            <button 
              onClick={() => testRemoveFromCart(item.id)}
              style={{ marginLeft: '10px' }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Add this to your DigitalMenu return temporarily:
// <TestComponent />
  const updateQuantity = (id, change) => {
    const updatedCart = cart.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(0, item.quantity + change) }
        : item
    ).filter(item => item.quantity > 0);
    
    setCart(updatedCart);
  };

  // Add to cart function
  const addToCart = (item) => {
    console.log('🛒 Adding to cart:', item);
    
    const cartItem = {
      id: item._id || item.id,
      _id: item._id || item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      category: item.category,
      description: item.description,
      ...item
    };

    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      const updatedCart = cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
      setCart(updatedCart);
    } else {
      setCart([...cart, cartItem]);
    }

    if (isMobile) {
      setCartOpen(true);
    }
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const serviceTax = subtotal * 0.06;
  const sst = subtotal * 0.08;
  const total = subtotal + serviceTax + sst;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Order Status View Component
  const OrderStatusView = () => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'pending': return '#f59e0b';
        case 'preparing': return '#3b82f6';
        case 'ready': return '#10b981';
        case 'completed': return '#6b7280';
        default: return '#6b7280';
      }
    };

    const getStatusText = (status) => {
      switch (status) {
        case 'pending': return 'Order Received';
        case 'preparing': return 'Being Prepared';
        case 'ready': return 'Ready for Pickup';
        case 'completed': return 'Completed';
        default: return status;
      }
    };

    return (
      <div className="order-status-view">
        <header className="premium-header">
          <div className="header-content">
            <div className="restaurant-info">
              <div className="restaurant-logo">🍛</div>
              <div className="restaurant-text">
                <h1 className="restaurant-name">FlavorFlow</h1>
                <p className="restaurant-tagline">Your Order Status</p>
              </div>
            </div>
            
            <div className="header-actions">
              <div className="table-info">
                <span className="table-label">Table</span>
                <span className="table-number">{selectedTable || '--'}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="status-main">
          <div className="status-header">
            <h2>Your Orders</h2>
            <p>Table {selectedTable}</p>
          </div>

          {customerOrders.length === 0 ? (
            <div className="empty-orders">
              <div className="empty-icon">📝</div>
              <h3>No Orders Found</h3>
              <p>You haven't placed any orders yet</p>
              <button 
                className="browse-menu-btn"
                onClick={() => setViewMode('menu')}
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div className="orders-list">
              {customerOrders.map((order, index) => (
                <div key={order._id || order.id || index} className="order-card">
                  <div className="order-header">
                    <div className="order-info">
                      <h3>Order #{order.orderNumber || `T${selectedTable}-${index + 1}`}</h3>
                      <p className="order-time">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Just now'}
                      </p>
                    </div>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {getStatusText(order.status || 'pending')}
                    </span>
                  </div>

                  <div className="order-items">
                    {order.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="order-item">
                        <div className="item-info">
                          <span className="item-quantity">{item.quantity}x</span>
                          <span className="item-name">{item.name}</span>
                        </div>
                        <span className="item-price">RM {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="order-footer">
                    <div className="order-total">
                      <strong>Total: RM {order.total ? order.total.toFixed(2) : total.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="status-actions">
            <button 
              className="add-more-btn"
              onClick={() => setViewMode('menu')}
            >
              Add More Items
            </button>
          </div>
        </main>
      </div>
    );
  };

  // PREMIUM CUSTOMER VIEW COMPONENT
  const PremiumCustomerView = () => {
    const [localCartOpen, setLocalCartOpen] = useState(false);
    const [recentlyAdded, setRecentlyAdded] = useState(null);

    // Show table detection warning if no table found
    if (!tableDetected) {
      return (
        <div className="table-detection-view">
          <div className="detection-content">
            <div className="detection-icon">🔍</div>
            <h2>Table Not Detected</h2>
            <p>Please scan the QR code provided on your table to access the menu.</p>
            <div className="detection-help">
              <p><strong>If you're having issues:</strong></p>
              <ul>
                <li>Make sure you scanned the correct QR code</li>
                <li>Check your internet connection</li>
                <li>Ask staff for assistance</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    // Food category emojis and colors
    const categoryConfig = {
      'all': { emoji: '🍽️', color: '#6366f1', name: 'All Items' },
      'appetizers': { emoji: '🥗', color: '#10b981', name: 'Appetizers' },
      'main-course': { emoji: '🍛', color: '#f59e0b', name: 'Main Course' },
      'desserts': { emoji: '🍰', color: '#ec4899', name: 'Desserts' },
      'beverages': { emoji: '🥤', color: '#3b82f6', name: 'Beverages' },
      'specials': { emoji: '⭐', color: '#8b5cf6', name: 'Specials' }
    };

    const handleItemAdd = (item) => {
      addToCart(item);
      setRecentlyAdded(item.id);
      setTimeout(() => setRecentlyAdded(null), 2000);
    };

    const handlePlaceOrderCustomer = async () => {
      if (cart.length === 0) {
        alert('Your cart is empty');
        return;
      }

      if (!selectedTable) {
        alert('Table number not detected. Please scan the QR code again.');
        return;
      }

      try {
        const orderData = cart.map(item => ({
          menuItemId: item._id || item.id,
          _id: item._id || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category
        }));

        console.log('📦 Placing order for table:', selectedTable);
        
        const result = await onCreateOrder(selectedTable, orderData, 'dine-in');
        
        // Save order to local storage and switch to status view
        const orderWithTable = {
          ...result,
          table: selectedTable,
          status: 'pending',
          total: total
        };
        
        saveOrderToStorage(orderWithTable);
        setCart([]);
        setLocalCartOpen(false);
        setViewMode('orderStatus');
        
        console.log('✅ Order placed successfully:', result);
      } catch (error) {
        console.error('❌ Order failed:', error);
        alert('Order failed: ' + error.message);
      }
    };

    const handleCartToggle = (open) => {
      setLocalCartOpen(open);
    };

    const handleCloseCart = () => {
      setLocalCartOpen(false);
    };

    // Get categories from menu
    const categories = ['all', ...new Set(menu.map(item => item.category).filter(Boolean))];
    
    // Filter items based on active category and search
    const filteredItems = menu.filter(item => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    // Calculate totals for customer view
    const customerSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const customerTax = customerSubtotal * 0.14;
    const customerTotal = customerSubtotal + customerTax;

    // Menu Item Card Component
    const PremiumMenuItem = ({ item }) => {
      const isRecentlyAdded = recentlyAdded === item.id;
      
      return (
        <div className={`premium-menu-item ${isRecentlyAdded ? 'item-added' : ''}`}>
          <div className="item-image-container">
            <div className="item-image" style={{ background: categoryConfig[item.category]?.color || '#6366f1' }}>
              <span className="item-emoji">{item.image || '🍽️'}</span>
              {item.popular && <div className="popular-badge">🔥 Popular</div>}
              {item.spicy && <div className="spicy-badge">🌶️ Spicy</div>}
            </div>
            <button 
              className="add-btn"
              onClick={() => handleItemAdd(item)}
              type="button"
            >
              <span className="add-icon">+</span>
            </button>
          </div>
          
          <div className="item-content">
            <div className="item-header">
              <h3 className="item-name">{item.name}</h3>
              <div className="item-price">RM {item.price}</div>
            </div>
            <p className="item-description">{item.description}</p>
            <div className="item-meta">
              <span className="prep-time">⏱️ {item.prepTime || 15} min</span>
              {item.calories && <span className="calories">🔥 {item.calories} cal</span>}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="premium-customer-view">
        {/* Header */}
        <header className="premium-header">
          <div className="header-background"></div>
          <div className="header-content">
            <div className="restaurant-info">
              <div className="restaurant-logo">🍛</div>
              <div className="restaurant-text">
                <h1 className="restaurant-name">FlavorFlow</h1>
                <p className="restaurant-tagline">Authentic Flavors • Premium Experience</p>
              </div>
            </div>
            
            <div className="header-actions">
              <div className="table-info">
                <span className="table-label">Table</span>
                <span className="table-number">{selectedTable || '--'}</span>
              </div>
              
              <div className="action-buttons">
                <button 
                  className="search-btn"
                  onClick={() => setShowSearch(!showSearch)}
                  type="button"
                >
                  🔍
                </button>
                <button 
                  className="cart-indicator"
                  onClick={() => handleCartToggle(true)}
                  type="button"
                >
                  <span className="cart-icon">🛒</span>
                  {cart.length > 0 && (
                    <span className="cart-count">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Search Component */}
        <SearchComponent />

        {/* View Orders Button */}
        {customerOrders.length > 0 && (
          <div className="view-orders-bar">
            <button 
              className="view-orders-btn"
              onClick={() => setViewMode('orderStatus')}
            >
              📋 View My Orders ({customerOrders.length})
            </button>
          </div>
        )}

        {/* Categories */}
        <section className="categories-section">
          <div className="categories-scroll">
            {categories.map(category => {
              const config = categoryConfig[category] || { emoji: '🍽️', color: '#6366f1', name: category };
              return (
                <button
                  key={category}
                  className={`category-card ${activeCategory === category ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category)}
                  style={{ '--category-color': config.color }}
                  type="button"
                >
                  <div className="category-emoji">{config.emoji}</div>
                  <span className="category-name">{config.name}</span>
                  <div className="category-count">
                    {category === 'all' ? menu.length : menu.filter(item => item.category === category).length}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Menu Items */}
        <main className="menu-main">
          <div className="menu-header">
            <h2 className="section-title">
              {activeCategory === 'all' ? 'Our Menu' : categoryConfig[activeCategory]?.name}
            </h2>
            <p className="section-subtitle">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} available
            </p>
          </div>

          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🍽️</div>
              <h3>No items found</h3>
              <p>Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="premium-menu-grid">
              {filteredItems.map(item => (
                <PremiumMenuItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </main>

        {/* Cart Sidebar */}
        <div 
          className={`premium-cart-sidebar ${localCartOpen ? 'open' : ''}`}
        >
          <div className="cart-header">
            <div className="cart-title-section">
              <h3>Your Order</h3>
              <p>Table {selectedTable}</p>
            </div>
            <button 
              className="close-cart"
              onClick={handleCloseCart}
              type="button"
            >
              ✕
            </button>
          </div>

          <div className="cart-content">
            {cart.length === 0 ? (
              <div className="empty-cart-state">
                <div className="empty-cart-icon">🛒</div>
                <h4>Your cart is empty</h4>
                <p>Add delicious items from our menu</p>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="item-details">
                        <div className="item-main">
                          <h4 className="item-title">{item.name}</h4>
                          <p className="item-price">RM {item.price}</p>
                        </div>
                        <div className="item-controls">
                          <div className="quantity-controls">
                            <button 
                              className="qty-btn minus"
                              onClick={() => updateQuantity(item.id, -1)}
                              type="button"
                            >
                              −
                            </button>
                            <span className="quantity">{item.quantity}</span>
                            <button 
                              className="qty-btn plus"
                              onClick={() => updateQuantity(item.id, 1)}
                              type="button"
                            >
                              +
                            </button>
                          </div>
                          <button 
                            className="remove-item"
                            onClick={() => removeFromCart(item.id)}
                            type="button"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="item-total">
                        RM {(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <div className="summary-line">
                    <span>Subtotal</span>
                    <span>RM {customerSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-line">
                    <span>Tax & Service</span>
                    <span>RM {customerTax.toFixed(2)}</span>
                  </div>
                  <div className="total-line">
                    <span>Total</span>
                    <span className="total-amount">RM {customerTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  className="checkout-button"
                  onClick={handlePlaceOrderCustomer}
                  type="button"
                >
                  <span className="checkout-text">Place Order</span>
                  <span className="checkout-price">RM {customerTotal.toFixed(2)}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Cart FAB */}
        {isMobile && cart.length > 0 && !localCartOpen && (
          <button 
            className="mobile-cart-fab"
            onClick={() => handleCartToggle(true)}
            type="button"
          >
            <span className="fab-icon">🛒</span>
            <span className="fab-count">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
            <span className="fab-text">View Order</span>
          </button>
        )}

        {/* Overlay */}
        {localCartOpen && (
          <div 
            className="cart-overlay"
            onClick={handleCloseCart}
          />
        )}
      </div>
    );
  };

  // ADMIN VIEW (for staff)
  const AdminView = () => {
    // ... (keep your existing admin view code)
    return (
      <div className="digital-menu-modern">
        <div className="menu-header-modern">
          <div className="menu-header-content-modern">
            <div className="menu-title-section-modern">
              <h2 className="menu-title-modern">Menu Management</h2>
              <p className="menu-subtitle-modern">Staff View - All Tables</p>
            </div>
          </div>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Staff administration view for managing all tables and orders</p>
        </div>
      </div>
    );
  };

  // MAIN RENDER
  return (
    <div className="digital-menu-modern">
      {isCustomerView ? (
        viewMode === 'orderStatus' ? (
          <OrderStatusView />
        ) : (
          <PremiumCustomerView />
        )
      ) : (
        <AdminView />
      )}
    </div>
  );
};

export default DigitalMenu;