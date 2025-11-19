import React, { useState, useCallback, memo } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { pointsService } from '../../services/pointsService';
import './styles.css';

// Memoized MenuItem component to prevent unnecessary re-renders
const MenuItem = memo(({ item, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = useCallback((change) => {
    setQuantity(prev => Math.max(1, prev + change));
  }, []);

  const handleAddToCart = useCallback(() => {
    onAddToCart(item, quantity);
    setQuantity(1); // Reset to 1 after adding
  }, [item, quantity, onAddToCart]);

  const pointsEarned = pointsService.calculatePointsFromOrder(item.price * quantity);

  return (
    <div className="menu-item-card" data-testid={`menu-item-${item.id}`}>
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
          <div className="quantity-controls">
            <button 
              className="quantity-btn minus"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              aria-label={`Decrease quantity of ${item.name}`}
              type="button"
            >
              −
            </button>
            <span className="quantity-display" aria-live="polite">
              {quantity}
            </span>
            <button 
              className="quantity-btn plus"
              onClick={() => handleQuantityChange(1)}
              aria-label={`Increase quantity of ${item.name}`}
              type="button"
            >
              +
            </button>
          </div>
          
          <button 
            className="add-to-cart-btn"
            onClick={handleAddToCart}
            aria-label={`Add ${quantity} ${item.name} to cart`}
            type="button"
          >
            Add {quantity > 1 && `(${quantity})`}
          </button>
        </div>
      </div>
    </div>
  );
});

MenuItem.displayName = 'MenuItem';

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
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = useCallback((item, quantity) => {
    onAddToCart(item, quantity);
  }, [onAddToCart]);

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
          aria-label="Search menu items"
        />
      </div>

      {/* Categories */}
      <div className="categories-scroll">
        {categories.map(category => (
          <button
            key={category}
            className={`category-pill ${activeCategory === category ? 'active' : ''}`}
            onClick={() => onCategoryChange(category)}
            aria-pressed={activeCategory === category}
            type="button"
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
              onAddToCart={handleAddToCart}
            />
          ))
        )}
      </div>
    </div>
  );
};