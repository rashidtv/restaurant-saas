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
import { customerService } from '../../services/customerService';
import { pointsService } from '../../services/pointsService';
import { CONFIG } from '../../constants/config'; // ✅ Use named import
import { ORDER_STATUS_CONFIG } from '../../constants/config';
import { apiClient, fetchOrders } from '../../config/api';
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


// Add this inside the DigitalMenu component, after the hooks:
const handleAddToCart = useCallback((item, quantity = 1) => {
  console.log('🛒 Adding to cart:', item.name, 'Quantity:', quantity);
  
  if (!item || !item.id) {
    console.error('❌ Invalid item for cart:', item);
    return;
  }
  
  // Use the cart hook's addToCart function
  addToCart(item, quantity);
}, [addToCart]);

// Add this function in DigitalMenu component:
const handleRegistration = useCallback(async (phone, name) => {
  try {
    console.log('📝 Processing registration for:', phone);
    
    const registeredCustomer = await registerCustomer(phone, name);
    
    if (registeredCustomer) {
      console.log('✅ Registration successful:', registeredCustomer.phone);
      setShowRegistration(false);
      setShowWelcome(false);
    }
  } catch (error) {
    console.error('❌ Registration failed:', error);
    alert(`Registration failed: ${error.message}`);
  }
}, [registerCustomer]);

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

// In frontend/src/components/DigitalMenu/DigitalMenu.jsx - Fix WebSocket handlers

// Replace the WebSocket useEffect in DigitalMenu with:

useEffect(() => {
  if (!selectedTable || !customer) return;

  let isSubscribed = true;

  const handleOrderUpdated = (updatedOrder) => {
    if (!isSubscribed) return;
    
    // VALIDATION: Check for null/undefined data
    if (!updatedOrder || !updatedOrder.orderNumber) {
      console.warn('⚠️ Received invalid order update via WebSocket');
      return;
    }
    
    console.log('🔄 Order updated via WebSocket:', updatedOrder.orderNumber);
    
    // Refresh orders when order status changes
    if (selectedTable) {
      loadTableOrders(selectedTable);
    }
    
    // If this order belongs to current customer, refresh customer data
    if (customer && updatedOrder.customerPhone === customer.phone) {
      console.log('🎯 Order belongs to current customer, refreshing data...');
      
      // Refresh customer orders
      getCustomerOrders().then(orders => {
        if (Array.isArray(orders)) {
          setCustomerOrders(orders);
        }
      }).catch(error => {
        console.error('Failed to refresh customer orders:', error);
      });
      
      // Refresh customer points data with validation
      if (customer.phone && customer.phone !== 'undefined') {
        customerService.refreshCustomerData(customer.phone)
          .then(freshCustomer => {
            if (freshCustomer && freshCustomer.phone) {
              customerHook.setCustomer(freshCustomer);
              customerHook.setPoints(freshCustomer.points || 0);
              console.log('✅ Customer points refreshed:', freshCustomer.points);
            }
          })
          .catch(error => {
            console.error('Failed to refresh customer data:', error);
          });
      }
    }
  };

  const handlePaymentProcessed = (payment) => {
    if (!isSubscribed) return;
    
    // VALIDATION: Check for null/undefined data
    if (!payment || !payment.orderId) {
      console.warn('⚠️ Received invalid payment via WebSocket');
      return;
    }
    
    console.log('💰 Payment processed via WebSocket:', payment.orderId);
    
    // Refresh orders when payment is completed
    if (selectedTable) {
      loadTableOrders(selectedTable);
    }
    
    // Refresh customer data after payment with validation
    if (customer && customer.phone && customer.phone !== 'undefined') {
      console.log('💰 Payment completed, refreshing customer data...');
      customerService.refreshCustomerData(customer.phone)
        .then(freshCustomer => {
          if (freshCustomer && freshCustomer.phone) {
            customerHook.setCustomer(freshCustomer);
            customerHook.setPoints(freshCustomer.points || 0);
            console.log('✅ Points updated after payment:', freshCustomer.points);
          }
        })
        .catch(error => {
          console.error('Failed to refresh customer after payment:', error);
        });
    }
  };

  // Use socketService with proper error handling
  if (socketService && socketService.socket) {
    socketService.on('orderUpdated', handleOrderUpdated);
    socketService.on('paymentProcessed', handlePaymentProcessed);
    
    console.log('🔌 DigitalMenu WebSocket listeners registered');
  } else {
    console.log('⚠️ Socket service not available, real-time updates disabled');
  }

  return () => {
    isSubscribed = false;
    
    if (socketService) {
      socketService.off('orderUpdated', handleOrderUpdated);
      socketService.off('paymentProcessed', handlePaymentProcessed);
      console.log('🧹 DigitalMenu WebSocket listeners cleaned up');
    }
  };
}, [selectedTable, customer, loadTableOrders, getCustomerOrders, customerHook]);

