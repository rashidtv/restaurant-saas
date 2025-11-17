import React, { useState } from 'react';

const DigitalMenu = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  // Simple menu data
  const menuItems = [
    { id: 1, name: 'Teh Tarik', price: 4.50, category: 'drinks' },
    { id: 2, name: 'Nasi Lemak', price: 12.90, category: 'main' },
    { id: 3, name: 'Roti Canai', price: 3.50, category: 'main' },
    { id: 4, name: 'Cendol', price: 6.90, category: 'desserts' }
  ];

  // Search that works
  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add to cart that works
  const addToCart = (item) => {
    const existing = cart.find(cartItem => cartItem.id === item.id);
    if (existing) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  // Delete that works
  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'white',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, color: '#333' }}>FlavorFlow</h1>
        <button 
          onClick={() => setShowCart(true)}
          style={{
            background: '#10b981',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          🛒 Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
        </button>
      </header>

      {/* Search - THIS WILL WORK */}
      <div style={{ background: 'white', padding: '15px' }}>
        <input
          type="text"
          placeholder="Search menu items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '18px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            outline: 'none'
          }}
        />
      </div>

      {/* Menu Items */}
      <div style={{ padding: '20px' }}>
        <h2 style={{ color: 'white', textAlign: 'center' }}>Menu</h2>
        
        {filteredItems.map(item => (
          <div key={item.id} style={{
            background: 'white',
            padding: '20px',
            marginBottom: '15px',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{ margin: 0 }}>{item.name}</h3>
              <p style={{ margin: '5px 0', color: '#666' }}>RM {item.price}</p>
            </div>
            <button
              onClick={() => addToCart(item)}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Add +
            </button>
          </div>
        ))}
      </div>

      {/* Cart Modal */}
      {showCart && (
        <>
          <div 
            onClick={() => setShowCart(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)'
            }}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '25px',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Your Cart</h2>
              <button 
                onClick={() => setShowCart(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px' }}
              >
                ✕
              </button>
            </div>

            {cart.length === 0 ? (
              <p>Your cart is empty</p>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '15px 0',
                    borderBottom: '1px solid #eee'
                  }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>{item.name}</p>
                      <p style={{ margin: 0 }}>Qty: {item.quantity} × RM {item.price}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #333' }}>
                  <h3>Total: RM {total.toFixed(2)}</h3>
                  <button
                    onClick={() => {
                      alert('Order placed successfully!');
                      setCart([]);
                      setShowCart(false);
                    }}
                    style={{
                      background: '#059669',
                      color: 'white',
                      border: 'none',
                      padding: '15px',
                      borderRadius: '8px',
                      fontSize: '18px',
                      width: '100%'
                    }}
                  >
                    Place Order
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DigitalMenu;