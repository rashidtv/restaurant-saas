// 🎯 PRODUCTION READY: Phone number validation fix
export const validatePhoneNumber = (phone) => {
  if (!phone) return false;
  
  // 🎯 FIX: Handle both string and object inputs
  const phoneString = typeof phone === 'string' ? phone : String(phone);
  
  // Remove all non-digit characters
  const cleanPhone = phoneString.replace(/\D/g, '');
  
  // Validate phone length (Malaysian phones are usually 10-11 digits)
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};

export const validateEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateName = (name) => {
  if (!name) return false;
  return name.trim().length >= 2;
};

export const validateOrderItems = (items) => {
  if (!items || !Array.isArray(items)) return false;
  if (items.length === 0) return false;
  
  return items.every(item => 
    item && 
    item.quantity > 0 && 
    item.price >= 0
  );
};

// src/utils/validators.js - Example function
export const validateOrderData = (orderData) => {
  if (!orderData) {
    throw new Error('Order data is required');
  }
  
  if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
    throw new Error('Order must contain at least one item');
  }
  
  // Validate each item
  orderData.items.forEach(item => {
    if (!item.name || !item.price || item.quantity <= 0) {
      throw new Error('Each item must have a name, price, and positive quantity');
    }
  });
  
  return true; // Validation passed
};

// Make sure this export exists
export { validateOrderData };

export const validateTableNumber = (tableNumber) => {
  if (!tableNumber) return false;
  const tableString = String(tableNumber).toUpperCase();
  return /^T?[0-9]+$/.test(tableString);
};