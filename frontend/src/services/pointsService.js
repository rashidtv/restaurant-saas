import { CONFIG } from '../constants/config';

class PointsService {
  calculatePointsFromOrder(orderTotal) {
    const basePoints = Math.floor(orderTotal) * CONFIG.POINTS.POINTS_PER_RINGGIT;
    const isWeekend = CONFIG.POINTS.WEEKEND_DAYS.includes(new Date().getDay());
    
    return isWeekend ? basePoints * CONFIG.POINTS.WEEKEND_MULTIPLIER : basePoints;
  }

  getTierInfo(points) {
    const tiers = Object.values(CONFIG.TIERS);
    const currentTier = tiers
      .sort((a, b) => b.threshold - a.threshold)
      .find(tier => points >= tier.threshold) || CONFIG.TIERS.MEMBER;

    const nextTier = tiers.find(tier => tier.threshold > points);
    const pointsToNextTier = nextTier ? nextTier.threshold - points : 0;

    return {
      current: currentTier,
      next: nextTier,
      pointsToNextTier,
      progress: nextTier ? 
        Math.min(100, ((points - currentTier.threshold) / (nextTier.threshold - currentTier.threshold)) * 100) : 
        100
    };
  }

  getNextRewardInfo(points) {
    const rewardThresholds = [100, 500, 1000];
    const nextThreshold = rewardThresholds.find(threshold => points < threshold);
    
    if (!nextThreshold) {
      return { pointsNeeded: 0, reward: 'Maximum tier reached' };
    }

    const pointsNeeded = nextThreshold - points;
    const rewards = {
      100: 'Free Drink',
      500: 'Free Main Course', 
      1000: 'Free Meal for Two'
    };

    return {
      pointsNeeded,
      reward: rewards[nextThreshold]
    };
  }
}

export const pointsService = new PointsService();