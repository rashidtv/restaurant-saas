// frontend/src/components/DigitalMenu/DigitalMenu.jsx - FIXED VERSION
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCustomer } from '../../contexts/CustomerContext'; // 🎯 Consistent import
import { useOrders } from '../../hooks/useOrders';
import { useCart } from '../../hooks/useCart';
import { RegistrationModal } from './RegistrationModal';
import { PointsDisplay } from './PointsDisplay';
import OrderCard from './OrderCard';
import { MenuGrid } from './MenuGrid';
import { CartPanel } from './CartPanel';
import { customerService } from '../../services/customerService';
import { CONFIG } from '../../constants/config';
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
  
  // Custom hooks - 🎯 FIX: Use the context hook
  const { 
    customer, 
    registerCustomer, 
    clearCustomer,
    getCustomerOrders,
    addPoints // 🎯 ADD: Missing function
  } = useCustomer();

  const { orders, isLoading: ordersLoading, loadTableOrders } = useOrders();
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

  // 🎯 FIX: Remove all references to customerHook
  // Auto-scroll to top when modal opens
  useEffect(() => {
    if (showRegistration) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      setTimeout(() => {
        const modal = document.querySelector('.registration-modal');
        if (modal) {
          modal.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [showRegistration]);

  // Table detection with session awareness
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
          detectedTable = detectedTable.toString().toUpperCase().trim();
          if (!detectedTable.startsWith('T')) {
            detectedTable = 'T' + detectedTable;
          }
          console.log('🎯 Table detected from URL:', detectedTable);
          setSelectedTable(detectedTable);
        } else {
          console.log('ℹ️ No table parameter found in URL');
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

  // Load customer orders
  // In frontend/src/components/DigitalMenu/DigitalMenu.jsx - UPDATE THE ORDERS LOADING PART

// 🎯 UPDATE: In the load orders useEffect
useEffect(() => {
  const loadOrders = async () => {
    if (selectedTable) {
      try {
        console.log(`🔄 Loading orders for table: ${selectedTable}`);
        await loadTableOrders(selectedTable);
        
        // 🎯 IMPROVED: Only load customer orders if customer exists
        if (customer && getCustomerOrders) {
          try {
            const customerOrdersData = await getCustomerOrders();
            if (Array.isArray(customerOrdersData)) {
              setCustomerOrders(customerOrdersData);
            }
          } catch (customerError) {
            console.log('ℹ️ No customer orders or error:', customerError.message);
            // Don't block the UI for this error
          }
        }
      } catch (error) {
        console.log('ℹ️ Failed to load table orders - this is normal for new tables:', error.message);
        // 🎯 Don't show error to user for this case
      }
    }
  };

  loadOrders();
}, [selectedTable, customer, getCustomerOrders, loadTableOrders]);

  // Show registration when table detected
  useEffect(() => {
    if (selectedTable && !customer) {
      setShowRegistration(true);
      setShowWelcome(false);
    }
  }, [selectedTable, customer]);

  // WebSocket handlers - 🎯 FIX: Remove customerHook references
  useEffect(() => {
    if (!selectedTable || !customer) return;

    const handleOrderUpdated = (updatedOrder) => {
      if (!updatedOrder || !updatedOrder.orderNumber) {
        console.warn('⚠️ Received invalid order update via WebSocket');
        return;
      }
      
      console.log('🔄 Order updated via WebSocket:', updatedOrder.orderNumber);
      
      if (selectedTable) {
        loadTableOrders(selectedTable);
      }
      
      if (customer && updatedOrder.customerPhone === customer.phone) {
        console.log('🎯 Order belongs to current customer, refreshing data...');
        
        getCustomerOrders().then(orders => {
          if (Array.isArray(orders)) {
            setCustomerOrders(orders);
          }
        }).catch(error => {
          console.error('Failed to refresh customer orders:', error);
        });
        
        if (customer.phone && customer.phone !== 'undefined') {
          customerService.refreshCustomerData(customer.phone)
            .then(freshCustomer => {
              if (freshCustomer && freshCustomer.phone) {
                console.log('✅ Customer points refreshed:', freshCustomer.points);
                // 🎯 FIX: Points are automatically updated via context
              }
            })
            .catch(error => {
              console.error('Failed to refresh customer data:', error);
            });
        }
      }
    };

    const handlePaymentProcessed = (payment) => {
      if (!payment || !payment.orderId) {
        console.warn('⚠️ Received invalid payment via WebSocket');
        return;
      }
      
      console.log('💰 Payment processed via WebSocket:', payment.orderId);
      
      if (selectedTable) {
        loadTableOrders(selectedTable);
      }
      
      if (customer && customer.phone && customer.phone !== 'undefined') {
        console.log('💰 Payment completed, refreshing customer data...');
        customerService.refreshCustomerData(customer.phone)
          .then(freshCustomer => {
            if (freshCustomer && freshCustomer.phone) {
              console.log('✅ Points updated after payment:', freshCustomer.points);
              // 🎯 FIX: Points are automatically updated via context
            }
          })
          .catch(error => {
            console.error('Failed to refresh customer after payment:', error);
          });
      }
    };

    if (window.socket) {
      window.socket.on('orderUpdated', handleOrderUpdated);
      window.socket.on('paymentProcessed', handlePaymentProcessed);
      
      console.log('🔌 DigitalMenu WebSocket listeners registered');
    } else {
      console.log('⚠️ Global WebSocket not available, real-time updates disabled');
    }

    return () => {
      if (window.socket) {
        window.socket.off('orderUpdated', handleOrderUpdated);
        window.socket.off('paymentProcessed', handlePaymentProcessed);
        console.log('🧹 DigitalMenu WebSocket listeners cleaned up');
      }
    };
  }, [selectedTable, customer, loadTableOrders, getCustomerOrders]); // 🎯 FIX: Removed customerHook

  // Add to cart function
  const handleAddToCart = useCallback((item, quantity = 1) => {
    console.log('🛒 Adding to cart:', item.name, 'Quantity:', quantity);
    
    if (!item || !item.id) {
      console.error('❌ Invalid item for cart:', item);
      return;
    }
    
    addToCart(item, quantity);
  }, [addToCart]);

// In frontend/src/components/DigitalMenu/DigitalMenu.jsx - UPDATE REGISTRATION HANDLER

// In frontend/src/components/DigitalMenu/DigitalMenu.jsx - UPDATE the handleRegistration function

// In frontend/src/components/DigitalMenu/DigitalMenu.jsx - ADD THIS FUNCTION

// 🎯 CRITICAL: Add the missing handlePlaceOrder function
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
      menuItemId: item.menuItemId || item.id,
      name: item.name,
      price: parseFloat(item.price),
      quantity: item.quantity,
      category: item.category
    }));

    const orderTotal = getCartTotal();
    console.log('🎯 Creating order with customer:', customer.phone);

    let orderResult;
    
    if (onCreateOrder) {
      orderResult = await onCreateOrder(selectedTable, orderData, 'dine-in', { 
        customerPhone: customer.phone,
        customerName: customer.name 
      });
    } else {
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
      clearCart();
      setIsCartOpen(false);
      
      await loadTableOrders(selectedTable);
      if (getCustomerOrders) {
        const updatedCustomerOrders = await getCustomerOrders();
        setCustomerOrders(updatedCustomerOrders);
      }
      
      const orderNumber = orderResult.orderNumber || orderResult.data?.orderNumber || 'N/A';
      alert(`Order #${orderNumber} placed successfully!`);
    } else {
      throw new Error(orderResult?.message || 'Failed to place order');
    }
  } catch (error) {
    console.error('Order placement error:', error);
    alert(`Failed to place order: ${error.message}`);
  } finally {
    setIsPlacingOrder(false);
  }
}, [cart, selectedTable, customer, getCartTotal, onCreateOrder, clearCart, setIsCartOpen, loadTableOrders, getCustomerOrders]);

