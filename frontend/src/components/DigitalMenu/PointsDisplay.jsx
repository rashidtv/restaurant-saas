import React from 'react';

export const PointsDisplay = ({ points, phone, name, onClear }) => {
  const getTier = (points) => {
    if (points >= 1000) return { name: 'Platinum', color: '#10b981', icon: '💎' };
    if (points >= 500) return { name: 'Gold', color: '#f59e0b', icon: '🥇' };
    if (points >= 100) return { name: 'Silver', color: '#9ca3af', icon: '🥈' };
    return { name: 'Member', color: '#6b7280', icon: '👤' };
  };

  const tier = getTier(points);

  return (
    <div className="points-display">
      <div className="points-card">
        <div className="points-header">
          <div className="customer-info">
            {/* 🎯 NAME DISPLAY */}
            {name && (
              <div className="customer-name">
                <span className="welcome-text">Welcome, </span>
                <span className="name-text">{name}!</span>
              </div>
            )}
            <div className="customer-phone">📱 {phone}</div>
          </div>
          <div 
            className="tier-badge" 
            style={{ 
              backgroundColor: tier.color,
              color: 'white'
            }}
          >
            <span className="tier-icon">{tier.icon}</span>
            <span className="tier-name">{tier.name} Member</span>
          </div>
        </div>
        
        <div className="points-content">
          <div className="points-value">
            <span className="points-number">{points}</span>
            <span className="points-label">reward points</span>
          </div>
          
          <div className="points-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${Math.min((points / 1000) * 100, 100)}%`,
                  backgroundColor: tier.color
                }}
              ></div>
            </div>
            <div className="progress-text">
              {points < 1000 ? `${1000 - points} points to Platinum` : 'Max Tier Reached!'}
            </div>
          </div>
        </div>
        
        <div className="points-actions">
          <button 
            onClick={onClear}
            className="logout-btn"
            title="Logout"
          >
            <span className="logout-icon">🚪</span>
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PointsDisplay;