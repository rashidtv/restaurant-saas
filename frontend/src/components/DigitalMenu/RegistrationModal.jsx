import React, { useState } from 'react';
import { validatePhoneNumber } from '../../utils/validators';
import './styles.css';

export const RegistrationModal = ({ selectedTable, onRegister, onClose }) => {
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePhoneNumber(phone)) {
      alert('Please enter a valid phone number (at least 10 digits)');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRegister({ phone: phone.trim() });
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Welcome to Table {selectedTable}</h2>
          <p>Enter your phone number to earn loyalty points with every order</p>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="input-group">
            <label htmlFor="phone-input">Phone Number</label>
            <input
              id="phone-input"
              type="tel"
              placeholder="0123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="form-input"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="modal-actions">
            <button 
              type="submit" 
              className="btn-primary"
              disabled={!phone.trim() || isSubmitting}
            >
              {isSubmitting ? 'Registering...' : 'Start Earning Points'}
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
          </div>
        </div>
      </div>
    </div>
  );
};