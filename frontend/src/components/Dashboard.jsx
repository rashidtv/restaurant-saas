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
    <div className="dashboard-modern">
      {/* Modern Page Header */}
      <div className="page-header-modern">
        <div>
          <h2 className="page-title-modern">Restaurant Dashboard</h2>
          <p className="page-subtitle-modern">Real-time overview of your restaurant operations</p>
          {!apiConnected && (
            <div className="offline-badge-modern">⚠️ Offline Mode - Data may be limited</div>
          )}
        </div>
        <div className="menu-controls-modern">
          <div className="currency-display-modern">
            <span className="currency-icon-modern">📊</span>
            Live Data
          </div>
        </div>
      </div>

      {/* Modern Key Metrics */}
      <div className="dashboard-stats-modern">
        <div className="stat-card-modern revenue-card">
          <div className="stat-icon-modern">💰</div>
          <div className="stat-content-modern">
            <div className="stat-value-modern">RM {totalRevenue.toFixed(2)}</div>
            <div className="stat-label-modern">Total Revenue</div>
            <div className="stat-subtext-modern">
              Today: RM {todayRevenue().toFixed(2)}
              <br />
              Paid Orders: {paidOrders.length}
            </div>
          </div>
        </div>
        
        <div className="stat-card-modern orders-card">
          <div className="stat-icon-modern">📦</div>
          <div className="stat-content-modern">
            <div className="stat-value-modern">{orders?.length || 0}</div>
            <div className="stat-label-modern">Total Orders</div>
            <div className="stat-subtext-modern">
              Today: {todayOrders.length}
              <br />
              Active: {activeOrders.length}
            </div>
          </div>
        </div>
        
        <div className="stat-card-modern tables-card">
          <div className="stat-icon-modern">🪑</div>
          <div className="stat-content-modern">
            <div className="stat-value-modern">{occupiedTables.length}/{tables?.length || 0}</div>
            <div className="stat-label-modern">Tables Occupied</div>
            <div className="stat-subtext-modern">
              {availableTables.length} available
              <br />
              {tablesNeedingCleaning.length} need cleaning
            </div>
          </div>
        </div>
        
        <div className="stat-card-modern activity-card">
          <div className="stat-icon-modern">🔔</div>
          <div className="stat-content-modern">
            <div className="stat-value-modern">{unreadNotifications.length}</div>
            <div className="stat-label-modern">Notifications</div>
            <div className="stat-subtext-modern">
              {activeOrders.length} active orders
              <br />
              {paidOrders.length} paid orders
            </div>
          </div>
        </div>
      </div>

      {/* Modern Order Status Overview */}
      <div className="dashboard-charts-modern">
        <div className="chart-card-modern">
          <h3 className="chart-title-modern">Order Status Overview</h3>
          <div className="order-status-grid-modern">
            <div className="status-item-modern pending">
              <div className="status-count-modern">{pendingOrders.length}</div>
              <div className="status-label-modern">Pending</div>
            </div>
            <div className="status-item-modern preparing">
              <div className="status-count-modern">{preparingOrders.length}</div>
              <div className="status-label-modern">Preparing</div>
            </div>
            <div className="status-item-modern ready">
              <div className="status-count-modern">{readyOrders.length}</div>
              <div className="status-label-modern">Ready</div>
            </div>
            <div className="status-item-modern completed">
              <div className="status-count-modern">
                {orders?.filter(o => o.status === 'completed').length || 0}
              </div>
              <div className="status-label-modern">Completed</div>
            </div>
          </div>
          <div className="payment-status-modern">
            <div className="payment-status-item-modern paid">
              <strong>Paid Orders:</strong> {paidOrders.length}
            </div>
            <div className="payment-status-item-modern unpaid">
              <strong>Unpaid Orders:</strong> {orders?.filter(o => o.paymentStatus !== 'paid').length || 0}
            </div>
          </div>
        </div>
        
        <div className="chart-card-modern">
          <h3 className="chart-title-modern">Table Status</h3>
          <div className="table-status-grid-modern">
            <div className="table-status-modern available">
              <div className="status-count-modern">{availableTables.length}</div>
              <div className="status-label-modern">Available</div>
            </div>
            <div className="table-status-modern occupied">
              <div className="status-count-modern">{occupiedTables.length}</div>
              <div className="status-label-modern">Occupied</div>
            </div>
            <div className="table-status-modern cleaning">
              <div className="status-count-modern">{tablesNeedingCleaning.length}</div>
              <div className="status-label-modern">Needs Cleaning</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Recent Activity */}
      <div className="dashboard-charts-modern">
        <div className="chart-card-modern">
          <h3 className="chart-title-modern">Recent Orders</h3>
          <div className="recent-orders-modern">
            {orders && orders.slice(0, 5).map(order => (
              <div key={order._id || order.id} className="order-item-modern">
                <div className="order-info-modern">
                  <div className="order-number-modern">{order.orderNumber || `ORD-${order._id?.slice(-6)}`}</div>
                  <div className="order-table-modern">Table {order.tableId || order.table}</div>
                  <div className={`payment-status-badge ${order.paymentStatus === 'paid' ? 'paid' : 'unpaid'}`}>
                    {order.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Unpaid'}
                  </div>
                </div>
                <div className="order-status-modern">
                  <span className={`status-badge-modern ${order.status}`}>
                    {order.status}
                  </span>
                </div>
                <div className="order-amount-modern">
                  RM {(order.total || 0).toFixed(2)}
                </div>
              </div>
            ))}
            {(!orders || orders.length === 0) && (
              <div className="no-data-modern">No orders yet</div>
            )}
          </div>
        </div>
        
        <div className="chart-card-modern">
          <h3 className="chart-title-modern">Recent Notifications</h3>
          <div className="notifications-list-modern">
            {notifications && notifications.slice(0, 5).map(notification => (
              <div 
                key={notification.id} 
                className={`notification-item-modern ${notification.read ? '' : 'unread'}`}
                onClick={() => onNotificationRead(notification.id)}
              >
                <div className="notification-message-modern">{notification.message}</div>
                <div className="notification-time-modern">{notification.time}</div>
                <div className="notification-type-modern">{notification.type}</div>
              </div>
            ))}
            {(!notifications || notifications.length === 0) && (
              <div className="no-data-modern">No notifications</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;