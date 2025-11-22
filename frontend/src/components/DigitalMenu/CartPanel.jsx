import React from 'react';

// 🎯 FIX: Use named export consistently
export const CartPanel = ({
  cart,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
  selectedTable,
  customer,
  isPlacingOrder
}) => {
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="cart-panel-overlay">
      <div className="cart-panel">
        <div className="cart-header">
          <h2>Your Order</h2>
          <button onClick={onClose} className="close-btn" aria-label="Close cart">
            ✕
          </button>
        </div>

        <div className="cart-content">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-icon">🛒</div>
              <p>Your cart is empty</p>
              <p className="empty-subtitle">Add some delicious items to get started!</p>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="item-info">
                      <h4 className="item-name">{item.name}</h4>
                      <p className="item-price">RM {item.price.toFixed(2)}</p>
                    </div>
                    
                    <div className="item-controls">
                      <div className="quantity-controls">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="quantity-btn"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="quantity-btn"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="remove-btn"
                        aria-label="Remove item"
                      >
                        🗑️
                      </button>
                    </div>
                    
                    <div className="item-total">
                      RM {(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="summary-row">
                  <span>Items:</span>
                  <span>{getItemCount()}</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>RM {getCartTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="cart-actions">
                {!customer ? (
                  <div className="customer-required">
                    <p>Please register to place your order</p>
                  </div>
                ) : !selectedTable ? (
                  <div className="table-required">
                    <p>Table number required</p>
                  </div>
                ) : (
                  <button
                    onClick={onPlaceOrder}
                    disabled={isPlacingOrder}
                    className="place-order-btn"
                  >
                    {isPlacingOrder ? 'Placing Order...' : `Place Order • RM ${getCartTotal().toFixed(2)}`}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// 🎯 FIX: Also export as default for backward compatibility
export default CartPanel;