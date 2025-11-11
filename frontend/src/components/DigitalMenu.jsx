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
  
  // ADD this useEffect to DigitalMenu.jsx for better table detection:
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
      
      // Also detect on load in case of slow rendering
      setTimeout(detectTableFromURL, 1000);
      
      // Listen for URL changes
      window.addEventListener('hashchange', detectTableFromURL);
      window.addEventListener('popstate', detectTableFromURL);
      
      return () => {
        window.removeEventListener('hashchange', detectTableFromURL);
        window.removeEventListener('popstate', detectTableFromURL);
      };
    }
  }, [isCustomerView]);

  // Get table from URL parameters (for QR code scanning)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableFromUrl = urlParams.get('table');
    if (tableFromUrl) {
      console.log('DigitalMenu - Table from URL params:', tableFromUrl);
      setSelectedTable(tableFromUrl);
    }
  }, []);

  // DEBUG: Log menu data
  useEffect(() => {
    console.log('DigitalMenu - Menu data received:', menu);
  }, [menu]);

  // Reusable Menu Item Card Component
  const MenuItemCard = ({ item, onAddToCart, isMobile }) => (
    <div className="menu-item-card">
      <div className="menu-item-header">
        <span className="menu-item-image">{item.image}</span>
        <div className="menu-item-info">
          <h3 className="menu-item-name">{item.name}</h3>
          <p className="menu-item-description">
            {isMobile ? `${item.description?.substring(0, 50)}...` : item.description}
          </p>
        </div>
      </div>
      <div className="menu-item-meta">
        <div className="menu-item-tags">
          <span className="menu-item-tag">⏱️ {item.prepTime}m</span>
          {item.spicy !== "Mild" && (
            <span className="menu-item-tag" style={{
              backgroundColor: item.spicy === 'Medium' ? '#fef3c7' : '#fef2f2',
              color: item.spicy === 'Medium' ? '#d97706' : '#dc2626'
            }}>
              🌶️ {item.spicy}
            </span>
          )}
          {item.popular && (
            <span className="menu-item-tag" style={{
              backgroundColor: '#f0f9ff',
              color: '#0369a1'
            }}>
              ⭐ Popular
            </span>
          )}
        </div>
        <div className="menu-item-actions">
          <div className="menu-item-price">RM {item.price.toFixed(2)}</div>
          <button 
            className="add-to-cart-btn"
            onClick={() => onAddToCart(item)}
          >
            {isMobile ? '+' : 'Add +'}
          </button>
        </div>
      </div>
    </div>
  );

  // Payment Page Component
  const PaymentPage = ({ orderDetails, onBack, onPaymentSuccess, isMobile }) => {
    const [paymentMethod, setPaymentMethod] = useState('qr');
    const [paymentStatus, setPaymentStatus] = useState('pending');

    const handlePayment = () => {
      setPaymentStatus('processing');
      
      // Simulate payment processing
      setTimeout(() => {
        setPaymentStatus('success');
        setTimeout(() => {
          onPaymentSuccess();
        }, 2000);
      }, 3000);
    };

    if (paymentStatus === 'success') {
      return (
        <div className="payment-container">
          <div className="payment-success">
            <div className="success-icon">✅</div>
            <h2 className="success-title">Payment Successful!</h2>
            <p className="success-message">
              Thank you for your payment. Your order is being prepared.
            </p>
            <button className="continue-btn" onClick={onPaymentSuccess}>
              Continue
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="payment-container">
        <div className="payment-header">
          <button className="back-btn" onClick={onBack}>
            ← Back to Menu
          </button>
          <h2 className="payment-title">Payment</h2>
        </div>

        <div className="payment-layout">
          <div className="order-summary">
            <h3 className="summary-title">Order Summary</h3>
            <div className="summary-details">
              <div className="summary-row">
                <span>Table:</span>
                <span>{orderDetails.orderType === 'dine-in' ? `Table ${orderDetails.table}` : 'Takeaway'}</span>
              </div>
              {orderDetails.items.map((item, index) => {
                const itemName = item.name || 'Unknown Item';
                const displayName = isMobile ? truncateText(itemName, 15) : itemName;
                const itemPrice = item.price || 0;
                const itemQuantity = item.quantity || 1;
                
                return (
                  <div key={index} className="summary-row">
                    <span>{itemQuantity}x {displayName}</span>
                    <span>RM {(itemPrice * itemQuantity).toFixed(2)}</span>
                  </div>
                );
              })}
              <div className="summary-divider"></div>
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>RM {orderDetails.subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Service Tax (6%):</span>
                <span>RM {orderDetails.serviceTax.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>SST (8%):</span>
                <span>RM {orderDetails.sst.toFixed(2)}</span>
              </div>
              <div className="grand-total-row">
                <span>Total Amount:</span>
                <span className="grand-total-text">RM {orderDetails.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="payment-methods">
            <h3 className="methods-title">Select Payment Method</h3>
            
            <div className="method-options">
              <label className={`method-option ${paymentMethod === 'qr' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="qr"
                  checked={paymentMethod === 'qr'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="radio-input"
                />
                <div className="method-content">
                  <span className="method-icon">📱</span>
                  <div>
                    <div className="method-name">QR Code Payment</div>
                    <div className="method-desc">Scan QR code with your banking app</div>
                  </div>
                </div>
              </label>

              <label className={`method-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="radio-input"
                />
                <div className="method-content">
                  <span className="method-icon">💳</span>
                  <div>
                    <div className="method-name">Credit/Debit Card</div>
                    <div className="method-desc">Pay with Visa, Mastercard, or UnionPay</div>
                  </div>
                </div>
              </label>

              <label className={`method-option ${paymentMethod === 'cash' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="radio-input"
                />
                <div className="method-content">
                  <span className="method-icon">💵</span>
                  <div>
                    <div className="method-name">Cash Payment</div>
                    <div className="method-desc">Pay with cash at the counter</div>
                  </div>
                </div>
              </label>
            </div>

            {paymentMethod === 'qr' && (
              <div className="qr-payment">
                <div className="qr-payment-header">
                  <h4>Scan to Pay</h4>
                  <p>Use your banking app to scan the QR code</p>
                </div>
                <div className="payment-qr-code">
                  <QRCodeSVG 
                    value={`flavorflow://payment?amount=${orderDetails.total}&table=${orderDetails.table}`}
                    size={isMobile ? 150 : 200}
                    level="H"
                  />
                </div>
                <div className="payment-amount">
                  Amount: <strong>RM {orderDetails.total.toFixed(2)}</strong>
                </div>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="card-payment">
                <div className="card-form">
                  <input 
                    className="card-input" 
                    placeholder="Card Number" 
                    type="text"
                    maxLength="19"
                    pattern="[0-9\s]{13,19}"
                  />
                  <div className="card-row">
                    <input 
                      className="card-input" 
                      placeholder="MM/YY" 
                      type="text"
                      maxLength="5"
                    />
                    <input 
                      className="card-input" 
                      placeholder="CVV" 
                      type="text"
                      maxLength="3"
                    />
                  </div>
                  <input 
                    className="card-input" 
                    placeholder="Cardholder Name" 
                    type="text"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'cash' && (
              <div className="cash-payment">
                <div className="cash-instructions">
                  <p>Please proceed to the counter to make cash payment.</p>
                  <p>Your order number will be called when ready.</p>
                </div>
              </div>
            )}

            <button 
              className={`pay-now-btn ${paymentStatus === 'processing' ? 'processing' : ''}`}
              onClick={handlePayment}
              disabled={paymentStatus === 'processing'}
            >
              {paymentStatus === 'processing' ? (
                <>
                  <span className="spinner"></span>
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

  // **FIXED: Use ONLY the menu from props (API data) - NO HARDCODED MENU**
  const displayMenu = menu || [];

  // **FIXED: Create categories from actual menu data**
  const getMenuCategories = () => {
    if (!displayMenu || displayMenu.length === 0) {
      return [
        { id: 'all', name: 'All Items', count: 0 }
      ];
    }

    // Extract unique categories from menu items
    const categories = [...new Set(displayMenu.map(item => item.category || 'uncategorized'))];
    
    const categoryList = categories.map(category => ({
      id: category,
      name: category.charAt(0).toUpperCase() + category.slice(1),
      count: displayMenu.filter(item => item.category === category).length
    }));

    // Add "All Items" category
    return [
      { id: 'all', name: 'All Items', count: displayMenu.length },
      ...categoryList
    ];
  };

  const menuCategories = getMenuCategories();

  // **FIXED: Filter items based on active category**
  const getFilteredItems = () => {
    if (!displayMenu || displayMenu.length === 0) return [];
    
    if (activeCategory === 'all') {
      return displayMenu;
    }
    
    return displayMenu.filter(item => item.category === activeCategory);
  };

  const filteredItems = getFilteredItems();

  const addToCart = (item) => {
    console.log('DigitalMenu - Adding to cart:', item);
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
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

  // REPLACE the entire table detection useEffect in DigitalMenu.jsx:
  useEffect(() => {
    const detectTableFromURL = () => {
      console.log('🔍 DigitalMenu - Scanning URL for table number...');
      
      // Get current URL
      const currentUrl = window.location.href;
      console.log('📋 Current URL:', currentUrl);
      
      let detectedTable = null;

      // Method 1: Check hash parameters (/#/menu?table=T01)
      if (window.location.hash) {
        const hash = window.location.hash;
        console.log('🔍 Hash found:', hash);
        
        if (hash.includes('?')) {
          const hashParams = new URLSearchParams(hash.split('?')[1]);
          if (hashParams.has('table')) {
            detectedTable = hashParams.get('table');
            console.log('✅ Table detected from hash params:', detectedTable);
          }
        }
        
        // Also check for /#/menu/table/T01 format
        const hashParts = hash.split('/');
        const tableIndex = hashParts.findIndex(part => part === 'table');
        if (tableIndex !== -1 && hashParts[tableIndex + 1]) {
          detectedTable = hashParts[tableIndex + 1];
          console.log('✅ Table detected from hash path:', detectedTable);
        }
      }

      // Method 2: Check URL search params (/?table=T01)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('table')) {
        detectedTable = urlParams.get('table');
        console.log('✅ Table detected from search params:', detectedTable);
      }

      if (detectedTable) {
        console.log('🎯 Setting table number to:', detectedTable);
        setTableNumber(detectedTable);
        setSelectedTable(detectedTable);
      } else {
        console.log('❌ No table number detected in URL');
        console.log('📋 URL analysis:', {
          href: window.location.href,
          hash: window.location.hash,
          search: window.location.search,
          pathname: window.location.pathname
        });
      }
    };

    if (isCustomerView) {
      console.log('👤 Customer view - starting table detection');
      
      // Detect immediately
      detectTableFromURL();
      
      // Also detect after a short delay (for SPA routing)
      const timeoutId = setTimeout(detectTableFromURL, 500);
      
      // Listen for URL changes
      window.addEventListener('hashchange', detectTableFromURL);
      window.addEventListener('popstate', detectTableFromURL);
      
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('hashchange', detectTableFromURL);
        window.removeEventListener('popstate', detectTableFromURL);
      };
    }
  }, [isCustomerView]);

  // UPDATE the handlePlaceOrder function in DigitalMenu.jsx:
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty. Please add some items first.');
      return;
    }

    // Use detected table number or manual selection
    const finalTableNumber = tableNumber || selectedTable;
    
    if (!finalTableNumber && isCustomerView) {
      alert('Table number not detected. Please scan the QR code again or contact staff.');
      console.error('❌ No table number available for QR order');
      return;
    }

    console.log('🛒 Placing order for table:', finalTableNumber);
    console.log('📦 Cart items:', cart);

    try {
      const orderData = cart.map(item => ({
        menuItemId: item._id || item.id,
        _id: item._id || item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category
      }));

      console.log('📤 Sending order data:', {
        tableNumber: finalTableNumber,
        items: orderData,
        orderType: 'dine-in'
      });

      const result = await onCreateOrder(finalTableNumber, orderData, 'dine-in');
      
      console.log('✅ Order placed successfully:', result);
      
      // Clear cart and show success
      setCart([]);
      setOrderSuccess(true);
      
      setTimeout(() => setOrderSuccess(false), 5000);
      
      alert(`Order placed successfully! Your order number is: ${result.orderNumber}`);
      
    } catch (error) {
      console.error('❌ Order failed:', error);
      alert('Failed to place order: ' + error.message);
    }
  };

  const handleProceedToPayment = () => {
    if (cart.length === 0) return;
    setShowPayment(true);
  };

  // Safe text truncation
  const truncateText = (text, maxLength = 20) => {
    if (!text || typeof text !== 'string') return 'Unknown Item';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div className="page">
      {/* Improved Header Section */}
      <div className="page-header">
        <div className="menu-header-content">
          <div className="menu-header-info">
            <h2 className="page-title">
              {isCustomerView ? '🍛 FlavorFlow Menu' : 'Digital Menu'}
            </h2>
            <p className="page-subtitle">
              {isCustomerView && currentTable 
                ? `Welcome to Table ${currentTable} • Scan QR code to order`
                : selectedTable === 'Takeaway' 
                  ? 'Takeaway Order' 
                  : `Table ${selectedTable} • Scan QR code to order`
              }
            </p>
          </div>
          
          <div className="menu-controls-enhanced">
            <div className="control-group">
              <label className="control-label">Order Type</label>
              <select 
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
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
                  {['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08'].map(table => (
                    <option key={table} value={table}>Table {table}</option>
                  ))}
                </select>
              </div>
            )}
            
            {!isCustomerView && (
              <div className="control-group">
                <label className="control-label">View</label>
                <button 
                  className="customer-view-btn"
                  onClick={() => window.open('/#menu', '_blank')}
                >
                  👀 Customer View
                </button>
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
        <div className="menu-layout">
          {/* Categories Sidebar */}
          <div className="categories-sidebar">
            <h3 className="categories-title">Categories</h3>
            <div className="categories-list">
              {menuCategories.map(category => (
                <button
                  key={category.id}
                  className={`category-button ${activeCategory === category.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <span className="category-name">
                    {isMobile ? category.name.split(' ')[0] : category.name}
                  </span>
                  <span className="category-count">{category.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Container */}
          <div className="menu-items-container">
            {filteredItems.length === 0 ? (
              <div className="empty-menu-state">
                <div className="empty-menu-icon">🍽️</div>
                <h3>No Menu Items Available</h3>
                <p>Menu items will appear here once loaded from the digital menu</p>
              </div>
            ) : (
              <div className="menu-section">
                <h3 className="section-title">
                  {activeCategory === 'all' ? 'All Menu Items' : menuCategories.find(c => c.id === activeCategory)?.name}
                </h3>
                <div className="menu-items-grid">
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

          {/* Cart Sidebar */}
          <div className="cart-sidebar">
            <div className="cart-header">
              <h3 className="cart-title">Your Order</h3>
              <div className="cart-summary">
                {orderType === 'dine-in' ? `Table ${selectedTable}` : 'Takeaway'} • {itemCount} items
              </div>
            </div>

            {cart.length === 0 ? (
              <div className="empty-cart">
                <div className="empty-cart-icon">🛒</div>
                <p className="empty-cart-text">Your cart is empty</p>
                <p className="empty-cart-subtext">Add items from the menu</p>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-info">
                        <div className="cart-item-name">
                          {isMobile ? `${item.name.substring(0, 20)}...` : item.name}
                        </div>
                        <div className="cart-item-price">RM {item.price.toFixed(2)} each</div>
                      </div>
                      <div className="cart-item-controls">
                        <button 
                          className="quantity-btn"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          -
                        </button>
                        <span className="quantity-display">{item.quantity}</span>
                        <button 
                          className="quantity-btn"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          +
                        </button>
                        <button 
                          className="remove-btn"
                          onClick={() => removeFromCart(item.id)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-total">
                  <div className="total-line">
                    <span>Subtotal</span>
                    <span>RM {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="total-line">
                    <span>Service Tax (6%)</span>
                    <span>RM {serviceTax.toFixed(2)}</span>
                  </div>
                  <div className="total-line">
                    <span>SST (8%)</span>
                    <span>RM {sst.toFixed(2)}</span>
                  </div>
                  <div className="grand-total">
                    <span>Total Amount</span>
                    <span className="grand-total-amount">
                      RM {total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="cart-actions">
                  <button className="checkout-btn" onClick={handleProceedToPayment}>
                    <span className="checkout-icon">💳</span>
                    {isMobile ? `Pay RM ${total.toFixed(2)}` : `Proceed to Payment - RM ${total.toFixed(2)}`}
                  </button>
                  <button className="place-order-btn" onClick={handlePlaceOrder}>
                    <span className="checkout-icon">📦</span>
                    {isMobile ? 'Place Order' : 'Place Order Only'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalMenu;