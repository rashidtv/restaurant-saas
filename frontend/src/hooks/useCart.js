import { useState, useCallback, useMemo } from 'react';

export const useCart = () => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

// 🎯 FIX ONLY THIS FUNCTION - LEAVE EVERYTHING ELSE UNCHANGED
const addToCart = useCallback((item, quantity = 1) => {
  if (!item || typeof item !== 'object') {
    console.error('Invalid item for cart:', item);
    return;
  }

  // Ensure item has required properties
  const itemId = item.id || item._id;
  const itemName = item.name || 'Unknown Item';
  const itemPrice = parseFloat(item.price) || 0;

  if (!itemId) {
    console.error('Item missing ID:', item);
    return;
  }

  setCart(prevCart => {
    // Create unique ID to prevent merging items
    const uniqueItemId = `${itemId}-${Date.now()}`;
    
    const newItem = { 
      id: uniqueItemId,
      originalId: itemId,
      name: itemName,
      price: itemPrice,
      category: item.category || 'general',
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

  const setQuantity = useCallback((itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(prevCart => 
      prevCart.map(item =>
        item.id === itemId
          ? { ...item, quantity: Math.max(0, quantity) }
          : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Memoized calculations
  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  const getItemCount = useCallback(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  const getItemQuantity = useCallback((itemId) => {
    const item = cart.find(item => item.id === itemId);
    return item ? item.quantity : 0;
  }, [cart]);

  // Get cart items grouped for display (shows individual items with quantities)
  const getCartItemsForDisplay = useCallback(() => {
    return cart.map(item => ({
      ...item,
      totalPrice: item.price * item.quantity
    }));
  }, [cart]);

  // Memoized cart summary
  const cartSummary = useMemo(() => ({
    total: getCartTotal(),
    itemCount: getItemCount(),
    items: cart.length,
    displayItems: getCartItemsForDisplay()
  }), [cart, getCartTotal, getItemCount, getCartItemsForDisplay]);

  return {
    cart,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    setQuantity,
    clearCart,
    getCartTotal,
    getItemCount,
    getItemQuantity,
    getCartItemsForDisplay,
    cartSummary
  };
};