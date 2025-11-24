import React, { useState } from 'react';

export const MenuGrid = ({
  menuItems,
  searchTerm,
  activeCategory,
  categories,
  onAddToCart,
  onSearchChange,
  onCategoryChange
}) => {
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="menu-section">
      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search menu items..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Category Filter */}
      <div className="categories-scroll">
        {categories.map(category => (
          <button
            key={category}
            className={`category-pill ${activeCategory === category ? 'active' : ''}`}
            onClick={() => onCategoryChange(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="menu-grid">
        {filteredItems.map(item => (
          <MenuCard 
            key={item._id || item.id} 
            item={item} 
            onAddToCart={onAddToCart} 
          />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="empty-menu-state">
          <div className="empty-icon">🍽️</div>
          <p>No items found matching your search.</p>
          <p className="empty-subtitle">Try a different search or category</p>
        </div>
      )}
    </div>
  );
};

// Menu Card with Quantity Controls
const MenuCard = ({ item, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    onAddToCart(item, quantity);
    setQuantity(1); // Reset to 1 after adding
  };

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  return (
    <div className="menu-item-card">
      <div className="menu-item-image">
        {item.image ? (
          <img src={item.image} alt={item.name} />
        ) : (
          <div className="image-placeholder">
            <span>🍽️</span>
          </div>
        )}
      </div>
      
      <div className="menu-item-content">
        <div className="menu-item-info">
          <h3 className="item-title">{item.name}</h3>
          <p className="item-description">{item.description}</p>
          <div className="item-meta">
            <span className="item-price">RM {item.price.toFixed(2)}</span>
            {item.preparationTime && (
              <span className="item-prep-time">⏱️ {item.preparationTime}min</span>
            )}
          </div>
        </div>

        {/* 🎯 ADDED: Quantity Controls */}
        <div className="menu-item-actions">
          <div className="quantity-controls">
            <button 
              className="quantity-btn minus"
              onClick={decreaseQuantity}
              disabled={quantity <= 1}
            >
              −
            </button>
            <span className="quantity-display">{quantity}</span>
            <button 
              className="quantity-btn plus"
              onClick={increaseQuantity}
            >
              +
            </button>
          </div>

          <button 
            className="add-to-cart-btn"
            onClick={handleAddToCart}
            aria-label={`Add ${item.name} to cart`}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuGrid;