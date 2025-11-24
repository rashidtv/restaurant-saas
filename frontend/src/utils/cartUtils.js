// 🎯 Cart normalization utilities for consistent data structure
export const CartUtils = {
  // Normalize any item for cart operations
  normalizeCartItem: (item) => {
    const itemId = item.id || item._id || item.menuItemId;
    
    if (!itemId) {
      console.error('❌ Cannot normalize item - no ID found:', item);
      return null;
    }

    return {
      ...item,
      id: itemId,           // Standard ID for cart operations
      _id: item._id,        // MongoDB ID for API calls  
      menuItemId: item._id || item.menuItemId, // For order creation
      price: parseFloat(item.price) || 0,
      quantity: parseInt(item.quantity) || 1,
      // 🎯 Ensure all cart items have these fields
      name: item.name || 'Unknown Item',
      category: item.category || 'uncategorized',
      preparationTime: item.preparationTime || 15
    };
  },

  // Prepare cart items for API submission
  prepareForAPI: (cartItems) => {
    return cartItems.map(item => ({
      menuItemId: item._id || item.menuItemId,
      name: item.name,
      price: parseFloat(item.price) || 0,
      quantity: parseInt(item.quantity) || 1,
      category: item.category,
      specialInstructions: item.specialInstructions || '',
      preparationTime: item.preparationTime || 15
    }));
  },

  // Calculate total with validation
  calculateTotal: (cartItems) => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return total + (price * quantity);
    }, 0);
  },

  // Validate cart before submission
  validateCart: (cartItems) => {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return { isValid: false, error: 'Cart is empty' };
    }

    for (const item of cartItems) {
      if (!item.menuItemId && !item._id) {
        return { isValid: false, error: `Item missing ID: ${item.name}` };
      }
      if (!item.name) {
        return { isValid: false, error: 'Item missing name' };
      }
      if (isNaN(parseFloat(item.price))) {
        return { isValid: false, error: `Invalid price for: ${item.name}` };
      }
      if (parseInt(item.quantity) <= 0) {
        return { isValid: false, error: `Invalid quantity for: ${item.name}` };
      }
    }

    return { isValid: true, error: null };
  }
};