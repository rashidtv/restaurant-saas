import React from 'react';
import './Sidebar.css';

const Sidebar = ({ currentPage, onNavigate, sidebarOpen, isMobile, orders, tables }) => {
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', badge: null },
    { id: 'tables', label: 'Table Management', icon: '🪑', badge: tables.filter(t => t.status === 'needs_cleaning').length },
    { id: 'qr-generator', label: 'QR Generator', icon: '📱', badge: null },
    { id: 'menu', label: 'Digital Menu', icon: '🍽️', badge: null },
    { id: 'kitchen', label: 'Kitchen Display', icon: '👨‍🍳', badge: orders.filter(o => o.status === 'pending').length },
    { id: 'payments', label: 'Payments', icon: '💳', badge: null },
    { id: 'analytics', label: 'Analytics', icon: '📈', badge: 'New' }
  ];

  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <nav className="sidebar-nav">
        {navigationItems.map(item => (
          <button
            key={item.id}
            className={`sidebar-button ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">
              {isMobile ? item.label.split(' ')[0] : item.label}
            </span>
            {item.badge && (
              <span className="sidebar-badge">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Quick Stats - Hidden on mobile */}
      {!isMobile && (
        <div className="sidebar-stats">
          <div className="stat-item">
            <div className="stat-value">{orders.length}</div>
            <div className="stat-label">Active Orders</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {tables.filter(t => t.status === 'occupied').length}/{tables.length}
            </div>
            <div className="stat-label">Tables Occupied</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;