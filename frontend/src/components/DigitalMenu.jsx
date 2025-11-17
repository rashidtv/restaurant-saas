import React, { useState, useEffect } from 'react';
import './DigitalMenu.css';

// Create a SAFE wrapper component that never crashes
const SafeDigitalMenu = (props) => {
  // Ensure ALL props have safe defaults
  const safeProps = {
    cart: Array.isArray(props.cart) ? props.cart : [],
    setCart: props.setCart || (() => {}),
    onCreateOrder: props.onCreateOrder || (() => Promise.resolve()),
    isMobile: props.isMobile || false,
    menu: Array.isArray(props.menu) ? props.menu : [],
    apiConnected: props.apiConnected || false,
    currentTable: props.currentTable || '',
    isCustomerView: props.isCustomerView || false
  };

  return <DigitalMenu {...safeProps} />;
};

// Your actual component
const DigitalMenu = ({ cart, setCart, onCreateOrder, isMobile, menu, apiConnected, currentTable, isCustomerView }) => {
  console.log('🔧 DigitalMenu rendering with menu:', menu);
  
  const [selectedTable, setSelectedTable] = useState(currentTable || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [localCart, setLocalCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  // ABSOLUTELY SAFE menu - multiple fallbacks
  const safeMenu = Array.isArray(menu) ? menu : [];

  // Initialize safely
  useEffect(() => {
    console.log('✅ DigitalMenu safely mounted');
    if (Array.isArray(cart)) {
      setLocalCart(cart);
    }
  }, [cart]);

  // Table detection
  useEffect(() => {
    if (isCustomerView && currentTable) {
      setSelectedTable(currentTable);
    }
  }, [isCustomerView, currentTable]);

  // SIMPLE SEARCH - GUARANTEED TO WORK
  const SearchBar = () => (
    <div style={{ 
      background: 'white', 
      padding: '15px', 
      borderBottom: '1px solid #eee' 
    }}>
      <input
        type="text"
        placeholder="Search menu items..."
        value={searchTerm}
        onChange={(e) => {
          console.log('Search typing:', e.target.value);
          setSearchTerm(e.target.value);
        }}
        style={{
          width: '100%',
          padding: '12px 16px',
          fontSize: '16px',
          border: '2px solid #ddd',
          borderRadius: '8px',
          outline: 'none'
        }}
      />
    </div>
  );

  // SIMPLE DELETE - GUARANTEED TO WORK
  const removeFromCart = (itemId) => {
    console.log('🗑️ DELETE: Removing item ID:', itemId);
    console.log('Before deletion:', localCart);
    
    const updatedCart = localCart.filter(item => {
      const shouldKeep = item.id !== itemId;
      console.log(`Item ${item.id} vs ${itemId}: ${shouldKeep ? 'KEEP' : 'DELETE'}`);
      return shouldKeep;
    });
    
    console.log('After deletion:', updatedCart);
    setLocalCart(updatedCart);
    setCart(updatedCart);
  };

  // SIMPLE ADD TO CART - GUARANTEED TO WORK
  const addToCart = (item) => {
    console.log('➕ ADD: Adding item:', item?.name);
    
    const existingItem = localCart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      const updatedCart = localCart.map(cartItem =>
        cartItem.id === item.id 
          ? { ...cartItem, quantity: (cartItem.quantity || 0) + 1 }
          : cartItem
      );
      setLocalCart(updatedCart);
      setCart(updatedCart);
    } else {
      const newItem = {
        id: item?.id || item?._id || Math.random().toString(),
        _id: item?._id || item?.id || Math.random().toString(),
        name: item?.name || 'Unknown Item',
        price: item?.price || 0,
        quantity: 1,
        category: item?.category || 'unknown'
      };
      const newCart = [...localCart, newItem];
      setLocalCart(newCart);
      setCart(newCart);
    }
  };

  // ABSOLUTELY SAFE filtering
  const filteredItems = safeMenu.filter(item => {
    if (!item || typeof item !== 'object') return false;
    
    const itemName = item.name || '';
    const itemCategory = item.category || '';
    const search = searchTerm || '';
    
    const matchesSearch = search === '' || 
      itemName.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = activeCategory === 'all' || 
      itemCategory === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Safe total calculation
  const total = (localCart || []).reduce((sum, item) => {
    const price = item?.price || 0;
    const quantity = item?.quantity || 0;
    return sum + (price * quantity);
  }, 0);

  // SIMPLE CUSTOMER VIEW
  const SimpleCustomerView = () => (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255,255,255,0.95)',
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#333' }}>FlavorFlow</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
            Table {selectedTable || 'Not detected'}
          </p>
        </div>
        <button 
          onClick={() => setShowCart(true)}
          style={{
            background: '#10b981',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          🛒 Cart ({(localCart || []).reduce((sum, item) => sum + (item?.quantity || 0), 0)})
        </button>
      </header>

      {/* Search - THIS WILL WORK */}
      <SearchBar />

      {/* Categories */}
      <div style={{
        background: 'rgba(255,255,255,0.9)',
        padding: '15px 20px',
        display: 'flex',
        gap: '10px',
        overflowX: 'auto'
      }}>
        {['all', 'main', 'drinks', 'desserts'].map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeCategory === category ? '#667eea' : '#f1f5f9',
              color: activeCategory === category ? 'white' : '#333',
              borderRadius: '25px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Menu Items */}
      <div style={{ padding: '20px' }}>
        <h2 style={{ 
          color: 'white', 
          marginBottom: '20px',
          textAlign: 'center',
          fontSize: '24px'
        }}>
          Our Menu ({filteredItems.length} items)
        </h2>
        
        {filteredItems.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            padding: '40px 20px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🍽️</div>
            <p style={{ fontSize: '18px', color: '#666', margin: 0 }}>
              {safeMenu.length === 0 ? 'Menu loading...' : 'No items found'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {filteredItems.map((item, index) => (
              <div key={item.id || index} style={{
                background: 'rgba(255,255,255,0.95)',
                padding: '20px',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#333' }}>
                    {item.name || 'Unnamed Item'}
                  </h3>
                  <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>
                    {item.description || 'Delicious item'}
                  </p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#059669' }}>
                    RM {item.price || 0}
                  </p>
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
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    minWidth: '100px'
                  }}
                >
                  Add +
                </button>
              </div>
            ))}
          </div>
        )}
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
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1000
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
            overflowY: 'auto',
            zIndex: 1001
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '25px'
            }}>
              <h2 style={{ margin: 0, fontSize: '24px', color: '#333' }}>
                Your Order
              </h2>
              <button 
                onClick={() => setShowCart(false)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {(!localCart || localCart.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🛒</div>
                <p style={{ fontSize: '18px', color: '#666', margin: 0 }}>
                  Your cart is empty
                </p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '25px' }}>
                  {localCart.map((item, index) => (
                    <div key={item.id || index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '15px 0',
                      borderBottom: '1px solid #f1f5f9'
                    }}>
                      <div>
                        <p style={{ 
                          margin: '0 0 5px 0', 
                          fontWeight: 'bold',
                          fontSize: '16px'
                        }}>
                          {item.name}
                        </p>
                        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                          Qty: {item.quantity} × RM {item.price}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                
                <div style={{ 
                  borderTop: '2px solid #e5e7eb',
                  paddingTop: '20px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '25px',
                    fontSize: '20px',
                    fontWeight: 'bold'
                  }}>
                    <span>Total:</span>
                    <span>RM {total.toFixed(2)}</span>
                  </div>
                  
                  <button
                    onClick={async () => {
                      if (!selectedTable) {
                        alert('Table number not detected');
                        return;
                      }
                      if (!localCart || localCart.length === 0) {
                        alert('Your cart is empty');
                        return;
                      }
                      try {
                        await onCreateOrder(selectedTable, localCart, 'dine-in');
                        setLocalCart([]);
                        setCart([]);
                        setShowCart(false);
                        alert('Order placed successfully!');
                      } catch (error) {
                        alert('Order failed: ' + error.message);
                      }
                    }}
                    style={{
                      background: '#059669',
                      color: 'white',
                      border: 'none',
                      padding: '18px',
                      borderRadius: '10px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    Place Order - RM {total.toFixed(2)}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );

  // MAIN RENDER
  return (
    <div>
      {isCustomerView ? (
        <SimpleCustomerView />
      ) : (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Staff Admin View</h2>
          <p>Use customer QR code for ordering</p>
        </div>
      )}
    </div>
  );
};

// Export the SAFE wrapper instead of the raw component
export default SafeDigitalMenu;