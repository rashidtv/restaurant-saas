import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { pointsService } from '../../services/pointsService';
import './styles.css';

export const MenuGrid = ({ 
  menuItems, 
  searchTerm, 
  activeCategory, 
  categories, 
  onAddToCart, 
  onSearchChange, 
  onCategoryChange 
}) => {
  const [itemQuantities, setItemQuantities] = useState({});

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleQuantityChange = (itemId, change) => {
    setItemQuantities(prev => {
      const currentQty = prev[itemId] || 0;
      const newQty = Math.max(0, currentQty + change);
      
      if (newQty === 0) {
        const { [itemId]: removed, ...rest } = prev;
        return rest;
      }
      
      return { ...prev, [itemId]: newQty };
    });
  };

  const handleAddToCartWithQuantity = (item) => {
    const quantity = itemQuantities[item.id] || 1;
    
    // Add the item multiple times based on quantity
    for (let i = 0; i < quantity; i++) {
      onAddToCart(item);
    }
    
    // Reset quantity after adding to cart
    setItemQuantities(prev => {
      const { [item.id]: removed, ...rest } = prev;
      return rest;
    });
  };

  return (
    <div className="menu-section">
      {/* Search Section */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search menu items..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Categories */}
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

      {/* Menu Items Grid */}
      <div className="menu-grid">
        {filteredItems.length === 0 ? (
          <div className="empty-menu-state">
            <div className="empty-icon">🍽️</div>
            <p>No items found</p>
            <p className="empty-subtitle">Try a different search or category</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <MenuItem 
              key={item.id} 
              item={item} 
              quantity={itemQuantities[item.id] || 0}
              onQuantityChange={handleQuantityChange}
              onAddToCart={handleAddToCartWithQuantity}
            />
          ))
        )}
      </div>
    </div>
  );
};

const MenuItem = ({ item, quantity, onQuantityChange, onAddToCart }) => {
  const pointsEarned = pointsService.calculatePointsFromOrder(item.price);

  const handleAddClick = () => {
    if (quantity > 0) {
      onAddToCart(item);
    } else {
      // If no quantity selected, add one directly
      onAddToCart(item);
    }
  };

  return (
    <div className="menu-item-card">
      <div className="menu-item-content">
        <div className="menu-item-info">
          <h3 className="item-title">{item.name}</h3>
          <p className="item-description">{item.description}</p>
          <div className="item-meta">
            <span className="item-price">{formatCurrency(item.price)}</span>
            <span className="item-points">+{pointsEarned} pts</span>
          </div>
        </div>
        
        <div className="menu-item-actions">
          {quantity > 0 ? (
            <div className="quantity-selector">
              <button 
                className="quantity-btn minus"
                onClick={() => onQuantityChange(item.id, -1)}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="quantity-display">{quantity}</span>
              <button 
                className="quantity-btn plus"
                onClick={() => onQuantityChange(item.id, 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          ) : null}
          
          <button 
            className={`add-to-cart-btn ${quantity > 0 ? 'with-quantity' : ''}`}
            onClick={handleAddClick}
            aria-label={`Add ${item.name} to cart`}
          >
            {quantity > 0 ? `Add ${quantity}` : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};