import React from 'react';
import './Sidebar.css';

const Sidebar = ({ currentPage, onNavigate, sidebarOpen, isMobile, orders, tables }) => {
  const navigationItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: '📊', 
      badge: null,
      description: 'Overview & metrics'
    },
    { 
      id: 'tables', 
      label: 'Table Management', 
      icon: '🪑', 
      badge: tables.filter(t => t.status === 'needs_cleaning').length || null,
      description: 'Manage tables & cleaning'
    },
    { 
      id: 'qr-generator', 
      label: 'QR Generator', 
      icon: '📱', 
      badge: null,
      description: 'Create table QR codes'
    },
    { 
      id: 'menu', 
      label: 'Menu',
      icon: '🍽️', 
      badge: null,
      description: 'Menu management'
    },
    { 
      id: 'kitchen', 
      label: 'Kitchen Display', 
      icon: '👨‍🍳', 
      badge: orders.filter(o => o.status === 'pending').length || null,
      description: 'Order preparation'
    },
    { 
      id: 'payments', 
      label: 'Payments', 
      icon: '💳', 
      badge: null,
      description: 'Payment processing'
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: '📈', 
      badge: 'New',
      description: 'Business insights'
    }
  ];

  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length;
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;
  const totalTables = tables.length;
  const needsCleaning = tables.filter(t => t.status === 'needs_cleaning').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => onNavigate(currentPage)} // Close sidebar on overlay click
        />
      )}
      
      <div className={`sidebar-modern ${sidebarOpen ? 'open' : ''} ${isMobile ? 'mobile' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header-modern">
          <div className="sidebar-logo">
            <div className="logo-icon">🍛</div>
            <div className="logo-text">
              <span className="logo-title">FlavorFlow</span>
              <span className="logo-subtitle">Restaurant POS</span>
            </div>
          </div>
        </div>

        {/* Navigation - Scrollable Area */}
        <div className="sidebar-scrollable">
          <nav className="sidebar-nav-modern">
            <div className="nav-section">
              <span className="nav-section-label">Navigation</span>
              {navigationItems.map(item => (
                <button
                  key={item.id}
                  className={`nav-button-modern ${currentPage === item.id ? 'active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                >
                  <div className="nav-button-content">
                    <span className="nav-icon-modern">{item.icon}</span>
                    <div className="nav-text-modern">
                      <span className="nav-label-modern">
                        {isMobile ? item.label.split(' ')[0] : item.label}
                      </span>
                      {!isMobile && (
                        <span className="nav-description">{item.description}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Badge */}
                  {item.badge && (
                    <span className={`nav-badge-modern ${typeof item.badge === 'string' ? 'badge-new' : ''}`}>
                      {item.badge}
                    </span>
                  )}
                  
                  {/* Active Indicator */}
                  {currentPage === item.id && (
                    <div className="active-indicator"></div>
                  )}
                </button>
              ))}
            </div>
          </nav>

          {/* Quick Stats - Hidden on mobile when too many items */}
          {!isMobile && (
            <div className="sidebar-stats-modern">
              <div className="stats-header">
                <span className="stats-title">Quick Stats</span>
                <div className="stats-indicator">
                  <div className="online-dot"></div>
                  <span>Live</span>
                </div>
              </div>
              
              <div className="stats-grid">
                <div className="stat-card-modern">
                  <div className="stat-icon-modern">📦</div>
                  <div className="stat-content-modern">
                    <div className="stat-value-modern">{activeOrders}</div>
                    <div className="stat-label-modern">Active Orders</div>
                  </div>
                </div>
                
                <div className="stat-card-modern">
                  <div className="stat-icon-modern">🪑</div>
                  <div className="stat-content-modern">
                    <div className="stat-value-modern">{occupiedTables}/{totalTables}</div>
                    <div className="stat-label-modern">Tables Occupied</div>
                  </div>
                </div>
                
                <div className="stat-card-modern">
                  <div className="stat-icon-modern">🧹</div>
                  <div className="stat-content-modern">
                    <div className="stat-value-modern">{needsCleaning}</div>
                    <div className="stat-label-modern">Need Cleaning</div>
                  </div>
                </div>
                
                <div className="stat-card-modern">
                  <div className="stat-icon-modern">⏱️</div>
                  <div className="stat-content-modern">
                    <div className="stat-value-modern">{pendingOrders}</div>
                    <div className="stat-label-modern">Pending</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sidebar-footer-modern">
          <div className="user-profile">
            <div className="user-avatar">👨‍💼</div>
            <div className="user-info">
              <span className="user-name">Restaurant Staff</span>
              <span className="user-role">Administrator</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;