import { useState, useCallback, useMemo } from 'react';

export const useCart = () => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Enhanced addToCart with better validation
  const addToCart = useCallback((item, quantity = 1) => {
    if (!item || typeof item !== 'object') {
      console.error('Invalid item provided to addToCart:', item);
      return;
    }

    // Validate required fields with fallbacks
    const itemId = item.id || item._id || item.menuItemId;
    const itemName = item.name || 'Unknown Item';
    const itemPrice = parseFloat(item.price) || 0;
    const itemCategory = item.category || 'uncategorized';

    if (!itemId) {
      console.error('Item missing ID:', item);
      return;
    }

    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(cartItem => 
        cartItem.id === itemId || cartItem._id === itemId
      );
      
      if (existingItemIndex !== -1) {
        // Update existing item quantity
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + quantity
        };
        return updatedCart;
      } else {
        // Add new item with normalized structure
        return [...prevCart, { 
          id: itemId,
          _id: itemId, // Include both for compatibility
          name: itemName,
          price: itemPrice,
          category: itemCategory,
          description: item.description,
          quantity: quantity,
          addedAt: new Date().toISOString()
        }];
      }
    });
  }, []);

  const removeFromCart = useCallback((itemId) => {
    setCart(prevCart => prevCart.filter(item => 
      item.id !== itemId && item._id !== itemId
    ));
  }, []);

  const updateQuantity = useCallback((itemId, change) => {
    setCart(prevCart => 
      prevCart
        .map(item =>
          (item.id === itemId || item._id === itemId)
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
        (item.id === itemId || item._id === itemId)
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
    const item = cart.find(item => 
      item.id === itemId || item._id === itemId
    );
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