import React, { useState } from 'react';
import './PaymentSystem.css';

const PaymentSystem = ({ orders, payments, setPayments, isMobile }) => {
  const [activeTab, setActiveTab] = useState('pending');

  // Safe string function
  const truncateText = (text, maxLength = 20) => {
    if (!text || typeof text !== 'string') return 'Unknown Item';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Safe item name getter
  const getItemName = (item) => {
    if (item.menuItem && item.menuItem.name) return item.menuItem.name;
    if (item.name) return item.name;
    return 'Unknown Item';
  };

  // Get pending payments (orders that are completed but not paid)
  const pendingPayments = orders.filter(order => {
    const isCompleted = order.status === 'completed';
    const isAlreadyPaid = payments.find(p => p.orderId === (order.id || order._id));
    return isCompleted && !isAlreadyPaid;
  });

  const completedPayments = payments;

  const markAsPaid = (order) => {
    const orderId = order.id || order._id;
    
    // Check if already paid
    const alreadyPaid = payments.find(p => p.orderId === orderId);
    if (alreadyPaid) {
      alert('This order has already been paid!');
      return;
    }

    const newPayment = {
      id: `PAY-${Date.now().toString().slice(-4)}`,
      orderId: orderId,
      table: order.table || order.tableId,
      amount: order.total || 0,
      method: 'manual',
      status: 'completed',
      paidAt: new Date(),
      items: order.items || []
    };
    
    setPayments(prev => [newPayment, ...prev]);
  };

  const generateBill = (order) => {
    const orderId = order.id || order._id;
    const tableNumber = order.table || order.tableId;
    const orderTotal = order.total || 0;
    const subtotal = orderTotal / 1.14; // Remove tax to calculate
    
    const billContent = `
      FLAVORFLOW RESTAURANT
      =====================
      
      Order ID: ${orderId}
      Table: ${tableNumber}
      Date: ${new Date().toLocaleDateString()}
      Time: ${new Date().toLocaleTimeString()}
      
      ITEMS:
      ${(order.items || []).map(item => {
        const itemName = getItemName(item);
        const itemPrice = item.price || item.menuItem?.price || 0;
        const itemQuantity = item.quantity || 1;
        return `${itemQuantity}x ${itemName} - RM ${(itemPrice * itemQuantity).toFixed(2)}`;
      }).join('\n')}
      
      ---------------------
      Subtotal: RM ${subtotal.toFixed(2)}
      Service Tax (6%): RM ${(subtotal * 0.06).toFixed(2)}
      SST (8%): RM ${(subtotal * 0.08).toFixed(2)}
      ---------------------
      TOTAL: RM ${orderTotal.toFixed(2)}
      
      Thank you for dining with us!
    `;

    // Create and download bill as text file
    const blob = new Blob([billContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bill-${orderId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Payment System</h2>
        <p className="page-subtitle">Manage customer payments and billing</p>
      </div>

      <div className="payment-tabs">
        <button
          className={`payment-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Payments ({pendingPayments.length})
        </button>
        <button
          className={`payment-tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Payment History ({completedPayments.length})
        </button>
      </div>

      {activeTab === 'pending' && (
        <>
          {pendingPayments.length > 0 ? (
            <div className="payments-grid">
              {pendingPayments.map(order => {
                const orderId = order.id || order._id;
                const tableNumber = order.table || order.tableId;
                const orderTotal = order.total || 0;
                
                return (
                  <div key={orderId} className="payment-card">
                    <div className="payment-header">
                      <h3 className="payment-order-id">{orderId}</h3>
                      <span className="payment-table">{tableNumber}</span>
                    </div>
                    
                    <div className="payment-details">
                      <div className="payment-amount">
                        Total: <strong>RM {orderTotal.toFixed(2)}</strong>
                      </div>
                      <div className="payment-items">
                        {(order.items || []).map((item, index) => {
                          const itemName = getItemName(item);
                          const itemPrice = item.price || item.menuItem?.price || 0;
                          const itemQuantity = item.quantity || 1;
                          
                          return (
                            <div key={index} className="payment-item">
                              <span>
                                {itemQuantity}x {isMobile ? truncateText(itemName, 15) : itemName}
                              </span>
                              <span>RM {(itemPrice * itemQuantity).toFixed(2)}</span>
                            </div>
                          );
                        })}
                        <div className="payment-item" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', fontWeight: '600' }}>
                          <span>Total Amount:</span>
                          <span>RM {orderTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="payment-actions">
                      <button 
                        className="mark-paid-btn"
                        onClick={() => markAsPaid(order)}
                      >
                        💵 Mark as Paid
                      </button>
                      <button 
                        className="generate-bill-btn"
                        onClick={() => generateBill(order)}
                      >
                        🧾 Generate Bill
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">💰</div>
              <h3 className="empty-title">No Pending Payments</h3>
              <p className="empty-description">
                All completed orders have been paid. New payments will appear here as orders are completed.
              </p>
            </div>
          )}
        </>
      )}

      {activeTab === 'completed' && (
        <>
          {completedPayments.length > 0 ? (
            <div className="payments-table">
              <div className="table-header">
                <div>Payment ID</div>
                <div>Order ID</div>
                <div>Table</div>
                <div>Amount</div>
                <div>Method</div>
                <div>Time</div>
              </div>
              {completedPayments.map(payment => (
                <div key={payment.id} className="table-row">
                  <div className="payment-id">{payment.id}</div>
                  <div className="order-id">{payment.orderId}</div>
                  <div>
                    <span className="payment-table-small">{payment.table}</span>
                  </div>
                  <div className="payment-amount-cell">RM {payment.amount.toFixed(2)}</div>
                  <div>
                    <span className={`payment-method ${payment.method}`}>
                      {payment.method}
                    </span>
                  </div>
                  <div className="payment-time">
                    {formatTime(payment.paidAt)}
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                      {formatDate(payment.paidAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3 className="empty-title">No Payment History</h3>
              <p className="empty-description">
                Payment history will appear here once you start marking orders as paid.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PaymentSystem;