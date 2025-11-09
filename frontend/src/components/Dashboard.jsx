import React from 'react';
import './Dashboard.css';

const Dashboard = ({ orders, tables, payments, notifications, onNotificationRead, getPrepTimeRemaining, isMobile }) => {
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const todayRevenue = payments.filter(p => {
    const paymentDate = new Date(p.paidAt);
    const today = new Date();
    return paymentDate.toDateString() === today.toDateString();
  }).reduce((sum, payment) => sum + payment.amount, 0);

  const activeOrders = orders.filter(order => order.status !== 'completed');
  const pendingOrders = orders.filter(order => order.status === 'pending');
  const preparingOrders = orders.filter(order => order.status === 'preparing');
  
  const occupiedTables = tables.filter(table => table.status === 'occupied');
  const availableTables = tables.filter(table => table.status === 'available');
  const tablesNeedingCleaning = tables.filter(table => table.status === 'needs_cleaning');

  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h2 className="page-title">Restaurant Dashboard</h2>
          <p className="page-subtitle">Real-time overview of your restaurant operations</p>
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
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">RM {totalRevenue.toFixed(2)}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-value">{orders.length}</div>
            <div className="stat-label">Total Orders</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🪑</div>
          <div className="stat-content">
            <div className="stat-value">{occupiedTables.length}/{tables.length}</div>
            <div className="stat-label">Tables Occupied</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔔</div>
          <div className="stat-content">
            <div className="stat-value">{unreadNotifications.length}</div>
            <div className="stat-label">Pending Notifications</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="dashboard-charts">
        <div className="chart-card">
          <h3 className="chart-title">Revenue Overview</h3>
          <div className="chart-placeholder">
            <div className="chart-text">📈 Revenue Chart</div>
            <div className="chart-description">Daily revenue performance and trends</div>
          </div>
        </div>
        <div className="chart-card">
          <h3 className="chart-title">Order Status</h3>
          <div className="chart-placeholder">
            <div className="chart-text">📊 Order Distribution</div>
            <div className="chart-description">
              Pending: {pendingOrders.length} | Preparing: {preparingOrders.length}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Notifications */}
      <div className="dashboard-charts">
        <div className="chart-card">
          <h3 className="chart-title">Quick Actions</h3>
          <div className="quick-actions">
            <button className="btn btn-primary">View All Orders</button>
            <button className="btn btn-success">Manage Tables</button>
            <button className="btn btn-warning">Kitchen Display</button>
          </div>
        </div>
        <div className="chart-card">
          <h3 className="chart-title">Recent Notifications</h3>
          <div className="quick-actions">
            {notifications.slice(0, 3).map(notification => (
              <div 
                key={notification.id} 
                className={`notification-item ${notification.read ? '' : 'unread'}`}
                onClick={() => onNotificationRead(notification.id)}
              >
                <div className="notification-message">{notification.message}</div>
                <div className="notification-time">{notification.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;