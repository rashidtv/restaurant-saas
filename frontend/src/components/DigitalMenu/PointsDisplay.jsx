import React from 'react';

// 🎯 FIX: Use named export consistently
export const PointsDisplay = ({ points, phone, onClear }) => {
  const getTier = (points) => {
    if (points >= 1000) return { name: 'Platinum', color: '#10b981', icon: '💎' };
    if (points >= 500) return { name: 'Gold', color: '#f59e0b', icon: '🥇' };
    if (points >= 100) return { name: 'Silver', color: '#9ca3af', icon: '🥈' };
    return { name: 'Member', color: '#6b7280', icon: '👤' };
  };

  const tier = getTier(points);

  return (
    <div className="points-display">
      <div className="points-header">
        <div className="tier-info">
          <span className="tier-icon">{tier.icon}</span>
          <div className="tier-details">
            <h3>{tier.name} Member</h3>
            <p>{points} points</p>
          </div>
        </div>
        {phone && (
          <div className="phone-info">
            <span>📱 {phone}</span>
          </div>
        )}
      </div>
      
      <div className="points-progress">
        <div 
          className="progress-bar"
          style={{ 
            backgroundColor: tier.color,
            width: `${Math.min((points / 1000) * 100, 100)}%`
          }}
        ></div>
      </div>
      
      <div className="points-actions">
        <button 
          onClick={onClear}
          className="logout-btn"
          title="Logout"
        >
          🚪
        </button>
      </div>
    </div>
  );
};

// 🎯 FIX: Also export as default for backward compatibility
export default PointsDisplay;