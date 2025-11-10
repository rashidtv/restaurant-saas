import React, { useState, useEffect } from 'react';
import './KitchenDisplay.css';
import { truncateText, getSafeString } from '../utils/stringUtils';

const KitchenDisplay = ({ orders, setOrders, getPrepTimeRemaining, isMobile, onUpdateOrderStatus, apiConnected }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for live timers
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const updateOrderStatus = (orderId, newStatus) => {
    if (apiConnected && onUpdateOrderStatus) {
      onUpdateOrderStatus(orderId, newStatus);
    } else {
      // Fallback to local state update
      setOrders(orders.map(order => {
        if (order.id === orderId || order._id === orderId) {
          const updatedOrder = { 
            ...order, 
            status: newStatus 
          };
          
          if (newStatus === 'preparing' && !order.preparationStart) {
            updatedOrder.preparationStart = new Date();
          }
          
          return updatedOrder;
        }
        return order;
      }));
    }
  };

  const markTableForCleaning = (tableNumber) => {
    console.log(`Table ${tableNumber} marked for cleaning`);
  };

  const filteredOrders = activeFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === activeFilter);

  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    total: orders.length
  };

  // Check if order is urgent (less than 2 minutes remaining)
  const isOrderUrgent = (order) => {
    if (order.status !== 'preparing' || !order.preparationStart) return false;
    
    const prepTimeRemaining = getPrepTimeRemaining(order);
    if (prepTimeRemaining === 'Overdue') return true;
    
    const minutesRemaining = parseInt(prepTimeRemaining);
    return minutesRemaining <= 2 && minutesRemaining > 0;
  };

  const getProgressPercentage = (order) => {
    if (!order.preparationStart || order.status !== 'preparing') return 0;
    
    const now = new Date();
    const startTime = new Date(order.preparationStart);
    const elapsedMs = now - startTime;
    const totalMs = (order.estimatedPrepTime || 15) * 60000;
    
    return Math.min(100, (elapsedMs / totalMs) * 100);
  };

  const getProgressColor = (order) => {
    const percentage = getProgressPercentage(order);
    if (percentage < 50) return '#3b82f6';
    if (percentage < 80) return '#f59e0b';
    return '#ef4444';
  };

  // Safe order type display
  const getOrderTypeDisplay = (orderType) => {
    const type = getSafeString(orderType, 'dine-in');
    return isMobile ? type.substring(0, 3) : type;
  };

  // Get table number safely
  const getTableNumber = (order) => {
    return order.table || order.tableId || 'Unknown';
  };

  // Get order ID safely
  const getOrderId = (order) => {
    return order.id || order._id || order.orderNumber || `ORD-${Date.now()}`;
  };

  // Get order total safely
  const getOrderTotal = (order) => {
    if (order.total) return order.total;
    if (order.items) {
      return order.items.reduce((sum, item) => {
        const itemPrice = item.price || item.menuItem?.price || 0;
        const itemQuantity = item.quantity || 1;
        return sum + (itemPrice * itemQuantity);
      }, 0);
    }
    return 0;
  };

// Enhanced getItemName function with better error handling
const getItemName = (item) => {
  console.log('Kitchen Display - Processing item for display:', item);
  
  // Handle all possible data formats
  if (item.menuItem && item.menuItem.name) {
    return getSafeString(item.menuItem.name);
  }
  if (item.name) {
    return getSafeString(item.name);
  }
  if (item.menuItem && typeof item.menuItem === 'object') {
    // Try to extract name from menuItem object
    const menuItemName = item.menuItem.name || item.menuItem.title;
    if (menuItemName) return getSafeString(menuItemName);
  }
  
  console.warn('Kitchen Display - Unknown item structure, returning fallback:', item);
  return 'Menu Item';
};

