import React from 'react';
import { ORDER_STATUS_CONFIG } from '../../constants/config';
import { formatCurrency, formatTime, formatDate } from '../../utils/formatters';
import { orderService } from '../../services/orderService';
import './styles.css';

export const OrderCard = ({ order }) => {
  const statusConfig = ORDER_STATUS_CONFIG[order.status] || 
    { label: order.status, color: '#6B7280', icon: '❓' };

  const orderTotal = orderService.calculateOrderTotal(order.items);

  return (
    <div className={`order-card ${order.status}`}>
      <div className="order-header">
        <div className="order-info">
          <div className="order-number">Order #{order.orderNumber || 'N/A'}</div>
          <div className="order-date">{formatDate(order.createdAt)}</div>
        </div>
        <div 
          className="status-badge"
          style={{ 
            backgroundColor: `${statusConfig.color}20`,
            color: statusConfig.color,
            borderColor: statusConfig.color
          }}
        >
          {statusConfig.icon} {statusConfig.label}
        </div>
      </div>

      <div className="order-items">
        {order.items?.map((item, index) => (
          <div key={index} className="order-item">
            <div className="item-details">
              <span className="item-name">{item.name || 'Menu Item'}</span>
              <span className="item-quantity">x{item.quantity || 1}</span>
            </div>
            {item.price && (
              <div className="item-price">
                {formatCurrency(item.price)}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="order-footer">
        <div className="order-time">
          {formatTime(order.createdAt)}
        </div>
        <div className="order-total">
          {formatCurrency(orderTotal)}
        </div>
      </div>
    </div>
  );
};