const handlePlaceOrder = useCallback(async () => {
  // Enhanced session validation with better error handling
  try {
    console.log('🔐 Validating customer session...');
    
    const sessionCheck = await fetch(`${CONFIG.API_BASE_URL}/api/customers/me`, {
      method: 'GET',
      credentials: 'include', // This is crucial
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('🔐 Session check status:', sessionCheck.status);
    
    if (sessionCheck.status === 401) {
      // Check if we have customer data but session expired
      if (customer) {
        console.log('🔄 Session expired for existing customer, attempting re-registration...');
        try {
          // Try to re-register with same phone
          await registerCustomer(customer.phone, customer.name);
          console.log('✅ Customer re-registered successfully');
          // Continue with order placement
        } catch (regError) {
          console.error('❌ Re-registration failed:', regError);
          throw new Error('Session expired. Please scan QR code again.');
        }
      } else {
        throw new Error('No active session. Please register first.');
      }
    }
    
    if (!sessionCheck.ok) {
      throw new Error('Session validation failed');
    }
    
    console.log('✅ Session validated successfully');
    
  } catch (error) {
    console.error('❌ Session validation failed:', error);
    alert(error.message);
    setShowRegistration(true);
    return;
  }
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
      menuItemId: item.menuItemId || item.id,
      name: item.name,
      price: parseFloat(item.price),
      quantity: item.quantity,
      category: item.category
    }));

    const orderTotal = getCartTotal();
    const pointsEarned = pointsService.calculatePointsFromOrder(orderTotal);

    console.log('🎯 Creating order with customer:', customer.phone);

    let orderResult;
    
    // 🛠️ FIX: Use existing onCreateOrder if available, otherwise use direct API
    if (onCreateOrder) {
      // Use the existing function but pass customer data
      orderResult = await onCreateOrder(selectedTable, orderData, 'dine-in', { 
        customerPhone: customer.phone,
        customerName: customer.name 
      });
    } else {
      // Fallback to direct API call using CONFIG
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tableId: selectedTable,
          items: orderData,
          orderType: 'dine-in',
          customerPhone: customer.phone,
          customerName: customer.name
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to place order');
      }

      orderResult = await response.json();
    }

    if (orderResult && (orderResult.success || orderResult.orderNumber)) {
      // Add points after successful order
      await addPoints(pointsEarned, orderTotal);
      
      clearCart();
      setIsCartOpen(false);
      
      // Refresh orders
      await loadTableOrders(selectedTable);
      if (getCustomerOrders) {
        const updatedCustomerOrders = await getCustomerOrders();
        setCustomerOrders(updatedCustomerOrders);
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
}, [cart, selectedTable, customer, getCartTotal, onCreateOrder, addPoints, clearCart, setIsCartOpen, loadTableOrders, getCustomerOrders]);

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
        {/* 🎯 FIXED: Only show ACTIVE orders (pending, preparing, ready) */}
        {activeOrders.length > 0 && (
          <div className="orders-group">
            <h3 className="group-title">Active Orders ({activeOrders.length})</h3>
            <div className="orders-scroll-container">
              <div className="orders-list">
                {activeOrders.map((order, index) => (
                  <OrderCard 
                    key={order._id || `order-${index}`} 
                    order={order} 
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 🎯 FIXED: Hide completed orders after payment - only show briefly */}
        {completedOrders.length > 0 && (
          <div className="orders-group completed-orders">
            <h3 className="group-title">Recently Completed ({completedOrders.length})</h3>
            <div className="orders-scroll-container">
              <div className="orders-list">
                {completedOrders
                  .filter(order => {
                    // Only show orders completed in the last 5 minutes
                    const completedTime = new Date(order.completedAt || order.updatedAt);
                    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                    return completedTime > fiveMinutesAgo;
                  })
                  .map((order, index) => (
                    <OrderCard 
                      key={order._id || `completed-${index}`} 
                      order={order} 
                    />
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {displayOrders.length === 0 && (
          <div className="empty-orders">
            <div className="empty-icon">📦</div>
            <p>No active orders</p>
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