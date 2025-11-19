import React, { useState, useEffect } from 'react';
import { validatePhoneNumber } from '../../utils/validators';
import './styles.css';

export const RegistrationModal = ({ selectedTable, onRegister, onClose }) => {
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  // Smooth entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

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
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    setPhone(value);
    if (error) setError('');
  };

  return (
    <div className={`modal-overlay registration-overlay ${isVisible ? 'visible' : ''}`} onClick={handleOverlayClick}>
      <div className="modal registration-modal">
        {/* Clean Header */}
        <div className="modal-header">
          <div className="modal-icon">📱</div>
          <h2>Welcome to Table {selectedTable}!</h2>
          <p>Enter your phone number to start ordering and earn points</p>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="error-message" role="alert">
              ⚠️ {error}
            </div>
          )}
          
          <div className="input-group">
            <label htmlFor="phone-input">Your Phone Number</label>
            <input
              id="phone-input"
              type="tel"
              placeholder="0123456789"
              value={phone}
              onChange={handlePhoneChange}
              className="form-input"
              required
              disabled={isSubmitting}
              autoFocus
              maxLength="10"
              pattern="[0-9]{10}"
              inputMode="numeric"
            />
            <div className="input-hint">10-digit number only</div>
          </div>

          <div className="modal-actions">
            <button 
              type="submit" 
              className="btn-primary"
              disabled={!phone.trim() || phone.length !== 10 || isSubmitting}
              aria-label={isSubmitting ? 'Setting up your account' : 'Continue to menu'}
            >
              {isSubmitting ? (
                <>
                  <span className="loading-spinner" aria-hidden="true"></span>
                  Setting up your account...
                </>
              ) : (
                'Continue to Menu'
              )}
            </button>
            <button 
              type="button" 
              onClick={handleClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Browse Menu First
            </button>
          </div>
        </form>

        {/* Simple Benefits */}
        <div className="benefits-section">
          <h3>Why Register?</h3>
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