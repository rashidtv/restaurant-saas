import React from 'react';
import './Dashboard.css';

const Dashboard = ({ orders, tables, payments, notifications, onNotificationRead, getPrepTimeRemaining, isMobile, apiConnected }) => {
  // FIXED: Calculate revenue from BOTH payments AND paid orders
  const calculateRevenue = () => {
    console.log('💰 Revenue Debug:', {
      paymentsCount: payments?.length,
      paidOrdersCount: orders?.filter(o => o.paymentStatus === 'paid').length,
      allOrders: orders?.length
    });

    // Method 1: From payments collection (for accuracy)
    const fromPayments = payments && Array.isArray(payments) 
      ? payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
      : 0;

    // Method 2: From paid orders (primary source - this should be the truth)
    const fromPaidOrders = orders && Array.isArray(orders)
      ? orders
          .filter(order => order.paymentStatus === 'paid' && order.status === 'completed')
          .reduce((sum, order) => sum + (order.total || 0), 0)
      : 0;

    // FIXED: Use the HIGHER value to ensure we don't under-report revenue
    // This handles cases where payments might not be fully synced
    const totalRevenue = Math.max(fromPayments, fromPaidOrders);

    console.log('💰 Revenue Calculation:', {
      fromPayments,
      fromPaidOrders,
      finalRevenue: totalRevenue
    });

    return totalRevenue;
  };

  const totalRevenue = calculateRevenue();

  // Today's revenue - FIXED to use same logic
  const todayRevenue = () => {
    const today = new Date().toDateString();
    
    // From payments
    const fromPayments = payments && Array.isArray(payments) 
      ? payments.filter(p => {
          if (!p.paidAt) return false;
          try {
            const paymentDate = new Date(p.paidAt);
            return paymentDate.toDateString() === today;
          } catch {
            return false;
          }
        }).reduce((sum, payment) => sum + (payment.amount || 0), 0)
      : 0;

    // From paid orders
    const fromPaidOrders = orders && Array.isArray(orders)
      ? orders.filter(order => {
          if (!order.orderedAt || order.paymentStatus !== 'paid' || order.status !== 'completed') return false;
          try {
            const orderDate = new Date(order.orderedAt);
            return orderDate.toDateString() === today;
          } catch {
            return false;
          }
        }).reduce((sum, order) => sum + (order.total || 0), 0)
      : 0;

    // FIXED: Use the higher value
    return Math.max(fromPayments, fromPaidOrders);
  };

  // FIXED: Add proper array checks for all data
  const activeOrders = orders && Array.isArray(orders) 
    ? orders.filter(order => order.status !== 'completed' && order.status !== 'cancelled')
    : [];

  const pendingOrders = orders && Array.isArray(orders)
    ? orders.filter(order => order.status === 'pending')
    : [];

  const preparingOrders = orders && Array.isArray(orders)
    ? orders.filter(order => order.status === 'preparing')
    : [];

  const readyOrders = orders && Array.isArray(orders)
    ? orders.filter(order => order.status === 'ready')
    : [];

  const paidOrders = orders && Array.isArray(orders)
    ? orders.filter(order => order.paymentStatus === 'paid')
    : [];

  // FIXED: Table status filtering
  const occupiedTables = tables && Array.isArray(tables)
    ? tables.filter(table => table.status === 'occupied')
    : [];

  const availableTables = tables && Array.isArray(tables)
    ? tables.filter(table => table.status === 'available')
    : [];

  const tablesNeedingCleaning = tables && Array.isArray(tables)
    ? tables.filter(table => table.status === 'needs_cleaning')
    : [];

  const unreadNotifications = notifications && Array.isArray(notifications)
    ? notifications.filter(n => !n.read)
    : [];

  // FIXED: Today's orders count
  const todayOrders = orders && Array.isArray(orders)
    ? orders.filter(order => {
        if (!order.orderedAt) return false;
        try {
          const orderDate = new Date(order.orderedAt);
          const today = new Date();
          return orderDate.toDateString() === today.toDateString();
        } catch {
          return false;
        }
      })
    : [];

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h2 className="page-title">Restaurant Dashboard</h2>
          <p className="page-subtitle">Real-time overview of your restaurant operations</p>
          {!apiConnected && (
            <div className="offline-badge">⚠️ Offline Mode</div>
          )}
        </div>
        <div className="menu-controls">
          <div className="currency-display">
            <span className="currency-icon">📊</span>
            Live Data
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="dashboard-stats">
        <div className="stat-card revenue-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">RM {totalRevenue.toFixed(2)}</div>
            <div className="stat-label">Total Revenue</div>
            <div className="stat-subtext">
              Today: RM {todayRevenue().toFixed(2)}
              <br />
              Paid Orders: {paidOrders.length}
            </div>
          </div>
        </div>
        
        <div className="stat-card orders-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-value">{orders?.length || 0}</div>
            <div className="stat-label">Total Orders</div>
            <div className="stat-subtext">
              Today: {todayOrders.length}
              <br />
              Active: {activeOrders.length}
            </div>
          </div>
        </div>
        
        <div className="stat-card tables-card">
          <div className="stat-icon">🪑</div>
          <div className="stat-content">
            <div className="stat-value">{occupiedTables.length}/{tables?.length || 0}</div>
            <div className="stat-label">Tables Occupied</div>
            <div className="stat-subtext">
              {availableTables.length} available
              <br />
              {tablesNeedingCleaning.length} need cleaning
            </div>
          </div>
        </div>
        
        <div className="stat-card activity-card">
          <div className="stat-icon">🔔</div>
          <div className="stat-content">
            <div className="stat-value">{unreadNotifications.length}</div>
            <div className="stat-label">Notifications</div>
            <div className="stat-subtext">
              {activeOrders.length} active orders
              <br />
              {paidOrders.length} paid orders
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Overview */}
      <div className="dashboard-charts">
        <div className="chart-card">
          <h3 className="chart-title">Order Status Overview</h3>
          <div className="order-status-grid">
            <div className="status-item pending">
              <div className="status-count">{pendingOrders.length}</div>
              <div className="status-label">Pending</div>
            </div>
            <div className="status-item preparing">
              <div className="status-count">{preparingOrders.length}</div>
              <div className="status-label">Preparing</div>
            </div>
            <div className="status-item ready">
              <div className="status-count">{readyOrders.length}</div>
              <div className="status-label">Ready</div>
            </div>
            <div className="status-item completed">
              <div className="status-count">
                {orders?.filter(o => o.status === 'completed').length || 0}
              </div>
              <div className="status-label">Completed</div>
            </div>
          </div>
          <div className="payment-status">
            <div className="payment-status-item paid">
              <strong>Paid Orders:</strong> {paidOrders.length}
            </div>
            <div className="payment-status-item unpaid">
              <strong>Unpaid Orders:</strong> {orders?.filter(o => o.paymentStatus !== 'paid').length || 0}
            </div>
          </div>
        </div>
        
        <div className="chart-card">
          <h3 className="chart-title">Table Status</h3>
          <div className="table-status-grid">
            <div className="table-status available">
              <div className="status-count">{availableTables.length}</div>
              <div className="status-label">Available</div>
            </div>
            <div className="table-status occupied">
              <div className="status-count">{occupiedTables.length}</div>
              <div className="status-label">Occupied</div>
            </div>
            <div className="table-status cleaning">
              <div className="status-count">{tablesNeedingCleaning.length}</div>
              <div className="status-label">Needs Cleaning</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="dashboard-charts">
        <div className="chart-card">
          <h3 className="chart-title">Recent Orders</h3>
          <div className="recent-orders">
            {orders && orders.slice(0, 5).map(order => (
              <div key={order._id || order.id} className="order-item">
                <div className="order-info">
                  <div className="order-number">{order.orderNumber || `ORD-${order._id?.slice(-6)}`}</div>
                  <div className="order-table">Table {order.tableId || order.table}</div>
                  <div className={`payment-status ${order.paymentStatus === 'paid' ? 'paid' : 'unpaid'}`}>
                    {order.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Unpaid'}
                  </div>
                </div>
                <div className="order-status">
                  <span className={`status-badge ${order.status}`}>
                    {order.status}
                  </span>
                </div>
                <div className="order-amount">
                  RM {(order.total || 0).toFixed(2)}
                </div>
              </div>
            ))}
            {(!orders || orders.length === 0) && (
              <div className="no-data">No orders yet</div>
            )}
          </div>
        </div>
        
        <div className="chart-card">
          <h3 className="chart-title">Recent Notifications</h3>
          <div className="notifications-list">
            {notifications && notifications.slice(0, 5).map(notification => (
              <div 
                key={notification.id} 
                className={`notification-item ${notification.read ? '' : 'unread'}`}
                onClick={() => onNotificationRead(notification.id)}
              >
                <div className="notification-message">{notification.message}</div>
                <div className="notification-time">{notification.time}</div>
                <div className="notification-type">{notification.type}</div>
              </div>
            ))}
            {(!notifications || notifications.length === 0) && (
              <div className="no-data">No notifications</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;