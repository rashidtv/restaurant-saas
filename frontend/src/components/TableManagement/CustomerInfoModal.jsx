// frontend/src/components/TableManagement/CustomerInfoModal.jsx
import React, { useState } from 'react';

export const CustomerInfoModal = ({ isOpen, onClose, onConfirm, tableNumber }) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [skipCustomer, setSkipCustomer] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (skipCustomer) {
      onConfirm(null, null);
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    onConfirm(cleanPhone, name || `Customer-${cleanPhone.slice(-4)}`);
  };

  return (
    <div className="modal-overlay-modern">
      <div className="modal-content-modern" style={{ maxWidth: '400px' }}>
        <div className="modal-header-modern">
          <h2 className="modal-title-modern">Customer Info</h2>
          <button className="close-button-modern" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group-modern">
            <label className="form-label-modern">Table {tableNumber}</label>
            
            <div className="order-form-modern">
              {!skipCustomer ? (
                <>
                  <div className="form-group-modern">
                    <label className="form-label-modern">📱 Phone Number *</label>
                    <input
                      type="tel"
                      className="form-input-modern"
                      placeholder="e.g., 0123456789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                    <small className="form-hint-modern">
                      Customer earns loyalty points
                    </small>
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label-modern">👤 Customer Name</label>
                    <input
                      type="text"
                      className="form-input-modern"
                      placeholder="Enter customer name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <small className="form-hint-modern">
                      Optional - will auto-generate if left blank
                    </small>
                  </div>

                  <div className="form-actions-modern" style={{ marginTop: '16px' }}>
                    <button
                      type="button"
                      className="btn-modern btn-secondary-modern"
                      onClick={() => setSkipCustomer(true)}
                    >
                      Skip Customer
                    </button>
                    <button
                      type="submit"
                      className="btn-modern btn-primary-modern"
                    >
                      Create Order
                    </button>
                  </div>

                  <div style={{ marginTop: '12px', textAlign: 'center' }}>
                    <small>
                      <button
                        type="button"
                        className="text-link-modern"
                        onClick={() => setSkipCustomer(true)}
                        style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Continue without customer
                      </button>
                    </small>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ marginBottom: '16px', color: '#6B7280' }}>
                    ⚠️ Customer will not earn loyalty points
                  </p>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="btn-modern btn-secondary-modern"
                      onClick={() => setSkipCustomer(false)}
                    >
                      Enter Customer
                    </button>
                    <button
                      type="submit"
                      className="btn-modern btn-primary-modern"
                    >
                      Create Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};