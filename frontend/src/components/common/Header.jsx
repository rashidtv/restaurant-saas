import React from 'react';
import './Header.css';

const Header = ({ notifications, isMobile, toggleSidebar }) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-section">
          <button 
            className="mobile-menu-btn"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <span className="menu-bar"></span>
            <span className="menu-bar"></span>
            <span className="menu-bar"></span>
          </button>
          <div className="logo">
            <span className="logo-icon">🍛</span>
            <div className="logo-text">
              <h1 className="logo-title">FlavorFlow</h1>
              <p className="logo-subtitle">Premium Restaurant Management</p>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="notification-bell">
            <span className="bell-icon">🔔</span>
            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="currency-display">
            <span className="currency-icon">💵</span>
            MYR
          </div>
          <div className="user-profile">
            <div className="user-avatar">RM</div>
            {!isMobile && (
              <div className="user-info">
                <div className="user-name">Restaurant Manager</div>
                <div className="user-role">Kuala Lumpur</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;