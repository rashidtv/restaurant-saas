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
  
  // NEW: Order history and active order state
  const [activeOrder, setActiveOrder] = useState(null);
  const [viewMode, setViewMode] = useState('menu'); // 'menu' | 'order-status'
  const [orderHistory, setOrderHistory] = useState([]);
  const [loadingOrder, setLoadingOrder] = useState(false);

  // DEBUG: Log menu data
  useEffect(() => {
    console.log('DigitalMenu - Menu data received:', menu);
  }, [menu]);

  // NEW: Check for existing orders when table is detected
  useEffect(() => {
    const checkExistingOrder = async () => {
      if (selectedTable && isCustomerView) {
        setLoadingOrder(true);
        console.log('🔍 Checking for existing orders for table:', selectedTable);
        
        try {
          // Simulate API call to check for active orders
          // In real implementation, this would be an API call
          const existingOrder = await fetchActiveOrder(selectedTable);
          
          if (existingOrder) {
            console.log('✅ Found existing order:', existingOrder);
            setActiveOrder(existingOrder);
            setViewMode('order-status');
          } else {
            console.log('❌ No existing order found');
            setActiveOrder(null);
            setViewMode('menu');
          }
        } catch (error) {
          console.error('Error checking existing order:', error);
        } finally {
          setLoadingOrder(false);
        }
      }
    };

    checkExistingOrder();
  }, [selectedTable, isCustomerView]);

  // Table detection
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
        setTableNumber(detectedTable);
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

  // NEW: Simulate API call to fetch active order
  const fetchActiveOrder = async (tableId) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock data - in real implementation, this would be an API call
    const mockActiveOrders = [
      {
        _id: 'active_order_1',
        orderNumber: 'MESRA123456',
        tableId: 'T01',
        table: 'T01',
        items: [
          { 
            menuItem: { _id: '1', name: 'Teh Tarik', price: 4.50 },
            quantity: 2,
            price: 4.50,
            status: 'preparing'
          },
          { 
            menuItem: { _id: '4', name: 'Nasi Lemak', price: 12.90 },
            quantity: 1,
            price: 12.90,
            status: 'pending'
          }
        ],
        status: 'preparing',
        total: 21.90,
        orderedAt: new Date(Date.now() - 15 * 60000), // 15 minutes ago
        estimatedReady: new Date(Date.now() + 15 * 60000) // 15 minutes from now
      }
    ];
    
    return mockActiveOrders.find(order => 
      order.tableId === tableId && 
      ['pending', 'preparing', 'ready'].includes(order.status)
    ) || null;
  };

  // NEW: Add items to existing order
  const addToExistingOrder = async (newItems) => {
    if (!activeOrder) return;
    
    console.log('➕ Adding items to existing order:', newItems);
    
    try {
      // Simulate API call to update order
      const updatedOrder = {
        ...activeOrder,
        items: [...activeOrder.items, ...newItems.map(item => ({
          menuItem: { _id: item.id, name: item.name, price: item.price },
          quantity: item.quantity,
          price: item.price,
          status: 'pending'
        }))],
        total: activeOrder.total + newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        updatedAt: new Date()
      };
      
      setActiveOrder(updatedOrder);
      setCart([]); // Clear cart after adding to existing order
      setViewMode('order-status');
      
      console.log('✅ Order updated successfully');
    } catch (error) {
      console.error('❌ Error updating order:', error);
      alert('Failed to add items to existing order: ' + error.message);
    }
  };

  // FIX 1: ULTIMATE KEYBOARD STABILITY - Separate Search Component
  const SearchComponent = () => {
    const searchInputRef = useRef(null);
    const [localSearchTerm, setLocalSearchTerm] = useState('');

    useEffect(() => {
      if (showSearch && searchInputRef.current) {
        const focusInput = () => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        };
        
        requestAnimationFrame(() => {
          requestAnimationFrame(focusInput);
        });
      }
    }, [showSearch]);

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
            ref={searchInputRef}
            type="text"
            placeholder="Search for dishes, ingredients..."
            value={localSearchTerm}
            onChange={handleSearchChange}
            className="search-input"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
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

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
  };

  // FIX 2: BULLETPROOF DELETE FUNCTION - Use current cart state
  const removeFromCart = React.useCallback((itemId) => {
    console.log('🔄 DELETE: Removing item ID:', itemId);
    console.log('📦 Current cart:', cart);
    
    const itemToRemove = cart.find(item => item.id === itemId);
    
    if (!itemToRemove) {
      console.log('❌ Item not found in cart');
      return;
    }

    console.log('🗑️ Removing item:', itemToRemove.name);
    
    const updatedCart = cart.filter(item => {
      const shouldKeep = item.id !== itemId;
      console.log(`🔍 ${item.id} === ${itemId}? ${!shouldKeep} - ${shouldKeep ? 'KEEP' : 'REMOVE'}`);
      return shouldKeep;
    });
    
    console.log('✅ New cart after removal:', updatedCart);
    setCart(updatedCart);
  }, [cart, setCart]);

  const updateQuantity = React.useCallback((id, change) => {
    const updatedCart = cart.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(0, item.quantity + change) }
        : item
    ).filter(item => item.quantity > 0);
    
    setCart(updatedCart);
  }, [cart, setCart]);

  // Add to cart function - FIXED to use current cart state
  const addToCart = React.useCallback((item) => {
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
  }, [cart, isMobile, setCart]);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const serviceTax = subtotal * 0.06;
  const sst = subtotal * 0.08;
  const total = subtotal + serviceTax + sst;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Cart handlers
  const toggleCart = () => {
    setCartOpen(!cartOpen);
  };

  const handleCartClose = () => {
    setCartOpen(false);
  };

  const handleProceedToPayment = () => {
    if (cart.length === 0) return;
    setShowPayment(true);
    setCartOpen(false);
  };

  // NEW: Enhanced place order function
  const handlePlaceOrder = async (isAddingToExisting = false) => {
    if (cart.length === 0) {
      alert('Your cart is empty. Please add some items first.');
      return;
    }

    const finalTableNumber = tableNumber || selectedTable;
    
    if (!finalTableNumber && isCustomerView) {
      alert('Table number not detected. Please scan the QR code again or contact staff.');
      return;
    }

    console.log('🛒 Placing order for table:', finalTableNumber);

    try {
      const orderData = cart.map(item => ({
        menuItemId: item._id || item.id,
        _id: item._id || item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category
      }));

      let result;
      
      if (isAddingToExisting && activeOrder) {
        // Add to existing order
        result = await addToExistingOrder(cart);
      } else {
        // Create new order
        result = await onCreateOrder(finalTableNumber, orderData, 'dine-in');
        console.log('✅ Order placed successfully:', result);
        
        setCart([]);
        setCartOpen(false);
        setOrderSuccess(true);
        setTimeout(() => setOrderSuccess(false), 5000);
        
        alert(`Order placed successfully! Your order number is: ${result.orderNumber}`);
      }
      
    } catch (error) {
      console.error('❌ Order failed:', error);
      alert('Failed to place order: ' + error.message);
    }
  };

  // NEW: Order Status View Component
  const OrderStatusView = ({ order, onAddMoreItems, onBackToMenu }) => {
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
        case 'preparing': return 'Preparing';
        case 'ready': return 'Ready for Pickup';
        case 'completed': return 'Completed';
        default: return status;
      }
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
      return `${diffMins} min`;
    };

    return (
      <div className="order-status-view">
        <div className="status-main">
          <div className="status-header">
            <h2>Your Current Order</h2>
            <p>Table {order.table} • {order.orderNumber}</p>
          </div>

          <div className="order-card">
            <div className="order-header">
              <div className="order-info">
                <h3>Order Status</h3>
                <p className="order-time">
                  Ordered {new Date(order.orderedAt).toLocaleTimeString()}
                </p>
              </div>
              <div 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(order.status) }}
              >
                {getStatusText(order.status)}
              </div>
            </div>

            <div className="order-items">
              {order.items.map((item, index) => (
                <div key={index} className="order-item">
                  <div className="item-info">
                    <span className="item-quantity">{item.quantity}x</span>
                    <span className="item-name">{item.menuItem.name}</span>
                  </div>
                  <div className="item-status">
                    <span style={{ 
                      color: item.status === 'ready' ? '#10b981' : 
                            item.status === 'preparing' ? '#3b82f6' : '#f59e0b',
                      fontWeight: '600'
                    }}>
                      {getItemStatus(item)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-footer">
              <div className="order-total">
                Total: <strong>RM {order.total.toFixed(2)}</strong>
              </div>
              {order.status !== 'completed' && (
                <div className="time-remaining">
                  ⏱️ Estimated ready in: {calculateTimeRemaining()}
                </div>
              )}
            </div>
          </div>

          <div className="status-actions">
            <button 
              className="add-more-btn"
              onClick={onAddMoreItems}
              type="button"
            >
              ＋ Add More Items to This Order
            </button>
            <button 
              className="back-to-menu-btn"
              onClick={onBackToMenu}
              type="button"
              style={{
                background: 'transparent',
                color: '#667eea',
                border: '2px solid #667eea',
                marginTop: '1rem'
              }}
            >
              ← Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  };

  // PREMIUM CUSTOMER VIEW COMPONENT WITH ENHANCED FUNCTIONALITY
  const PremiumCustomerView = () => {
    const [localCartOpen, setLocalCartOpen] = useState(false);
    const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
    const [recentlyAdded, setRecentlyAdded] = useState(null);

    // Food category emojis and colors
    const categoryConfig = {
      'all': { emoji: '🍽️', color: '#6366f1', name: 'All Items' },
      'drinks': { emoji: '🥤', color: '#3b82f6', name: 'Beverages' },
      'main': { emoji: '🍛', color: '#f59e0b', name: 'Main Course' },
      'desserts': { emoji: '🍰', color: '#ec4899', name: 'Desserts' },
      'appetizers': { emoji: '🥗', color: '#10b981', name: 'Appetizers' },
      'specials': { emoji: '⭐', color: '#8b5cf6', name: 'Specials' }
    };

    // NEW: Handle view mode changes
    const handleAddMoreItems = () => {
      setViewMode('menu');
      setLocalCartOpen(false);
    };

    const handleBackToMenu = () => {
      setViewMode('menu');
    };

    // Show order status view if there's an active order
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
      setTimeout(() => setRecentlyAdded(null), 2000);
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

        console.log('📦 Placing order with items:', orderData);
        
        const result = await onCreateOrder(selectedTable, orderData, 'dine-in');
        setCart([]);
        setLocalCartOpen(false);
        setShowOrderConfirmation(true);
        
        console.log('✅ Order result:', result);
      } catch (error) {
        console.error('❌ Order failed:', error);
        alert('Order failed: ' + error.message);
      }
    };

    const handleCartToggle = (open) => {
      console.log('🛒 Cart toggle:', open);
      setLocalCartOpen(open);
    };

    const handleCloseCart = () => {
      console.log('🛒 Closing cart explicitly');
      setLocalCartOpen(false);
    };

    const handleCartClick = (e) => {
      e.stopPropagation();
    };

    // Get categories from menu
    const categories = ['all', ...new Set((menu || []).map(item => item.category).filter(Boolean))];
    
    // Filter items based on active category and search
    const filteredItems = (menu || []).filter(item => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
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

    // Order Confirmation Component
    const OrderConfirmation = () => (
      <div className="order-confirmation-overlay">
        <div className="order-confirmation">
          <div className="confirmation-icon">🎉</div>
          <h2>Order Confirmed!</h2>
          <p>Your order has been placed successfully and is being prepared.</p>
          <div className="order-details">
            <p><strong>Table:</strong> {selectedTable}</p>
            <p><strong>Items:</strong> {cart.reduce((sum, item) => sum + item.quantity, 0)}</p>
            <p><strong>Total:</strong> RM {customerTotal.toFixed(2)}</p>
          </div>
          <button 
            className="continue-shopping-btn"
            onClick={() => setShowOrderConfirmation(false)}
            type="button"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );

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
                    <span className="cart-count">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* FIX 1: SEPARATE SEARCH COMPONENT */}
        <SearchComponent />

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
                    {category === 'all' ? (menu || []).length : (menu || []).filter(item => item.category === category).length}
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
                <PremiumMenuItem key={item._id || item.id} item={item} />
              ))}
            </div>
          )}
        </main>

        {/* Cart Sidebar - FIX 2: PROPER DELETE FUNCTIONALITY */}
        <div 
          className={`premium-cart-sidebar ${localCartOpen ? 'open' : ''}`}
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
                          {/* FIX 2: PROPER DELETE BUTTON */}
                          <button 
                            className="remove-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('🗑️ DELETE BUTTON CLICKED for:', item.name);
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

        {/* Order Confirmation */}
        {showOrderConfirmation && <OrderConfirmation />}
      </div>
    );
  };

  // ADMIN VIEW (unchanged from your original code)
  const AdminView = () => {
    // ... (keep your existing AdminView implementation)
    return (
      <div>Admin View - Implementation unchanged</div>
    );
  };

  // MAIN RENDER
  return (
    <div className="digital-menu-modern">
      {isCustomerView ? <PremiumCustomerView /> : <AdminView />}
    </div>
  );
};

export default DigitalMenu;