const handleRegistration = useCallback(async (phone, name) => {
  try {
    console.log('📝 Processing registration for:', phone);
    
    const registeredCustomer = await registerCustomer(phone, name);
    
    if (registeredCustomer) {
      console.log('✅ Registration successful, customer object:', registeredCustomer);
      
      // 🎯 The CustomerContext should automatically update the customer state
      // We just need to close the modals
      setShowRegistration(false);
      setShowWelcome(false);
      
      // 🎯 Small delay to ensure state propagation
      setTimeout(() => {
        console.log('🔄 Registration completed, UI should update automatically');
      }, 100);
    }
  } catch (error) {
    console.error('❌ Registration failed:', error);
    alert(`Registration failed: ${error.message}`);
    throw error;
  }
}, [registerCustomer]); // 🎯 Simplified dependencies

// In DigitalMenu.jsx - TEMPORARY DEBUG BUTTON
{customer && (
  <div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '8px', margin: '1rem 0' }}>
    <h4>Debug Info</h4>
    <p>Customer: {customer.phone}</p>
    <p>Points: {customer.points}</p>
    <button 
      onClick={() => {
        console.log('🔄 Manual refresh - Customer:', customer);
        loadTableOrders(selectedTable);
      }}
      style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}
    >
      Refresh Data
    </button>
  </div>
)}

