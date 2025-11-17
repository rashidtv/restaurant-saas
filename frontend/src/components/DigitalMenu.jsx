import React, { useState, useEffect, useRef, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './DigitalMenu.css';

const DigitalMenu = ({ cart, setCart, onCreateOrder, isMobile, menu = [], apiConnected, currentTable, isCustomerView = false }) => {
  // ----- state -----
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

  // ----- defensive wrappers -----
  // Ensure we always have arrays (protect against parent passing null)
  const safeMenu = Array.isArray(menu) ? menu : [];
  const safeCart = Array.isArray(cart) ? cart : [];

  // Normalize menu items so each has an `id` field (useMemo for perf)
  const menuItems = useMemo(() => {
    return safeMenu.map(it => {
      const id = (it && (it.id || it._id)) || Math.random().toString(36).slice(2, 9);
      return { ...it, id };
    });
  }, [safeMenu]);

  // ----- mount debug -----
  useEffect(() => {
    console.log('📱 Device Info:', {
      userAgent: navigator.userAgent,
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
      isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
    });
    console.log('✅ DigitalMenu mounted');
  }, []);

  // ----- Table detection (from QR link) -----
  useEffect(() => {
    const detectTableFromURL = () => {
      try {
        console.log('🔍 Scanning URL for table number...');
        const url = new URL(window.location.href);
        const hash = window.location.hash || '';
        const searchParams = url.searchParams;
        let detectedTable = null;

        if (searchParams.has('table')) {
          detectedTable = searchParams.get('table');
          console.log('✅ Table detected from search params:', detectedTable);
        }

        if (!detectedTable && hash.includes('?')) {
          const hashParams = new URLSearchParams(hash.split('?')[1]);
          if (hashParams.has('table')) {
            detectedTable = hashParams.get('table');
            console.log('✅ Table detected from hash params:', detectedTable);
          }
        }

        if (!detectedTable) {
          const path = window.location.pathname || '';
          const parts = path.split('/').filter(Boolean);
          const menuIdx = parts.indexOf('menu');
          if (menuIdx !== -1 && parts[menuIdx + 1]) {
            detectedTable = parts[menuIdx + 1];
            console.log('✅ Table detected from /menu/ path:', detectedTable);
          } else {
            const tableIdx = parts.indexOf('table');
            if (tableIdx !== -1 && parts[tableIdx + 1]) {
              detectedTable = parts[tableIdx + 1];
              console.log('✅ Table detected from /table/ path:', detectedTable);
            }
          }
        }

        if (detectedTable) {
          setTableNumber(detectedTable);
          setSelectedTable(detectedTable);
          setTableDetected(true);
          console.log('🎯 Table number set to:', detectedTable);
          checkExistingOrders(detectedTable);
        } else {
          console.log('❌ No table number found in URL');
          setTableDetected(false);
        }
      } catch (err) {
        console.error('Error detecting table from URL', err);
        setTableDetected(false);
      }
    };

    if (isCustomerView) {
      detectTableFromURL();
      window.addEventListener('hashchange', detectTableFromURL);
      window.addEventListener('popstate', detectTableFromURL);
      return () => {
        window.removeEventListener('hashchange', detectTableFromURL);
        window.removeEventListener('popstate', detectTableFromURL);
      };
    }
  }, [isCustomerView]);

  // ----- local orders (simulate backend) -----
  const checkExistingOrders = async (tableNum) => {
    try {
      const key = `table_${tableNum}_orders`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const orders = JSON.parse(saved);
        setCustomerOrders(orders || []);
        if ((orders || []).length > 0) {
          setViewMode('orderStatus');
          console.log('📋 Found existing orders:', orders);
        }
      }
    } catch (error) {
      console.log('No existing orders found for table', tableNum);
    }
  };

  const saveOrderToStorage = (order) => {
    try {
      const key = `table_${selectedTable}_orders`;
      const savedOrders = localStorage.getItem(key) || '[]';
      const orders = JSON.parse(savedOrders);
      orders.push(order);
      localStorage.setItem(key, JSON.stringify(orders));
      setCustomerOrders(orders);
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  // ----- Search component (iOS safe) -----
  const SearchComponent = () => {
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
    const inputRef = useRef(null);

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
            type="search"
            placeholder="Search menu..."
            value={localSearchTerm}
            onChange={handleSearchChange}
            className="search-input"
            enterKeyHint="search"
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

  // ----- Cart utilities (defensive reads use safeCart) -----
  const removeFromCart = (itemId) => {
    console.log('REMOVE: Removing item', itemId);
    const updatedCart = safeCart.filter(item => item.id !== itemId);
    console.log('Cart before:', safeCart.length, 'Cart after:', updatedCart.length);
    setCart(updatedCart);
  };

  const updateQuantity = (id, change) => {
    const updatedCart = (safeCart || []).map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(0, (item.quantity || 0) + change) }
        : item
    ).filter(item => (item.quantity || 0) > 0);
    setCart(updatedCart);
  };

  const addToCart = (item) => {
    const id = item.id; // normalized id from menuItems
    console.log('🛒 Adding to cart:', { id, name: item.name });

    const cartItem = {
      id,
      _id: id,
      name: item.name,
      price: item.price || 0,
      quantity: 1,
      category: item.category,
      description: item.description,
      ...item
    };

    const existingItem = safeCart.find(ci => ci.id === id);

    if (existingItem) {
      const updatedCart = safeCart.map(ci =>
        ci.id === id
          ? { ...ci, quantity: (ci.quantity || 0) + 1 }
          : ci
      );
      setCart(updatedCart);
    } else {
      setCart([...(safeCart || []), cartItem]);
    }

    if (isMobile) setCartOpen(true);
  };

  // ----- Totals & counts (use safeCart) -----
  const subtotal = (safeCart || []).reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
  const serviceTax = subtotal * 0.06;
  const sst = subtotal * 0.08;
  const total = subtotal + serviceTax + sst;
  const itemCount = (safeCart || []).reduce((sum, item) => sum + (item.quantity || 0), 0);

  // ----- Order Status View -----
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
                    {(order.items || []).map((item, itemIndex) => (
                      <div key={itemIndex} className="order-item">
                        <div className="item-info">
                          <span className="item-quantity">{item.quantity}x</span>
                          <span className="item-name">{item.name}</span>
                        </div>
                        <span className="item-price">RM {((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
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

  // ----- Premium Customer View -----
  const PremiumCustomerView = () => {
    const [localCartOpen, setLocalCartOpen] = useState(false);
    const [recentlyAdded, setRecentlyAdded] = useState(null);

    const handleCartToggle = (open) => setLocalCartOpen(open);
    const handleCloseCart = () => setLocalCartOpen(false);

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
      if ((safeCart || []).length === 0) {
        alert('Your cart is empty');
        return;
      }

      if (!selectedTable) {
        alert('Table number not detected. Please scan the QR code again.');
        return;
      }

      try {
        const orderData = (safeCart || []).map(item => ({
          menuItemId: item.id,
          _id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category
        }));

        console.log('📦 Placing order for table:', selectedTable);

        let result;
        if (typeof onCreateOrder === 'function') {
          result = await onCreateOrder(selectedTable, orderData, 'dine-in');
        } else {
          // fallback mock result for local testing
          result = {
            id: 'local_' + Date.now(),
            orderNumber: `L${Date.now().toString().slice(-5)}`,
            items: orderData,
            createdAt: new Date().toISOString()
          };
          console.warn('onCreateOrder not provided — returning mock result', result);
        }

        const orderWithTable = {
          ...result,
          table: selectedTable,
          status: 'pending',
          total: (safeCart || []).reduce((s, it) => s + ((it.price || 0) * (it.quantity || 0)), 0),
        };

        saveOrderToStorage(orderWithTable);
        setCart([]); // clear parent's cart
        setLocalCartOpen(false);
        setViewMode('orderStatus');

        console.log('✅ Order placed successfully:', result);
      } catch (error) {
        console.error('❌ Order failed:', error);
        alert('Order failed: ' + (error.message || error));
      }
    };

    const categories = ['all', ...new Set((menuItems || []).map(item => item.category).filter(Boolean))];

    const filteredItems = (menuItems || []).filter(item => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const q = (searchTerm || '').toLowerCase();
      const matchesSearch = !q || (item.name || '').toLowerCase().includes(q) || ((item.description || '').toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });

    const customerSubtotal = (safeCart || []).reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
    const customerTax = customerSubtotal * 0.14;
    const customerTotal = customerSubtotal + customerTax;

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
                  {(safeCart || []).length > 0 && (
                    <span className="cart-count">
                      {(safeCart || []).reduce((sum, item) => sum + (item.quantity || 0), 0)}
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
                    {category === 'all' ? (menuItems || []).length : (menuItems || []).filter(item => item.category === category).length}
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
              {(filteredItems || []).length} {(filteredItems || []).length === 1 ? 'item' : 'items'} available
            </p>
          </div>

          {(filteredItems || []).length === 0 ? (
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
            {(safeCart || []).length === 0 ? (
              <div className="empty-cart-state">
                <div className="empty-cart-icon">🛒</div>
                <h4>Your cart is empty</h4>
                <p>Add delicious items from our menu</p>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {(safeCart || []).map(item => (
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
                        RM {(((item.price || 0) * (item.quantity || 0))).toFixed(2)}
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
        {isMobile && (safeCart || []).length > 0 && !localCartOpen && (
          <button
            className="mobile-cart-fab"
            onClick={() => handleCartToggle(true)}
            type="button"
          >
            <span className="fab-icon">🛒</span>
            <span className="fab-count">{(safeCart || []).reduce((sum, item) => sum + (item.quantity || 0), 0)}</span>
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

  // ----- Admin View -----
  const AdminView = () => {
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

  // ----- Simple Customer View (fallback/test) -----
  const SimpleCustomerView = () => {
    const [localCart, setLocalCart] = useState([]);
    const [localSearch, setLocalSearch] = useState('');
    const [showCart, setShowCart] = useState(false);
    const [activeCat, setActiveCat] = useState('all');

    const SimpleSearch = () => (
      <div style={{
        background: 'white',
        padding: '15px',
        borderBottom: '1px solid #eee'
      }}>
        <input
          type="text"
          placeholder="Search menu items..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '2px solid #ddd',
            borderRadius: '8px'
          }}
        />
      </div>
    );

    const removeItem = (itemId) => {
      console.log('Removing item:', itemId);
      const updated = localCart.filter(item => item.id !== itemId);
      setLocalCart(updated);
      console.log('Cart after removal:', updated);
    };

    const simpleAddToCart = (item) => {
      console.log('Adding item:', item.name);
      const existing = localCart.find(cartItem => cartItem.id === item.id);

      if (existing) {
        const updated = localCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
        setLocalCart(updated);
      } else {
        setLocalCart([...localCart, { ...item, quantity: 1 }]);
      }
    };

    const filteredItems = (menuItems || []).filter(item => {
      const matchesSearch = (item.name || '').toLowerCase().includes((localSearch || '').toLowerCase());
      const matchesCategory = activeCat === 'all' || item.category === activeCat;
      return matchesSearch && matchesCategory;
    });

    const totalLocal = localCart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <header style={{
          background: 'white',
          padding: '15px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: 0, color: '#333' }}>FlavorFlow</h1>
            <p style={{ margin: 0, color: '#666' }}>Table {selectedTable || '--'}</p>
          </div>
          <button
            onClick={() => setShowCart(true)}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          >
            Cart ({localCart.reduce((sum, item) => sum + (item.quantity || 0), 0)})
          </button>
        </header>

        <SimpleSearch />

        <div style={{
          background: 'white',
          padding: '15px',
          display: 'flex',
          gap: '10px',
          overflowX: 'auto'
        }}>
          {['all', ...new Set((menuItems || []).map(i => i.category || 'other'))].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              style={{
                padding: '10px 15px',
                border: 'none',
                background: activeCat === cat ? '#667eea' : '#f1f5f9',
                color: activeCat === cat ? 'white' : '#333',
                borderRadius: '20px',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ padding: '15px' }}>
          <h2 style={{ color: 'white', marginBottom: '15px' }}>Menu</h2>

          {filteredItems.map(item => (
            <div key={item.id} style={{
              background: 'white',
              padding: '15px',
              marginBottom: '10px',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0 }}>{item.name}</h3>
                <p style={{ margin: '5px 0', color: '#666' }}>{item.description}</p>
                <p style={{ margin: 0, fontWeight: 'bold' }}>RM {item.price}</p>
              </div>
              <button
                onClick={() => simpleAddToCart(item)}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              >
                Add +
              </button>
            </div>
          ))}
        </div>

        {showCart && (
          <>
            <div
              onClick={() => setShowCart(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)'
              }}
            />
            <div style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '90%',
              maxWidth: '400px',
              background: 'white',
              padding: '20px',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Your Cart</h2>
                <button
                  onClick={() => setShowCart(false)}
                  style={{ background: 'none', border: 'none', fontSize: '20px' }}
                >
                  ✕
                </button>
              </div>

              {localCart.length === 0 ? (
                <p>Your cart is empty</p>
              ) : (
                <>
                  {localCart.map(item => (
                    <div key={item.id} style={{
                      padding: '10px',
                      borderBottom: '1px solid #eee',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>{item.name}</p>
                        <p style={{ margin: 0 }}>Qty: {item.quantity} × RM {item.price}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #333' }}>
                    <h3>Total: RM {totalLocal.toFixed(2)}</h3>
                    <button
                      onClick={async () => {
                        if (!selectedTable) {
                          alert('Table not detected');
                          return;
                        }
                        try {
                          if (typeof onCreateOrder === 'function') {
                            await onCreateOrder(selectedTable, localCart, 'dine-in');
                          } else {
                            console.warn('onCreateOrder not provided — simulating order');
                          }
                          setLocalCart([]);
                          setShowCart(false);
                          alert('Order placed successfully!');
                        } catch (error) {
                          alert('Order failed: ' + (error.message || error));
                        }
                      }}
                      style={{
                        background: '#059669',
                        color: 'white',
                        border: 'none',
                        padding: '15px',
                        borderRadius: '8px',
                        fontSize: '16px',
                        width: '100%'
                      }}
                    >
                      Place Order
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  // ----- Main render -----
  return (
    <div className="digital-menu-modern">
      {isCustomerView ? (
        viewMode === 'orderStatus' ? <OrderStatusView /> : <PremiumCustomerView />
      ) : (
        <AdminView />
      )}
    </div>
  );
};

export default DigitalMenu;
