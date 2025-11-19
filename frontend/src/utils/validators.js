export const validatePhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10;
};

export const validateOrderData = (order) => {
  if (!order) return false;
  if (!order.items || !Array.isArray(order.items) || order.items.length === 0) return false;
  
  return order.items.every(item => 
    item && 
    item.name && 
    typeof item.price === 'number' && 
    typeof item.quantity === 'number'
  );
};