import React, { useState, useEffect } from 'react';
import './DigitalMenu.css';

const DigitalMenu = ({ cart, setCart, onCreateOrder, isMobile, menu, apiConnected, currentTable, isCustomerView }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [orderType, setOrderType] = useState('dine-in');
  const [selectedTable, setSelectedTable] = useState('');
  const [tableNumber, setTableNumber] = useState(currentTable || '');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [showCart, setShowCart] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    specialInstructions: ''
  });

  // Table detection for QR codes
  useEffect(() => {
    const detectTableFromURL = () => {
      console.log('🔍 Scanning URL for table number...');
      
      const url = new URL(window.location.href);
      const hash = window.location.hash;
      const searchParams = url.searchParams;
      
      let detectedTable = null;

      // Check URL search params (/?table=T01)
      if (searchParams.has('table')) {
        detectedTable = searchParams.get('table');
        console.log('✅ Table detected from search params:', detectedTable);
      }
      
      // Check hash parameters (/#menu?table=T01)
      if (hash.includes('?')) {
        const hashParams = new URLSearchParams(hash.split('?')[1]);
        if (hashParams.has('table')) {
          detectedTable = hashParams.get('table');
          console.log('✅ Table detected from hash params:', detectedTable);
        }
      }

      if (detectedTable) {
        setTableNumber(detectedTable);
        console.log('🎯 Table number set to:', detectedTable);
      } else {
        console.log('❌ No table number found in URL');
      }
    };

    if (isCustomerView) {
      detectTableFromURL();
      window.addEventListener('hashchange', detectTableFromURL);
      
      return () => {
        window.removeEventListener('hashchange', detectTableFromURL);
      };
    }
  }, [isCustomerView]);

  // Load cart from localStorage
  useEffect(() => {
    if (isCustomerView) {
      const savedCart = localStorage.getItem('customerCart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    }
  }, [isCustomerView, setCart]);

  // Save cart to localStorage
  useEffect(() => {
    if (isCustomerView) {
      localStorage.setItem('customerCart', JSON.stringify(cart));
    }
  }, [cart, isCustomerView]);

  // Add item to cart
  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem._id === item._id);
    
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem._id === item._id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { 
        ...item, 
        quantity: 1,
        addedAt: new Date().toISOString()
      }]);
    }
    
    // Show cart automatically when adding items on mobile
    if (isMobile) {
      setShowCart(true);
    }
  };

  // Remove item from cart
  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item._id !== itemId));
  };

  // Update item quantity
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map(item =>
        item._id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  // Clear entire cart
  const clearCart = () => {
    setCart([]);
    if (isCustomerView) {
      localStorage.removeItem('customerCart');
    }
  };

  // Calculate total
  const getTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Get item count in cart
  const getItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  // Get categories from menu
  const categories = ['all', ...new Set(menu.map(item => item.category))];
  
  // Filter and sort menu
  const filteredMenu = menu
    .filter(item => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

  // Place order
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty. Please add some items first.');
      return;
    }

    // Validate table number for QR orders
    if (isCustomerView && !tableNumber) {
      alert('Table number not detected. Please scan the QR code again.');
      return;
    }

    // Validate table selection for staff orders
    if (!isCustomerView && orderType === 'dine-in' && !selectedTable) {
      alert('Please select a table number.');
      return;
    }

    const finalTable = isCustomerView ? tableNumber : selectedTable;
    const finalOrderType = isCustomerView ? 'dine-in' : orderType;

    console.log('🛒 Placing order:', { 
      finalTable, 
      finalOrderType, 
      items: cart,
      customerInfo 
    });

    try {
      const orderData = {
        tableId: finalTable,
        items: cart.map(item => ({
          menuItemId: item._id,
          quantity: item.quantity,
          price: item.price,
          specialInstructions: item.specialInstructions || ''
        })),
        orderType: finalOrderType,
        customerName: customerInfo.name || (isCustomerView ? 'QR Customer' : ''),
        customerPhone: customerInfo.phone || ''
      };

      const result = await onCreateOrder(finalTable, cart, finalOrderType);
      
      console.log('✅ Order placed successfully:', result);
      
      // Clear cart and show success
      setCart([]);
      setCustomerInfo({ name: '', phone: '', specialInstructions: '' });
      setOrderSuccess(true);
      setShowCart(false);
      
      if (isCustomerView) {
        localStorage.removeItem('customerCart');
      }
      
      setTimeout(() => setOrderSuccess(false), 5000);
      
      alert(`Order placed successfully! Your order number is: ${result.orderNumber}`);
      
    } catch (error) {
      console.error('❌ Order failed:', error);
      alert('Failed to place order: ' + error.message);
    }
  };

  // Get popular items (most added to cart)
  const getPopularItems = () => {
    const itemCounts = {};
    cart.forEach(item => {
      itemCounts[item._id] = (itemCounts[item._id] || 0) + item.quantity;
    });
    
    return menu
      .filter(item => itemCounts[item._id])
      .sort((a, b) => itemCounts[b._id] - itemCounts[a._id])
      .slice(0, 3);
  };

    // Render header based on view type
  const renderHeader = () => (
    <div className="page-header">
      <div className="menu-header-content">
        <div className="menu-header-info">
          <h2 className="page-title">
            {isCustomerView ? '🍛 FlavorFlow Menu' : 'Digital Menu Management'}
          </h2>
          <p className="page-subtitle">
            {isCustomerView && tableNumber 
              ? `Welcome to Table ${tableNumber} • Order will be delivered to your table`
              : isCustomerView && !tableNumber
                ? 'Scan QR code to start ordering'
                : orderType === 'takeaway' 
                  ? 'Takeaway Order Management' 
                  : selectedTable 
                    ? `Table ${selectedTable} Order Management`
                    : 'Select a table to start order'
            }
            {isCustomerView && !tableNumber && (
              <span style={{color: '#ef4444', display: 'block', marginTop: '8px', fontSize: '0.9rem'}}>
                ⚠️ Table not detected. Please scan QR code again.
              </span>
            )}
          </p>
        </div>
        
        <div className="menu-controls-enhanced">
          {!isCustomerView && (
            <>
              <div className="control-group">
                <label className="control-label">Order Type</label>
                <select 
                  value={orderType}
                  onChange={(e) => {
                    setOrderType(e.target.value);
                    if (e.target.value === 'takeaway') {
                      setSelectedTable('Takeaway');
                    } else {
                      setSelectedTable('');
                    }
                  }}
                  className="control-select enhanced"
                >
                  <option value="dine-in">🍽️ Dine In</option>
                  <option value="takeaway">🥡 Takeaway</option>
                </select>
              </div>
              
              {orderType === 'dine-in' && (
                <div className="control-group">
                  <label className="control-label">Table Number</label>
                  <select 
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="control-select enhanced"
                  >
                    <option value="">Select Table</option>
                    {['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10'].map(table => (
                      <option key={table} value={table}>Table {table}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
          
          {!isCustomerView && (
            <div className="control-group">
              <label className="control-label">Preview</label>
              <button 
                className="customer-view-btn"
                onClick={() => window.open('/#menu', '_blank')}
              >
                👀 Customer View
              </button>
            </div>
          )}
          
          {/* Cart Summary */}
          {cart.length > 0 && (
            <div className="control-group">
              <label className="control-label">Cart</label>
              <div className="cart-summary">
                <span className="cart-count">{getItemCount()} items</span>
                <span className="cart-total">RM {getTotal().toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render search and filters
  const renderFilters = () => (
    <div className="menu-filters">
      <div className="search-box">
        <input
          type="text"
          placeholder="Search menu items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <span className="search-icon">🔍</span>
      </div>
      
      <div className="filter-controls">
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="filter-select"
        >
          <option value="name">Sort by Name</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
        
        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category === 'all' ? 'All Items' : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Render menu grid
  const renderMenuGrid = () => (
    <div className="menu-content">
      {/* Popular Items Section */}
      {isCustomerView && getPopularItems().length > 0 && (
        <div className="popular-section">
          <h3 className="section-title">Your Favorites</h3>
          <div className="popular-items">
            {getPopularItems().map(item => (
              <div key={item._id} className="popular-item-card" onClick={() => addToCart(item)}>
                <div className="popular-item-content">
                  <span className="popular-item-name">{item.name}</span>
                  <span className="popular-item-price">RM {item.price.toFixed(2)}</span>
                </div>
                <button className="quick-add-btn">+ Add</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menu Items Grid */}
      <div className="menu-grid-section">
        <div className="section-header">
          <h3 className="section-title">
            {activeCategory === 'all' ? 'All Menu Items' : activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}
            <span className="item-count">({filteredMenu.length} items)</span>
          </h3>
        </div>

        {filteredMenu.length === 0 ? (
          <div className="empty-menu">
            <div className="empty-icon">🍽️</div>
            <h3>No items found</h3>
            <p>Try changing your search or filter criteria</p>
          </div>
        ) : (
          <div className="menu-grid">
            {filteredMenu.map(item => {
              const cartItem = cart.find(cartItem => cartItem._id === item._id);
              const quantity = cartItem ? cartItem.quantity : 0;
              
              return (
                <div key={item._id} className="menu-item-card">
                  <div className="item-image">
                    <div className="image-placeholder">
                      {item.emoji || '🍛'}
                    </div>
                    {quantity > 0 && (
                      <div className="cart-badge">{quantity}</div>
                    )}
                  </div>
                  
                  <div className="item-content">
                    <div className="item-header">
                      <h3 className="item-name">{item.name}</h3>
                      <span className="item-category">{item.category}</span>
                    </div>
                    
                    <p className="item-description">
                      {item.description || 'Delicious menu item prepared with care'}
                    </p>
                    
                    {item.preparationTime && (
                      <div className="prep-time">
                        <span className="prep-icon">⏱️</span>
                        {item.preparationTime} min
                      </div>
                    )}
                    
                    <div className="item-footer">
                      <div className="price-section">
                        <span className="item-price">RM {item.price.toFixed(2)}</span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="original-price">RM {item.originalPrice.toFixed(2)}</span>
                        )}
                      </div>
                      
                      <div className="item-actions">
                        {quantity > 0 ? (
                          <div className="quantity-controls-compact">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(item._id, quantity - 1);
                              }}
                              className="qty-btn"
                            >
                              -
                            </button>
                            <span className="qty-display">{quantity}</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(item._id, quantity + 1);
                              }}
                              className="qty-btn"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button 
                            className="add-to-cart-btn primary"
                            onClick={() => addToCart(item)}
                          >
                            Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

    // Render cart sidebar
  const renderCartSidebar = () => (
    <div className={`cart-sidebar ${showCart ? 'show' : ''}`}>
      <div className="cart-header">
        <div className="cart-title">
          <h3>Your Order</h3>
          <button 
            className="close-cart-btn"
            onClick={() => setShowCart(false)}
          >
            ×
          </button>
        </div>
        <div className="cart-summary-header">
          <span className="item-count">{getItemCount()} items</span>
          <button 
            className="clear-cart-btn"
            onClick={clearCart}
          >
            Clear All
          </button>
        </div>
      </div>
      
      <div className="cart-items">
        {cart.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <p>Your cart is empty</p>
            <small>Add some delicious items to get started</small>
          </div>
        ) : (
          cart.map(item => (
            <div key={item._id} className="cart-item">
              <div className="cart-item-content">
                <div className="cart-item-info">
                  <span className="cart-item-name">{item.name}</span>
                  <span className="cart-item-price">RM {item.price.toFixed(2)} each</span>
                </div>
                <div className="cart-item-controls">
                  <div className="quantity-controls">
                    <button 
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      className="quantity-btn"
                    >
                      -
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className="quantity-btn"
                    >
                      +
                    </button>
                  </div>
                  <div className="cart-item-total">
                    RM {(item.price * item.quantity).toFixed(2)}
                  </div>
                  <button 
                    onClick={() => removeFromCart(item._id)}
                    className="remove-item-btn"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {cart.length > 0 && (
        <div className="cart-footer">
          {/* Customer Info for QR orders */}
          {isCustomerView && (
            <div className="customer-info">
              <h4>Your Information (Optional)</h4>
              <div className="info-fields">
                <input
                  type="text"
                  placeholder="Your name"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({...prev, name: e.target.value}))}
                  className="info-input"
                />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({...prev, phone: e.target.value}))}
                  className="info-input"
                />
                <textarea
                  placeholder="Special instructions (allergies, preferences, etc.)"
                  value={customerInfo.specialInstructions}
                  onChange={(e) => setCustomerInfo(prev => ({...prev, specialInstructions: e.target.value}))}
                  className="info-textarea"
                  rows="3"
                />
              </div>
            </div>
          )}

          <div className="cart-total-section">
            <div className="total-line">
              <span>Subtotal:</span>
              <span>RM {getTotal().toFixed(2)}</span>
            </div>
            <div className="total-line">
              <span>Service Tax (0%):</span>
              <span>RM 0.00</span>
            </div>
            <div className="total-line grand-total">
              <span>Total:</span>
              <span>RM {getTotal().toFixed(2)}</span>
            </div>
          </div>

          <div className="checkout-actions">
            <button 
              className="place-order-btn primary"
              onClick={handlePlaceOrder}
              disabled={isCustomerView && !tableNumber}
            >
              {isCustomerView ? 
                `Place Order for Table ${tableNumber || '?'}` : 
                `Place ${orderType === 'takeaway' ? 'Takeaway' : 'Table'} Order`
              }
              <span className="order-total">RM {getTotal().toFixed(2)}</span>
            </button>
            
            {isCustomerView && !tableNumber && (
              <div className="table-warning">
                ⚠️ Table number required. Please scan QR code.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Render floating cart button for mobile
  const renderFloatingCart = () => (
    cart.length > 0 && isMobile && (
      <div className="cart-floating">
        <div 
          className="floating-cart-trigger"
          onClick={() => setShowCart(!showCart)}
        >
          <div className="floating-cart-info">
            <span className="floating-count">{getItemCount()} items</span>
            <span className="floating-total">RM {getTotal().toFixed(2)}</span>
          </div>
          <div className="floating-cart-icon">
            🛒
            {getItemCount() > 0 && (
              <span className="floating-badge">{getItemCount()}</span>
            )}
          </div>
        </div>
      </div>
    )
  );

  // Render order success banner
  const renderSuccessBanner = () => (
    orderSuccess && (
      <div className="order-success-banner">
        <div className="success-content">
          <span className="success-icon">✅</span>
          <div className="success-message">
            <h3>Order Placed Successfully!</h3>
            <p>Your order has been sent to the kitchen. You'll be notified when it's ready.</p>
          </div>
          <button 
            className="close-banner-btn"
            onClick={() => setOrderSuccess(false)}
          >
            ×
          </button>
        </div>
      </div>
    )
  );

  return (
    <div className="digital-menu">
      {renderHeader()}
      {renderSuccessBanner()}
      {renderFilters()}
      {renderMenuGrid()}
      {renderCartSidebar()}
      {renderFloatingCart()}
    </div>
  );
};

export default DigitalMenu;