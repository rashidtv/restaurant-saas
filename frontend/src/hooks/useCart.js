import { useState, useCallback, useMemo } from 'react';

export const useCart = () => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Add item to cart with optional quantity
  const addToCart = useCallback((item, quantity = 1) => {
    if (!item || !item.id) {
      console.error('Invalid item provided to addToCart');
      return;
    }

    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(cartItem => cartItem.id === item.id);
      
      if (existingItemIndex !== -1) {
        // Update existing item quantity
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + quantity
        };
        return updatedCart;
      } else {
        // Add new item with quantity
        return [...prevCart, { 
          ...item, 
          quantity: quantity,
          addedAt: new Date().toISOString() // Track when item was added
        }];
      }
    });
  }, []);

  // Remove item completely from cart
  const removeFromCart = useCallback((itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  }, []);

  // Update specific item quantity
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

  // Set specific quantity for an item
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

  // Memoized calculations for better performance
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

  // Memoized cart summary
  const cartSummary = useMemo(() => ({
    total: getCartTotal(),
    itemCount: getItemCount(),
    items: cart.length
  }), [cart, getCartTotal, getItemCount]);

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
    cartSummary
  };
};