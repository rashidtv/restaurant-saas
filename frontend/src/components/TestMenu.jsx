// TestMenu.jsx
import React, { useState } from 'react';

const TestMenu = () => {
  console.log('✅ TestMenu is loading!');
  
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);

  const menu = [
    { id: 1, name: 'Test Item 1', price: 10 },
    { id: 2, name: 'Test Item 2', price: 15 }
  ];

  const addToCart = (item) => {
    setCart([...cart, item]);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  return (
    <div style={{ padding: '20px', background: 'lightblue', minHeight: '100vh' }}>
      <h1>🎉 TEST MENU WORKING! 🎉</h1>
      
      {/* Search Test */}
      <div style={{ margin: '20px 0' }}>
        <h3>Search Test:</h3>
        <input
          type="text"
          placeholder="Type here..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '15px', fontSize: '18px', width: '100%' }}
        />
        <p>You typed: {search}</p>
      </div>

      {/* Add Test */}
      <div style={{ margin: '20px 0' }}>
        <h3>Add to Cart Test:</h3>
        {menu.map(item => (
          <div key={item.id} style={{ margin: '10px 0' }}>
            {item.name} - ${item.price}
            <button 
              onClick={() => addToCart(item)}
              style={{ marginLeft: '10px', padding: '10px' }}
            >
              Add
            </button>
          </div>
        ))}
      </div>

      {/* Delete Test */}
      <div style={{ margin: '20px 0' }}>
        <h3>Cart ({cart.length} items):</h3>
        {cart.map(item => (
          <div key={item.id} style={{ margin: '10px 0' }}>
            {item.name} - ${item.price}
            <button 
              onClick={() => removeFromCart(item.id)}
              style={{ marginLeft: '10px', padding: '10px', background: 'red', color: 'white' }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestMenu;