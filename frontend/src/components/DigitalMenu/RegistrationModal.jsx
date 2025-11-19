import React, { useState } from 'react';
import { validatePhoneNumber } from '../../utils/validators';
import './styles.css';

export const RegistrationModal = ({ selectedTable, onRegister, onClose }) => {
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validatePhoneNumber(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRegister({ phone: phone.trim() });
    } catch (error) {
      console.error('Registration failed:', error);
      setError(error.message || 'Unable to register. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        {/* Clean Header */}
        <div className="modal-header">
          <div className="modal-icon">📱</div>
          <h2>Welcome!</h2>
          <p>Enter your phone number to start ordering</p>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}
          
          <div className="input-group">
            <label htmlFor="phone-input">Your Phone Number</label>
            <input
              id="phone-input"
              type="tel"
              placeholder="012 345 6789"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError('');
              }}
              className="form-input"
              required
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="modal-actions">
            <button 
              type="submit" 
              className="btn-primary"
              disabled={!phone.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="loading-spinner"></span>
                  Setting up your account...
                </>
              ) : (
                'Continue to Menu'
              )}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Browse Menu First
            </button>
          </div>
        </form>

        {/* Simple Benefits */}
        <div className="benefits-section">
          <div className="benefit-item">
            <span className="benefit-icon">⚡</span>
            <span>Earn points with every order</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">📱</span>
            <span>Track your order history</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🎁</span>
            <span>Get exclusive rewards</span>
          </div>
        </div>
      </div>
    </div>
  );
};