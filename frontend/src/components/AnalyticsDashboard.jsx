import React from 'react';
import './AnalyticsDashboard.css';

// Add these utility functions before the AnalyticsDashboard component
const getItemName = (item) => {
  if (!item) return 'Unknown Item';
  if (item.menuItem && item.menuItem.name) return item.menuItem.name;
  if (item.name) return item.name;
  return 'Unknown Item';
};

const getItemPrice = (item) => {
  if (!item) return 0;
  if (item.price) return item.price;
  if (item.menuItem && item.menuItem.price) return item.menuItem.price;
  return 0;
};

const calculateTablePerformance = (tables, orders) => {
  const totalTables = tables.length;
  const occupiedTables = tables.filter(table => table.status === 'occupied').length;
  const availableTables = tables.filter(table => table.status === 'available').length;
  
  const completedOrders = orders.filter(order => order.status === 'completed').length;
  const avgTurnover = totalTables > 0 ? (completedOrders / totalTables).toFixed(1) : '0.0';
  
  return {
    totalTables,
    occupiedTables,
    availableTables,
    utilization: totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0,
    avgTurnover
  };
};

const AnalyticsDashboard = ({ orders, payments, tables, isMobile }) => {
  // Calculate key metrics
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalOrders = orders.length;
  const completedOrders = orders.filter(order => order.status === 'completed').length;
  const avgOrderValue = payments.length > 0 ? totalRevenue / payments.length : 0;
  
  const occupiedTables = tables.filter(table => table.status === 'occupied').length;
  const tableUtilization = tables.length > 0 ? (occupiedTables / tables.length) * 100 : 0;
  
  const todayRevenue = payments.filter(p => {
    const paymentDate = new Date(p.paidAt);
    const today = new Date();
    return paymentDate.toDateString() === today.toDateString();
  }).reduce((sum, payment) => sum + payment.amount, 0);

  // Calculate popular items
  const popularItems = calculatePopularItems(orders);
  
  // Calculate time distribution
  const timeDistribution = calculateTimeDistribution(orders);
  
  // Calculate revenue by category
  const revenueByCategory = calculateRevenueByCategory(orders, payments);

  // Calculate table performance
  const tablePerformance = calculateTablePerformance(tables, orders);

  function calculatePopularItems(orders) {
    const itemCount = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        if (itemCount[item.name]) {
          itemCount[item.name].quantity += item.quantity;
          itemCount[item.name].revenue += item.price * item.quantity;
        } else {
          itemCount[item.name] = {
            quantity: item.quantity,
            revenue: item.price * item.quantity,
            image: item.image || '🍽️'
          };
        }
      });
    });
    
    return Object.entries(itemCount)
      .sort(([,a], [,b]) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(([name, data], index) => ({
        rank: index + 1,
        name,
        ...data
      }));
  }

  function calculateTimeDistribution(orders) {
    const timeSlots = {
      'Breakfast\n(6AM-11AM)': 0,
      'Lunch\n(11AM-3PM)': 0,
      'Dinner\n(5PM-10PM)': 0,
      'Late Night\n(10PM-2AM)': 0
    };
    
    orders.forEach(order => {
      const orderTime = new Date(order.createdAt).getHours();
      if (orderTime >= 6 && orderTime < 11) timeSlots['Breakfast\n(6AM-11AM)']++;
      else if (orderTime >= 11 && orderTime < 15) timeSlots['Lunch\n(11AM-3PM)']++;
      else if (orderTime >= 17 && orderTime < 22) timeSlots['Dinner\n(5PM-10PM)']++;
      else timeSlots['Late Night\n(10PM-2AM)']++;
    });
    
    return Object.entries(timeSlots).map(([label, count]) => ({
      label: isMobile ? label.split('\n')[0] : label,
      count,
      percentage: orders.length > 0 ? ((count / orders.length) * 100).toFixed(1) : 0
    }));
  }

  function calculateRevenueByCategory(orders, payments) {
    const categories = {
      'Signature': 0,
      'Main Courses': 0,
      'Beverages': 0,
      'Desserts': 0,
      'Appetizers': 0
    };
    
    payments.forEach(payment => {
      const order = orders.find(o => o.id === payment.orderId);
      if (order) {
        order.items.forEach(item => {
          const category = getCategoryFromItem(item);
          categories[category] += item.price * item.quantity;
        });
      }
    });
    
    const total = Object.values(categories).reduce((sum, rev) => sum + rev, 0);
    
    return Object.entries(categories).map(([category, revenue]) => ({
      category: isMobile ? category.split(' ')[0] : category,
      revenue,
      percentage: total > 0 ? ((revenue / total) * 100).toFixed(1) : 0
    }));
  }

 function getCategoryFromItem(item) {
  if (!item || !item.name) return 'Appetizers';
  
  const itemName = item.name.toLowerCase();
  
  if (itemName.includes('nasi lemak') || itemName.includes('rendang') || itemName.includes('satay')) 
    return 'Signature';
  if (itemName.includes('rice') || itemName.includes('chicken') || itemName.includes('beef') || itemName.includes('curry')) 
    return 'Main Courses';
  if (itemName.includes('tea') || itemName.includes('coffee') || itemName.includes('coconut') || itemName.includes('milo')) 
    return 'Beverages';
  if (itemName.includes('mango') || itemName.includes('cendol') || itemName.includes('pisang')) 
    return 'Desserts';
  return 'Appetizers';
}

