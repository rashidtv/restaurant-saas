import React from 'react';
import { ORDER_STATUS_CONFIG } from '../../constants/config';
import { formatCurrency } from '../../utils/formatters';
import { orderService } from '../../services/orderService';

// 🎯 FIX: Use named export (or change import to default)
export const OrderCard = ({ order, onStatusUpdate, showActions = false }) => {
  if (!order) return null;

  const statusConfig = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.pending;
  const total = order.total || order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;

  const handleStatusUpdate = async (newStatus) => {
    try {
      await orderService.updateOrderStatus(order._id || order.orderNumber, newStatus);
      if (onStatusUpdate) {
        onStatusUpdate(order, newStatus);
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const getTimeElapsed = (orderDate) => {
    if (!orderDate) return 'N/A';
    const now = new Date();
    const orderTime = new Date(orderDate);
    const diffMs = now - orderTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  return (
    <div className="order-card" style={{ borderLeft: `4px solid ${statusConfig.borderColor}` }}>
      <div className="order-header">
        <div className="order-info">
          <h3 className="order-number">Order #{order.orderNumber}</h3>
          <span className="order-time">
            {order.orderedAt ? getTimeElapsed(order.orderedAt) : 'Recent'}
          </span>
        </div>
        <div 
          className="order-status"
          style={{ 
            backgroundColor: statusConfig.bgColor,
            color: statusConfig.color,
            border: `1px solid ${statusConfig.borderColor}`
          }}
        >
          <span className="status-icon">{statusConfig.icon}</span>
          <span className="status-label">{statusConfig.label}</span>
        </div>
      </div>

      {order.tableId && (
        <div className="order-table">
          Table: {order.tableId}
        </div>
      )}

      {order.customerName && (
        <div className="order-customer">
          Customer: {order.customerName}
        </div>
      )}

      <div className="order-items">
        <h4>Items ({order.items?.length || 0})</h4>
        <div className="items-list">
          {order.items?.map((item, index) => (
            <div key={index} className="order-item">
              <span className="item-name">{item.quantity}x {item.name}</span>
              <span className="item-price">{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="order-footer">
        <div className="order-total">
          Total: {formatCurrency(total)}
        </div>
        
        {showActions && order.status === 'pending' && (
          <div className="order-actions">
            <button 
              onClick={() => handleStatusUpdate('preparing')}
              className="btn-preparing"
            >
              Start Preparing
            </button>
          </div>
        )}

        {showActions && order.status === 'preparing' && (
          <div className="order-actions">
            <button 
              onClick={() => handleStatusUpdate('ready')}
              className="btn-ready"
            >
              Mark Ready
            </button>
          </div>
        )}

        {showActions && order.status === 'ready' && (
          <div className="order-actions">
            <button 
              onClick={() => handleStatusUpdate('completed')}
              className="btn-completed"
            >
              Complete Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// 🎯 FIX: Also export as default for backward compatibility
export default OrderCard;