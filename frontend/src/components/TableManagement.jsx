import React, { useState } from 'react';
import './TableManagement.css';

const TableManagement = ({ tables, setTables, orders, setOrders, onCreateOrder, onCompleteOrder, getTimeAgo, isMobile }) => {
  const [selectedTable, setSelectedTable] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);

  // Sample menu items for order creation
  const menuItems = [
    { id: 1, name: 'Nasi Lemak Special', price: 12.90, category: 'main' },
    { id: 2, name: 'Teh Tarik', price: 4.50, category: 'drinks' },
    { id: 3, name: 'Rendang Tok', price: 22.90, category: 'main' },
    { id: 4, name: 'Mango Sticky Rice', price: 12.90, category: 'desserts' },
    { id: 5, name: 'Satay Set (10 sticks)', price: 18.90, category: 'appetizer' },
    { id: 6, name: 'Iced Lemon Tea', price: 5.90, category: 'drinks' }
  ];

  const updateTableStatus = (tableId, newStatus) => {
    setTables(tables.map(table =>
      table.id === tableId 
        ? { 
            ...table, 
            status: newStatus,
            ...(newStatus === 'available' && { lastCleaned: new Date(), orderId: null })
          }
        : table
    ));
  };

  const getCleaningStatus = (lastCleaned) => {
    const hoursSinceCleaned = (new Date() - new Date(lastCleaned)) / (1000 * 60 * 60);
    
    if (hoursSinceCleaned < 1) return { status: 'fresh', color: '#10B981', text: 'Recently cleaned' };
    if (hoursSinceCleaned < 4) return { status: 'good', color: '#3B82F6', text: 'Clean' };
    if (hoursSinceCleaned < 8) return { status: 'needs_attention', color: '#F59E0B', text: 'Needs attention' };
    return { status: 'needs_cleaning', color: '#EF4444', text: 'Needs cleaning' };
  };

  const handleStartOrder = (table) => {
    setSelectedTable(table);
    setOrderItems(menuItems.map(item => ({ ...item, quantity: 0, selected: false })));
    setShowOrderModal(true);
  };

  const handleViewOrder = (table) => {
    const order = orders.find(o => o.id === table.orderId);
    if (order) {
      setSelectedOrder(order);
      setShowOrderDetails(true);
    }
  };

  const handleCompleteOrder = (order) => {
    onCompleteOrder(order.id, order.table);
    setShowOrderDetails(false);
  };

  const handleCreateOrder = () => {
    const selectedItems = orderItems.filter(item => item.quantity > 0);
    if (selectedItems.length === 0) {
      alert('Please select at least one item');
      return;
    }

    const newOrder = onCreateOrder(selectedTable.number, selectedItems, 'dine-in');
    setShowOrderModal(false);
    setSelectedTable(null);
    setOrderItems([]);
  };

  const updateOrderItemQuantity = (itemId, change) => {
    setOrderItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            quantity: Math.max(0, item.quantity + change),
            selected: Math.max(0, item.quantity + change) > 0
          }
        : item
    ));
  };

  const getOrderForTable = (table) => {
    return orders.find(order => order.id === table.orderId);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Table Management</h2>
        <p className="page-subtitle">Manage restaurant tables, cleaning schedules, and status</p>
      </div>

      <div className="tables-grid">
        {tables.map(table => {
          const cleaningStatus = getCleaningStatus(table.lastCleaned);
          const tableOrder = getOrderForTable(table);
          
          return (
            <div key={table.id} className="table-card">
              <div className="table-header">
                <h3 className="table-number">{table.number}</h3>
                <div className="table-status-badges">
                  <span className={`table-status status-${table.status}`}>
                    {table.status.replace('_', ' ')}
                  </span>
                  <span 
                    className="cleaning-status"
                    style={{
                      backgroundColor: `${cleaningStatus.color}20`,
                      color: cleaningStatus.color
                    }}
                  >
                    {cleaningStatus.text}
                  </span>
                </div>
              </div>
              
              <div className="table-info">
                <div className="table-capacity">
                  <span>👥</span>
                  Capacity: {table.capacity}
                </div>
                <div className="cleaning-time">
                  <span>🧹</span>
                  Last cleaned: {getTimeAgo(table.lastCleaned)}
                </div>
                {tableOrder && (
                  <div className="table-order">
                    Order: {tableOrder.id} • {tableOrder.status}
                  </div>
                )}
              </div>

              <div className="table-actions">
                {table.status === 'available' && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleStartOrder(table)}
                  >
                    Start Order
                  </button>
                )}
                {table.status === 'occupied' && (
                  <>
                    <button 
                      className="btn btn-warning"
                      onClick={() => handleViewOrder(table)}
                    >
                      View Order
                    </button>
                    <button 
                      className="btn btn-success"
                      onClick={() => onCompleteOrder(table.orderId, table.number)}
                    >
                      Complete Order
                    </button>
                  </>
                )}
                {table.status === 'needs_cleaning' && (
                  <button 
                    className="btn btn-success"
                    onClick={() => updateTableStatus(table.id, 'available')}
                  >
                    Mark Clean
                  </button>
                )}
                {(table.status === 'available' || table.status === 'needs_cleaning') && (
                  <button 
                    className="btn btn-warning"
                    onClick={() => updateTableStatus(table.id, 'available')}
                  >
                    Clean Now
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Creation Modal */}
      {showOrderModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Start Order - Table {selectedTable?.number}</h2>
              <button 
                className="close-button"
                onClick={() => setShowOrderModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="order-form">
              <div className="form-group">
                <label className="form-label">Order Type</label>
                <select className="form-select">
                  <option value="dine-in">Dine In</option>
                  <option value="takeaway">Takeaway</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select Menu Items</label>
                <div className="menu-items-grid">
                  {orderItems.map(item => (
                    <div key={item.id} className="menu-item-row">
                      <input
                        type="checkbox"
                        className="menu-item-checkbox"
                        checked={item.selected}
                        onChange={(e) => updateOrderItemQuantity(item.id, e.target.checked ? 1 : -item.quantity)}
                      />
                      <div className="menu-item-details">
                        <div className="menu-item-name">{item.name}</div>
                        <div className="menu-item-price">RM {item.price}</div>
                      </div>
                      <div className="quantity-controls">
                        <button 
                          className="quantity-btn"
                          onClick={() => updateOrderItemQuantity(item.id, -1)}
                          disabled={item.quantity === 0}
                        >
                          -
                        </button>
                        <span className="quantity-display">{item.quantity}</span>
                        <button 
                          className="quantity-btn"
                          onClick={() => updateOrderItemQuantity(item.id, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowOrderModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleCreateOrder}
                >
                  Create Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Order Details - {selectedOrder.id}</h2>
              <button 
                className="close-button"
                onClick={() => setShowOrderDetails(false)}
              >
                ×
              </button>
            </div>
            
            <div className="order-details">
              <div className="order-info">
                <div className="info-item">
                  <span className="info-label">Table</span>
                  <span className="info-value">{selectedOrder.table}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status</span>
                  <span className="info-value">{selectedOrder.status}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Order Type</span>
                  <span className="info-value">{selectedOrder.type}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Time</span>
                  <span className="info-value">{selectedOrder.time}</span>
                </div>
              </div>

              <div className="order-items">
                <h3 className="form-label">Order Items</h3>
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="item-details">
                      <div className="item-name">{item.quantity}x {item.name}</div>
                      <div className="item-price">RM {item.price} each</div>
                    </div>
                    <div className="item-total">
                      RM {(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-total">
                <span>Total Amount:</span>
                <span>RM {selectedOrder.total.toFixed(2)}</span>
              </div>

              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowOrderDetails(false)}
                >
                  Close
                </button>
                {selectedOrder.status !== 'completed' && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleCompleteOrder(selectedOrder)}
                  >
                    Complete Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagement;