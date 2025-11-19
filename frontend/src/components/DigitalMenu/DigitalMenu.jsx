import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import './styles.css';

export const DigitalMenu = ({ 
  menu = [], 
  apiConnected, 
  currentTable, 
  isCustomerView = false,
  onCreateOrder 
}) => {
  // Refs for scrolling
  const cartPanelRef = useRef(null);
  
  // Custom hooks - use the original implementation without breaking changes
  const customerHook = useCustomer();
  const { 
    customer, 
    points, 
    registerCustomer, 
    updateCustomerAfterOrder, 
    addPoints, 
    clearCustomer,
    getCustomerOrders
  } = customerHook;

  const { orders, isLoading: ordersLoading, loadTableOrders, createOrder: createOrderAPI } = useOrders();
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getCartTotal, 
    getItemCount 
  } = useCart();

  // Local state
  const [selectedTable, setSelectedTable] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegistration, setShowRegistration] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [headerSticky, setHeaderSticky] = useState(false);

  // Table detection from URL - ORIGINAL WORKING CODE
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

  // Sticky header implementation
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setHeaderSticky(true);
      } else {
        setHeaderSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to cart when it opens
  useEffect(() => {
    if (isCartOpen && cartPanelRef.current) {
      setTimeout(() => {
        cartPanelRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end'
        });
      }, 100);
    }
  }, [isCartOpen]);

  // FIXED: Load customer orders - RESTORE ORIGINAL FUNCTIONALITY
  useEffect(() => {
    const loadOrders = async () => {
      if (selectedTable) {
        try {
          // Always load table orders first
          await loadTableOrders(selectedTable);
          
          // If customer exists, also load their specific orders
          if (customer && getCustomerOrders) {
            const customerOrdersData = await getCustomerOrders();
            setCustomerOrders(customerOrdersData);
          }
        } catch (error) {
          console.error('Failed to load orders:', error);
        }
      }
    };

    loadOrders();
  }, [selectedTable, customer, getCustomerOrders, loadTableOrders]);

  // Show registration when table detected and no customer
  useEffect(() => {
    if (selectedTable && !customer) {
      setShowRegistration(true);
      setShowWelcome(false);
    }
  }, [selectedTable, customer]);

