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
  
  // Simple ref for search input
  const searchInputRef = useRef(null);

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

  // Get table from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableFromUrl = urlParams.get('table');
    if (tableFromUrl) {
      console.log('DigitalMenu - Table from URL params:', tableFromUrl);
      setSelectedTable(tableFromUrl);
      setTableNumber(tableFromUrl);
    }
  }, []);

  // DEBUG: Log menu data
  useEffect(() => {
    console.log('DigitalMenu - Menu data received:', menu);
  }, [menu]);

  // FIX 1: SIMPLE SEARCH HANDLERS - No keyboard dismissal
  const handleSearchToggle = () => {
    const newShowSearch = !showSearch;
    setShowSearch(newShowSearch);
    
    if (newShowSearch) {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // FIX 2: SIMPLE DELETE FUNCTION - Only removes specific item
  const removeFromCart = (itemId) => {
    console.log('🗑️ Removing item:', itemId);
    const newCart = cart.filter(item => item.id !== itemId);
    setCart(newCart);
    // Cart stays open after deletion
  };

  const updateQuantity = (id, change) => {
    const newCart = cart.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(0, item.quantity + change) }
        : item
    ).filter(item => item.quantity > 0);
    
    setCart(newCart);
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
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
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

  // Toggle cart for mobile
  const toggleCart = () => {
    setCartOpen(!cartOpen);
  };

  // Close cart when clicking overlay
  const handleCartClose = () => {
    setCartOpen(false);
  };

  // Close cart when proceeding to payment
  const handleProceedToPayment = () => {
    if (cart.length === 0) return;
    setShowPayment(true);
    setCartOpen(false);
  };

  const handlePlaceOrder = async () => {
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

      const result = await onCreateOrder(finalTableNumber, orderData, 'dine-in');
      
      console.log('✅ Order placed successfully:', result);
      
      setCart([]);
      setCartOpen(false);
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 5000);
      
      alert(`Order placed successfully! Your order number is: ${result.orderNumber}`);
      
    } catch (error) {
      console.error('❌ Order failed:', error);
      alert('Failed to place order: ' + error.message);
    }
  };

  // PREMIUM CUSTOMER VIEW COMPONENT WITH FIXES
  const PremiumCustomerView = () => {
    const [localCartOpen, setLocalCartOpen] = useState(false);
    const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
    const [recentlyAdded, setRecentlyAdded] = useState(null);
    const [searchInput, setSearchInput] = useState('');

    // Food category emojis and colors
    const categoryConfig = {
      'all': { emoji: '🍽️', color: '#6366f1', name: 'All Items' },
      'appetizers': { emoji: '🥗', color: '#10b981', name: 'Appetizers' },
      'main-course': { emoji: '🍛', color: '#f59e0b', name: 'Main Course' },
      'desserts': { emoji: '🍰', color: '#ec4899', name: 'Desserts' },
      'beverages': { emoji: '🥤', color: '#3b82f6', name: 'Beverages' },
      'specials': { emoji: '⭐', color: '#8b5cf6', name: 'Specials' }
    };

    // Add to cart with animation
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

    // Cart handlers
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
    const categories = ['all', ...new Set(menu.map(item => item.category).filter(Boolean))];
    
    // Filter items based on active category and search
    const filteredItems = menu.filter(item => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchInput.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchInput.toLowerCase());
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

        {/* FIX 1: SEARCH BAR - No keyboard dismissal */}
        {showSearch && (
          <div className="search-section">
            <div className="search-container">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for dishes, ingredients..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setSearchTerm(e.target.value);
                }}
                className="search-input"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              <button 
                className="clear-search"
                onClick={() => {
                  setSearchInput('');
                  setSearchTerm('');
                  searchInputRef.current?.focus();
                }}
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

        {/* Cart Sidebar - FIX 2: Proper delete and stays open */}
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
                          <button 
                            className="remove-item"
                            onClick={(e) => {
                              e.stopPropagation();
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

  // Modern Payment Page Component
  const PaymentPage = ({ orderDetails, onBack, onPaymentSuccess, isMobile }) => {
    const [paymentMethod, setPaymentMethod] = useState('qr');
    const [paymentStatus, setPaymentStatus] = useState('pending');

    const handlePayment = () => {
      setPaymentStatus('processing');
      
      setTimeout(() => {
        setPaymentStatus('success');
        setTimeout(() => {
          onPaymentSuccess();
        }, 2000);
      }, 3000);
    };

    if (paymentStatus === 'success') {
      return (
        <div className="payment-container-modern">
          <div className="payment-success-modern">
            <div className="success-icon-modern">✅</div>
            <h2 className="success-title-modern">Payment Successful!</h2>
            <p className="success-message-modern">
              Thank you for your payment. Your order is being prepared.
            </p>
            <button className="continue-btn-modern" onClick={onPaymentSuccess} type="button">
              Continue Shopping
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="payment-container-modern">
        <div className="payment-header-modern">
          <button className="back-btn-modern" onClick={onBack} type="button">
            <span className="back-arrow">←</span>
            Back to Menu
          </button>
          <h2 className="payment-title-modern">Complete Your Payment</h2>
        </div>

        <div className="payment-layout-modern">
          <div className="order-summary-modern">
            <div className="summary-header-modern">
              <h3 className="summary-title-modern">Order Summary</h3>
              <div className="order-type-badge">{orderDetails.orderType}</div>
            </div>
            <div className="summary-details-modern">
              <div className="summary-row-modern">
                <span>Table</span>
                <span>{orderDetails.orderType === 'dine-in' ? `Table ${orderDetails.table}` : 'Takeaway'}</span>
              </div>
              
              <div className="items-list-modern">
                {orderDetails.items.map((item, index) => {
                  const itemName = item.name || 'Unknown Item';
                  const displayName = isMobile ? truncateText(itemName, 15) : itemName;
                  const itemPrice = item.price || 0;
                  const itemQuantity = item.quantity || 1;
                  
                  return (
                    <div key={index} className="item-row-modern">
                      <div className="item-info-modern">
                        <span className="item-quantity-modern">{itemQuantity}x</span>
                        <span className="item-name-modern">{displayName}</span>
                      </div>
                      <span className="item-price-modern">RM {(itemPrice * itemQuantity).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
              
              <div className="summary-divider-modern"></div>
              <div className="summary-row-modern">
                <span>Subtotal</span>
                <span>RM {orderDetails.subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row-modern">
                <span>Service Tax (6%)</span>
                <span>RM {orderDetails.serviceTax.toFixed(2)}</span>
              </div>
              <div className="summary-row-modern">
                <span>SST (8%)</span>
                <span>RM {orderDetails.sst.toFixed(2)}</span>
              </div>
              <div className="grand-total-row-modern">
                <span>Total Amount</span>
                <span className="grand-total-text-modern">RM {orderDetails.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="payment-methods-modern">
            <h3 className="methods-title-modern">Payment Method</h3>
            
            <div className="method-options-modern">
              {[
                { id: 'qr', name: 'QR Code', icon: '📱', desc: 'Scan with banking app' },
                { id: 'card', name: 'Credit Card', icon: '💳', desc: 'Visa, Mastercard' },
                { id: 'cash', name: 'Cash', icon: '💵', desc: 'Pay at counter' }
              ].map(method => (
                <label key={method.id} className={`method-option-modern ${paymentMethod === method.id ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="radio-input-modern"
                  />
                  <div className="method-content-modern">
                    <span className="method-icon-modern">{method.icon}</span>
                    <div className="method-info-modern">
                      <div className="method-name-modern">{method.name}</div>
                      <div className="method-desc-modern">{method.desc}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {paymentMethod === 'qr' && (
              <div className="qr-payment-modern">
                <div className="qr-payment-header-modern">
                  <h4>Scan to Pay</h4>
                  <p>Use your banking app to scan the QR code</p>
                </div>
                <div className="payment-qr-code-modern">
                  <QRCodeSVG 
                    value={`flavorflow://payment?amount=${orderDetails.total}&table=${orderDetails.table}`}
                    size={isMobile ? 140 : 180}
                    level="H"
                  />
                </div>
                <div className="payment-amount-modern">
                  Amount: <strong>RM {orderDetails.total.toFixed(2)}</strong>
                </div>
              </div>
            )}

            <button 
              className={`pay-now-btn-modern ${paymentStatus === 'processing' ? 'processing' : ''}`}
              onClick={handlePayment}
              disabled={paymentStatus === 'processing'}
              type="button"
            >
              {paymentStatus === 'processing' ? (
                <>
                  <span className="spinner-modern"></span>
                  Processing Payment...
                </>
              ) : (
                `Pay RM ${orderDetails.total.toFixed(2)}`
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Modern Menu Item Card Component for Admin
  const MenuItemCard = ({ item, onAddToCart, isMobile }) => {
    const itemName = item.name || 'Unknown Item';
    const itemPrice = item.price || 0;
    const itemDescription = item.description || 'Delicious menu item';
    const prepTime = item.prepTime || item.preparationTime || 15;
    
    return (
      <div className="menu-item-card-modern">
        <div className="menu-item-image-modern">
          <span className="item-emoji-modern">{item.image || '🍽️'}</span>
        </div>
        <div className="menu-item-content-modern">
          <div className="menu-item-header-modern">
            <h3 className="menu-item-name-modern">{itemName}</h3>
            <div className="menu-item-price-modern">RM {itemPrice.toFixed(2)}</div>
          </div>
          <p className="menu-item-desc-modern">
            {isMobile ? `${itemDescription.substring(0, 60)}...` : itemDescription}
          </p>
          <div className="menu-item-tags-modern">
            <span className="tag-modern tag-prep-modern">⏱️ {prepTime}m</span>
            {item.spicy && item.spicy !== "Mild" && (
              <span className="tag-modern tag-spicy-modern">
                🌶️ {item.spicy}
              </span>
            )}
            {item.popular && (
              <span className="tag-modern tag-popular-modern">
                ⭐ Popular
              </span>
            )}
          </div>
          <button 
            className="add-to-cart-btn-modern"
            onClick={() => onAddToCart(item)}
            type="button"
          >
            <span className="btn-icon-modern">+</span>
            Add to Cart
          </button>
        </div>
      </div>
    );
  };

  // Use ONLY the menu from props (API data)
  const displayMenu = menu || [];

  // Create categories from actual menu data
  const getMenuCategories = () => {
    if (!displayMenu || displayMenu.length === 0) {
      return [
        { id: 'all', name: 'All Items', count: 0 }
      ];
    }

    const categories = [...new Set(displayMenu.map(item => item.category || 'uncategorized'))];
    
    const categoryList = categories.map(category => ({
      id: category,
      name: category.charAt(0).toUpperCase() + category.slice(1),
      count: displayMenu.filter(item => item.category === category).length
    }));

    return [
      { id: 'all', name: 'All Items', count: displayMenu.length },
      ...categoryList
    ];
  };

  const menuCategories = getMenuCategories();

  // Filter items based on active category
  const getFilteredItems = () => {
    if (!displayMenu || displayMenu.length === 0) return [];
    
    if (activeCategory === 'all') {
      return displayMenu;
    }
    
    return displayMenu.filter(item => item.category === activeCategory);
  };

  const filteredItems = getFilteredItems();

  const truncateText = (text, maxLength = 20) => {
    if (!text || typeof text !== 'string') return 'Unknown Item';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // ADMIN VIEW
  const AdminView = () => {
    return (
      <div className="digital-menu-modern">
        <div className="menu-header-modern">
          <div className="menu-header-content-modern">
            <div className="menu-title-section-modern">
              <h2 className="menu-title-modern">
                Menu Management
              </h2>
              <p className="menu-subtitle-modern">
                {selectedTable === 'Takeaway' 
                  ? 'Takeaway Order' 
                  : selectedTable 
                    ? `Table ${selectedTable} • Staff View`
                    : 'Select a table to begin'
                }
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

        {showPayment ? (
          <PaymentPage 
            orderDetails={{
              table: selectedTable,
              items: cart,
              subtotal,
              serviceTax,
              sst,
              total,
              orderType
            }}
            onBack={() => setShowPayment(false)}
            onPaymentSuccess={() => {
              handlePlaceOrder();
            }}
            isMobile={isMobile}
          />
        ) : (
          <div className="menu-layout-modern">
            {/* Modern Categories Sidebar */}
            <div className="categories-sidebar-modern">
              <h3 className="categories-title-modern">Categories</h3>
              <div className="categories-list-modern">
                {menuCategories.map(category => (
                  <button
                    key={category.id}
                    className={`category-btn-modern ${activeCategory === category.id ? 'active' : ''}`}
                    onClick={() => setActiveCategory(category.id)}
                    type="button"
                  >
                    <span className="category-name-modern">
                      {category.name}
                    </span>
                    <span className="category-count-modern">{category.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Modern Menu Items Container */}
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
                      {activeCategory === 'all' ? 'All Menu Items' : menuCategories.find(c => c.id === activeCategory)?.name}
                    </h3>
                    <span className="items-count-modern">{filteredItems.length} items</span>
                  </div>
                  <div className="menu-grid-modern">
                    {filteredItems.map(item => (
                      <MenuItemCard 
                        key={item._id || item.id} 
                        item={item} 
                        onAddToCart={addToCart}
                        isMobile={isMobile}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modern Cart Sidebar */}
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
                          <div className="cart-item-name-modern">
                            {truncateText(item.name, isMobile ? 25 : 35)}
                          </div>
                          <div className="cart-item-price-modern">RM {item.price.toFixed(2)}</div>
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
                      <span>Service Tax (6%)</span>
                      <span>RM {serviceTax.toFixed(2)}</span>
                    </div>
                    <div className="total-line-modern">
                      <span>SST (8%)</span>
                      <span>RM {sst.toFixed(2)}</span>
                    </div>
                    <div className="grand-total-modern">
                      <span>Total Amount</span>
                      <span className="grand-total-amount-modern">
                        RM {total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="cart-actions-modern">
                    <button className="checkout-btn-modern" onClick={handleProceedToPayment} type="button">
                      <span className="checkout-icon-modern">💳</span>
                      {isMobile ? `Pay RM ${total.toFixed(2)}` : `Proceed to Payment`}
                    </button>
                    <button className="place-order-btn-modern" onClick={handlePlaceOrder} type="button">
                      <span className="order-icon-modern">📦</span>
                      Place Order Only
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Mobile Cart Overlay */}
        {isMobile && cartOpen && (
          <div 
            className="cart-overlay active"
            onClick={handleCartClose}
          />
        )}

        {/* Mobile Cart Toggle Button */}
        {isMobile && (
          <button 
            className="cart-toggle-btn-modern"
            onClick={toggleCart}
            type="button"
          >
            🛒
            {itemCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                fontSize: '0.75rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white'
              }}>
                {itemCount}
              </span>
            )}
          </button>
        )}
      </div>
    );
  };

  // MAIN RENDER
  return (
    <div className="digitalMenu">
      {isCustomerView ? <PremiumCustomerView /> : <AdminView />}
    </div>
  );
};

export default DigitalMenu;