import React, { useState, useEffect } from 'react';
import './DigitalMenu.css';

const DigitalMenu = ({ cart, setCart, onCreateOrder, isMobile, menu, apiConnected, currentTable, isCustomerView = false }) => {
  const [selectedTable, setSelectedTable] = useState(currentTable || '');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartOpen, setCartOpen] = useState(false);

  // Simple table detection
  useEffect(() => {
    if (isCustomerView && currentTable) {
      setSelectedTable(currentTable);
    }
  }, [currentTable, isCustomerView]);

  // Simple menu data fallback
  const displayMenu = menu && menu.length > 0 ? menu : [
    { id: 1, name: 'Teh Tarik', price: 4.50, category: 'drinks', description: 'Famous Malaysian pulled tea' },
    { id: 2, name: 'Nasi Lemak', price: 12.90, category: 'main', description: 'Coconut rice with sambal' },
    { id: 3, name: 'Roti Canai', price: 3.50, category: 'main', description: 'Flaky flatbread with curry' },
    { id: 4, name: 'Cendol', price: 6.90, category: 'desserts', description: 'Shaved ice dessert' }
  ];

  // Simple add to cart
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

  // Simple remove from cart
  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // Simple update quantity
  const updateQuantity = (id, change) => {
    const updatedCart = cart.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(0, item.quantity + change) }
        : item
    ).filter(item => item.quantity > 0);
    
    setCart(updatedCart);
  };

  // Simple place order
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
        quantity: item.quantity
      }));

      await onCreateOrder(selectedTable, orderData, 'dine-in');
      setCart([]);
      setCartOpen(false);
      alert('Order placed successfully!');
    } catch (error) {
      alert('Order failed: ' + error.message);
    }
  };

  // Simple categories
  const categories = ['all', ...new Set(displayMenu.map(item => item.category))];
  
  // Simple filtered items
  const filteredItems = displayMenu.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Simple totals
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // SIMPLE CUSTOMER VIEW
  if (isCustomerView) {
    return (
      <div className="simple-customer-view">
        {/* Header */}
        <header className="simple-header">
          <h1>FlavorFlow</h1>
          <div className="header-actions">
            <div className="table-info">
              Table: {selectedTable || '--'}
            </div>
            <button 
              className="cart-button"
              onClick={() => setCartOpen(true)}
            >
              Cart ({itemCount})
            </button>
          </div>
        </header>

        {/* Search */}
        <div className="simple-search">
          <input
            type="text"
            placeholder="Search menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Categories */}
        <div className="simple-categories">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Items */}
        <div className="simple-menu">
          {filteredItems.map(item => (
            <div key={item.id} className="menu-item">
              <div className="item-info">
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <div className="item-price">RM {item.price}</div>
              </div>
              <button 
                className="add-btn"
                onClick={() => addToCart(item)}
              >
                Add +
              </button>
            </div>
          ))}
        </div>

        {/* Simple Cart */}
        {cartOpen && (
          <div className="simple-cart-overlay" onClick={() => setCartOpen(false)}>
            <div className="simple-cart" onClick={(e) => e.stopPropagation()}>
              <div className="cart-header">
                <h2>Your Order</h2>
                <button onClick={() => setCartOpen(false)}>Close</button>
              </div>
              
              {cart.length === 0 ? (
                <p>Your cart is empty</p>
              ) : (
                <>
                  <div className="cart-items">
                    {cart.map(item => (
                      <div key={item.id} className="cart-item">
                        <span>{item.name} x {item.quantity}</span>
                        <div className="item-controls">
                          <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                          <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                          <button onClick={() => removeFromCart(item.id)}>Remove</button>
                        </div>
                        <span>RM {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="cart-total">
                    Total: RM {total.toFixed(2)}
                  </div>
                  
                  <button 
                    className="place-order-btn"
                    onClick={handlePlaceOrder}
                  >
                    Place Order
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Mobile Cart Button */}
        {isMobile && cart.length > 0 && !cartOpen && (
          <button 
            className="mobile-cart-btn"
            onClick={() => setCartOpen(true)}
          >
            View Cart ({itemCount})
          </button>
        )}
      </div>
    );
  }

  // Simple Admin View
  return (
    <div className="simple-admin-view">
      <h2>Menu Management</h2>
      <p>Staff view for table: {selectedTable}</p>
      <div className="admin-controls">
        <select 
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
        >
          <option value="">Select Table</option>
          <option value="T01">Table T01</option>
          <option value="T02">Table T02</option>
          <option value="T03">Table T03</option>
        </select>
      </div>
      
      {/* Same menu display as customer view */}
      <div className="simple-menu">
        {displayMenu.map(item => (
          <div key={item.id} className="menu-item">
            <div className="item-info">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <div className="item-price">RM {item.price}</div>
            </div>
            <button 
              className="add-btn"
              onClick={() => addToCart(item)}
            >
              Add +
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DigitalMenu;