import { useState, useCallback } from 'react';

export const useCart = () => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // 🎯 FIX: Normalize item IDs for cart operations
  const normalizeItemId = (item) => {
    return item.id || item._id || item.menuItemId;
  };

  const addToCart = useCallback((item, quantity = 1) => {
    setCart(prevCart => {
      const itemId = normalizeItemId(item);
      
      if (!itemId) {
        console.error('❌ Invalid item for cart - no ID found:', item);
        return prevCart;
      }

      const existingItem = prevCart.find(cartItem => 
        normalizeItemId(cartItem) === itemId
      );
      
      if (existingItem) {
        return prevCart.map(cartItem =>
          normalizeItemId(cartItem) === itemId
            ? { 
                ...cartItem, 
                quantity: cartItem.quantity + quantity,
                // 🎯 Ensure all cart items have consistent structure
                id: itemId,
                _id: item._id || cartItem._id
              }
            : cartItem
        );
      } else {
        // 🎯 Create normalized cart item with all necessary fields
        const cartItem = {
          ...item,
          id: itemId,           // Standardized ID for cart operations
          _id: item._id,        // Keep MongoDB _id for API calls
          menuItemId: item._id, // For order creation
          quantity: quantity,
          // 🎯 Ensure price is always a number
          price: parseFloat(item.price) || 0
        };
        
        return [...prevCart, cartItem];
      }
    });
  }, []);

  const removeFromCart = useCallback((itemId) => {
    setCart(prevCart => prevCart.filter(item => 
      normalizeItemId(item) !== itemId
    ));
  }, []);

  const updateQuantity = useCallback((itemId, change) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (normalizeItemId(item) === itemId) {
          const newQuantity = item.quantity + change;
          if (newQuantity <= 0) {
            return null;
          }
          return { 
            ...item, 
            quantity: newQuantity 
          };
        }
        return item;
      }).filter(Boolean)
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return total + (price * quantity);
    }, 0);
  }, [cart]);

  const getItemCount = useCallback(() => {
    return cart.reduce((count, item) => count + (item.quantity || 1), 0);
  }, [cart]);

  // 🎯 FIX: Add the missing getCartForAPI function
  const getCartForAPI = useCallback(() => {
    return cart.map(item => ({
      menuItemId: item._id || item.menuItemId || item.id,
      name: item.name,
      price: parseFloat(item.price) || 0,
      quantity: parseInt(item.quantity) || 1,
      category: item.category,
      specialInstructions: item.specialInstructions || ''
    }));
  }, [cart]);

  // 🎯 FIX: Add the missing validateCart function
  const validateCart = useCallback(() => {
    if (!Array.isArray(cart) || cart.length === 0) {
      return { isValid: false, error: 'Cart is empty' };
    }

    for (const item of cart) {
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
  }, [cart]);

  return {
    cart,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getItemCount,
    getCartForAPI, // 🎯 NOW DEFINED
    validateCart   // 🎯 NOW DEFINED
  };
};