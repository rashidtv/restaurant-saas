import React, { useState, useEffect } from 'react';
import { customerService } from '../../services/customerService';
// No CSS import needed - using existing styles.css

export const PointsDisplay = ({ points, phone, onClear }) => {
  const [currentPoints, setCurrentPoints] = useState(points);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Real-time points updates via WebSocket
  useEffect(() => {
    const refreshPoints = async () => {
      if (!phone) return;
      
      try {
        setIsRefreshing(true);
        const freshCustomer = await customerService.refreshCustomerData(phone);
        if (freshCustomer && freshCustomer.points !== undefined) {
          setCurrentPoints(freshCustomer.points);
          console.log('🔄 Points updated in real-time:', freshCustomer.points);
        }
      } catch (error) {
        console.error('Failed to refresh points:', error);
      } finally {
        setIsRefreshing(false);
      }
    };

    const handlePaymentProcessed = (payment) => {
      console.log('💰 Payment processed, refreshing points...');
      refreshPoints();
    };

    const handleOrderUpdated = (updatedOrder) => {
      if (updatedOrder.customerPhone === phone) {
        console.log('📦 Order updated for customer, refreshing points...');
        refreshPoints();
      }
    };

    if (window.socket) {
      window.socket.on('paymentProcessed', handlePaymentProcessed);
      window.socket.on('orderUpdated', handleOrderUpdated);
    }

    return () => {
      if (window.socket) {
        window.socket.off('paymentProcessed', handlePaymentProcessed);
        window.socket.off('orderUpdated', handleOrderUpdated);
      }
    };
  }, [phone]);

  useEffect(() => {
    setCurrentPoints(points);
  }, [points]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const freshCustomer = await customerService.refreshCustomerData(phone);
      if (freshCustomer) {
        setCurrentPoints(freshCustomer.points);
      }
    } catch (error) {
      console.error('Manual refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="points-display">
      <div className="points-header">
        <h3>Loyalty Points</h3>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="refresh-points-btn"
          aria-label="Refresh points"
        >
          {isRefreshing ? '⟳' : '↻'}
        </button>
      </div>
      
      <div className="points-content">
        <div className="points-value">
          <span className="points-number">{currentPoints}</span>
          <span className="points-label">points</span>
        </div>
        
        <div className="customer-info">
          <span className="customer-phone">{phone}</span>
          <button 
            onClick={onClear}
            className="change-number-btn"
            aria-label="Change phone number"
          >
            Change
          </button>
        </div>
      </div>
    </div>
  );
};