// 🎯 FIX: Add useEffect to detect customer changes
useEffect(() => {
  if (customer) {
    console.log('🎯 Customer detected in DigitalMenu:', customer.phone);
    console.log('🎯 Customer points:', customer.points);
    
    // 🎯 Force re-render when customer is set
    setShowWelcome(false);
    
    // 🎯 Load customer-specific data
    if (selectedTable) {
      loadTableOrders(selectedTable);
      
      // Load customer orders
      if (getCustomerOrders) {
        getCustomerOrders().then(orders => {
          if (Array.isArray(orders)) {
            setCustomerOrders(orders);
          }
        });
      }
    }
  }
}, [customer, selectedTable, loadTableOrders, getCustomerOrders]);

// In frontend/src/components/DigitalMenu/DigitalMenu.jsx - ADD THIS useEffect

// 🎯 ADD: Detect when customer becomes available and update UI
useEffect(() => {
  console.log('🎯 Customer state changed in DigitalMenu:', {
    hasCustomer: !!customer,
    customerPhone: customer?.phone,
    customerPoints: customer?.points,
    showRegistration: showRegistration,
    showWelcome: showWelcome
  });

  if (customer) {
    console.log('✅ Customer detected, updating UI...');
    // 🎯 Force hide registration and welcome when customer is available
    setShowRegistration(false);
    setShowWelcome(false);
    
    // 🎯 Refresh orders to show customer-specific data
    if (selectedTable) {
      setTimeout(() => {
        loadTableOrders(selectedTable);
      }, 100);
    }
  }
}, [customer, selectedTable, loadTableOrders]); // 🎯 Only depend on customer state

  const toggleCart = useCallback(() => {
    setIsCartOpen(prev => !prev);
  }, []);

  const displayOrders = customerOrders.length > 0 ? customerOrders : orders;
  const activeOrders = displayOrders.filter(order => 
    order && ['pending', 'preparing', 'ready'].includes(order.status)
  );
  const completedOrders = displayOrders.filter(order => 
    order && order.status === 'completed'
  );

  const categories = ['all', ...new Set(menu.map(item => item.category))];
  const displayMenu = menu && menu.length > 0 ? menu : [];

  // CUSTOMER VIEW
  if (isCustomerView) {
    return (
      <div className="digital-menu">
        {/* Registration Modal */}
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
                points={customer.points || 0}
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

                    {completedOrders.length > 0 && (
                      <div className="orders-group completed-orders">
                        <h3 className="group-title">Recently Completed ({completedOrders.length})</h3>
                        <div className="orders-scroll-container">
                          <div className="orders-list">
                            {completedOrders
                              .filter(order => {
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

        {/* Cart Panel */}
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

export default DigitalMenu;