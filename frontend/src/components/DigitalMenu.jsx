import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './DigitalMenu.css';

// Reusable Menu Item Card Component
const MenuItemCard = ({ item, onAddToCart, isMobile }) => (
  <div className="menu-item-card">
    <div className="menu-item-header">
      <span className="menu-item-image">{item.image}</span>
      <div className="menu-item-info">
        <h3 className="menu-item-name">{item.name}</h3>
        <p className="menu-item-description">
          {isMobile ? `${item.description.substring(0, 50)}...` : item.description}
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
            {orderDetails.items.map((item, index) => (
              <div key={index} className="summary-row">
                <span>{item.quantity}x {isMobile ? `${item.name.substring(0, 15)}...` : item.name}</span>
                <span>RM {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
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

// Main DigitalMenu Component
const DigitalMenu = ({ cart, setCart, onCreateOrder, isMobile }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedTable, setSelectedTable] = useState('T01');
  const [orderType, setOrderType] = useState('dine-in');
  const [showPayment, setShowPayment] = useState(false);

  // Organized menu structure
  const menuSections = [
    {
      id: 'signature',
      name: 'Signature Dishes',
      items: [
        {
          id: 1,
          name: "Nasi Lemak Royal",
          description: "Premium coconut rice with traditional sambal, crispy chicken, anchovies, and quail eggs",
          price: 16.90,
          category: "signature",
          prepTime: 15,
          spicy: "Medium",
          popular: true,
          image: "🍛"
        },
        {
          id: 3,
          name: "Rendang Tok",
          description: "Traditional dry beef rendang with authentic spices and coconut",
          price: 22.90,
          category: "signature",
          prepTime: 25,
          spicy: "Hot",
          popular: true,
          image: "🍖"
        },
        {
          id: 5,
          name: "Satay Set (10 sticks)",
          description: "Grilled chicken and beef satay with peanut sauce and condiments",
          price: 18.90,
          category: "signature",
          prepTime: 12,
          spicy: "Mild",
          popular: true,
          image: "🍢"
        },
        {
          id: 11,
          name: "Char Kway Teow",
          description: "Stir-fried rice noodles with prawns, cockles, and Chinese sausage",
          price: 14.90,
          category: "signature",
          prepTime: 12,
          spicy: "Medium",
          popular: true,
          image: "🍜"
        }
      ]
    },
    {
      id: 'main',
      name: 'Main Courses',
      items: [
        {
          id: 7,
          name: "Chicken Curry",
          description: "Spicy chicken curry with potatoes and coconut milk",
          price: 14.90,
          category: "main",
          prepTime: 20,
          spicy: "Medium",
          popular: false,
          image: "🍗"
        },
        {
          id: 8,
          name: "Fried Rice Special",
          description: "Wok-fried rice with shrimp, chicken, and vegetables",
          price: 12.90,
          category: "main",
          prepTime: 10,
          spicy: "Mild",
          popular: true,
          image: "🍚"
        },
        {
          id: 12,
          name: "Beef Rendang",
          description: "Slow-cooked beef in rich coconut and spices",
          price: 19.90,
          category: "main",
          prepTime: 25,
          spicy: "Hot",
          popular: true,
          image: "🥩"
        }
      ]
    },
    {
      id: 'drinks',
      name: 'Beverages',
      items: [
        {
          id: 2,
          name: "Artisan Teh Tarik",
          description: "Expertly pulled Malaysian milk tea with rich, creamy foam",
          price: 6.50,
          category: "drinks", 
          prepTime: 5,
          spicy: "Mild",
          popular: true,
          image: "🥤"
        },
        {
          id: 6,
          name: "Iced Lemon Tea",
          description: "Refreshing lemon tea with mint leaves and honey",
          price: 5.90,
          category: "drinks",
          prepTime: 3,
          spicy: "Mild",
          popular: false,
          image: "🍋"
        },
        {
          id: 9,
          name: "Fresh Coconut",
          description: "Chilled young coconut with natural sweetness",
          price: 8.90,
          category: "drinks",
          prepTime: 2,
          spicy: "Mild",
          popular: true,
          image: "🥥"
        },
        {
          id: 13,
          name: "Iced Coffee",
          description: "Rich coffee with condensed milk and ice",
          price: 7.50,
          category: "drinks",
          prepTime: 4,
          spicy: "Mild",
          popular: true,
          image: "☕"
        }
      ]
    },
    {
      id: 'desserts',
      name: 'Desserts',
      items: [
        {
          id: 4,
          name: "Mango Sticky Rice",
          description: "Sweet mango with coconut sticky rice and sesame seeds",
          price: 12.90,
          category: "desserts",
          prepTime: 10,
          spicy: "Mild",
          popular: false,
          image: "🥭"
        },
        {
          id: 10,
          name: "Cendol Delight",
          description: "Traditional shaved ice with coconut milk and palm sugar",
          price: 7.90,
          category: "desserts",
          prepTime: 5,
          spicy: "Mild",
          popular: true,
          image: "🍧"
        },
        {
          id: 14,
          name: "Pisang Goreng",
          description: "Crispy fried bananas with ice cream",
          price: 8.90,
          category: "desserts",
          prepTime: 8,
          spicy: "Mild",
          popular: true,
          image: "🍌"
        }
      ]
    },
    {
      id: 'appetizers',
      name: 'Appetizers',
      items: [
        {
          id: 15,
          name: "Spring Rolls",
          description: "Crispy vegetable spring rolls with sweet chili sauce",
          price: 9.90,
          category: "appetizers",
          prepTime: 8,
          spicy: "Mild",
          popular: true,
          image: "🌯"
        },
        {
          id: 16,
          name: "Prawn Crackers",
          description: "Light and crispy prawn crackers with dip",
          price: 6.90,
          category: "appetizers",
          prepTime: 3,
          spicy: "Mild",
          popular: false,
          image: "🦐"
        }
      ]
    }
  ];

  // Calculate total items count for "All Items"
  const totalItemsCount = menuSections.reduce((total, section) => total + section.items.length, 0);

  const menuCategories = [
    { id: 'all', name: 'All Items', count: totalItemsCount },
    ...menuSections.map(section => ({
      id: section.id,
      name: section.name,
      count: section.items.length
    }))
  ];

  // Get table from URL parameters (for QR code scanning)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableFromUrl = urlParams.get('table');
    if (tableFromUrl) {
      setSelectedTable(tableFromUrl);
    }
  }, []);

  const addToCart = (item) => {
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

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    
    const newOrder = onCreateOrder(selectedTable, cart, orderType);
    setCart([]);
    setShowPayment(false);
    
    // Show confirmation
    alert(`Order placed successfully! Your order number is ${newOrder.id}. Please proceed to payment when ready.`);
  };

  const handleProceedToPayment = () => {
    if (cart.length === 0) return;
    setShowPayment(true);
  };

  // Get filtered items for specific category
  const filteredItems = activeCategory === 'all' 
    ? [] // We'll handle "all" differently
    : menuSections.find(section => section.id === activeCategory)?.items || [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Digital Menu</h2>
          <p className="page-subtitle">
            {selectedTable === 'Takeaway' ? 'Takeaway Order' : `Table ${selectedTable}`} • Scan QR code to order
          </p>
        </div>
        <div className="menu-controls">
          <select 
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            className="control-select"
          >
            <option value="dine-in">Dine In</option>
            <option value="takeaway">Takeaway</option>
          </select>
          {orderType === 'dine-in' && (
            <select 
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="control-select"
            >
              {['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08'].map(table => (
                <option key={table} value={table}>Table {table}</option>
              ))}
            </select>
          )}
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
            {activeCategory === 'all' ? (
              // Show all sections when "All Items" is selected
              menuSections.map(section => (
                <div key={section.id} className="menu-section">
                  <h3 className="section-title">{section.name}</h3>
                  <div className="menu-items-grid">
                    {section.items.map(item => (
                      <MenuItemCard 
                        key={item.id} 
                        item={item} 
                        onAddToCart={addToCart}
                        isMobile={isMobile}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              // Show filtered items when a specific category is selected
              <div className="menu-section">
                <h3 className="section-title">
                  {menuSections.find(s => s.id === activeCategory)?.name}
                </h3>
                <div className="menu-items-grid">
                  {filteredItems.map(item => (
                    <MenuItemCard 
                      key={item.id} 
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