// Also update the calculatePopularItems function:
function calculatePopularItems(orders) {
  const itemCount = {};
  
  orders.forEach(order => {
    (order.items || []).forEach(item => {
      const itemName = getItemName(item); // Use the same safe function
      const itemPrice = getItemPrice(item);
      const itemQuantity = item.quantity || 1;
      
      if (itemCount[itemName]) {
        itemCount[itemName].quantity += itemQuantity;
        itemCount[itemName].revenue += itemPrice * itemQuantity;
      } else {
        itemCount[itemName] = {
          quantity: itemQuantity,
          revenue: itemPrice * itemQuantity,
          image: item.image || '🍽️'
        };
      }
    });
  });
  
  return Object.entries(itemCount)
    .sort(([,a], [,b]) => b.quantity - a.quantity)
    .slice(0, 5)
    .map(([name, data], index) => ({
      rank: index + 1,
      name,
      ...data
    }));
}

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Business Analytics</h2>
        <p className="page-subtitle">Deep insights into your restaurant performance</p>
      </div>

      {/* Key Metrics */}
      <div className="analytics-stats">
        <div className="analytics-stat-card">
          <div className="analytics-stat-icon">💰</div>
          <div className="analytics-stat-content">
            <div className="analytics-stat-value">RM {totalRevenue.toFixed(2)}</div>
            <div className="analytics-stat-label">Total Revenue</div>
            <div className="analytics-stat-trend trend-positive">
              ↑ RM {todayRevenue.toFixed(2)} today
            </div>
          </div>
        </div>
        
        <div className="analytics-stat-card">
          <div className="analytics-stat-icon">📦</div>
          <div className="analytics-stat-content">
            <div className="analytics-stat-value">{totalOrders}</div>
            <div className="analytics-stat-label">Total Orders</div>
            <div className="analytics-stat-trend trend-positive">
              ↑ {completedOrders} completed
            </div>
          </div>
        </div>
        
        <div className="analytics-stat-card">
          <div className="analytics-stat-icon">📊</div>
          <div className="analytics-stat-content">
            <div className="analytics-stat-value">RM {avgOrderValue.toFixed(2)}</div>
            <div className="analytics-stat-label">Average Order Value</div>
            <div className="analytics-stat-trend trend-neutral">
              • Consistent
            </div>
          </div>
        </div>
        
        <div className="analytics-stat-card">
          <div className="analytics-stat-icon">🪑</div>
          <div className="analytics-stat-content">
            <div className="analytics-stat-value">{tablePerformance.utilization}%</div>
            <div className="analytics-stat-label">Table Utilization</div>
            <div className="analytics-stat-trend trend-positive">
              ↑ {tablePerformance.occupiedTables}/{tablePerformance.totalTables} occupied
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="analytics-grid">
        {/* Revenue Overview */}
        <div className="analytics-card">
          <h3 className="analytics-title">Revenue Overview</h3>
          <div className="chart-container">
            <div className="chart-placeholder">
              <div className="chart-icon">📈</div>
              <div className="chart-text">Revenue Chart</div>
              <div className="chart-description">Daily revenue performance over time</div>
            </div>
          </div>
          <div className="revenue-breakdown">
            {revenueByCategory.map((item, index) => (
              <div key={index} className="revenue-item">
                <div className="revenue-category">{item.category}</div>
                <div className="revenue-amount">RM {item.revenue.toFixed(2)}</div>
                <div className="revenue-percentage">{item.percentage}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Items */}
        <div className="analytics-card">
          <h3 className="analytics-title">Popular Items</h3>
          <div className="top-items-list">
            {popularItems.map(item => (
              <div key={item.rank} className="top-item">
                <div className="item-rank">#{item.rank}</div>
                <div className="item-icon">{item.image}</div>
                <div className="item-details">
                  <div className="item-name">{item.name}</div>
                  <div className="item-stats">
                    <span className="item-quantity">{item.quantity} sold</span>
                    <span className="item-sales">RM {item.revenue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Table Performance */}
        <div className="analytics-card">
          <h3 className="analytics-title">Table Performance</h3>
          <div className="table-performance">
            <div className="performance-metric">
              <div className="metric-value">{tablePerformance.totalTables}</div>
              <div className="metric-label">Total Tables</div>
            </div>
            <div className="performance-metric">
              <div className="metric-value">{tablePerformance.availableTables}</div>
              <div className="metric-label">Available</div>
            </div>
            <div className="performance-metric">
              <div className="metric-value">{tablePerformance.occupiedTables}</div>
              <div className="metric-label">Occupied</div>
            </div>
            <div className="performance-metric">
              <div className="metric-value">{tablePerformance.avgTurnover}</div>
              <div className="metric-label">Avg Turnover</div>
            </div>
          </div>
          <div className="utilization-bar" style={{marginTop: '1rem'}}>
            <div className="utilization-label" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
              <span>Table Utilization</span>
              <span>{tablePerformance.utilization}%</span>
            </div>
            <div className="utilization-track" style={{
              height: '8px',
              backgroundColor: '#e2e8f0',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div className="utilization-progress" style={{
                width: `${tablePerformance.utilization}%`,
                height: '100%',
                backgroundColor: '#10b981',
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>
        </div>

        {/* Time Distribution */}
        <div className="analytics-card">
          <h3 className="analytics-title">Order Time Distribution</h3>
          <div className="time-distribution">
            {timeDistribution.map((slot, index) => (
              <div key={index} className="time-slot">
                <div className="time-label">{slot.label}</div>
                <div className="time-stats">
                  <span className="time-orders">{slot.count} orders</span>
                  <span className="time-percentage">{slot.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status */}
        <div className="analytics-card">
          <h3 className="analytics-title">Order Status</h3>
          <div className="order-status-grid">
            <div className="status-item status-pending">
              <div className="status-count">
                {orders.filter(o => o.status === 'pending').length}
              </div>
              <div className="status-label">Pending</div>
            </div>
            <div className="status-item status-preparing">
              <div className="status-count">
                {orders.filter(o => o.status === 'preparing').length}
              </div>
              <div className="status-label">Preparing</div>
            </div>
            <div className="status-item status-ready">
              <div className="status-count">
                {orders.filter(o => o.status === 'ready').length}
              </div>
              <div className="status-label">Ready</div>
            </div>
            <div className="status-item status-completed">
              <div className="status-count">
                {orders.filter(o => o.status === 'completed').length}
              </div>
              <div className="status-label">Completed</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="analytics-card">
          <h3 className="analytics-title">Recent Activity</h3>
          <div className="recent-activity">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="activity-item">
                <div className="activity-icon">
                  {order.status === 'completed' ? '✅' : 
                   order.status === 'preparing' ? '👨‍🍳' : 
                   order.status === 'ready' ? '🛎️' : '⏳'}
                </div>
                <div className="activity-details">
                  <div className="activity-title">
                    Order {order.id} - {order.table}
                  </div>
                  <div className="activity-description">
                    {order.items.length} items • RM {order.total.toFixed(2)}
                  </div>
                </div>
                <div className="activity-time">{order.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;