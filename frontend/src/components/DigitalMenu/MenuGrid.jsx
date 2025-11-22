import React from 'react';

// 🎯 FIX: Use named export consistently
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
    <div className="menu-grid-container">
      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search menu items..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        {categories.map(category => (
          <button
            key={category}
            className={`category-btn ${activeCategory === category ? 'active' : ''}`}
            onClick={() => onCategoryChange(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="menu-grid">
        {filteredItems.map(item => (
          <div key={item._id || item.id} className="menu-item-card">
            <div className="menu-item-image">
              {item.image ? (
                <img src={item.image} alt={item.name} />
              ) : (
                <div className="image-placeholder">
                  <span>🍽️</span>
                </div>
              )}
            </div>
            
            <div className="menu-item-info">
              <h3 className="item-name">{item.name}</h3>
              <p className="item-description">{item.description}</p>
              <div className="item-details">
                <span className="item-price">RM {item.price.toFixed(2)}</span>
                {item.preparationTime && (
                  <span className="prep-time">⏱️ {item.preparationTime}min</span>
                )}
              </div>
              
              <button 
                className="add-to-cart-btn"
                onClick={() => onAddToCart(item)}
                aria-label={`Add ${item.name} to cart`}
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="no-items-message">
          <p>No items found matching your search.</p>
        </div>
      )}
    </div>
  );
};

// 🎯 FIX: Also export as default for backward compatibility
export default MenuGrid;