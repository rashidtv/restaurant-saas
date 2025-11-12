import React from 'react';
import './Header.css';

const Header = ({ notifications, isMobile, toggleSidebar, apiConnected }) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="header-modern">
      <div className="header-content-modern">
        {/* Logo Section */}
        <div className="logo-section-modern">
          {isMobile && (
            <button 
              className="mobile-menu-btn-modern"
              onClick={toggleSidebar}
              aria-label="Toggle menu"
            >
              <span className="menu-bar-modern"></span>
              <span className="menu-bar-modern"></span>
              <span className="menu-bar-modern"></span>
            </button>
          )}
          
          <div className="logo-modern">
            <span className="logo-icon-modern">🍛</span>
            <div className="logo-text-modern">
              <h1 className="logo-title-modern">FlavorFlow</h1>
              <p className="logo-subtitle-modern">Premium Restaurant POS</p>
            </div>
          </div>
        </div>
        
        {/* Header Actions */}
        <div className="header-actions-modern">
          {/* Connection Status */}
          <div className={`connection-status-modern ${apiConnected ? 'connected' : 'disconnected'}`}>
            <div className="status-dot-modern"></div>
            <span>{apiConnected ? 'Live' : 'Offline'}</span>
          </div>
          
          {/* Notification Bell */}
          <div className="notification-bell-modern">
            <span className="bell-icon-modern">🔔</span>
            {unreadCount > 0 && (
              <span className="notification-badge-modern">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          
          {/* Currency Display */}
          <div className="currency-display-modern">
            <span className="currency-icon-modern">💵</span>
            <span>MYR</span>
          </div>
          
          {/* User Profile */}
          <div className="user-profile-modern">
            <div className="user-avatar-modern">RM</div>
            {!isMobile && (
              <div className="user-info-modern">
                <div className="user-name-modern">Restaurant Manager</div>
                <div className="user-role-modern">Kuala Lumpur</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;