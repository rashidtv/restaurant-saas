import React, { useState, useEffect } from 'react';
import './TableManagement.css';

const TableManagement = ({ tables, setTables, orders, setOrders, onCreateOrder, onCompleteOrder, getTimeAgo, isMobile, menu }) => {
  const [selectedTable, setSelectedTable] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);

  // Use the menu from DigitalMenu - FIXED with proper fallback
  const menuItems = menu && menu.length > 0 ? menu : [
    { id: '1', _id: '1', name: 'Nasi Lemak Royal', price: 16.90, category: 'signature' },
    { id: '2', _id: '2', name: 'Teh Tarik', price: 6.50, category: 'drinks' },
    { id: '3', _id: '3', name: 'Rendang Tok', price: 22.90, category: 'signature' },
    { id: '4', _id: '4', name: 'Mango Sticky Rice', price: 12.90, category: 'desserts' },
    { id: '5', _id: '5', name: 'Satay Set', price: 18.90, category: 'signature' },
    { id: '6', _id: '6', name: 'Iced Lemon Tea', price: 5.90, category: 'drinks' },
    { id: '7', _id: '7', name: 'Chicken Curry', price: 14.90, category: 'main' },
    { id: '8', _id: '8', name: 'Fried Rice Special', price: 12.90, category: 'main' },
    { id: '9', _id: '9', name: 'Fresh Coconut', price: 8.90, category: 'drinks' },
    { id: '10', _id: '10', name: 'Cendol Delight', price: 7.90, category: 'desserts' },
    { id: '11', _id: '11', name: 'Char Kway Teow', price: 14.90, category: 'signature' },
    { id: '12', _id: '12', name: 'Beef Rendang', price: 19.90, category: 'main' },
    { id: '13', _id: '13', name: 'Iced Coffee', price: 7.50, category: 'drinks' },
    { id: '14', _id: '14', name: 'Pisang Goreng', price: 8.90, category: 'desserts' },
    { id: '15', _id: '15', name: 'Spring Rolls', price: 9.90, category: 'appetizers' },
    { id: '16', _id: '16', name: 'Prawn Crackers', price: 6.90, category: 'appetizers' }
  ];

  const updateTableStatus = (tableId, newStatus) => {
    setTables(tables.map(table =>
      table._id === tableId || table.id === tableId
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
    // Initialize all menu items with quantity 0
    const initializedItems = menuItems.map(item => ({ 
      ...item, 
      quantity: 0, 
      selected: false 
    }));
    setOrderItems(initializedItems);
    setShowOrderModal(true);
  };

  const handleViewOrder = (table) => {
    const order = orders.find(o => 
      (o.id === table.orderId || o._id === table.orderId) && 
      (o.table === table.number || o.tableId === table.number)
    );
    
    if (order) {
      console.log('TableManagement - Viewing order:', order);
      setSelectedOrder(order);
      setShowOrderDetails(true);
    }
  };

  const handleCompleteOrder = (order) => {
    // Complete only this specific order
    onCompleteOrder(order.id || order._id, order.table || order.tableId);
    
    // Update ONLY the table associated with this order
    setTables(prevTables => prevTables.map(table => 
      table.orderId === (order.id || order._id) 
        ? { ...table, status: 'needs_cleaning', orderId: null }
        : table
    ));
    
    setShowOrderDetails(false);
  };

  const handleCreateOrder = () => {
    const selectedItems = orderItems.filter(item => item.quantity > 0);
    if (selectedItems.length === 0) {
      alert('Please select at least one item');
      return;
    }

    // **FIXED: Ensure proper data structure with menuItem names**
    const orderData = selectedItems.map(item => ({
      id: item._id || item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      // Include both formats for compatibility
      menuItem: {
        _id: item._id || item.id,
        name: item.name, // **CRITICAL: Ensure name is included**
        price: item.price,
        category: item.category
      }
    }));

    console.log('TableManagement - Creating order with data:', orderData);

    const newOrder = onCreateOrder(selectedTable.number, orderData, 'dine-in');
    
    if (newOrder) {
      // Update ONLY this specific table with the new order ID
      setTables(prevTables => prevTables.map(table => 
        (table._id === selectedTable._id || table.id === selectedTable.id)
          ? { ...table, status: 'occupied', orderId: newOrder.id || newOrder._id }
          : table
      ));
    }
    
    setShowOrderModal(false);
    setSelectedTable(null);
    setOrderItems([]);
  };

  const updateOrderItemQuantity = (itemId, change) => {
    setOrderItems(prev => prev.map(item => 
      (item._id === itemId || item.id === itemId)
        ? { 
            ...item, 
            quantity: Math.max(0, item.quantity + change),
            selected: Math.max(0, item.quantity + change) > 0
          }
        : item
    ));
  };

  // FIXED: Only get order for this specific table
  const getOrderForTable = (table) => {
    return orders.find(order => 
      (order.id === table.orderId || order._id === table.orderId) && 
      (order.table === table.number || order.tableId === table.number)
    );
  };

 // **FIXED: Enhanced getItemName function**
const getItemName = (item) => {
  console.log('TableManagement - Processing item:', item);
  
  // Check direct name first
  if (item.name && item.name !== 'Unknown Item' && item.name !== 'Menu Item') {
    return item.name;
  }
  
  // Check menuItem name
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
      6.90: 'Prawn Crackers',
      14.90: 'Chicken Curry',
      12.90: 'Fried Rice Special',
      19.90: 'Beef Rendang',
      8.90: 'Pisang Goreng'
    };
    return menuItems[price] || `Menu Item (RM ${price})`;
  }
  
  return 'Menu Item';
};

  // Safe string function for mobile display
  const truncateText = (text, maxLength = 20) => {
    if (!text || typeof text !== 'string') return 'Unknown Item';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
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
            <div key={table._id || table.id} className="table-card">
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
                    Order: {tableOrder.id || tableOrder._id} • {tableOrder.status}
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
                      onClick={() => {
                        const order = getOrderForTable(table);
                        if (order) {
                          handleCompleteOrder(order);
                        }
                      }}
                    >
                      Complete Order
                    </button>
                  </>
                )}
                {table.status === 'needs_cleaning' && (
                  <button 
                    className="btn btn-success"
                    onClick={() => updateTableStatus(table._id || table.id, 'available')}
                  >
                    Mark Clean
                  </button>
                )}
                {(table.status === 'available' || table.status === 'needs_cleaning') && (
                  <button 
                    className="btn btn-warning"
                    onClick={() => {
                      // Force immediate cleaning - customer walked away
                      updateTableStatus(table._id || table.id, 'available');
                    }}
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
                <label className="form-label">Select Menu Items ({menuItems.length} available)</label>
                
                <div className="menu-items-grid">
                  {orderItems.map((item, index) => (
                    <div key={item._id || item.id || index} className="menu-item-row">
                      <div className="menu-item-details">
                        <div className="menu-item-name">
                          {item.name || 'Unnamed Item'}
                        </div>
                        <div className="menu-item-price">
                          RM {(item.price || 0).toFixed(2)}
                          {item.category && <span style={{fontSize: '0.75rem', color: '#64748b', marginLeft: '0.5rem'}}>({item.category})</span>}
                        </div>
                      </div>
                      <div className="quantity-controls">
                        <button 
                          className="quantity-btn"
                          onClick={() => updateOrderItemQuantity(item._id || item.id, -1)}
                          disabled={item.quantity === 0}
                        >
                          -
                        </button>
                        <span className="quantity-display">{item.quantity}</span>
                        <button 
                          className="quantity-btn"
                          onClick={() => updateOrderItemQuantity(item._id || item.id, 1)}
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
                  Create Order (RM {(orderItems.filter(item => item.quantity > 0).reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0)).toFixed(2)})
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
              <h2 className="modal-title">Order Details - {selectedOrder.id || selectedOrder._id}</h2>
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
                  <span className="info-value">{selectedOrder.table || selectedOrder.tableId}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status</span>
                  <span className="info-value">{selectedOrder.status}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Order Type</span>
                  <span className="info-value">{selectedOrder.orderType || selectedOrder.type || 'dine-in'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Time</span>
                  <span className="info-value">{selectedOrder.time || 'Just now'}</span>
                </div>
              </div>

              <div className="order-items">
                <h3 className="form-label">Order Items</h3>
                {(selectedOrder.items || []).map((item, index) => {
  const itemName = item.name || item.menuItem?.name || 'Menu Item';
  const itemPrice = item.price || item.menuItem?.price || 0;
  const itemQuantity = item.quantity || 1;
  
  return (
    <div key={index} className="order-item">
      <div className="item-details">
        <div className="item-name">{itemQuantity}x {itemName}</div>
        <div className="item-price">RM {itemPrice.toFixed(2)} each</div>
      </div>
      <div className="item-total">
        RM {(itemPrice * itemQuantity).toFixed(2)}
      </div>
    </div>
  );
})}
              </div>

              <div className="order-total">
                <span>Total Amount:</span>
                <span>RM {(selectedOrder.total || 0).toFixed(2)}</span>
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