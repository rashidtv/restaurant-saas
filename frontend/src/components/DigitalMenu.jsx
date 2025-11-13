import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './DigitalMenu.css';

const DigitalMenu = ({ cart, setCart, onCreateOrder, isMobile, menu, apiConnected, currentTable, isCustomerView = false }) => {
  const [selectedTable, setSelectedTable] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [orderType, setOrderType] = useState('dine-in');
  const [showPayment, setShowPayment] = useState(false);
  const [tableNumber, setTableNumber] = useState(currentTable || '');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  
  // Table detection - KEEP EXISTING FUNCTIONALITY
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

  // Get table from URL parameters - KEEP EXISTING
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableFromUrl = urlParams.get('table');
    if (tableFromUrl) {
      console.log('DigitalMenu - Table from URL params:', tableFromUrl);
      setSelectedTable(tableFromUrl);
      setTableNumber(tableFromUrl);
    }
  }, []);

  // DEBUG: Log menu data - KEEP EXISTING
  useEffect(() => {
    console.log('DigitalMenu - Menu data received:', menu);
  }, [menu]);

  // NEW: Simplified Customer View Component
  const CustomerMenuView = () => {
    const [localCart, setLocalCart] = useState([]);
    const [localCartOpen, setLocalCartOpen] = useState(false);

    const addToCart = (item) => {
      const existingItem = localCart.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        setLocalCart(localCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        ));
      } else {
        setLocalCart([...localCart, { ...item, quantity: 1 }]);
      }
      
      if (isMobile) setLocalCartOpen(true);
    };

    const removeFromCart = (id) => {
      setLocalCart(localCart.filter(item => item.id !== id));
    };

    const updateQuantity = (id, change) => {
      setLocalCart(localCart.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(0, item.quantity + change) }
          : item
      ).filter(item => item.quantity > 0));
    };

    const subtotal = localCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal * 1.14;

    const handlePlaceOrder = async () => {
      if (localCart.length === 0) {
        alert('Your cart is empty');
        return;
      }

      try {
        const orderData = localCart.map(item => ({
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }));

        await onCreateOrder(selectedTable, orderData, 'dine-in');
        setLocalCart([]);
        setLocalCartOpen(false);
        alert('Order placed successfully! 🎉');
      } catch (error) {
        alert('Order failed: ' + error.message);
      }
    };

    const categories = ['all', ...new Set(menu.map(item => item.category).filter(Boolean))];
    const filteredItems = activeCategory === 'all' 
      ? menu 
      : menu.filter(item => item.category === activeCategory);

    return (
      <div className="customer-view-modern">
        {/* Header */}
        <div className="customer-header-modern">
          <div className="header-content-modern">
            <div className="restaurant-info-modern">
              <h1 className="restaurant-name-modern">🍛 FlavorFlow</h1>
              <p className="table-info-modern">Table {selectedTable || 'Unknown'}</p>
            </div>
            <button 
              className="cart-toggle-modern" 
              onClick={() => setLocalCartOpen(!localCartOpen)}
            >
              <span className="cart-icon-modern">🛒</span>
              {localCart.length > 0 && (
                <span className="cart-badge-modern">
                  {localCart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="categories-scroll-modern">
          <div className="categories-container-modern">
            {categories.map(category => (
              <button
                key={category}
                className={`category-btn-modern ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                <span className="category-emoji-modern">
                  {category === 'all' ? '🍽️' : 
                   category === 'appetizers' ? '🥗' :
                   category === 'main-course' ? '🍛' :
                   category === 'desserts' ? '🍰' : '🥤'}
                </span>
                <span className="category-name-modern">
                  {category === 'all' ? 'All' : category}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="menu-container-modern">
          <div className="menu-grid-modern">
            {filteredItems.map(item => (
              <div key={item.id} className="menu-item-card-modern">
                <div className="item-image-modern">
                  <span className="item-emoji-modern">{item.image || '🍽️'}</span>
                </div>
                <div className="item-content-modern">
                  <div className="item-header-modern">
                    <h3 className="item-name-modern">{item.name}</h3>
                    <div className="item-price-modern">RM {item.price}</div>
                  </div>
                  <p className="item-description-modern">{item.description}</p>
                  <div className="item-tags-modern">
                    <span className="tag-modern prep-time-modern">
                      ⏱️ {item.prepTime || 15}m
                    </span>
                    {item.spicy && (
                      <span className="tag-modern spicy-modern">
                        🌶️ {item.spicy}
                      </span>
                    )}
                  </div>
                  <button 
                    className="add-to-cart-btn-modern"
                    onClick={() => addToCart(item)}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className={`cart-sidebar-modern ${localCartOpen ? 'open' : ''}`}>
          <div className="cart-header-modern">
            <h3>Your Order</h3>
            <button 
              className="close-cart-modern"
              onClick={() => setLocalCartOpen(false)}
            >
              ✕
            </button>
          </div>
          
          <div className="cart-items-modern">
            {localCart.length === 0 ? (
              <div className="empty-cart-modern">
                <div className="empty-icon-modern">🛒</div>
                <p>Your cart is empty</p>
                <p>Add items from the menu</p>
              </div>
            ) : (
              localCart.map(item => (
                <div key={item.id} className="cart-item-modern">
                  <div className="cart-item-info-modern">
                    <span className="cart-item-name-modern">{item.name}</span>
                    <span className="cart-item-price-modern">RM {item.price}</span>
                  </div>
                  <div className="cart-controls-modern">
                    <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                    <span className="quantity-modern">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                    <button 
                      className="remove-btn-modern"
                      onClick={() => removeFromCart(item.id)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {localCart.length > 0 && (
            <div className="cart-footer-modern">
              <div className="cart-total-modern">
                <div className="total-line-modern">
                  <span>Subtotal</span>
                  <span>RM {subtotal.toFixed(2)}</span>
                </div>
                <div className="total-line-modern">
                  <span>Tax (14%)</span>
                  <span>RM {(subtotal * 0.14).toFixed(2)}</span>
                </div>
                <div className="grand-total-modern">
                  <span>Total</span>
                  <span>RM {total.toFixed(2)}</span>
                </div>
              </div>
              <button 
                className="checkout-btn-modern"
                onClick={handlePlaceOrder}
              >
                Place Order • RM {total.toFixed(2)}
              </button>
            </div>
          )}
        </div>

        {/* Overlay */}
        {localCartOpen && (
          <div 
            className="cart-overlay-modern" 
            onClick={() => setLocalCartOpen(false)}
          />
        )}
      </div>
    );
  };

  // KEEP ALL EXISTING ADMIN FUNCTIONALITY BELOW

  // Modern Payment Page Component - KEEP EXISTING
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
            <button className="continue-btn-modern" onClick={onPaymentSuccess}>
              Continue Shopping
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="payment-container-modern">
        <div className="payment-header-modern">
          <button className="back-btn-modern" onClick={onBack}>
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

  // FIXED: Modern Menu Item Card Component - KEEP EXISTING
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
          >
            <span className="btn-icon-modern">+</span>
            Add to Cart
          </button>
        </div>
      </div>
    );
  };

  // Use ONLY the menu from props (API data) - KEEP EXISTING
  const displayMenu = menu || [];

  // Create categories from actual menu data - KEEP EXISTING
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

  // Filter items based on active category - KEEP EXISTING
  const getFilteredItems = () => {
    if (!displayMenu || displayMenu.length === 0) return [];
    
    if (activeCategory === 'all') {
      return displayMenu;
    }
    
    return displayMenu.filter(item => item.category === activeCategory);
  };

  const filteredItems = getFilteredItems();

  // FIXED: addToCart function - preserve item names properly - KEEP EXISTING
  const addToCart = (item) => {
    console.log('DigitalMenu - Adding to cart:', item);
    
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

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const serviceTax = subtotal * 0.06;
  const sst = subtotal * 0.08;
  const total = subtotal + serviceTax + sst;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Toggle cart for mobile - KEEP EXISTING
  const toggleCart = () => {
    setCartOpen(!cartOpen);
  };

  // Close cart when clicking overlay - KEEP EXISTING
  const handleCartClose = () => {
    setCartOpen(false);
  };

  // Close cart when proceeding to payment - KEEP EXISTING
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

  const truncateText = (text, maxLength = 20) => {
    if (!text || typeof text !== 'string') return 'Unknown Item';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // MAIN RENDER - Use new Customer View for QR scanning, keep admin view as is
  return (
    <div className="digital-menu-modern">
      {isCustomerView ? (
        <CustomerMenuView />
      ) : (
        <>
          {/* Modern Header Section - KEEP EXISTING ADMIN VIEW */}
          <div className="menu-header-modern">
            <div className="menu-header-content-modern">
              <div className="menu-title-section-modern">
                <h2 className="menu-title-modern">
                  {isCustomerView ? '🍛 FlavorFlow' : 'Menu Management'}
                </h2>
                <p className="menu-subtitle-modern">
                  {isCustomerView && currentTable 
                    ? `Table ${currentTable} • Ready to order`
                    : selectedTable === 'Takeaway' 
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
                            >
                              −
                            </button>
                            <span className="quantity-display-modern">{item.quantity}</span>
                            <button 
                              className="quantity-btn-modern"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              +
                            </button>
                            <button 
                              className="remove-btn-modern"
                              onClick={() => removeFromCart(item.id)}
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
                      <button className="checkout-btn-modern" onClick={handleProceedToPayment}>
                        <span className="checkout-icon-modern">💳</span>
                        {isMobile ? `Pay RM ${total.toFixed(2)}` : `Proceed to Payment`}
                      </button>
                      <button className="place-order-btn-modern" onClick={handlePlaceOrder}>
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
        </>
      )}
    </div>
  );
};

export default DigitalMenu;