import React, { useState, useEffect } from 'react';
import './PaymentSystem.css';

const PaymentSystem = ({ orders, payments, setPayments, isMobile, apiConnected }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');

// REPLACE the getOrdersForPayment function:
const getOrdersForPayment = () => {
  const payableOrders = orders.filter(order => {
    // Orders are ready for payment when completed OR ready
    const isPayable = order.status === 'completed' || order.status === 'ready';
    const isNotPaid = order.paymentStatus !== 'paid';
    
    console.log(`💰 Payment Check - ${order.orderNumber}: status=${order.status}, paymentStatus=${order.paymentStatus}, payable=${isPayable && isNotPaid}`);
    
    return isPayable && isNotPaid;
  });

  console.log(`💵 Found ${payableOrders.length} orders for payment`);
  return payableOrders;
};

  // UPDATE the getPaidOrders function:
const getPaidOrders = () => {
  const paid = orders.filter(order => order.paymentStatus === 'paid');
  console.log(`💳 Paid orders: ${paid.length}`);
  return paid;
};

  const handleProcessPayment = async (order, method) => {
    try {
      console.log(`💳 Processing payment for order: ${order.orderNumber}`, order);
      
      const paymentData = {
        orderId: order.orderNumber,
        amount: order.total,
        method: method
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
        
        if (!response.ok) {
          throw new Error(`Payment failed: ${response.status}`);
        }
        
        paymentResult = await response.json();
      } else {
        // Fallback: Create payment locally
        paymentResult = {
          _id: Date.now().toString(),
          orderId: order.orderNumber,
          amount: order.total,
          method: method,
          status: 'completed',
          paidAt: new Date()
        };
        
        setPayments(prev => [...prev, paymentResult]);
        
        // Update order payment status locally
        const updatedOrders = orders.map(o => 
          o.orderNumber === order.orderNumber 
            ? { ...o, paymentStatus: 'paid', paymentMethod: method }
            : o
        );
        // You'll need to pass setOrders to this component or use a callback
      }
      
      console.log('✅ Payment processed:', paymentResult);
      setShowPaymentModal(false);
      setSelectedOrder(null);
      
      alert(`Payment of RM ${order.total.toFixed(2)} processed successfully!`);
      
    } catch (error) {
      console.error('❌ Payment error:', error);
      alert(`Payment failed: ${error.message}`);
    }
  };

  const pendingPaymentOrders = getOrdersForPayment();
  const completedPayments = getPaidOrders();

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Payment System</h2>
        <p className="page-subtitle">Process payments and manage transactions</p>
      </div>

      {!apiConnected && (
        <div className="api-warning">
          ⚠️ Running in offline mode. Payments will not be saved.
        </div>
      )}

      <div className="payment-sections">
        {/* Pending Payments */}
        <div className="payment-section">
          <h3 className="section-title">
            Pending Payments 
            {pendingPaymentOrders.length > 0 && (
              <span className="badge">{pendingPaymentOrders.length}</span>
            )}
          </h3>
          
          {pendingPaymentOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💵</div>
              <p>No pending payments</p>
              <small>Orders will appear here when they are ready or completed</small>
            </div>
          ) : (
            <div className="orders-grid">
              {pendingPaymentOrders.map(order => (
                <div key={order._id || order.id} className="payment-order-card">
                  <div className="order-header">
                    <h4>{order.orderNumber}</h4>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="order-details">
                    <div className="detail-item">
                      <span>Table:</span>
                      <span>{order.tableId || order.table || 'Takeaway'}</span>
                    </div>
                    <div className="detail-item">
                      <span>Type:</span>
                      <span>{order.orderType || 'dine-in'}</span>
                    </div>
                    <div className="detail-item">
                      <span>Items:</span>
                      <span>{order.items?.length || 0} items</span>
                    </div>
                    <div className="detail-item">
                      <span>Total:</span>
                      <span className="total-amount">RM {order.total?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>

                  <div className="order-items-preview">
                    {order.items?.slice(0, 3).map((item, index) => (
                      <div key={index} className="order-item-preview">
                        <span className="item-quantity">{item.quantity}x</span>
                        <span className="item-name">
                          {item.menuItem?.name || item.name || 'Menu Item'}
                        </span>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <div className="more-items">+{order.items.length - 3} more items</div>
                    )}
                  </div>

                  <div className="payment-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowPaymentModal(true);
                      }}
                    >
                      Process Payment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Payments */}
        <div className="payment-section">
          <h3 className="section-title">
            Payment History 
            <span className="badge">{completedPayments.length}</span>
          </h3>
          
          {completedPayments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>No payment history</p>
              <small>Completed payments will appear here</small>
            </div>
          ) : (
            <div className="payments-list">
              {completedPayments.map(order => (
                <div key={order._id || order.id} className="completed-payment-card">
                  <div className="payment-header">
                    <h4>{order.orderNumber}</h4>
                    <span className="paid-badge">Paid</span>
                  </div>
                  
                  <div className="payment-details">
                    <div className="detail-item">
                      <span>Amount:</span>
                      <span className="amount">RM {order.total?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="detail-item">
                      <span>Method:</span>
                      <span>{order.paymentMethod || 'Cash'}</span>
                    </div>
                    <div className="detail-item">
                      <span>Table:</span>
                      <span>{order.tableId || order.table || 'Takeaway'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Process Payment - {selectedOrder.orderNumber}</h3>
              <button 
                className="close-button"
                onClick={() => setShowPaymentModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="payment-modal-body">
              <div className="payment-summary">
                <div className="summary-item">
                  <span>Order Total:</span>
                  <span className="total-amount">RM {selectedOrder.total?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="summary-item">
                  <span>Table:</span>
                  <span>{selectedOrder.tableId || selectedOrder.table || 'Takeaway'}</span>
                </div>
                <div className="summary-item">
                  <span>Items:</span>
                  <span>{selectedOrder.items?.length || 0}</span>
                </div>
              </div>

              <div className="payment-methods">
                <h4>Select Payment Method</h4>
                <div className="method-options">
                  {['cash', 'card', 'qrpay', 'ewallet'].map(method => (
                    <button
                      key={method}
                      className={`method-btn ${paymentMethod === method ? 'active' : ''}`}
                      onClick={() => setPaymentMethod(method)}
                    >
                      {method === 'cash' && '💵 Cash'}
                      {method === 'card' && '💳 Card'}
                      {method === 'qrpay' && '📱 QR Pay'}
                      {method === 'ewallet' && '📲 E-Wallet'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleProcessPayment(selectedOrder, paymentMethod)}
                >
                  Confirm Payment - RM {selectedOrder.total?.toFixed(2) || '0.00'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSystem;