import React, { useState } from 'react';
import './PaymentSystem.css';

const PaymentSystem = ({ orders, payments, setPayments, isMobile }) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // SIMPLE: Show ALL orders that aren't completed
  const pendingOrders = orders.filter(order => order.status !== 'completed');
  
  const processPayment = (order) => {
    // SIMPLE: Just mark as paid
    const paymentData = {
      id: `PAY-${Date.now()}`,
      orderId: order.id || order._id,
      amount: order.total || 0,
      method: 'cash',
      status: 'completed',
      paidAt: new Date(),
      table: order.table || order.tableId
    };

    setPayments(prev => [...prev, paymentData]);
    alert(`Payment processed for Order ${order.orderNumber || order.id}`);
    setSelectedOrder(null);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Payment System</h2>
        <p className="page-subtitle">Process customer payments</p>
      </div>

      {/* Simple Tabs */}
      <div className="payment-tabs">
        <button 
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Payments ({pendingOrders.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Payment History ({payments.length})
        </button>
      </div>

      {/* SIMPLE: Pending Payments */}
      {activeTab === 'pending' && (
        <div className="payments-section">
          <h3>Pending Payments</h3>
          
          {pendingOrders.length === 0 ? (
            <div className="empty-state">
              <p>No pending payments</p>
            </div>
          ) : (
            <div className="orders-list">
              {pendingOrders.map(order => (
                <div key={order.id} className="payment-card">
                  <div className="card-header">
                    <h4>Order: {order.orderNumber || order.id}</h4>
                    <span>Table: {order.table || order.tableId}</span>
                  </div>
                  
                  <div className="order-items">
                    {(order.items || []).map((item, index) => (
                      <div key={index} className="item-row">
                        <span>{item.quantity}x {item.name || item.menuItem?.name || 'Item'}</span>
                        <span>RM {((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="card-footer">
                    <strong>Total: RM {(order.total || 0).toFixed(2)}</strong>
                    <button 
                      className="pay-btn"
                      onClick={() => processPayment(order)}
                    >
                      Mark as Paid
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SIMPLE: Payment History */}
      {activeTab === 'history' && (
        <div className="payments-section">
          <h3>Payment History</h3>
          
          {payments.length === 0 ? (
            <div className="empty-state">
              <p>No payment history</p>
            </div>
          ) : (
            <div className="payments-list">
              {payments.map(payment => (
                <div key={payment.id} className="payment-item">
                  <div>Order: {payment.orderId}</div>
                  <div>Table: {payment.table}</div>
                  <div>Amount: RM {payment.amount.toFixed(2)}</div>
                  <div>Time: {new Date(payment.paidAt).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentSystem;