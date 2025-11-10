import React, { useState, useEffect } from 'react';
import './PaymentSystem.css';

// Add this function at the top
const getItemName = (item) => {
  if (item.name && item.name !== 'Unknown Item' && item.name !== 'Menu Item') {
    return item.name;
  }
  if (item.menuItem && item.menuItem.name && item.menuItem.name !== 'Unknown Item') {
    return item.menuItem.name;
  }
  
  // Fallback to price-based reconstruction
  const price = item.price || (item.menuItem && item.menuItem.price);
  if (price) {
    const menuItems = {
      16.90: 'Nasi Lemak Royal',
      22.90: 'Rendang Tok', 
      18.90: 'Satay Set',
      14.90: 'Char Kway Teow',
      6.50: 'Teh Tarik',
      5.90: 'Iced Lemon Tea',
      8.90: 'Fresh Coconut',
      7.50: 'Iced Coffee',
      12.90: 'Mango Sticky Rice',
      7.90: 'Cendol Delight',
      9.90: 'Spring Rolls',
      6.90: 'Prawn Crackers'
    };
    return menuItems[price] || `Menu Item (RM ${price})`;
  }
  
  return 'Menu Item';
};

const PaymentSystem = ({ orders, payments, setPayments, isMobile, apiConnected }) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // **FIXED: Filter orders properly**
  const pendingOrders = orders.filter(order => 
    order.status === 'pending' || order.status === 'preparing' || order.status === 'ready'
  );
  
  const completedOrders = orders.filter(order => order.status === 'completed');

  const processPayment = (order, method) => {
    const paymentData = {
      id: `PAY-${Date.now()}`,
      orderId: order.id || order._id,
      amount: order.total || 0,
      method: method,
      status: 'completed',
      paidAt: new Date(),
      table: order.table || order.tableId
    };

    setPayments(prev => [...prev, paymentData]);
    
    // Update order status locally
    // Note: In a real app, you'd update the orders state here
    
    setShowPaymentModal(false);
    setSelectedOrder(null);
    
    alert(`Payment processed successfully for Order ${order.orderNumber || order.id}`);
  };

  const handlePayment = (order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const truncateText = (text, maxLength = 20) => {
    if (!text || typeof text !== 'string') return 'Menu Item';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Payment System</h2>
        <p className="page-subtitle">Process payments and manage transactions</p>
      </div>

      {/* Payment Tabs */}
      <div className="payment-tabs">
        <button 
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Payments ({pendingOrders.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Payment History ({payments.length})
        </button>
      </div>

      {/* Pending Payments */}
      {activeTab === 'pending' && (
        <div className="payments-section">
          <h3 className="section-title">Pending Payments</h3>
          
          {pendingOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💳</div>
              <h3>No Pending Payments</h3>
              <p>All orders have been paid or no orders created yet</p>
              <p style={{fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem'}}>
                Create orders in Table Management or Digital Menu first
              </p>
            </div>
          ) : (
            <div className="orders-grid">
              {pendingOrders.map(order => (
                <div key={order.id || order._id} className="payment-card">
                  <div className="payment-card-header">
                    <div>
                      <h4 className="order-id">{order.orderNumber || order.id}</h4>
                      <p className="order-table">Table {order.table || order.tableId || 'Unknown'}</p>
                      <p className="order-status-badge">Status: {order.status}</p>
                    </div>
                    <div className={`order-status ${order.status}`}>
                      {order.status}
                    </div>
                  </div>

                  <div className="order-items">
                    <h5>Order Items:</h5>
                    {(order.items || []).map((item, index) => {
                      const itemName = getItemName(item);
                      const itemPrice = item.price || (item.menuItem && item.menuItem.price) || 0;
                      const itemQuantity = item.quantity || 1;
                      
                      return (
                        <div key={index} className="order-item">
                          <span className="item-name">
                            {itemQuantity}x {truncateText(itemName, isMobile ? 15 : 25)}
                          </span>
                          <span className="item-price">
                            RM {(itemPrice * itemQuantity).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="payment-card-footer">
                    <div className="order-total">
                      Total: <strong>RM {(order.total || 0).toFixed(2)}</strong>
                    </div>
                    <button 
                      className="process-payment-btn"
                      onClick={() => handlePayment(order)}
                    >
                      Process Payment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payment History */}
      {activeTab === 'completed' && (
        <div className="payments-section">
          <h3 className="section-title">Payment History</h3>
          
          {payments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>No Payment History</h3>
              <p>Completed payments will appear here</p>
            </div>
          ) : (
            <div className="payments-table">
              <div className="table-header">
                <div>Payment ID</div>
                <div>Order ID</div>
                <div>Table</div>
                <div>Amount</div>
                <div>Method</div>
                <div>Time</div>
              </div>
              
              {payments.map(payment => (
                <div key={payment.id} className="table-row">
                  <div className="payment-id">{payment.id}</div>
                  <div className="order-id">{payment.orderId}</div>
                  <div className="table-number">Table {payment.table}</div>
                  <div className="amount">RM {payment.amount.toFixed(2)}</div>
                  <div className="method">{payment.method}</div>
                  <div className="time">
                    {new Date(payment.paidAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Process Payment</h2>
              <button 
                className="close-button"
                onClick={() => setShowPaymentModal(false)}
              >
                ×
              </button>
            </div>

            <div className="payment-details">
              <div className="order-summary">
                <h3>Order Summary</h3>
                <div className="summary-row">
                  <span>Order ID:</span>
                  <span>{selectedOrder.orderNumber || selectedOrder.id}</span>
                </div>
                <div className="summary-row">
                  <span>Table:</span>
                  <span>Table {selectedOrder.table || selectedOrder.tableId}</span>
                </div>
                
                <div className="order-items-summary">
                  <h4>Items:</h4>
                  {(selectedOrder.items || []).map((item, index) => {
                    const itemName = getItemName(item);
                    const itemPrice = item.price || (item.menuItem && item.menuItem.price) || 0;
                    const itemQuantity = item.quantity || 1;
                    
                    return (
                      <div key={index} className="summary-item">
                        <span>{itemQuantity}x {truncateText(itemName, 20)}</span>
                        <span>RM {(itemPrice * itemQuantity).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="total-row">
                  <span>Total Amount:</span>
                  <span className="total-amount">
                    RM {(selectedOrder.total || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="payment-methods">
                <h3>Select Payment Method</h3>
                <div className="method-options">
                  <label className={`method-option ${paymentMethod === 'cash' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="method-icon">💵</span>
                    <span className="method-name">Cash</span>
                  </label>

                  <label className={`method-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="method-icon">💳</span>
                    <span className="method-name">Card</span>
                  </label>

                  <label className={`method-option ${paymentMethod === 'qr' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="qr"
                      checked={paymentMethod === 'qr'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="method-icon">📱</span>
                    <span className="method-name">QR Code</span>
                  </label>
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
                  onClick={() => processPayment(selectedOrder, paymentMethod)}
                >
                  Confirm Payment - RM {(selectedOrder.total || 0).toFixed(2)}
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