// FIXED: WebSocket integration with dynamic import
useEffect(() => {
  let socket = null;

  const initializeWebSocket = async () => {
    try {
      // Dynamic import to avoid build issues
      const socketIO = await import('socket.io-client');
      const io = socketIO.default || socketIO;
      
      socket = io('https://restaurant-saas-backend-hbdz.onrender.com', {
        transports: ['websocket', 'polling'],
        timeout: 10000
      });

      socket.on('orderUpdated', (updatedOrder) => {
        console.log('🔄 Order updated via WebSocket:', updatedOrder.orderNumber);
        if (selectedTable) {
          loadTableOrders(selectedTable);
        }
        if (customer && updatedOrder.customerPhone === customer.phone) {
          getCustomerOrders().then(setCustomerOrders);
        }
      });

      socket.on('paymentProcessed', (payment) => {
        console.log('💰 Payment processed via WebSocket:', payment.orderId);
        if (selectedTable) {
          loadTableOrders(selectedTable);
        }
      });

      socket.on('connect', () => {
        console.log('🔌 DigitalMenu WebSocket connected');
      });

    } catch (error) {
      console.error('WebSocket initialization failed:', error);
    }
  };

  // Call the async function
  initializeWebSocket();

  return () => {
    if (socket) {
      socket.disconnect();
      console.log('🧹 DigitalMenu WebSocket cleaned up');
    }
  };
}, [selectedTable, customer, loadTableOrders, getCustomerOrders]);

  // FIXED: Enhanced add to cart with proper quantity handling
  const handleAddToCart = useCallback((item, quantity = 1) => {
    if (!customer) {
      setShowRegistration(true);
      return;
    }
    
    // Use the original item structure without normalization to avoid breaking changes
    addToCart(item, quantity);
  }, [customer, addToCart]);

  const handleRegistration = useCallback(async (formData) => {
    try {
      await registerCustomer(formData.phone);
      setShowRegistration(false);
      setShowWelcome(false);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }, [registerCustomer]);

  // FIXED: Enhanced place order with proper order history refresh
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
      // FIXED: Use cart items directly with their quantities
      const orderData = cart.map(item => ({
        menuItemId: item.id,
        name: item.name,
        price: parseFloat(item.price),
        quantity: item.quantity, // Use the actual quantity from cart
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
        
        // FIXED: Refresh orders immediately after successful order
        try {
          // Refresh both table orders and customer orders
          await loadTableOrders(selectedTable);
          if (customer && getCustomerOrders) {
            const updatedCustomerOrders = await getCustomerOrders();
            setCustomerOrders(updatedCustomerOrders);
          }
        } catch (refreshError) {
          console.error('Error refreshing orders:', refreshError);
        }
        
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
    loadTableOrders, 
    getCustomerOrders
  ]);

  // Fixed cart toggle function
  const toggleCart = useCallback(() => {
    setIsCartOpen(prev => !prev);
  }, []);

  // FIXED: Use both customer orders and table orders for display
  const displayOrders = customerOrders.length > 0 ? customerOrders : orders;
  const activeOrders = displayOrders.filter(order => 
    order && ['pending', 'preparing', 'ready'].includes(order.status)
  );
  const completedOrders = displayOrders.filter(order => 
    order && order.status === 'completed'
  );

  // Categories for menu
  const categories = ['all', ...new Set(menu.map(item => item.category))];

  // Use original menu structure
  const displayMenu = menu && menu.length > 0 ? menu : [];

  // CUSTOMER VIEW
  if (isCustomerView) {
    return (
      <div className="digital-menu">
        {/* Registration Modal - Top Position */}
        {showRegistration && (
          <RegistrationModal
            selectedTable={selectedTable}
            onRegister={handleRegistration}
            onClose={() => {
              setShowRegistration(false);
              setShowWelcome(true);
            }}
          />
        )}

        {/* Fixed Sticky Header */}
        <header className={`menu-header ${headerSticky ? 'sticky' : ''}`}>
          <div className="header-content">
            <h1 className="restaurant-name">FlavorFlow</h1>
            {selectedTable && (
              <div className="table-info">Table {selectedTable}</div>
            )}
          </div>
          
          {/* Cart Button */}
          {customer && selectedTable && (
            <button 
              className="cart-button-header"
              onClick={toggleCart}
              aria-label={`View cart with ${getItemCount()} items`}
              aria-expanded={isCartOpen}
            >
              <span className="cart-icon">🛒</span>
              <span className="cart-summary">
                {getItemCount()} items • RM {getCartTotal().toFixed(2)}
              </span>
              {getItemCount() > 0 && (
                <span className="cart-badge" aria-live="polite">
                  {getItemCount()}
                </span>
              )}
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
            {/* Brief Welcome Message */}
            {showWelcome && !customer && (
              <div className="welcome-brief">
                <div className="welcome-icon">👋</div>
                <h2>Welcome to Table {selectedTable}</h2>
                <p>Browse our menu and start ordering</p>
                <button 
                  onClick={() => setShowRegistration(true)}
                  className="register-cta-btn"
                >
                  Register to Earn Points
                </button>
              </div>
            )}

            {/* Points Display */}
            {customer && (
              <PointsDisplay 
                points={points} 
                phone={customer.phone}
                onClear={clearCustomer}
              />
            )}

            {/* FIXED: Orders Section - Restore original functionality */}
            {customer && (
              <div className="orders-section">
                <div className="section-header">
                  <h2>Your Orders</h2>
                  <button 
                    onClick={async () => {
                      try {
                        await loadTableOrders(selectedTable);
                        if (customer && getCustomerOrders) {
                          const updatedOrders = await getCustomerOrders();
                          setCustomerOrders(updatedOrders);
                        }
                      } catch (error) {
                        console.error('Error refreshing orders:', error);
                      }
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
                    {activeOrders.length > 0 && (
                      <div className="orders-group">
                        <h3 className="group-title">Active Orders ({activeOrders.length})</h3>
                        <div className="orders-list">
                          {activeOrders.map((order, index) => (
                            <OrderCard 
                              key={order._id || `order-${index}`} 
                              order={order} 
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {completedOrders.length > 0 && (
                      <div className="orders-group">
                        <h3 className="group-title">Order History ({completedOrders.length})</h3>
                        <div className="orders-list">
                          {completedOrders.map((order, index) => (
                            <OrderCard 
                              key={order._id || `completed-${index}`} 
                              order={order} 
                            />
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

            {/* Menu Section */}
            <div className="menu-section">
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
          </div>
        )}

        {/* Cart Panel with Ref for Auto-scroll */}
        <div ref={cartPanelRef}>
          <CartPanel
            cart={cart}
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onPlaceOrder={handlePlaceOrder}
            selectedTable={selectedTable}
            customer={customer}
            isPlacingOrder={isPlacingOrder}
          />
        </div>

        {/* Mobile Floating Cart Button */}
        {customer && selectedTable && getItemCount() > 0 && (
          <button 
            className="floating-cart-btn"
            onClick={toggleCart}
            aria-label={`Open cart with ${getItemCount()} items`}
          >
            <span>🛒</span>
            <span>{getItemCount()} • RM {getCartTotal().toFixed(2)}</span>
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