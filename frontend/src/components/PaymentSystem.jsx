import React, { useState, useEffect } from 'react';
import './PaymentSystem.css';

const PaymentSystem = ({ orders, payments, setPayments, isMobile, apiConnected }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [activeTab, setActiveTab] = useState('pending');

  // FIXED: Get ALL unpaid orders regardless of status
  const getPendingPayments = () => {
    console.log('🔍 PaymentSystem - Checking orders:', orders.length);
    
    const pending = orders.filter(order => {
      if (!order) return false;
      
      // Show any order that is not paid
      const isNotPaid = order.paymentStatus !== 'paid' && order.paymentStatus !== 'completed';
      const hasItems = order.items && order.items.length > 0;
      const hasTotal = order.total > 0;
      
      console.log(`💰 Order ${order.orderNumber || order.id}:`, {
        status: order.status,
        paymentStatus: order.paymentStatus,
        isNotPaid,
        hasItems,
        hasTotal
      });
      
      return isNotPaid && hasItems && hasTotal;
    });

    console.log(`💵 Found ${pending.length} unpaid orders:`, 
      pending.map(p => `${p.orderNumber || p.id} (${p.status})`));
    
    return pending;
  };

  const getCompletedPayments = () => {
    const completed = orders.filter(order => 
      order && (order.paymentStatus === 'paid' || order.paymentStatus === 'completed')
    );
    console.log(`📊 Found ${completed.length} completed payments`);
    return completed;
  };

  const processPayment = async (order, method) => {
    try {
      console.log('💳 Processing payment for:', order.orderNumber || order.id);
      
      const paymentData = {
        orderId: order.orderNumber || order.id,
        amount: order.total,
        method: method,
        tableId: order.tableId || order.table
      };

      let paymentResult;

      if (apiConnected) {
        const response = await fetch('https://restaurant-saas-backend-hbdz.onrender.com/api/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentData),
        });

        if (!response.ok) throw new Error(`Payment failed: ${response.status}`);
        paymentResult = await response.json();
        
        // Update local state
        setPayments(prev => [...prev, paymentResult]);
      } else {
        // Offline fallback
        paymentResult = {
          _id: Date.now().toString(),
          orderId: order.orderNumber || order.id,
          amount: order.total,
          method: method,
          status: 'completed',
          paidAt: new Date()
        };
        setPayments(prev => [...prev, paymentResult]);
      }

      console.log('✅ Payment successful:', paymentResult);
      setShowPaymentModal(false);
      setSelectedOrder(null);
      
      alert(`Payment of RM ${order.total.toFixed(2)} processed successfully!`);

    } catch (error) {
      console.error('❌ Payment error:', error);
      alert(`Payment failed: ${error.message}`);
    }
  };

  const pendingPayments = getPendingPayments();
  const completedPayments = getCompletedPayments();

  return (
    <div className="payment-system">
      <div className="payment-header">
        <div className="header-content">
          <h1 className="page-title">Payment System</h1>
          <p className="page-subtitle">Manage payments and transactions</p>
        </div>
        <div className="payment-stats">
          <div className="stat-card">
            <div className="stat-value">{pendingPayments.length}</div>
            <div className="stat-label">Pending Payments</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{completedPayments.length}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </div>

      {!apiConnected && (
        <div className="offline-warning">
          <span>⚠️</span>
          <span>Offline Mode - Payments will not be saved to server</span>
        </div>
      )}

      <div className="payment-tabs">
        <button 
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Payments
          {pendingPayments.length > 0 && (
            <span className="tab-badge">{pendingPayments.length}</span>
          )}
        </button>
        <button 
          className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Payment History
          {completedPayments.length > 0 && (
            <span className="tab-badge">{completedPayments.length}</span>
          )}
        </button>
      </div>

      <div className="payment-content">
        {activeTab === 'pending' && (
          <div className="pending-payments">
            {pendingPayments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💵</div>
                <h3>No Pending Payments</h3>
                <p>All orders have been paid or no orders exist</p>
              </div>
            ) : (
              <div className="orders-grid">
                {pendingPayments.map(order => (
                  <div key={order._id || order.id} className="payment-order-card">
                    <div className="order-header">
                      <div className="order-info">
                        <h3 className="order-number">{order.orderNumber || order.id}</h3>
                        <div className="order-meta">
                          <span className="table-badge">Table {order.tableId || order.table || 'Takeaway'}</span>
                          <span className={`status-badge status-${order.status}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                      <div className="order-amount">
                        RM {order.total?.toFixed(2) || '0.00'}
                      </div>
                    </div>

                    <div className="order-items">
                      {order.items?.slice(0, 3).map((item, index) => {
                        const itemName = item.menuItem?.name || item.name || 'Menu Item';
                        const itemPrice = item.price || (item.menuItem?.price) || 0;
                        const itemQuantity = item.quantity || 1;
                        
                        return (
                          <div key={index} className="order-item">
                            <span className="item-quantity">{itemQuantity}x</span>
                            <span className="item-name">
                              {itemName}
                            </span>
                            <span className="item-price">
                              RM {(itemPrice * itemQuantity).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                      {order.items?.length > 3 && (
                        <div className="more-items">
                          +{order.items.length - 3} more items
                        </div>
                      )}
                    </div>

                    <div className="payment-actions">
                      <button 
                        className="pay-button primary"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowPaymentModal(true);
                        }}
                      >
                        Process Payment
                      </button>
                      <div className="order-status-info">
                        Status: <strong>{order.status}</strong> | 
                        Payment: <strong>{order.paymentStatus || 'pending'}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="completed-payments">
            {completedPayments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>No Payment History</h3>
                <p>Completed payments will appear here</p>
              </div>
            ) : (
              <div className="payments-list">
                {completedPayments.map(order => (
                  <div key={order._id || order.id} className="completed-payment-card">
                    <div className="payment-header">
                      <div className="payment-info">
                        <h3 className="order-number">{order.orderNumber || order.id}</h3>
                        <div className="payment-meta">
                          <span className="table-badge">Table {order.tableId || order.table || 'Takeaway'}</span>
                          <span className="method-badge">{order.paymentMethod || 'Cash'}</span>
                        </div>
                      </div>
                      <div className="payment-amount">
                        RM {order.total?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <div className="payment-details">
                      <div className="detail-item">
                        <span>Paid At:</span>
                        <span>{new Date(order.paidAt || order.completedAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="status-badge paid">
                        Paid
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="payment-modal">
            <div className="modal-header">
              <h2>Process Payment</h2>
              <button 
                className="close-button"
                onClick={() => setShowPaymentModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="payment-summary">
                <div className="summary-row">
                  <span>Order Number:</span>
                  <strong>{selectedOrder.orderNumber || selectedOrder.id}</strong>
                </div>
                <div className="summary-row">
                  <span>Table:</span>
                  <span>{selectedOrder.tableId || selectedOrder.table || 'Takeaway'}</span>
                </div>
                <div className="summary-row">
                  <span>Order Status:</span>
                  <span className={`status-${selectedOrder.status}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="summary-row">
                  <span>Total Amount:</span>
                  <strong className="total-amount">
                    RM {selectedOrder.total?.toFixed(2) || '0.00'}
                  </strong>
                </div>
              </div>

              <div className="payment-methods">
                <h3>Select Payment Method</h3>
                <div className="methods-grid">
                  {[
                    { id: 'cash', name: 'Cash', icon: '💵' },
                    { id: 'card', name: 'Credit Card', icon: '💳' },
                    { id: 'qrpay', name: 'QR Pay', icon: '📱' },
                    { id: 'ewallet', name: 'E-Wallet', icon: '📲' }
                  ].map(method => (
                    <button
                      key={method.id}
                      className={`method-option ${paymentMethod === method.id ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <span className="method-icon">{method.icon}</span>
                      <span className="method-name">{method.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="button secondary"
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </button>
              <button 
                className="button primary"
                onClick={() => processPayment(selectedOrder, paymentMethod)}
              >
                Confirm Payment - RM {selectedOrder.total?.toFixed(2) || '0.00'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSystem;