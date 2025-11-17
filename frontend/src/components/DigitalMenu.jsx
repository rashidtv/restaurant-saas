import React, { useState, useEffect, useRef } from 'react';
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
  
  // Universal mobile states
  const [activeOrder, setActiveOrder] = useState(null);
  const [viewMode, setViewMode] = useState('menu');
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [touchStart, setTouchStart] = useState(null);

  // Universal mobile detection
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Universal touch device detection
    const checkTouchDevice = () => {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(isTouch);
      console.log('📱 Touch device detected:', isTouch);
    };

    checkTouchDevice();
    window.addEventListener('touchstart', checkTouchDevice);
    
    return () => window.removeEventListener('touchstart', checkTouchDevice);
  }, []);

  // Universal table detection
  useEffect(() => {
    const detectTableFromURL = () => {
      console.log('🔍 Universal table detection...');
      
      const url = new URL(window.location.href);
      const searchParams = url.searchParams;
      const hash = window.location.hash;
      const pathname = window.location.pathname;
      
      let detectedTable = null;

      // Universal URL parameter detection
      if (searchParams.has('table')) {
        detectedTable = searchParams.get('table');
      } else if (hash.includes('table=')) {
        const hashMatch = hash.match(/table=([^&]+)/);
        detectedTable = hashMatch ? hashMatch[1] : null;
      } else if (pathname.includes('/table/')) {
        const pathMatch = pathname.match(/\/table\/([^\/]+)/);
        detectedTable = pathMatch ? pathMatch[1] : null;
      }

      // Clean table number
      if (detectedTable) {
        detectedTable = detectedTable.toString().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        console.log('🎯 Table detected:', detectedTable);
        
        setTableNumber(detectedTable);
        setSelectedTable(detectedTable);
      } else {
        console.log('❌ No table detected in URL');
      }
    };

    if (isCustomerView) {
      detectTableFromURL();
      
      // Universal event listeners
      const events = ['hashchange', 'popstate', 'load'];
      events.forEach(event => window.addEventListener(event, detectTableFromURL));
      
      return () => {
        events.forEach(event => window.removeEventListener(event, detectTableFromURL));
      };
    }
  }, [isCustomerView]);

  // Universal search component
  const SearchComponent = () => {
    const searchInputRef = useRef(null);

    useEffect(() => {
      if (showSearch && searchInputRef.current) {
        // Universal focus with fallbacks
        const focusInput = () => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
            // Universal mobile input attributes
            searchInputRef.current.setAttribute('inputmode', 'search');
            searchInputRef.current.setAttribute('enterkeyhint', 'search');
          }
        };

        // Multiple focus attempts for different devices
        setTimeout(focusInput, 50);
        setTimeout(focusInput, 200);
      }
    }, [showSearch]);

    const handleSearchChange = (e) => {
      const value = e.target.value;
      setSearchTerm(value);
    };

    const handleClearSearch = () => {
      setSearchTerm('');
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    };

    const handleSearchSubmit = (e) => {
      e.preventDefault();
      return false;
    };

    if (!showSearch) return null;

    return (
      <div className="search-section">
        <div className="search-container">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
              // Universal mobile attributes
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck="false"
              inputMode="search"
              enterKeyHint="search"
            />
            {searchTerm && (
              <button 
                type="button"
                className="clear-search"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </form>
        </div>
      </div>
    );
  };

  // Universal search toggle
  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchTerm('');
    }
  };

  // Universal cart management
  const removeFromCart = React.useCallback((itemId) => {
    console.log('🗑️ Removing item:', itemId);
    
    const updatedCart = cart.filter(item => item.id !== itemId);
    setCart(updatedCart);
    
    // Universal: Keep cart open after deletion
    if (updatedCart.length === 0 && isMobile) {
      setCartOpen(false); // Only close if cart becomes empty on mobile
    }
  }, [cart, setCart, isMobile]);

  const updateQuantity = React.useCallback((id, change) => {
    const updatedCart = cart.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(0, item.quantity + change) }
        : item
    ).filter(item => item.quantity > 0);
    
    setCart(updatedCart);
  }, [cart, setCart]);

  const addToCart = React.useCallback((item) => {
    console.log('🛒 Adding to cart:', item.name);
    
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

    // Universal: Auto-open cart on mobile, but respect user preference
    if (isMobile && !cartOpen) {
      setTimeout(() => setCartOpen(true), 300);
    }
  }, [cart, isMobile, cartOpen, setCart]);

  // Universal cart handlers
  const toggleCart = () => {
    setCartOpen(!cartOpen);
  };

  const handleCartClose = () => {
    setCartOpen(false);
  };

  // Universal order placement
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty. Please add some items first.');
      return;
    }

    const finalTableNumber = tableNumber || selectedTable;
    
    if (!finalTableNumber && isCustomerView) {
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

      const result = await onCreateOrder(finalTableNumber, orderData, 'dine-in');
      
      setCart([]);
      setCartOpen(false);
      setOrderSuccess(true);
      
      setTimeout(() => setOrderSuccess(false), 5000);
      
      alert(`Order placed! Order number: ${result.orderNumber}`);
      
    } catch (error) {
      console.error('❌ Order failed:', error);
      alert('Failed to place order: ' + error.message);
    }
  };

  // Universal Order Status Component
  const OrderStatusView = ({ order, onAddMoreItems, onBackToMenu }) => {
    const getStatusInfo = (status) => {
      const statusMap = {
        'pending': { color: '#f59e0b', text: 'Order Received', emoji: '⏳' },
        'preparing': { color: '#3b82f6', text: 'Being Prepared', emoji: '👨‍🍳' },
        'ready': { color: '#10b981', text: 'Ready', emoji: '✅' },
        'completed': { color: '#6b7280', text: 'Completed', emoji: '🎉' }
      };
      return statusMap[status] || { color: '#6b7280', text: status, emoji: '📦' };
    };

    const getItemStatus = (item) => {
      return item.status === 'preparing' ? '👨‍🍳 Preparing' : 
             item.status === 'ready' ? '✅ Ready' : '⏳ Pending';
    };

    const calculateTimeRemaining = () => {
      if (!order.estimatedReady) return 'Calculating...';
      const now = new Date();
      const estimated = new Date(order.estimatedReady);
      const diffMs = estimated - now;
      const diffMins = Math.max(0, Math.ceil(diffMs / 60000));
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
    };

    const statusInfo = getStatusInfo(order.status);

    return (
      <div className="order-status-view">
        <div className="status-main">
          <div className="status-header">
            <h2>Your Order Status</h2>
            <p>Table {order.table} • {order.orderNumber}</p>
          </div>

          <div className="order-card">
            <div className="order-header">
              <div className="order-info">
                <h3>Current Status</h3>
                <p className="order-time">
                  Ordered at {new Date(order.orderedAt).toLocaleTimeString()}
                </p>
              </div>
              <div 
                className="status-badge"
                style={{ backgroundColor: statusInfo.color }}
              >
                <span className="status-emoji">{statusInfo.emoji}</span>
                {statusInfo.text}
              </div>
            </div>

            <div className="order-items">
              <h4 className="items-title">Order Items</h4>
              {order.items.map((item, index) => (
                <div key={index} className="order-item">
                  <div className="item-info">
                    <span className="item-quantity">{item.quantity}x</span>
                    <span className="item-name">{item.menuItem.name}</span>
                  </div>
                  <div className="item-status">
                    <span className={`status-${item.status}`}>
                      {getItemStatus(item)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-footer">
              <div className="order-total">
                <strong>Total: RM {order.total.toFixed(2)}</strong>
              </div>
              {order.status !== 'completed' && (
                <div className="time-remaining">
                  <span className="time-icon">⏱️</span>
                  Estimated ready in: {calculateTimeRemaining()}
                </div>
              )}
            </div>
          </div>

          <div className="status-actions">
            <button 
              className="btn-primary"
              onClick={onAddMoreItems}
            >
              <span className="btn-icon">+</span>
              Add More Items
            </button>
            <button 
              className="btn-secondary"
              onClick={onBackToMenu}
            >
              <span className="btn-icon">←</span>
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Universal Customer View
  const PremiumCustomerView = () => {
    const [localCartOpen, setLocalCartOpen] = useState(false);
    const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
    const [recentlyAdded, setRecentlyAdded] = useState(null);

    // Universal category configuration
    const categoryConfig = {
      'all': { emoji: '🍽️', color: '#6366f1', name: 'All Items' },
      'drinks': { emoji: '🥤', color: '#3b82f6', name: 'Drinks' },
      'main': { emoji: '🍛', color: '#f59e0b', name: 'Main Course' },
      'desserts': { emoji: '🍰', color: '#ec4899', name: 'Desserts' },
      'appetizers': { emoji: '🥗', color: '#10b981', name: 'Appetizers' },
      'specials': { emoji: '⭐', color: '#8b5cf6', name: 'Specials' }
    };

    // Universal view handlers
    const handleAddMoreItems = () => {
      setViewMode('menu');
      setLocalCartOpen(false);
    };

    const handleBackToMenu = () => {
      setViewMode('menu');
    };

    const handleViewOrderStatus = () => {
      if (activeOrder) {
        setViewMode('order-status');
      }
    };

    // Show order status if selected
    if (viewMode === 'order-status' && activeOrder) {
      return (
        <OrderStatusView 
          order={activeOrder}
          onAddMoreItems={handleAddMoreItems}
          onBackToMenu={handleBackToMenu}
        />
      );
    }

    const handleItemAdd = (item) => {
      addToCart(item);
      setRecentlyAdded(item.id);
      setTimeout(() => setRecentlyAdded(null), 1500);
    };

    const handlePlaceOrderCustomer = async () => {
      if (cart.length === 0) {
        alert('Your cart is empty');
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

        const result = await onCreateOrder(selectedTable, orderData, 'dine-in');
        setCart([]);
        setLocalCartOpen(false);
        setShowOrderConfirmation(true);
        
      } catch (error) {
        alert('Order failed: ' + error.message);
      }
    };

    const handleCartToggle = (open) => {
      setLocalCartOpen(open);
    };

    const handleCloseCart = () => {
      setLocalCartOpen(false);
    };

    // Universal menu data
    const categories = ['all', ...new Set((menu || []).map(item => item.category).filter(Boolean))];
    
    const filteredItems = (menu || []).filter(item => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch = searchTerm === '' || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    // Universal totals calculation
    const customerSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const customerTax = customerSubtotal * 0.14;
    const customerTotal = customerSubtotal + customerTax;

    // Universal Menu Item Component
    const PremiumMenuItem = ({ item }) => {
      const isRecentlyAdded = recentlyAdded === item.id;
      
      return (
        <div className={`premium-menu-item ${isRecentlyAdded ? 'item-added' : ''}`}>
          <div className="item-image-container">
            <div className="item-image" style={{ background: categoryConfig[item.category]?.color || '#6366f1' }}>
              <span className="item-emoji">{item.image || '🍽️'}</span>
              {item.popular && <div className="item-badge popular">Popular</div>}
              {item.spicy && <div className="item-badge spicy">Spicy</div>}
            </div>
            <button 
              className="add-btn"
              onClick={() => handleItemAdd(item)}
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

    // Universal Order Confirmation
    const OrderConfirmation = () => (
      <div className="order-confirmation-overlay">
        <div className="order-confirmation">
          <div className="confirmation-icon">🎉</div>
          <h2>Order Confirmed!</h2>
          <p>Your order has been placed successfully.</p>
          <div className="order-details">
            <p><strong>Table:</strong> {selectedTable}</p>
            <p><strong>Items:</strong> {cart.reduce((sum, item) => sum + item.quantity, 0)}</p>
            <p><strong>Total:</strong> RM {customerTotal.toFixed(2)}</p>
          </div>
          <button 
            className="btn-primary"
            onClick={() => setShowOrderConfirmation(false)}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );

    return (
      <div className="premium-customer-view">
        {/* Universal Header */}
        <header className="premium-header">
          <div className="header-content">
            <div className="restaurant-info">
              <div className="restaurant-logo">🍛</div>
              <div className="restaurant-text">
                <h1 className="restaurant-name">FlavorFlow</h1>
                <p className="restaurant-tagline">Delicious Food • Great Experience</p>
              </div>
            </div>
            
            <div className="header-actions">
              <div className="table-info">
                <span className="table-label">Table</span>
                <span className="table-number">{selectedTable || '--'}</span>
              </div>
              
              <div className="action-buttons">
                <button 
                  className="icon-btn"
                  onClick={handleSearchToggle}
                >
                  <span className="btn-emoji">🔍</span>
                </button>
                
                {activeOrder && (
                  <button 
                    className="icon-btn status"
                    onClick={handleViewOrderStatus}
                  >
                    <span className="btn-emoji">📦</span>
                  </button>
                )}
                
                <button 
                  className="icon-btn cart"
                  onClick={() => handleCartToggle(true)}
                >
                  <span className="btn-emoji">🛒</span>
                  {cart.length > 0 && (
                    <span className="cart-badge">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Universal Search */}
        <SearchComponent />

        {/* Universal Categories */}
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
                >
                  <div className="category-emoji">{config.emoji}</div>
                  <span className="category-name">{config.name}</span>
                  <div className="category-count">
                    {category === 'all' ? (menu || []).length : (menu || []).filter(item => item.category === category).length}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Universal Menu Items */}
        <main className="menu-main">
          <div className="menu-header">
            <h2 className="section-title">
              {activeCategory === 'all' ? 'Our Menu' : categoryConfig[activeCategory]?.name}
            </h2>
            <p className="section-subtitle">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} available
              {searchTerm && ` for "${searchTerm}"`}
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
                <PremiumMenuItem key={item._id || item.id} item={item} />
              ))}
            </div>
          )}
        </main>

        {/* Universal Cart */}
        <div 
          className={`premium-cart-sidebar ${localCartOpen ? 'open' : ''}`}
        >
          <div className="cart-header">
            <div className="cart-title-section">
              <h3>Your Order</h3>
              <p>Table {selectedTable}</p>
            </div>
            <button 
              className="close-btn"
              onClick={handleCloseCart}
            >
              ✕
            </button>
          </div>

          <div className="cart-content">
            {cart.length === 0 ? (
              <div className="empty-cart-state">
                <div className="empty-icon">🛒</div>
                <h4>Your cart is empty</h4>
                <p>Add items from the menu</p>
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
                              className="qty-btn"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              −
                            </button>
                            <span className="quantity">{item.quantity}</span>
                            <button 
                              className="qty-btn"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              +
                            </button>
                          </div>
                          <button 
                            className="remove-btn"
                            onClick={() => removeFromCart(item.id)}
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
                  className="checkout-btn"
                  onClick={handlePlaceOrderCustomer}
                >
                  <span className="btn-text">Place Order</span>
                  <span className="btn-price">RM {customerTotal.toFixed(2)}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Universal Mobile FAB */}
        {isMobile && cart.length > 0 && !localCartOpen && (
          <button 
            className="mobile-fab"
            onClick={() => handleCartToggle(true)}
          >
            <span className="fab-icon">🛒</span>
            <span className="fab-count">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
            <span className="fab-text">View Cart</span>
          </button>
        )}

        {/* Universal Overlay */}
        {localCartOpen && (
          <div 
            className="overlay"
            onClick={handleCloseCart}
          />
        )}

        {/* Universal Confirmation */}
        {showOrderConfirmation && <OrderConfirmation />}
      </div>
    );
  };

  // Universal Admin View (simplified for demo)
  const AdminView = () => {
    return (
      <div className="admin-view">
        <div className="admin-header">
          <h2>Menu Management</h2>
          <p>Staff View - Table {selectedTable || 'Not Selected'}</p>
        </div>
        <div className="admin-content">
          <p>Admin interface would go here with full functionality</p>
        </div>
      </div>
    );
  };

  // Universal Main Render
  return (
    <div className="digital-menu">
      {isCustomerView ? <PremiumCustomerView /> : <AdminView />}
    </div>
  );
};

export default DigitalMenu;