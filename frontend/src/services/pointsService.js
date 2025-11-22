import { CONFIG } from '../constants/config';

class PointsService {
  calculatePointsFromOrder(orderTotal) {
    if (!orderTotal || orderTotal <= 0) return 0;
    
    const basePoints = Math.floor(orderTotal) * CONFIG.POINTS.POINTS_PER_RINGGIT;
    const isWeekend = CONFIG.POINTS.WEEKEND_DAYS.includes(new Date().getDay());
    
    const finalPoints = isWeekend ? basePoints * CONFIG.POINTS.WEEKEND_MULTIPLIER : basePoints;
    
    console.log(`🎯 Points calculation: RM${orderTotal} = ${finalPoints} points (weekend: ${isWeekend})`);
    return finalPoints;
  }

  async addPoints(phone, pointsToAdd, orderTotal = 0) {
    try {
      // 🛠️ FIX: Validate customer ID before API call
      if (!phone || phone === 'undefined' || phone === 'null') {
        console.error('❌ Invalid customer phone for points addition:', phone);
        throw new Error('Customer registration required before adding points');
      }

      // Additional validation
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        throw new Error('Valid phone number required for points');
      }

      console.log('➕ Adding points to customer:', cleanPhone);
      
      const response = await fetch(`${this.baseURL}/api/customers/${cleanPhone}/points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points: pointsToAdd,
          orderTotal: orderTotal
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Points update failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to add points:', error);
      throw new Error(error.message || 'Points update failed. Please contact staff.');
    }
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