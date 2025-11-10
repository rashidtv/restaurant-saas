import React, { useState, useEffect } from 'react';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = ({ orders, payments, tables, isMobile }) => {
  const [timeRange, setTimeRange] = useState('today');
  
  // Get all completed orders (both paid and unpaid)
  const getCompletedOrders = () => {
    return orders.filter(order => order.status === 'completed');
  };

  // Get paid orders
  const getPaidOrders = () => {
    return orders.filter(order => order.paymentStatus === 'paid');
  };

  // Calculate analytics data
  const calculateAnalytics = () => {
    const completedOrders = getCompletedOrders();
    const paidOrders = getPaidOrders();
    
    const totalRevenue = paidOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = completedOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Table occupancy
    const occupiedTables = tables.filter(table => table.status === 'occupied').length;
    const totalTables = tables.length;
    const occupancyRate = totalTables > 0 ? (occupiedTables / totalTables) * 100 : 0;
    
    // Popular items
    const itemCounts = {};
    completedOrders.forEach(order => {
      order.items?.forEach(item => {
        const itemName = item.menuItem?.name || item.name || 'Unknown Item';
        itemCounts[itemName] = (itemCounts[itemName] || 0) + (item.quantity || 1);
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
      completedOrders,
      paidOrders
    };
  };

  const analytics = calculateAnalytics();

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Analytics Dashboard</h2>
        <p className="page-subtitle">Business insights and performance metrics</p>
        
        <div className="time-filter">
          <button 
            className={`time-btn ${timeRange === 'today' ? 'active' : ''}`}
            onClick={() => setTimeRange('today')}
          >
            Today
          </button>
          <button 
            className={`time-btn ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => setTimeRange('week')}
          >
            This Week
          </button>
          <button 
            className={`time-btn ${timeRange === 'month' ? 'active' : ''}`}
            onClick={() => setTimeRange('month')}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-value">RM {analytics.totalRevenue.toFixed(2)}</div>
          <div className="metric-label">Total Revenue</div>
          <div className="metric-subtext">{analytics.paidOrders.length} paid orders</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value">{analytics.totalOrders}</div>
          <div className="metric-label">Completed Orders</div>
          <div className="metric-subtext">{analytics.paidOrders.length} paid</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value">RM {analytics.averageOrderValue.toFixed(2)}</div>
          <div className="metric-label">Average Order Value</div>
          <div className="metric-subtext">Per completed order</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value">{analytics.occupancyRate.toFixed(1)}%</div>
          <div className="metric-label">Table Occupancy</div>
          <div className="metric-subtext">{analytics.occupiedTables}/{analytics.totalTables} tables</div>
        </div>
      </div>

      <div className="analytics-sections">
        {/* Popular Items */}
        <div className="analytics-section">
          <h3 className="section-title">Popular Items</h3>
          <div className="popular-items">
            {analytics.popularItems.length > 0 ? (
              analytics.popularItems.map((item, index) => (
                <div key={index} className="popular-item">
                  <span className="item-rank">#{index + 1}</span>
                  <span className="item-name">{item.name}</span>
                  <span className="item-count">{item.count} orders</span>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No order data available</p>
                <small>Popular items will appear here</small>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="analytics-section">
          <h3 className="section-title">Recent Completed Orders</h3>
          <div className="recent-orders">
            {analytics.completedOrders.slice(0, 5).map(order => (
              <div key={order._id || order.id} className="recent-order">
                <div className="order-info">
                  <span className="order-number">{order.orderNumber}</span>
                  <span className="order-table">{order.tableId || order.table || 'Takeaway'}</span>
                </div>
                <div className="order-details">
                  <span className="order-amount">RM {order.total?.toFixed(2) || '0.00'}</span>
                  <span className={`payment-status ${order.paymentStatus === 'paid' ? 'paid' : 'pending'}`}>
                    {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              </div>
            ))}
            {analytics.completedOrders.length === 0 && (
              <div className="empty-state">
                <p>No completed orders</p>
                <small>Completed orders will appear here</small>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;