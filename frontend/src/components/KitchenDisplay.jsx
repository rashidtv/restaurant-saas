import React, { useState, useEffect } from 'react';
import './KitchenDisplay.css';

const KitchenDisplay = ({ orders, setOrders, getPrepTimeRemaining, isMobile }) => {
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
    setOrders(orders.map(order => {
      if (order.id === orderId) {
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
  };

  const markTableForCleaning = (tableNumber) => {
    // In a real app, this would update the table status
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
    const totalMs = order.estimatedPrepTime * 60000;
    
    return Math.min(100, (elapsedMs / totalMs) * 100);
  };

  const getProgressColor = (order) => {
    const percentage = getProgressPercentage(order);
    if (percentage < 50) return '#3b82f6';
    if (percentage < 80) return '#f59e0b';
    return '#ef4444';
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
            {isMobile ? filter.label.split(' ')[0] : filter.label}
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
          
          return (
            <div 
              key={order.id} 
              className={`kitchen-order-card ${isUrgent ? 'urgent' : ''}`}
            >
              <div className="kitchen-order-header">
                <div>
                  <h3 className="kitchen-order-id">{order.id}</h3>
                  <div className="kitchen-order-meta">
                    <span className="order-table">{order.table}</span>
                    <span className="order-type">
                      {isMobile ? order.type.substring(0, 3) : order.type}
                    </span>
                    <span className="order-time">{order.time}</span>
                  </div>
                </div>
                <div className="kitchen-order-status">
                  <div className="order-total">RM {order.total.toFixed(2)}</div>
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
                {order.items.map((item, index) => (
                  <div key={index} className="kitchen-order-item">
                    <div className="order-item-info">
                      <span className="order-item-quantity">{item.quantity}x</span>
                      <span className="order-item-name">
                        {isMobile ? `${item.name.substring(0, 20)}...` : item.name}
                      </span>
                    </div>
                    <div className="order-item-price">
                      RM {(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="kitchen-order-actions">
                {order.status === 'pending' && (
                  <button 
                    className="kitchen-action-btn"
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                  >
                    <span className="action-icon">👨‍🍳</span>
                    {isMobile ? 'Start' : 'Start Preparing'}
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button 
                    className="kitchen-action-btn-ready"
                    onClick={() => updateOrderStatus(order.id, 'ready')}
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
                        updateOrderStatus(order.id, 'completed');
                        if (order.type === 'dine-in') {
                          markTableForCleaning(order.table);
                        }
                      }}
                    >
                      <span className="action-icon">🎉</span>
                      {isMobile ? 'Complete' : 'Complete Order'}
                    </button>
                    {order.type === 'dine-in' && (
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
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem', 
              color: '#64748b',
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍🍳</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>
                No Orders Found
              </h3>
              <p style={{ margin: 0 }}>
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