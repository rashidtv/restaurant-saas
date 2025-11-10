import React, { useState, useEffect } from 'react';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = ({ orders, payments, tables, isMobile }) => {
  const [timeRange, setTimeRange] = useState('today');
  const [loading, setLoading] = useState(false);

  // Calculate analytics data
  const calculateAnalytics = () => {
    const completedOrders = orders.filter(order => order.status === 'completed');
    const paidOrders = orders.filter(order => order.paymentStatus === 'paid');
    
    const totalRevenue = paidOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = completedOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Table analytics
    const occupiedTables = tables.filter(table => table.status === 'occupied').length;
    const totalTables = tables.length;
    const occupancyRate = totalTables > 0 ? (occupiedTables / totalTables) * 100 : 0;
    
    // Popular items
    const itemCounts = {};
    completedOrders.forEach(order => {
      order.items?.forEach(item => {
        const itemName = item.menuItem?.name || item.name || 'Unknown Item';
        const quantity = item.quantity || 1;
        itemCounts[itemName] = (itemCounts[itemName] || 0) + quantity;
      });
    });
    
    const popularItems = Object.entries(itemCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
    
    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      occupancyRate,
      occupiedTables,
      totalTables,
      popularItems,
      completedOrders: completedOrders.slice(0, 10),
      paidOrders: paidOrders.length
    };
  };

  const analytics = calculateAnalytics();

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <div className="header-main">
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">Business insights and performance metrics</p>
        </div>
        
        <div className="time-filters">
          <button 
            className={`time-filter-btn ${timeRange === 'today' ? 'active' : ''}`}
            onClick={() => setTimeRange('today')}
          >
            Today
          </button>
          <button 
            className={`time-filter-btn ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => setTimeRange('week')}
          >
            This Week
          </button>
          <button 
            className={`time-filter-btn ${timeRange === 'month' ? 'active' : ''}`}
            onClick={() => setTimeRange('month')}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card revenue-card">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-value">RM {analytics.totalRevenue.toFixed(2)}</div>
            <div className="metric-label">Total Revenue</div>
            <div className="metric-trend positive">
              +12% from yesterday
            </div>
          </div>
        </div>
        
        <div className="metric-card orders-card">
          <div className="metric-icon">📦</div>
          <div className="metric-content">
            <div className="metric-value">{analytics.totalOrders}</div>
            <div className="metric-label">Completed Orders</div>
            <div className="metric-trend">
              {analytics.paidOrders} paid
            </div>
          </div>
        </div>
        
        <div className="metric-card average-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-value">RM {analytics.averageOrderValue.toFixed(2)}</div>
            <div className="metric-label">Average Order Value</div>
            <div className="metric-trend positive">
              +5.2% increase
            </div>
          </div>
        </div>
        
        <div className="metric-card occupancy-card">
          <div className="metric-icon">🍽️</div>
          <div className="metric-content">
            <div className="metric-value">{analytics.occupancyRate.toFixed(1)}%</div>
            <div className="metric-label">Table Occupancy</div>
            <div className="metric-trend">
              {analytics.occupiedTables}/{analytics.totalTables} tables
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Data Sections */}
      <div className="analytics-content">
        {/* Popular Items Section */}
        <div className="analytics-section">
          <div className="section-header">
            <h2 className="section-title">Popular Menu Items</h2>
            <div className="section-actions">
              <span className="section-badge">Top 5</span>
            </div>
          </div>
          <div className="section-content">
            {analytics.popularItems.length > 0 ? (
              <div className="popular-items-list">
                {analytics.popularItems.map((item, index) => (
                  <div key={index} className="popular-item">
                    <div className="item-rank">#{index + 1}</div>
                    <div className="item-info">
                      <div className="item-name">{item.name}</div>
                      <div className="item-stats">{item.count} orders</div>
                    </div>
                    <div className="item-bar">
                      <div 
                        className="item-progress" 
                        style={{ width: `${(item.count / Math.max(...analytics.popularItems.map(i => i.count))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-section">
                <div className="empty-icon">📊</div>
                <h3>No Data Available</h3>
                <p>Popular items will appear here as orders are completed</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders Section */}
        <div className="analytics-section">
          <div className="section-header">
            <h2 className="section-title">Recent Completed Orders</h2>
            <div className="section-actions">
              <span className="section-badge">{analytics.completedOrders.length}</span>
            </div>
          </div>
          <div className="section-content">
            {analytics.completedOrders.length > 0 ? (
              <div className="recent-orders-list">
                {analytics.completedOrders.map((order, index) => (
                  <div key={order._id || order.id} className="recent-order-item">
                    <div className="order-main">
                      <div className="order-number">{order.orderNumber}</div>
                      <div className="order-meta">
                        <span className="table-info">Table {order.tableId || order.table || 'Takeaway'}</span>
                        <span className="order-time">
                          {order.completedAt ? new Date(order.completedAt).toLocaleTimeString() : 'Recently'}
                        </span>
                      </div>
                    </div>
                    <div className="order-details">
                      <div className="order-amount">RM {order.total?.toFixed(2) || '0.00'}</div>
                      <div className={`payment-status ${order.paymentStatus === 'paid' ? 'status-paid' : 'status-pending'}`}>
                        {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-section">
                <div className="empty-icon">📦</div>
                <h3>No Orders Completed</h3>
                <p>Completed orders will appear here for analytics</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="stats-row">
        <div className="stat-item">
          <div className="stat-value">{analytics.paidOrders}</div>
          <div className="stat-label">Paid Orders</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{analytics.totalOrders - analytics.paidOrders}</div>
          <div className="stat-label">Unpaid Orders</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{analytics.occupiedTables}</div>
          <div className="stat-label">Occupied Tables</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{analytics.totalTables - analytics.occupiedTables}</div>
          <div className="stat-label">Available Tables</div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;