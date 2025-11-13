import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './DigitalMenu.css';

const DigitalMenu = ({ cart, setCart, onCreateOrder, isMobile, menu, apiConnected, currentTable, isCustomerView = false }) => {
  const [selectedTable, setSelectedTable] = useState(currentTable || '');
  const [activeCategory, setActiveCategory] = useState('all');
  const [orderType, setOrderType] = useState('dine-in');
  const [showPayment, setShowPayment] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  const [cartOpen, setCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const searchInputRef = useRef(null);
  const cartOpenRef = useRef(false);

  // Keep ref in sync
  useEffect(() => {
    cartOpenRef.current = cartOpen;
  }, [cartOpen]);

  // QR table detection functionality
  useEffect(() => {
    const detectTableFromURL = () => {
      console.log('🔍 Scanning URL for table number...');
      
      const url = new URL(window.location.href);
      const hash = window.location.hash;
      const searchParams = url.searchParams;
      
      let detectedTable = null;

      if (searchParams.has('table')) {
        detectedTable = searchParams.get('table');
        console.log('✅ Table detected from search params:', detectedTable);
      }
      
      if (hash.includes('?')) {
        const hashParams = new URLSearchParams(hash.split('?')[1]);
        if (hashParams.has('table')) {
          detectedTable = hashParams.get('table');
          console.log('✅ Table detected from hash params:', detectedTable);
        }
      }

      if (detectedTable) {
        setSelectedTable(detectedTable);
        console.log('🎯 Table number set to:', detectedTable);
      } else {
        console.log('❌ No table number found in URL');
      }
    };

    if (isCustomerView) {
      detectTableFromURL();
      setTimeout(detectTableFromURL, 1000);
      
      window.addEventListener('hashchange', detectTableFromURL);
      window.addEventListener('popstate', detectTableFromURL);
      
      return () => {
        window.removeEventListener('hashchange', detectTableFromURL);
        window.removeEventListener('popstate', detectTableFromURL);
      };
    }
  }, [isCustomerView]);

  // Get table from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableFromUrl = urlParams.get('table');
    if (tableFromUrl) {
      console.log('DigitalMenu - Table from URL params:', tableFromUrl);
      setSelectedTable(tableFromUrl);
    }
  }, []);

  // FIX 1: COMPLETELY STABLE SEARCH HANDLER - NO KEYBOARD DISMISSAL
  const handleSearchToggle = () => {
    setShowSearch(prev => !prev);
    if (!showSearch) {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 200);
    }
  };

  // FIX 1: ULTRA-STABLE SEARCH CHANGE - NO RE-RENDERS
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // CRITICAL FIX: Use setTimeout to maintain focus without interfering with React's render cycle
    setTimeout(() => {
      if (e.target) {
        e.target.focus();
      }
    }, 0);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 50);
  };

  // Cart handlers
  const handleCartToggle = (open) => {
    console.log('🛒 Cart toggle:', open);
    setCartOpen(open);
  };

  const handleCloseCart = () => {
    console.log('🛒 Closing cart');
    setCartOpen(false);
  };

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
  };

  // FIX 2: CORRECT REMOVE FROM CART FUNCTION - ONLY REMOVE SPECIFIC ITEM
  const removeFromCart = (id) => {
    console.log('🗑️ Removing item:', id, 'from cart:', cart);
    
    // FIX: Properly filter only the specific item to remove
    const updatedCart = cart.filter(item => {
      const shouldKeep = item.id !== id;
      console.log(`Item ${item.id} vs ${id}: ${shouldKeep ? 'KEEP' : 'REMOVE'}`);
      return shouldKeep;
    });
    
    console.log('🛒 Cart after removal:', updatedCart);
    setCart(updatedCart);
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

  // PREMIUM CUSTOMER VIEW
  const PremiumCustomerView = () => {
    const [recentlyAdded, setRecentlyAdded] = useState(null);

    const handleItemAdd = (item) => {
      addToCart(item);
      setRecentlyAdded(item.id);
      setTimeout(() => setRecentlyAdded(null), 2000);
    };

    if (!selectedTable && isCustomerView) {
      return (
        <div className="premium-customer-view">
          <div className="loading-state">
            <div className="loading-spinner">🔄</div>
            <h2>Detecting Table...</h2>
            <p>Please wait while we detect your table number</p>
          </div>
        </div>
      );
    }

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

        {/* FIX 1: SEARCH BAR - ULTRA STABLE KEYBOARD */}
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
                // Critical mobile attributes
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                inputMode="text"
                // Prevent any default behaviors
                onBlur={(e) => {
                  // Only allow blur if user explicitly clicks elsewhere
                  if (!e.relatedTarget?.classList?.contains('clear-search')) {
                    e.preventDefault();
                    setTimeout(() => e.target.focus(), 10);
                  }
                }}
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

        {/* Cart Sidebar - FIX 2: CORRECT DELETE FUNCTIONALITY */}
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
                          {/* FIX 2: CORRECT DELETE BUTTON - ONLY REMOVES SPECIFIC ITEM */}
                          <button 
                            className="remove-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('🗑️ Delete button clicked for item:', item.id);
                              removeFromCart(item.id);
                            }}
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

  // ADMIN VIEW
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
                        {/* FIX 2: CORRECT DELETE BUTTON FOR ADMIN VIEW */}
                        <button 
                          className="remove-btn-modern"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromCart(item.id);
                          }}
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