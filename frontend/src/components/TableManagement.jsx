import React, { useState, useEffect } from 'react';
import './TableManagement.css';

const TableManagement = ({ tables, setTables, orders, setOrders, onCreateOrder, onCompleteOrder, getTimeAgo, isMobile, menu, apiConnected }) => {
  const [selectedTable, setSelectedTable] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);

  console.log('✅ TableManagement loaded - no socket errors');
  // USE THE MENU FROM PROPS (Digital Menu data)
  const menuItems = menu || [];
  
  console.log('📋 TableManagement using menu:', menuItems.length, 'items');

  // Initialize order items when modal opens
  useEffect(() => {
    if (showOrderModal && selectedTable) {
      // Initialize with actual menu items
      const initializedItems = menuItems.map(item => ({
        ...item,
        quantity: 0,
        selected: false
      }));
      setOrderItems(initializedItems);
      console.log('🔄 Order modal initialized with:', initializedItems.length, 'menu items');
    }
  }, [showOrderModal, selectedTable, menuItems]);

  // Update table status function
  const updateTableStatus = async (tableId, newStatus) => {
    console.log('🔄 Updating table status:', tableId, 'to', newStatus);
    
    try {
      // Update local state first
      setTables(prevTables => prevTables.map(table => {
        if (table._id === tableId || table.id === tableId) {
          const updatedTable = { 
            ...table, 
            status: newStatus
          };
          
          // Clear order data when marking as available
          if (newStatus === 'available') {
            updatedTable.lastCleaned = new Date().toISOString();
            updatedTable.orderId = null;
            updatedTable.currentOrder = null;
            console.log('✅ Cleared order data for table:', table.number);
          }
          
          return updatedTable;
        }
        return table;
      }));

      // Update backend if connected
      if (apiConnected) {
        await fetch(`https://restaurant-saas-backend-hbdz.onrender.com/api/tables/${tableId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
            ...(newStatus === 'available' && { 
              orderId: null,
              lastCleaned: new Date().toISOString()
            })
          })
        });
      }
    } catch (error) {
      console.error('❌ Error updating table status:', error);
    }
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
    
    // Don't update table status here - wait for payment
    setShowOrderDetails(false);
  };

  const handleCreateOrder = async () => {
    const selectedItems = orderItems 
      ? orderItems.filter(item => item && item.quantity > 0)
      : [];

    if (selectedItems.length === 0) {
      alert('Please select at least one item');
      return;
    }

    console.log('📦 Creating order for table:', selectedTable?.number);

    const orderData = {
      tableId: selectedTable?.number,
      items: selectedItems.map(item => ({
        menuItemId: item._id || item.id,
        quantity: item.quantity,
        price: item.price,
        specialInstructions: ''
      })),
      orderType: 'dine-in'
    };

    console.log('TableManagement - Creating order with data:', orderData);

    try {
      const newOrder = await onCreateOrder(selectedTable?.number, selectedItems, 'dine-in');
      
      if (newOrder) {
        setTables(prevTables => prevTables.map(table => 
          table.number === selectedTable?.number
            ? { ...table, status: 'occupied', orderId: newOrder._id || newOrder.id }
            : table
        ));
      }
      
      setShowOrderModal(false);
      setSelectedTable(null);
      setOrderItems([]);
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Failed to create order: ' + error.message);
    }
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

  const getOrderForTable = (table) => {
    // If table is available or needs_cleaning, no order to show
    if (table.status === 'available' || table.status === 'needs_cleaning') {
      return null;
    }
    
    // Find order by table number (most reliable)
    return orders.find(order => {
      const orderTableId = order.tableId || order.table;
      const tableId = table.number || table._id;
      
      return orderTableId === tableId && 
             order.status !== 'completed' && 
             order.status !== 'cancelled';
    });
  };

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
    
    // If we have a price but no name, create a generic name
    const price = item.price || (item.menuItem && item.menuItem.price);
    if (price) {
      // Try to find the actual menu item from our digital menu
      const actualMenuItem = menuItems.find(menuItem => 
        menuItem.price === price || menuItem._id === item.menuItemId || menuItem.id === item.menuItemId
      );
      
      if (actualMenuItem && actualMenuItem.name) {
        return actualMenuItem.name;
      }
      
      // Last resort: generic name with price
      return `Menu Item (RM ${price})`;
    }
    
    // Final fallback
    return 'Menu Item';
  };

  // Function to get item details from actual menu
  const getItemDetails = (item) => {
    // If item already has name and price, use them
    if (item.name && item.price) {
      return { name: item.name, price: item.price };
    }
    
    // Try to find in the actual menu
    const menuItemId = item.menuItemId || item._id || item.id;
    const actualMenuItem = menuItems.find(menuItem => 
      menuItem._id === menuItemId || 
      menuItem.id === menuItemId ||
      menuItem.price === item.price
    );
    
    if (actualMenuItem) {
      return { 
        name: actualMenuItem.name || 'Menu Item', 
        price: actualMenuItem.price || 0 
      };
    }
    
    // Final fallback
    return { 
      name: item.name || 'Menu Item', 
      price: item.price || 0 
    };
  };

  return (
    <div className="table-management-modern">
      {/* Modern Page Header */}
      <div className="page-header-modern">
        <div>
          <h2 className="page-title-modern">Table Management</h2>
          <p className="page-subtitle-modern">Manage restaurant tables, cleaning schedules, and status</p>
          {!apiConnected && (
            <div className="offline-badge-modern">⚠️ Offline Mode - Data may be limited</div>
          )}
        </div>
      </div>

      {/* Modern Tables Grid */}
      <div className="tables-grid-modern">
        {tables.map(table => {
          const cleaningStatus = getCleaningStatus(table.lastCleaned);
          const tableOrder = getOrderForTable(table);
          
          return (
            <div key={table._id || table.id} className={`table-card-modern status-${table.status}`}>
              <div className="table-header-modern">
                <h3 className="table-number-modern">Table {table.number}</h3>
                <div className="table-status-badges-modern">
                  <span className={`table-status-modern status-${table.status}`}>
                    {table.status.replace('_', ' ')}
                  </span>
                  <span 
                    className="cleaning-status-modern"
                    style={{
                      backgroundColor: `${cleaningStatus.color}20`,
                      color: cleaningStatus.color
                    }}
                  >
                    {cleaningStatus.text}
                  </span>
                </div>
              </div>
              
              <div className="table-info-modern">
                <div className="table-info-item-modern">
                  <span className="table-info-icon-modern">👥</span>
                  Capacity: {table.capacity}
                </div>
                <div className="table-info-item-modern">
                  <span className="table-info-icon-modern">🧹</span>
                  Last cleaned: {getTimeAgo(table.lastCleaned)}
                </div>
                {tableOrder && (
                  <div className="table-order-modern">
                    <strong>Order: {tableOrder.orderNumber}</strong> • {tableOrder.status}
                    {tableOrder.total && (
                      <div className="order-total-small-modern">Total: RM {tableOrder.total.toFixed(2)}</div>
                    )}
                  </div>
                )}
              </div>

              <div className="table-actions-modern">
                {table.status === 'available' && (
                  <button 
                    className="btn-modern btn-primary-modern"
                    onClick={() => handleStartOrder(table)}
                  >
                    Start Order
                  </button>
                )}
                {table.status === 'occupied' && (
                  <>
                    <button 
                      className="btn-modern btn-warning-modern"
                      onClick={() => handleViewOrder(table)}
                    >
                      View Order
                    </button>
                    <button 
                      className="btn-modern btn-success-modern"
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
                    className="btn-modern btn-success-modern"
                    onClick={() => updateTableStatus(table._id || table.id, 'available')}
                  >
                    Mark Clean
                  </button>
                )}
                {(table.status === 'available' || table.status === 'needs_cleaning') && (
                  <button 
                    className="btn-modern btn-warning-modern"
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

      {/* Modern Order Creation Modal */}
      {showOrderModal && (
        <div className="modal-overlay-modern">
          <div className="modal-content-modern">
            <div className="modal-header-modern">
              <h2 className="modal-title-modern">Start Order - Table {selectedTable?.number}</h2>
              <button 
                className="close-button-modern"
                onClick={() => setShowOrderModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="order-form-modern">
              <div className="form-group-modern">
                <label className="form-label-modern">Select Menu Items ({menuItems.length} available)</label>
                
                <div className="menu-items-grid-modern">
                  {orderItems.map((item, index) => (
                    <div key={item._id || item.id || index} className="menu-item-row-modern">
                      <div className="menu-item-details-modern">
                        <div className="menu-item-name-modern">
                          {item.name || 'Unnamed Item'}
                        </div>
                        <div className="menu-item-price-modern">
                          RM {(item.price || 0).toFixed(2)}
                          {item.category && <span className="menu-item-category-modern">({item.category})</span>}
                        </div>
                      </div>
                      <div className="quantity-controls-modern">
                        <button 
                          className="quantity-btn-modern"
                          onClick={() => updateOrderItemQuantity(item._id || item.id, -1)}
                          disabled={item.quantity === 0}
                        >
                          -
                        </button>
                        <span className="quantity-display-modern">{item.quantity}</span>
                        <button 
                          className="quantity-btn-modern"
                          onClick={() => updateOrderItemQuantity(item._id || item.id, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions-modern">
                <button 
                  className="btn-modern btn-secondary-modern"
                  onClick={() => setShowOrderModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-modern btn-primary-modern"
                  onClick={handleCreateOrder}
                >
                  Create Order (RM {(orderItems.filter(item => item.quantity > 0).reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0)).toFixed(2)})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="modal-overlay-modern">
          <div className="modal-content-modern">
            <div className="modal-header-modern">
              <h2 className="modal-title-modern">Order Details - {selectedOrder.id || selectedOrder._id}</h2>
              <button 
                className="close-button-modern"
                onClick={() => setShowOrderDetails(false)}
              >
                ×
              </button>
            </div>
            
            <div className="order-details-modern">
              <div className="order-info-modern">
                <div className="info-item-modern">
                  <span className="info-label-modern">Table</span>
                  <span className="info-value-modern">{selectedOrder.table || selectedOrder.tableId}</span>
                </div>
                <div className="info-item-modern">
                  <span className="info-label-modern">Status</span>
                  <span className="info-value-modern">{selectedOrder.status}</span>
                </div>
                <div className="info-item-modern">
                  <span className="info-label-modern">Order Type</span>
                  <span className="info-value-modern">{selectedOrder.orderType || selectedOrder.type || 'dine-in'}</span>
                </div>
                <div className="info-item-modern">
                  <span className="info-label-modern">Time</span>
                  <span className="info-value-modern">{selectedOrder.time || 'Just now'}</span>
                </div>
              </div>

              <div className="order-items-modern">
                <h3 className="form-label-modern">Order Items</h3>
                {(selectedOrder.items || []).map((item, index) => {
                  const itemDetails = getItemDetails(item);
                  const itemName = itemDetails.name;
                  const itemPrice = itemDetails.price;
                  const itemQuantity = item.quantity || 1;
                  
                  return (
                    <div key={index} className="order-item-modern">
                      <div className="item-details-modern">
                        <div className="item-name-modern">{itemQuantity}x {itemName}</div>
                        <div className="item-price-modern">RM {itemPrice.toFixed(2)} each</div>
                      </div>
                      <div className="item-total-modern">
                        RM {(itemPrice * itemQuantity).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="order-total-modern">
                <span>Total Amount:</span>
                <span>RM {(selectedOrder.total || 0).toFixed(2)}</span>
              </div>

              <div className="modal-actions-modern">
                <button 
                  className="btn-modern btn-secondary-modern"
                  onClick={() => setShowOrderDetails(false)}
                >
                  Close
                </button>
                {selectedOrder.status !== 'completed' && (
                  <button 
                    className="btn-modern btn-primary-modern"
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