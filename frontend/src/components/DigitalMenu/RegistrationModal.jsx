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
      setError('Please enter a valid phone number (at least 10 digits)');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRegister({ phone: phone.trim() });
      // Success - modal will close automatically via parent
    } catch (error) {
      console.error('Registration failed:', error);
      setError(error.message || 'Registration failed. Please try again.');
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
        <div className="modal-header">
          <h2>Welcome to Table {selectedTable}</h2>
          <p>Enter your phone number to earn loyalty points with every order</p>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}
          
          <div className="input-group">
            <label htmlFor="phone-input">Phone Number</label>
            <input
              id="phone-input"
              type="tel"
              placeholder="0123456789"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError(''); // Clear error when user types
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
                  Registering...
                </>
              ) : (
                'Start Earning Points'
              )}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Skip for Now
            </button>
          </div>
        </form>

        <div className="benefits-section">
          <h4>Loyalty Benefits</h4>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">🎯</div>
              <div className="benefit-text">1 point per RM 1 spent</div>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">⚡</div>
              <div className="benefit-text">Double points on weekends</div>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🎁</div>
              <div className="benefit-text">Redeem points for free items</div>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">📱</div>
              <div className="benefit-text">Track orders across devices</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};