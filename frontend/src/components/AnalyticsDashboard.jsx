import React, { useState, useEffect } from 'react';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = ({ orders, payments, tables, isMobile }) => {
  const [timeRange, setTimeRange] = useState('today');
  
  // Get analytics data
  const calculateAnalytics = () => {
    // Include both completed and paid orders
    const completedOrders = orders.filter(order => order.status === 'completed');
    const paidOrders = orders.filter(order => order.paymentStatus === 'paid');
    
    const totalRevenue = paidOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = completedOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Table analytics
    const occupiedTables = tables.filter(table => table.status === 'occupied').length;
    const totalTables = tables.length;
    const occupancyRate = totalTables > 0 ? (occupiedTables / totalTables) * 100 : 0;
    
    // Popular items from completed orders
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
      completedOrders: completedOrders.slice(0, 10), // Last 10 orders
      paidOrders
    };
  };

  const analytics = calculateAnalytics();

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Analytics Dashboard</h2>
        <p className="page-subtitle">Business insights and performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="analytics-metrics">
        <div className="metric-card revenue-card">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-value">RM {analytics.totalRevenue.toFixed(2)}</div>
            <div className="metric-label">Total Revenue</div>
            <div className="metric-subtext">{analytics.paidOrders.length} paid orders</div>
          </div>
        </div>
        
        <div className="metric-card orders-card">
          <div className="metric-icon">📦</div>
          <div className="metric-content">
            <div className="metric-value">{analytics.totalOrders}</div>
            <div className="metric-label">Completed Orders</div>
            <div className="metric-subtext">{analytics.paidOrders.length} paid</div>
          </div>
        </div>
        
        <div className="metric-card average-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-value">RM {analytics.averageOrderValue.toFixed(2)}</div>
            <div className="metric-label">Average Order Value</div>
            <div className="metric-subtext">Per completed order</div>
          </div>
        </div>
        
        <div className="metric-card occupancy-card">
          <div className="metric-icon">🍽️</div>
          <div className="metric-content">
            <div className="metric-value">{analytics.occupancyRate.toFixed(1)}%</div>
            <div className="metric-label">Table Occupancy</div>
            <div className="metric-subtext">{analytics.occupiedTables}/{analytics.totalTables} tables</div>
          </div>
        </div>
      </div>

      <div className="analytics-content">
        {/* Popular Items */}
        <div className="analytics-section">
          <div className="section-header">
            <h3 className="section-title">Popular Menu Items</h3>
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
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-section">
                <div className="empty-icon">📊</div>
                <p>No popular items data</p>
                <small>Complete some orders to see analytics</small>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="analytics-section">
          <div className="section-header">
            <h3 className="section-title">Recent Completed Orders</h3>
            <span className="section-badge">{analytics.completedOrders.length}</span>
          </div>
          <div className="section-content">
            {analytics.completedOrders.length > 0 ? (
              <div className="recent-orders-list">
                {analytics.completedOrders.map(order => (
                  <div key={order._id || order.id} className="recent-order-item">
                    <div className="order-main">
                      <div className="order-number">{order.orderNumber}</div>
                      <div className="order-table">{order.tableId || order.table || 'Takeaway'}</div>
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
                <p>No completed orders</p>
                <small>Orders will appear here when completed</small>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;