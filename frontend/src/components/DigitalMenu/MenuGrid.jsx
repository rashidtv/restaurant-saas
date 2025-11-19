import React from 'react';
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
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
              onAddToCart={onAddToCart} 
            />
          ))
        )}
      </div>
    </div>
  );
};

const MenuItem = ({ item, onAddToCart }) => {
  const pointsEarned = pointsService.calculatePointsFromOrder(item.price);

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
        <button 
          className="add-to-cart-btn"
          onClick={() => onAddToCart(item)}
          aria-label={`Add ${item.name} to cart`}
        >
          Add
        </button>
      </div>
    </div>
  );
};