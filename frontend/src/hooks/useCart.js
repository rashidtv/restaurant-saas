import { useState, useCallback } from 'react';

export const useCart = () => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // 🎯 PRODUCTION: Fixed addToCart that accepts backend items with _id
  const addToCart = useCallback((item, quantity = 1) => {
    if (!item || typeof item !== 'object') {
      console.error('Invalid item for cart:', item);
      return;
    }

    // ✅ ACCEPT BOTH _id (from backend) AND id (from frontend)
    const itemId = item.id || item._id;
    const itemName = item.name || 'Unknown Item';
    const itemPrice = parseFloat(item.price) || 0;

    if (!itemId) {
      console.error('❌ Item missing ID:', item);
      return;
    }

    setCart(prevCart => {
      // Create unique ID to prevent merging
      const uniqueItemId = `${itemId}-${Date.now()}`;
      
      const newItem = { 
        id: uniqueItemId,
        originalId: itemId, // Keep original ID for backend reference
        name: itemName,
        price: itemPrice,
        quantity: Math.max(1, parseInt(quantity) || 1)
      };

      console.log('🛒 Added to cart:', newItem.name);
      return [...prevCart, newItem];
    });
  }, []);

  const removeFromCart = useCallback((itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId, change) => {
    setCart(prevCart => 
      prevCart
        .map(item =>
          item.id === itemId
            ? { ...item, quantity: Math.max(0, item.quantity + change) }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  const getItemCount = useCallback(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  const getCartItemsForOrder = useCallback(() => {
    return cart.map(item => ({
      menuItemId: item.originalId, // Use original ID for backend
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));
  }, [cart]);

  return {
    // State
    cart,
    isCartOpen,
    
    // Actions
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    
    // Getters
    getCartTotal,
    getItemCount,
    getCartItemsForOrder
  };
};