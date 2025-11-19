import React, { useState, useEffect, useCallback } from 'react';
import { useCustomer } from '../../hooks/useCustomer';
import { useOrders } from '../../hooks/useOrders';
import { useCart } from '../../hooks/useCart';
import { RegistrationModal } from './RegistrationModal';
import { PointsDisplay } from './PointsDisplay';
import { OrderCard } from './OrderCard';
import { MenuGrid } from './MenuGrid';
import { CartPanel } from './CartPanel';
import { orderService } from '../../services/orderService';
import { pointsService } from '../../services/pointsService';
import { validatePhoneNumber } from '../../utils/validators';
import './styles.css';

export const DigitalMenu = ({ 
  menu = [], 
  apiConnected, 
  currentTable, 
  isCustomerView = false,
  onCreateOrder 
}) => {
  // Hooks
  const { customer, points, registerCustomer, updateCustomerAfterOrder, addPoints, clearCustomer } = useCustomer();
  const { orders, isLoading: ordersLoading, loadTableOrders, createOrder: createOrderAPI } = useOrders();
  const { cart, isCartOpen, setIsCartOpen, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getItemCount } = useCart();

  // Local state
  const [selectedTable, setSelectedTable] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegistration, setShowRegistration] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Table detection
  useEffect(() => {
    if (isCustomerView) {
      const detectTableFromURL = () => {
        let detectedTable = null;
        
        // Check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        detectedTable = urlParams.get('table');
        
        // Check hash parameters
        if (!detectedTable && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
          detectedTable = hashParams.get('table');
        }

        if (detectedTable) {
          // Normalize table format
          detectedTable = detectedTable.toString().toUpperCase();
          if (!detectedTable.startsWith('T')) {
            detectedTable = 'T' + detectedTable;
          }
          setSelectedTable(detectedTable);
        }
      };

      detectTableFromURL();
      
      const handleHashChange = () => {
        detectTableFromURL();
      };
      
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }
  }, [isCustomerView]);

  // Load orders when table is detected
  useEffect(() => {
    if (selectedTable && customer) {
      loadTableOrders(selectedTable);
    }
  }, [selectedTable, customer, loadTableOrders]);

  // Auto-refresh orders
  useEffect(() => {
    if (selectedTable && customer) {
      const interval = setInterval(() => {
        loadTableOrders(selectedTable);
      }, 10000); // Refresh every 10 seconds

      return () => clearInterval(interval);
    }
  }, [selectedTable, customer, loadTableOrders]);

  // Show registration if no customer when table is detected
  useEffect(() => {
    if (selectedTable && !customer) {
      setShowRegistration(true);
    }
  }, [selectedTable, customer]);

  // Event handlers
  const handleRegistration = useCallback(async (formData) => {
    try {
      await registerCustomer(formData.phone);
      setShowRegistration(false);
    } catch (error) {
      throw error; // Propagate to modal
    }
  }, [registerCustomer]);

  const handleAddToCart = useCallback((item) => {
    if (!customer) {
      setShowRegistration(true);
      return;
    }
    addToCart(item);
  }, [customer, addToCart]);

  const handlePlaceOrder = useCallback(async () => {
    if (cart.length === 0) {
      alert('Your cart is empty. Please add some items first.');
      return;
    }

    if (!selectedTable) {
      alert('Table number not detected. Please scan the QR code again.');
      return;
    }

    if (!customer) {
      alert('Please register with your phone number to place an order.');
      setShowRegistration(true);
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Prepare order data
      const orderData = cart.map(item => ({
        menuItemId: item.id,
        name: item.name,
        price: parseFloat(item.price),
        quantity: parseInt(item.quantity),
        category: item.category
      }));

      const orderTotal = getCartTotal();
      const pointsEarned = pointsService.calculatePointsFromOrder(orderTotal);

      // Create order via provided function or use internal API
      const orderResult = onCreateOrder 
        ? await onCreateOrder(selectedTable, orderData, 'dine-in', { customerPhone: customer.phone })
        : await createOrderAPI({
            tableId: selectedTable,
            items: orderData,
            orderType: 'dine-in',
            customerPhone: customer.phone,
            status: 'pending'
          });

      if (orderResult && orderResult.success !== false) {
        // Update customer data and points
        updateCustomerAfterOrder(orderTotal);
        addPoints(pointsEarned);
        
        // Clear cart and close
        clearCart();
        setIsCartOpen(false);
        
        // Refresh orders
        setTimeout(() => loadTableOrders(selectedTable), 1000);
        
        // Show success message
        const orderNumber = orderResult.orderNumber || orderResult.data?.orderNumber || 'N/A';
        alert(`Order #${orderNumber} placed successfully! You earned ${pointsEarned} points.`);
      } else {
        throw new Error(orderResult?.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order placement error:', error);
      alert(`Failed to place order: ${error.message}`);
    } finally {
      setIsPlacingOrder(false);
    }
  }, [
    cart, 
    selectedTable, 
    customer, 
    getCartTotal, 
    onCreateOrder, 
    createOrderAPI, 
    updateCustomerAfterOrder, 
    addPoints, 
    clearCart, 
    setIsCartOpen, 
    loadTableOrders
  ]);

  // Separate orders by status
  const activeOrders = orders.filter(order => 
    ['pending', 'preparing', 'ready'].includes(order.status)
  );
  const completedOrders = orders.filter(order => order.status === 'completed');

  // Categories for menu
  const categories = ['all', ...new Set(menu.map(item => item.category))];

  // Fallback menu data
  const displayMenu = menu && menu.length > 0 ? menu : [
    { id: '1', name: 'Teh Tarik', price: 4.50, category: 'drinks', description: 'Famous Malaysian pulled tea' },
    { id: '2', name: 'Nasi Lemak', price: 12.90, category: 'main', description: 'Coconut rice with sambal' },
    { id: '3', name: 'Roti Canai', price: 3.50, category: 'main', description: 'Flaky flatbread with curry' },
    { id: '4', name: 'Cendol', price: 6.90, category: 'desserts', description: 'Shaved ice dessert' }
  ];

  // CUSTOMER VIEW
  if (isCustomerView) {
    return (
      <div className="digital-menu">
        {/* Registration Modal */}
        {showRegistration && (
          <RegistrationModal
            selectedTable={selectedTable}
            onRegister={handleRegistration}
            onClose={() => setShowRegistration(false)}
          />
        )}

        {/* Header */}
        <header className="menu-header">
          <div className="header-content">
            <h1 className="restaurant-name">FlavorFlow</h1>
            {selectedTable && (
              <div className="table-info">Table {selectedTable}</div>
            )}
          </div>
          
          {customer && (
            <button 
              className="cart-button"
              onClick={() => setIsCartOpen(true)}
            >
              🛒 {getItemCount() > 0 && <span className="cart-badge">{getItemCount()}</span>}
            </button>
          )}
        </header>

        {/* Table Detection Prompt */}
        {!selectedTable && (
          <div className="table-prompt">
            <div className="prompt-icon">📱</div>
            <h2>Scan QR Code</h2>
            <p>Scan your table QR code to start ordering</p>
          </div>
        )}

        {/* Customer Content */}
        {selectedTable && (
          <div className="customer-content">
            {/* Points Display */}
            {customer && (
              <PointsDisplay 
                points={points} 
                phone={customer.phone}
                onClear={clearCustomer}
              />
            )}

            {/* Orders Section */}
            {customer && (
              <div className="orders-section">
                <div className="section-header">
                  <h2>Your Orders</h2>
                  <button 
                    onClick={() => loadTableOrders(selectedTable)}
                    disabled={ordersLoading}
                    className="refresh-btn"
                  >
                    {ordersLoading ? '...' : '↻'}
                  </button>
                </div>

                {ordersLoading ? (
                  <div className="loading-state">Loading orders...</div>
                ) : (
                  <>
                    {/* Active Orders */}
                    {activeOrders.length > 0 && (
                      <div className="orders-group">
                        <h3 className="group-title">Active Orders ({activeOrders.length})</h3>
                        <div className="orders-list">
                          {activeOrders.map((order, index) => (
                            <OrderCard key={order._id || index} order={order} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Completed Orders */}
                    {completedOrders.length > 0 && (
                      <div className="orders-group">
                        <h3 className="group-title">Order History ({completedOrders.length})</h3>
                        <div className="orders-list">
                          {completedOrders.map((order, index) => (
                            <OrderCard key={order._id || index} order={order} />
                          ))}
                        </div>
                      </div>
                    )}

                    {orders.length === 0 && (
                      <div className="empty-orders">
                        <div className="empty-icon">📦</div>
                        <p>No orders yet</p>
                        <p className="empty-subtitle">Your orders will appear here</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Menu Section */}
            {customer && (
              <MenuGrid
                menuItems={displayMenu}
                searchTerm={searchTerm}
                activeCategory={activeCategory}
                categories={categories}
                onAddToCart={handleAddToCart}
                onSearchChange={setSearchTerm}
                onCategoryChange={setActiveCategory}
              />
            )}
          </div>
        )}

        {/* Cart Panel */}
        <CartPanel
          cart={cart}
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          onPlaceOrder={handlePlaceOrder}
          selectedTable={selectedTable}
          customer={customer}
        />

        {/* Mobile Cart FAB */}
        {getItemCount() > 0 && !isCartOpen && selectedTable && customer && (
          <button 
            className="mobile-cart-fab"
            onClick={() => setIsCartOpen(true)}
          >
            🛒 {getItemCount()} • RM {getCartTotal().toFixed(2)}
          </button>
        )}
      </div>
    );
  }

  // ADMIN VIEW (Simplified)
  return (
    <div className="admin-view">
      <h2>Menu Management - Staff View</h2>
      <p>Staff interface for order management</p>
      {/* Admin functionality can be implemented here */}
    </div>
  );
};