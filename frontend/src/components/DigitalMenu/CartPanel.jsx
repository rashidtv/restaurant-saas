import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { pointsService } from '../../services/pointsService';
import './styles.css';

export const CartPanel = ({ 
  cart, 
  isOpen, 
  onClose, 
  onUpdateQuantity, 
  onRemoveItem, 
  onPlaceOrder,
  selectedTable,
  customer 
}) => {
  if (!isOpen) return null;

  // PERMANENT FIX: Use cart items directly - NO GROUPING
  const cartItems = cart.map(item => ({
    ...item,
    totalPrice: item.price * item.quantity
  }));

  const cartTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const pointsToEarn = pointsService.calculatePointsFromOrder(cartTotal);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="cart-overlay" onClick={handleOverlayClick}>
      <div className="cart-panel">
        <div className="cart-header">
          <h2>Your Order ({itemCount} items)</h2>
          <button 
            onClick={onClose}
            className="close-cart-btn"
            aria-label="Close cart"
          >
            ×
          </button>
        </div>

        <div className="cart-content">
          {cartItems.length === 0 ? (
            <EmptyCartState />
          ) : (
            <>
              <CartItems 
                items={cartItems}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
              />
              
              <CartSummary 
                total={cartTotal}
                pointsToEarn={pointsToEarn}
                itemCount={itemCount}
              />
              
              <PlaceOrderButton 
                total={cartTotal}
                itemCount={itemCount}
                table={selectedTable}
                customer={customer}
                onPlaceOrder={onPlaceOrder}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const EmptyCartState = () => (
  <div className="empty-cart">
    <div className="empty-cart-icon">🛒</div>
    <p>Your cart is empty</p>
    <p className="empty-subtitle">Add some delicious items to get started</p>
  </div>
);

const CartItems = ({ items, onUpdateQuantity, onRemoveItem }) => (
  <div className="cart-items">
    {items.map(item => (
      <CartItem 
        key={`${item.id}-${item.addedAt || Date.now()}`} // Unique key for each item
        item={item}
        onUpdateQuantity={onUpdateQuantity}
        onRemoveItem={onRemoveItem}
      />
    ))}
  </div>
);

const CartItem = ({ item, onUpdateQuantity, onRemoveItem }) => (
  <div className="cart-item">
    <div className="cart-item-info">
      <div className="cart-item-name">{item.name}</div>
      <div className="cart-item-meta">
        <span className="cart-item-price">{formatCurrency(item.price)} each</span>
        {item.category && (
          <span className="cart-item-category">{item.category}</span>
        )}
      </div>
    </div>
    
    <div className="cart-item-controls">
      <div className="quantity-controls">
        <button 
          onClick={() => onUpdateQuantity(item.id, -1)}
          className="quantity-btn minus"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="quantity-display">{item.quantity}</span>
        <button 
          onClick={() => onUpdateQuantity(item.id, 1)}
          className="quantity-btn plus"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
    </div>
    
    <div className="cart-item-total-section">
      <div className="cart-item-total">
        {formatCurrency(item.totalPrice)}
      </div>
      <button 
        onClick={() => onRemoveItem(item.id)}
        className="remove-item-btn"
        aria-label="Remove item"
      >
        Remove
      </button>
    </div>
  </div>
);

const CartSummary = ({ total, pointsToEarn, itemCount }) => (
  <div className="cart-summary">
    <div className="summary-row">
      <span>Subtotal ({itemCount} items)</span>
      <span>{formatCurrency(total)}</span>
    </div>
    
    <div className="summary-row">
      <span>Service Charge</span>
      <span>{formatCurrency(0)}</span>
    </div>
    
    <div className="summary-row">
      <span>Tax</span>
      <span>{formatCurrency(0)}</span>
    </div>
    
    <div className="summary-row points-summary">
      <span>Points to earn</span>
      <span className="points-value">+{pointsToEarn}</span>
    </div>
    
    <div className="summary-row total-row">
      <span>Total Amount</span>
      <span className="total-amount">{formatCurrency(total)}</span>
    </div>
  </div>
);

const PlaceOrderButton = ({ total, itemCount, table, customer, onPlaceOrder }) => (
  <button 
    className="place-order-btn"
    onClick={onPlaceOrder}
    disabled={!table || !customer}
  >
    {!table ? 'Select Table' : !customer ? 'Register to Order' : `Place Order • ${formatCurrency(total)}`}
  </button>
);

export default CartPanel;