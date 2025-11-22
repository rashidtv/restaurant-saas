import React, { useState } from 'react';
import { validatePhoneNumber, validateName } from '../../utils/validators';

// 🎯 FIX: Use named export consistently
export const RegistrationModal = ({ selectedTable, onRegister, onClose }) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const phoneString = String(phone).trim();
    const nameString = String(name).trim();

    if (!validatePhoneNumber(phoneString)) {
      setError('Please enter a valid phone number (at least 10 digits)');
      return;
    }

    if (!validateName(nameString)) {
      setError('Please enter your name (at least 2 characters)');
      return;
    }

    setIsLoading(true);

    try {
      console.log('📝 Registration submitted:', { phone: phoneString, name: nameString });
      await onRegister(phoneString, nameString);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    const cleanValue = value.replace(/[^\d\s\-\+\(\)]/g, '');
    setPhone(cleanValue);
    setError('');
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
    setError('');
  };

  return (
    <div className="registration-modal-overlay">
      <div className="registration-modal">
        <div className="modal-header">
          <h2>Join FlavorFlow Rewards</h2>
          <p>Register to earn points and track your orders</p>
          {selectedTable && (
            <div className="table-badge">Table {selectedTable}</div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label htmlFor="phone">Phone Number *</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="Enter your phone number"
              required
              disabled={isLoading}
            />
            <small>We'll send your order updates via SMS</small>
          </div>

          <div className="form-group">
            <label htmlFor="name">Your Name *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Enter your name"
              required
              disabled={isLoading}
            />
            <small>How should we address you?</small>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isLoading}
            >
              Maybe Later
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Registering...' : 'Join & Start Ordering'}
            </button>
          </div>

          <div className="benefits">
            <h4>Benefits:</h4>
            <ul>
              <li>✅ Earn loyalty points on every order</li>
              <li>✅ Track your order status in real-time</li>
              <li>✅ Faster checkout for future orders</li>
              <li>✅ Exclusive member-only offers</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
};

// 🎯 FIX: Also export as default for backward compatibility
export default RegistrationModal;