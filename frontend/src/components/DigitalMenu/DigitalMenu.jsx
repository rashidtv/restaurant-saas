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
  // 🎯 PRODUCTION-READY HOOK USAGE
  const customerHook = useCustomer();
  const { 
    customer, 
    points, 
    registerCustomer, 
    updateCustomerAfterOrder, 
    addPoints, 
    clearCustomer,
    // 🆕 Safe destructuring with fallback
    getCustomerOrders = () => {
      console.warn('getCustomerOrders not implemented, returning empty array');
      return Promise.resolve([]);
    }
  } = customerHook;

  const { orders, isLoading: ordersLoading, loadTableOrders, createOrder: createOrderAPI } = useOrders();
  const { cart, isCartOpen, setIsCartOpen, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getItemCount } = useCart();

  // Local state
  const [selectedTable, setSelectedTable] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegistration, setShowRegistration] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);

  // Table detection
  useEffect(() => {
    if (isCustomerView) {
      const detectTableFromURL = () => {
        let detectedTable = null;
        
        const urlParams = new URLSearchParams(window.location.search);
        detectedTable = urlParams.get('table');
        
        if (!detectedTable && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
          detectedTable = hashParams.get('table');
        }

        if (detectedTable) {
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

  // 🎯 PRODUCTION-READY ORDER LOADING
  useEffect(() => {
    const loadOrders = async () => {
      if (selectedTable && customer) {
        try {
          console.log('🔄 Loading orders for customer:', customer.phone);
          
          // Try customer-specific orders first, fallback to table orders
          const orders = await getCustomerOrders();
          if (orders && orders.length > 0) {
            setCustomerOrders(orders);
          } else {
            // Fallback to table-based orders
            await loadTableOrders(selectedTable);
          }
        } catch (error) {
          console.error('Failed to load orders:', error);
          // Fallback to table orders
          await loadTableOrders(selectedTable);
        }
      }
    };

    loadOrders();
  }, [selectedTable, customer, getCustomerOrders, loadTableOrders]);

  // Auto-refresh orders
  useEffect(() => {
    if (selectedTable && customer) {
      const interval = setInterval(() => {
        loadTableOrders(selectedTable);
      }, 30000); // Refresh every 30 seconds

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
      throw error;
    }
  }, [registerCustomer]);

  const handleAddToCart = useCallback((item) => {
    if (!customer) {
      // Show registration prompt when adding to cart without account
      const registerNow = window.confirm(
        'Register now to earn points with this order and track your history!'
      );
      if (registerNow) {
        setShowRegistration(true);
        return;
      }
    }
    addToCart(item);
  }, [customer, addToCart, setShowRegistration]);

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
      const orderData = cart.map(item => ({
        menuItemId: item.id,
        name: item.name,
        price: parseFloat(item.price),
        quantity: parseInt(item.quantity),
        category: item.category
      }));

      const orderTotal = getCartTotal();
      const pointsEarned = pointsService.calculatePointsFromOrder(orderTotal);

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
        updateCustomerAfterOrder(orderTotal);
        addPoints(pointsEarned);
        
        clearCart();
        setIsCartOpen(false);
        
        // Refresh orders after successful order
        setTimeout(() => {
          loadTableOrders(selectedTable);
          getCustomerOrders();
        }, 2000);
        
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
    cart, selectedTable, customer, getCartTotal, onCreateOrder, 
    createOrderAPI, updateCustomerAfterOrder, addPoints, clearCart, 
    setIsCartOpen, loadTableOrders, getCustomerOrders
  ]);

  // Separate orders by status
  const displayOrders = customerOrders.length > 0 ? customerOrders : orders;
  const activeOrders = displayOrders.filter(order => 
    ['pending', 'preparing', 'ready'].includes(order.status)
  );
  const completedOrders = displayOrders.filter(order => order.status === 'completed');

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
            {/* Show welcome message when no customer (skipped registration) */}
            {!customer && (
              <div className="welcome-section">
                <div className="welcome-icon">🍽️</div>
                <h2>Welcome to Table {selectedTable}</h2>
                <p>Browse our menu and add items to your cart</p>
                <div className="welcome-tips">
                  <div className="tip-item">
                    <span className="tip-icon">🛒</span>
                    <span>Add items to cart to start ordering</span>
                  </div>
                  <div className="tip-item">
                    <span className="tip-icon">📱</span>
                    <span>Register anytime to earn loyalty points</span>
                  </div>
                  <div className="tip-item">
                    <span className="tip-icon">⚡</span>
                    <span>Quick and easy checkout</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowRegistration(true)}
                  className="register-cta-btn"
                >
                  Register to Earn Points
                </button>
              </div>
            )}

            {/* Points Display - Only show when customer is registered */}
            {customer && (
              <PointsDisplay 
                points={points} 
                phone={customer.phone}
                onClear={clearCustomer}
              />
            )}

            {/* Orders Section - Only show when customer is registered */}
            {customer && (
              <div className="orders-section">
                <div className="section-header">
                  <h2>Your Orders</h2>
                  <button 
                    onClick={async () => {
                      await loadTableOrders(selectedTable);
                      await getCustomerOrders();
                    }}
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
                            <OrderCard key={order._id || `order-${index}`} order={order} />
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
                            <OrderCard key={order._id || `completed-${index}`} order={order} />
                          ))}
                        </div>
                      </div>
                    )}

                    {displayOrders.length === 0 && (
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

            {/* Menu Section - Show to everyone */}
            <MenuGrid
              menuItems={displayMenu}
              searchTerm={searchTerm}
              activeCategory={activeCategory}
              categories={categories}
              onAddToCart={handleAddToCart}
              onSearchChange={setSearchTerm}
              onCategoryChange={setActiveCategory}
            />
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
        {getItemCount() > 0 && !isCartOpen && selectedTable && (
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

  // ADMIN VIEW
  return (
    <div className="admin-view">
      <h2>Menu Management - Staff View</h2>
      <p>Staff interface for order management</p>
    </div>
  );
};