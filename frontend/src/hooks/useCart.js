import { useState, useCallback } from 'react';
import { CartUtils } from '../utils/cartUtils'; // 🎯 Import the utility

export const useCart = () => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = useCallback((item, quantity = 1) => {
    setCart(prevCart => {
      const normalizedItem = CartUtils.normalizeCartItem(item);
      
      if (!normalizedItem) {
        console.error('❌ Cannot add invalid item to cart:', item);
        return prevCart;
      }

      // Set initial quantity
      normalizedItem.quantity = quantity;

      const existingItemIndex = prevCart.findIndex(cartItem => 
        cartItem.id === normalizedItem.id
      );
      
      if (existingItemIndex !== -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + quantity
        };
        return updatedCart;
      } else {
        return [...prevCart, normalizedItem];
      }
    });
  }, []);

  const removeFromCart = useCallback((itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId, change) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === itemId) {
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
    return CartUtils.calculateTotal(cart);
  }, [cart]);

  const getItemCount = useCallback(() => {
    return cart.reduce((count, item) => count + (item.quantity || 1), 0);
  }, [cart]);

  // 🎯 NEW: Get cart items in API-ready format
  const getCartForAPI = useCallback(() => {
    return CartUtils.prepareForAPI(cart);
  }, [cart]);

  // 🎯 NEW: Validate cart before submission
  const validateCart = useCallback(() => {
    return CartUtils.validateCart(cart);
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
    getCartForAPI,
    validateCart
  };
};