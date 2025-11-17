import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './DigitalMenu.css';

const DigitalMenu = ({ cart, setCart, onCreateOrder, isMobile, menu, apiConnected, currentTable, isCustomerView = false }) => {
  const [selectedTable, setSelectedTable] = useState(currentTable || '');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [localCartOpen, setLocalCartOpen] = useState(false);

// SIMPLE SEARCH COMPONENT - NO FOCUS MANAGEMENT
const SearchComponent = () => {
  const [localSearchTerm, setLocalSearchTerm] = useState('');

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
          type="text"
          placeholder="Search for dishes, ingredients..."
          value={localSearchTerm}
          onChange={handleSearchChange}
          className="search-input"
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

  // FIX 2: SIMPLE DELETE - Direct state manipulation
  const removeFromCart = (itemId) => {
    console.log('DELETE: Removing item ID:', itemId);
    console.log('Current cart:', cart);
    
    const updatedCart = cart.filter(item => item.id !== itemId);
    console.log('Updated cart:', updatedCart);
    
    setCart(updatedCart);
  };

  const updateQuantity = (id, change) => {
    const updatedCart = cart.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(0, item.quantity + change) }
        : item
    ).filter(item => item.quantity > 0);
    
    setCart(updatedCart);
  };

  const addToCart = (item) => {
    console.log('Adding to cart:', item);
    
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
      setLocalCartOpen(true);
    }
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.14;
  const total = subtotal + tax;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Filter items based on active category and search
  const filteredItems = menu.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get categories from menu
  const categories = ['all', ...new Set(menu.map(item => item.category).filter(Boolean))];

  // Customer View Component
  const CustomerView = () => {
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
                  onClick={() => setShowSearch(!showSearch)}
                  type="button"
                >
                  🔍
                </button>
                <button 
                  className="cart-indicator"
                  onClick={() => setLocalCartOpen(true)}
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

        {/* Search */}
        <SearchComponent />

        {/* Categories */}
        <section className="categories-section">
          <div className="categories-scroll">
            {categories.map(category => (
              <button
                key={category}
                className={`category-card ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
                type="button"
              >
                <div className="category-emoji">🍽️</div>
                <span className="category-name">{category}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Menu Items */}
        <main className="menu-main">
          <div className="menu-header">
            <h2 className="section-title">Our Menu</h2>
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
                <div key={item.id} className="premium-menu-item">
                  <div className="item-image-container">
                    <div className="item-image">
                      <span className="item-emoji">🍽️</span>
                    </div>
                    <button 
                      className="add-btn"
                      onClick={() => addToCart(item)}
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Cart */}
        <div className={`premium-cart-sidebar ${localCartOpen ? 'open' : ''}`}>
          <div className="cart-header">
            <div className="cart-title-section">
              <h3>Your Order</h3>
              <p>Table {selectedTable}</p>
            </div>
            <button 
              className="close-cart"
              onClick={() => setLocalCartOpen(false)}
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
                    <span>Tax</span>
                    <span>RM {tax.toFixed(2)}</span>
                  </div>
                  <div className="total-line">
                    <span>Total</span>
                    <span className="total-amount">RM {total.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  className="checkout-button"
                  onClick={async () => {
                    try {
                      await onCreateOrder(selectedTable, cart, 'dine-in');
                      setCart([]);
                      setLocalCartOpen(false);
                      alert('Order placed successfully!');
                    } catch (error) {
                      alert('Order failed: ' + error.message);
                    }
                  }}
                  type="button"
                >
                  <span className="checkout-text">Place Order</span>
                  <span className="checkout-price">RM {total.toFixed(2)}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Overlay */}
        {localCartOpen && (
          <div 
            className="cart-overlay"
            onClick={() => setLocalCartOpen(false)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="digital-menu-modern">
      <CustomerView />
    </div>
  );
};

export default DigitalMenu;