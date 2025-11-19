import React from 'react';
import { pointsService } from '../../services/pointsService';
import { formatPhoneNumber } from '../../utils/formatters';
import './styles.css';

export const PointsDisplay = ({ points, phone, onClear }) => {
  const tierInfo = pointsService.getTierInfo(points);
  const nextReward = pointsService.getNextRewardInfo(points);

  const handleChangeNumber = () => {
    if (points > 0) {
      const confirmChange = window.confirm(
        `You have ${points} points. Changing your number will reset your points. Continue?`
      );
      if (!confirmChange) return;
    }
    onClear();
  };

  return (
    <div className="points-display">
      <div className="points-card">
        <div className="points-header">
          <div className="customer-info">
            <div className="phone-number">{formatPhoneNumber(phone)}</div>
            <div className="points-total">{points.toLocaleString()} Points</div>
          </div>
          <div 
            className="tier-badge"
            style={{ 
              backgroundColor: tierInfo.current.color,
              color: 'white'
            }}
          >
            {tierInfo.current.icon} {tierInfo.current.name}
          </div>
        </div>
        
        {tierInfo.next && (
          <div className="progress-section">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${tierInfo.progress}%`,
                  backgroundColor: tierInfo.current.color
                }}
              ></div>
            </div>
            <div className="progress-text">
              {tierInfo.pointsToNextTier.toLocaleString()} points to {tierInfo.next.name}
            </div>
          </div>
        )}

        {nextReward.pointsNeeded > 0 ? (
          <div className="next-reward">
            <span className="reward-text">
              🎁 {nextReward.pointsNeeded.toLocaleString()} points until {nextReward.reward}
            </span>
          </div>
        ) : (
          <div className="next-reward">
            <span className="reward-text">
              🎉 You've unlocked all rewards!
            </span>
          </div>
        )}

        <button 
          onClick={handleChangeNumber}
          className="change-number-btn"
        >
          Change Number
        </button>
      </div>
    </div>
  );
};