// Add this debug useEffect to KitchenDisplay
useEffect(() => {
  console.log('KitchenDisplay - All orders:', orders);
  console.log('KitchenDisplay - Filtered orders:', filteredOrders);
  
  // Log item structures for debugging
  orders.forEach((order, index) => {
    console.log(`Order ${index} items:`, order.items);
    order.items?.forEach((item, itemIndex) => {
      console.log(`Order ${index} - Item ${itemIndex}:`, item);
    });
  });
}, [orders, filteredOrders]);

  // Get item price safely - handles both data formats
  const getItemPrice = (item) => {
    // Handle Table Management format (item has menuItem object)
    if (item.menuItem && item.menuItem.price) {
      return item.menuItem.price;
    }
    // Handle Digital Menu format (item has direct price)
    if (item.price) {
      return item.price;
    }
    return 0;
  };

  // Get item quantity safely
  const getItemQuantity = (item) => {
    return item.quantity || 1;
  };

  return (
    <div className="page">
      <div className="kitchen-header">
        <div>
          <h2 className="page-title">Kitchen Display</h2>
          <p className="page-subtitle">Live order management with preparation tracking</p>
        </div>
        <div className="kitchen-stats">
          <div className="kitchen-stat">
            <div className="kitchen-stat-value">{stats.total}</div>
            <div className="kitchen-stat-label">Total Orders</div>
          </div>
          <div className="kitchen-stat">
            <div className="kitchen-stat-value" style={{ color: '#F59E0B' }}>{stats.pending}</div>
            <div className="kitchen-stat-label">Pending</div>
          </div>
          <div className="kitchen-stat">
            <div className="kitchen-stat-value" style={{ color: '#3B82F6' }}>{stats.preparing}</div>
            <div className="kitchen-stat-label">Preparing</div>
          </div>
          <div className="kitchen-stat">
            <div className="kitchen-stat-value" style={{ color: '#10B981' }}>{stats.ready}</div>
            <div className="kitchen-stat-label">Ready</div>
          </div>
        </div>
      </div>

      {/* Kitchen Filters */}
      <div className="kitchen-filters">
        {[
          { id: 'all', label: 'All Orders', count: stats.total },
          { id: 'pending', label: 'Pending', count: stats.pending },
          { id: 'preparing', label: 'Preparing', count: stats.preparing },
          { id: 'ready', label: 'Ready', count: stats.ready }
        ].map(filter => (
          <button
            key={filter.id}
            className={`kitchen-filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter.id)}
          >
            {isMobile ? getSafeString(filter.label).split(' ')[0] : filter.label}
            {filter.count > 0 && (
              <span className="filter-count">{filter.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Kitchen Orders Grid */}
      <div className="kitchen-grid">
        {filteredOrders.map(order => {
          const prepTimeRemaining = getPrepTimeRemaining(order);
          const isUrgent = isOrderUrgent(order);
          const progressPercentage = getProgressPercentage(order);
          const progressColor = getProgressColor(order);
          const orderId = getOrderId(order);
          const tableNumber = getTableNumber(order);
          const orderTotal = getOrderTotal(order);
          const orderType = order.orderType || 'dine-in';
          
          return (
            <div 
              key={orderId} 
              className={`kitchen-order-card ${isUrgent ? 'urgent' : ''}`}
            >
              <div className="kitchen-order-header">
                <div>
                  <h3 className="kitchen-order-id">{orderId}</h3>
                  <div className="kitchen-order-meta">
                    <span className="order-table">Table {tableNumber}</span>
                    <span className="order-type">
                      {getOrderTypeDisplay(orderType)}
                    </span>
                    <span className="order-time">{order.time || 'Just now'}</span>
                  </div>
                </div>
                <div className="kitchen-order-status">
                  <div className="order-total">RM {orderTotal.toFixed(2)}</div>
                  <span className={
                    order.status === 'ready' ? 'kitchen-status-ready' : 
                    order.status === 'preparing' ? 'kitchen-status-preparing' : 
                    'kitchen-status-pending'
                  }>
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Preparation Timer */}
              {order.status === 'preparing' && prepTimeRemaining && (
                <div className="prep-timer">
                  <div className="timer-label">Time Remaining:</div>
                  <div 
                    className="timer-value"
                    style={{ color: isUrgent ? '#ef4444' : '#1e293b' }}
                  >
                    {prepTimeRemaining}
                    {isUrgent && ' ⚠️'}
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{
                        width: `${progressPercentage}%`,
                        backgroundColor: progressColor
                      }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="kitchen-order-items">
                {(order.items || []).map((item, index) => {
                  const itemName = getItemName(item);
                  const itemPrice = getItemPrice(item);
                  const itemQuantity = getItemQuantity(item);
                  
                  return (
                    <div key={index} className="kitchen-order-item">
                      <div className="order-item-info">
                        <span className="order-item-quantity">{itemQuantity}x</span>
                        <span className="order-item-name">
                          {truncateText(itemName, isMobile ? 15 : 25)}
                        </span>
                      </div>
                      <div className="order-item-price">
                        RM {(itemPrice * itemQuantity).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="kitchen-order-actions">
                {order.status === 'pending' && (
                  <button 
                    className="kitchen-action-btn"
                    onClick={() => updateOrderStatus(orderId, 'preparing')}
                  >
                    <span className="action-icon">👨‍🍳</span>
                    {isMobile ? 'Start' : 'Start Preparing'}
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button 
                    className="kitchen-action-btn-ready"
                    onClick={() => updateOrderStatus(orderId, 'ready')}
                  >
                    <span className="action-icon">✅</span>
                    {isMobile ? 'Ready' : 'Mark as Ready'}
                  </button>
                )}
                {order.status === 'ready' && (
                  <div className="ready-actions">
                    <button 
                      className="kitchen-action-btn-complete"
                      onClick={() => {
                        updateOrderStatus(orderId, 'completed');
                        if (orderType === 'dine-in') {
                          markTableForCleaning(tableNumber);
                        }
                      }}
                    >
                      <span className="action-icon">🎉</span>
                      {isMobile ? 'Complete' : 'Complete Order'}
                    </button>
                    {orderType === 'dine-in' && (
                      <div className="cleaning-note">
                        Table will be marked for cleaning
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="empty-state">
            <div className="empty-kitchen-state">
              <div className="empty-kitchen-icon">👨‍🍳</div>
              <h3 className="empty-kitchen-title">No Orders Found</h3>
              <p className="empty-kitchen-message">
                {activeFilter === 'all' 
                  ? 'No orders in the kitchen right now.' 
                  : `No ${activeFilter} orders at the moment.`
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenDisplay;