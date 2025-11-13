import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './DigitalMenu.css';

const DigitalMenu = ({ cart, setCart, onCreateOrder, isMobile, menu, apiConnected, currentTable, isCustomerView = false }) => {
  const [selectedTable, setSelectedTable] = useState(currentTable || '');
  const [activeCategory, setActiveCategory] = useState('all');
  const [orderType, setOrderType] = useState('dine-in');
  const [showPayment, setShowPayment] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  // FIX: Single source of truth for cart open state
  const [cartOpen, setCartOpen] = useState(false);
  
  // FIX: Single search state
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // FIX: Use refs for stable DOM references
  const searchInputRef = useRef(null);
  const cartOpenRef = useRef(false);

  // Keep ref in sync
  useEffect(() => {
    cartOpenRef.current = cartOpen;
  }, [cartOpen]);

  // Table detection - SIMPLIFIED
  useEffect(() => {
    if (isCustomerView && !selectedTable) {
      const urlParams = new URLSearchParams(window.location.search);
      const tableFromUrl = urlParams.get('table') || currentTable;
      if (tableFromUrl) {
        setSelectedTable(tableFromUrl);
      }
    }
  }, [isCustomerView, selectedTable, currentTable]);

  // FIX: Stable search handlers
  const handleSearchToggle = () => {
    setShowSearch(prev => !prev);
    if (!showSearch) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  // FIX: Stable cart handlers
  const handleCartToggle = (open) => {
    console.log('🛒 Cart toggle:', open);
    setCartOpen(open);
  };

  const handleCloseCart = () => {
    console.log('🛒 Closing cart');
    setCartOpen(false);
  };

  // FIX: Prevent cart close when clicking inside
  const handleCartClick = (e) => {
    e.stopPropagation();
  };

  // Add to cart function
  const addToCart = (item) => {
    console.log('🛒 Adding to cart:', item);
    
    const cartItem = {
      id: item._id || item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      category: item.category,
      description: item.description,
      image: item.image,
    };

    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, cartItem]);
    }

    // Auto-open cart on mobile when adding items
    if (isMobile) {
      handleCartToggle(true);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id, change) => {
    setCart(cart.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(0, item.quantity + change) }
        : item
    ).filter(item => item.quantity > 0));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.14;
  const total = subtotal + tax;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Order placement
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty');
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

      console.log('📦 Placing order for table:', selectedTable);
      const result = await onCreateOrder(selectedTable, orderData, 'dine-in');
      
      setCart([]);
      handleCloseCart();
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 5000);
      
      console.log('✅ Order result:', result);
    } catch (error) {
      console.error('❌ Order failed:', error);
      alert('Order failed: ' + error.message);
    }
  };

  // Filter menu items
  const categories = ['all', ...new Set(menu.map(item => item.category).filter(Boolean))];
  
  const filteredItems = menu.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Category config
  const categoryConfig = {
    'all': { emoji: '🍽️', color: '#6366f1', name: 'All Items' },
    'appetizers': { emoji: '🥗', color: '#10b981', name: 'Appetizers' },
    'main-course': { emoji: '🍛', color: '#f59e0b', name: 'Main Course' },
    'desserts': { emoji: '🍰', color: '#ec4899', name: 'Desserts' },
    'beverages': { emoji: '🥤', color: '#3b82f6', name: 'Beverages' },
    'specials': { emoji: '⭐', color: '#8b5cf6', name: 'Specials' }
  };

  // PREMIUM CUSTOMER VIEW - SIMPLIFIED
  const PremiumCustomerView = () => {
    const [recentlyAdded, setRecentlyAdded] = useState(null);

    const handleItemAdd = (item) => {
      addToCart(item);
      setRecentlyAdded(item.id);
      setTimeout(() => setRecentlyAdded(null), 2000);
    };

    return (
      <div className="premium-customer-view">
        {/* Header */}
        <header className="premium-header">
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
                  onClick={handleSearchToggle}
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
                    <span className="cart-count">{itemCount}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Search Bar - FIXED */}
        {showSearch && (
          <div className="search-section">
            <div className="search-container">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for dishes, ingredients..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              <button 
                className="clear-search"
                onClick={clearSearch}
                type="button"
              >
                ✕
              </button>
            </div>
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
                <div key={item.id} className={`premium-menu-item ${recentlyAdded === item.id ? 'item-added' : ''}`}>
                  <div className="item-image-container">
                    <div className="item-image" style={{ background: categoryConfig[item.category]?.color || '#6366f1' }}>
                      <span className="item-emoji">{item.image || '🍽️'}</span>
                      {item.popular && <div className="popular-badge">🔥 Popular</div>}
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Cart Sidebar - FIXED: Stable implementation */}
        <div 
          className={`premium-cart-sidebar ${cartOpen ? 'open' : ''}`}
          onClick={handleCartClick}
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
                    <span>RM {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-line">
                    <span>Tax & Service</span>
                    <span>RM {tax.toFixed(2)}</span>
                  </div>
                  <div className="total-line">
                    <span>Total</span>
                    <span className="total-amount">RM {total.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  className="checkout-button"
                  onClick={handlePlaceOrder}
                  type="button"
                >
                  <span className="checkout-text">Place Order</span>
                  <span className="checkout-price">RM {total.toFixed(2)}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Cart FAB */}
        {isMobile && cart.length > 0 && !cartOpen && (
          <button 
            className="mobile-cart-fab"
            onClick={() => handleCartToggle(true)}
            type="button"
          >
            <span className="fab-icon">🛒</span>
            <span className="fab-count">{itemCount}</span>
            <span className="fab-text">View Order</span>
          </button>
        )}

        {/* Overlay */}
        {cartOpen && (
          <div 
            className="cart-overlay"
            onClick={handleCloseCart}
          />
        )}

        {/* Order Success */}
        {orderSuccess && (
          <div className="order-confirmation-overlay">
            <div className="order-confirmation">
              <div className="confirmation-icon">🎉</div>
              <h2>Order Confirmed!</h2>
              <p>Your order has been placed successfully.</p>
              <button 
                className="continue-shopping-btn"
                onClick={() => setOrderSuccess(false)}
                type="button"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ADMIN VIEW - SIMPLIFIED
  const AdminView = () => {
    return (
      <div className="digital-menu-modern">
        <div className="menu-header-modern">
          <div className="menu-header-content-modern">
            <div className="menu-title-section-modern">
              <h2 className="menu-title-modern">Menu Management</h2>
              <p className="menu-subtitle-modern">
                {selectedTable ? `Table ${selectedTable} • Staff View` : 'Select a table to begin'}
              </p>
            </div>
            
            <div className="menu-controls-modern">
              <div className="control-group-modern">
                <label className="control-label-modern">Order Type</label>
                <select 
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="control-select-modern"
                >
                  <option value="dine-in">🍽️ Dine In</option>
                  <option value="takeaway">🥡 Takeaway</option>
                </select>
              </div>
              
              {orderType === 'dine-in' && (
                <div className="control-group-modern">
                  <label className="control-label-modern">Table Number</label>
                  <select 
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="control-select-modern"
                  >
                    <option value="">Select Table</option>
                    {['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08'].map(table => (
                      <option key={table} value={table}>Table {table}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="menu-layout-modern">
          {/* Categories */}
          <div className="categories-sidebar-modern">
            <h3 className="categories-title-modern">Categories</h3>
            <div className="categories-list-modern">
              {categories.map(category => (
                <button
                  key={category}
                  className={`category-btn-modern ${activeCategory === category ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category)}
                  type="button"
                >
                  <span className="category-name-modern">
                    {categoryConfig[category]?.name || category}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items */}
          <div className="menu-items-container-modern">
            {filteredItems.length === 0 ? (
              <div className="empty-menu-modern">
                <div className="empty-icon-modern">🍽️</div>
                <h3 className="empty-title-modern">No Menu Items Available</h3>
                <p className="empty-subtitle-modern">Menu items will appear here once loaded</p>
              </div>
            ) : (
              <div className="menu-section-modern">
                <div className="section-header-modern">
                  <h3 className="section-title-modern">
                    {activeCategory === 'all' ? 'All Menu Items' : categoryConfig[activeCategory]?.name}
                  </h3>
                  <span className="items-count-modern">{filteredItems.length} items</span>
                </div>
                <div className="menu-grid-modern">
                  {filteredItems.map(item => (
                    <div key={item.id} className="menu-item-card-modern">
                      <div className="menu-item-image-modern">
                        <span className="item-emoji-modern">{item.image || '🍽️'}</span>
                      </div>
                      <div className="menu-item-content-modern">
                        <div className="menu-item-header-modern">
                          <h3 className="menu-item-name-modern">{item.name}</h3>
                          <div className="menu-item-price-modern">RM {item.price}</div>
                        </div>
                        <p className="menu-item-desc-modern">{item.description}</p>
                        <button 
                          className="add-to-cart-btn-modern"
                          onClick={() => addToCart(item)}
                          type="button"
                        >
                          <span className="btn-icon-modern">+</span>
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cart */}
          <div className={`cart-sidebar-modern ${cartOpen ? 'cart-open' : ''}`}>
            <div className="cart-header-modern">
              <div className="cart-title-section-modern">
                <h3 className="cart-title-modern">Your Order</h3>
                <div className="cart-subtitle-modern">
                  {orderType === 'dine-in' && selectedTable ? `Table ${selectedTable}` : 'Takeaway'}
                </div>
              </div>
              <div className="cart-badge-modern">{itemCount}</div>
            </div>

            {cart.length === 0 ? (
              <div className="empty-cart-modern">
                <div className="empty-icon-modern">🛒</div>
                <p className="empty-title-modern">Your cart is empty</p>
                <p className="empty-subtitle-modern">Add items from the menu to get started</p>
              </div>
            ) : (
              <>
                <div className="cart-items-modern">
                  {cart.map(item => (
                    <div key={item.id} className="cart-item-modern">
                      <div className="cart-item-info-modern">
                        <div className="cart-item-name-modern">{item.name}</div>
                        <div className="cart-item-price-modern">RM {item.price}</div>
                      </div>
                      <div className="cart-item-controls-modern">
                        <button 
                          className="quantity-btn-modern"
                          onClick={() => updateQuantity(item.id, -1)}
                          type="button"
                        >
                          −
                        </button>
                        <span className="quantity-display-modern">{item.quantity}</span>
                        <button 
                          className="quantity-btn-modern"
                          onClick={() => updateQuantity(item.id, 1)}
                          type="button"
                        >
                          +
                        </button>
                        <button 
                          className="remove-btn-modern"
                          onClick={() => removeFromCart(item.id)}
                          type="button"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-total-modern">
                  <div className="total-line-modern">
                    <span>Subtotal</span>
                    <span>RM {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="total-line-modern">
                    <span>Tax</span>
                    <span>RM {tax.toFixed(2)}</span>
                  </div>
                  <div className="grand-total-modern">
                    <span>Total</span>
                    <span className="grand-total-amount-modern">RM {total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="cart-actions-modern">
                  <button className="checkout-btn-modern" onClick={handlePlaceOrder} type="button">
                    <span className="checkout-icon-modern">📦</span>
                    Place Order
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Cart Toggle */}
        {isMobile && (
          <button 
            className="cart-toggle-btn-modern"
            onClick={() => handleCartToggle(!cartOpen)}
            type="button"
          >
            🛒
            {itemCount > 0 && (
              <span className="cart-badge-mobile">{itemCount}</span>
            )}
          </button>
        )}

        {/* Mobile Overlay */}
        {isMobile && cartOpen && (
          <div 
            className="cart-overlay"
            onClick={handleCloseCart}
          />
        )}
      </div>
    );
  };

  // MAIN RENDER
  return isCustomerView ? <PremiumCustomerView /> : <AdminView />;
};

export default DigitalMenu;