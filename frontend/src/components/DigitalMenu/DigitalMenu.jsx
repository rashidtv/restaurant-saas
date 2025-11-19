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
  const digitalMenuRef = useRef(null);
  
  // Custom hooks
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

  // Table detection from URL
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
      // Small delay to ensure the cart panel is fully rendered
      setTimeout(() => {
        cartPanelRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end',
          inline: 'nearest'
        });
      }, 100);
    }
  }, [isCartOpen]);

  // Load customer orders when available
  useEffect(() => {
    const loadCustomerOrders = async () => {
      if (selectedTable && customer && getCustomerOrders) {
        try {
          const orders = await getCustomerOrders();
          setCustomerOrders(orders);
        } catch (error) {
          console.error('Failed to load customer orders:', error);
          await loadTableOrders(selectedTable);
        }
      }
    };

    loadCustomerOrders();
  }, [selectedTable, customer, getCustomerOrders, loadTableOrders]);

  // Show registration when table detected and no customer
  useEffect(() => {
    if (selectedTable && !customer) {
      setShowRegistration(true);
      setShowWelcome(false);
    }
  }, [selectedTable, customer]);

  // Enhanced add to cart with better error handling
  const handleAddToCart = useCallback((item, quantity = 1) => {
    if (!customer) {
      setShowRegistration(true);
      return;
    }
    
    try {
      // Normalize the item structure before adding to cart
      const normalizedItem = {
        id: item.id || item._id,
        _id: item._id || item.id,
        name: item.name,
        price: parseFloat(item.price),
        category: item.category,
        description: item.description
      };
      
      addToCart(normalizedItem, quantity);
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
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
        
        setTimeout(async () => {
          try {
            await loadTableOrders(selectedTable);
            if (getCustomerOrders) {
              const orders = await getCustomerOrders();
              setCustomerOrders(orders);
            }
          } catch (error) {
            console.error('Error refreshing orders:', error);
          }
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

  // Fixed: Enhanced cart toggle with auto-scroll
  const toggleCart = useCallback(() => {
    const willOpen = !isCartOpen;
    setIsCartOpen(willOpen);
    
    if (willOpen) {
      // Auto-scroll will be handled by the useEffect above
    }
  }, [isCartOpen]);

  // Separate orders by status
  const displayOrders = customerOrders.length > 0 ? customerOrders : orders;
  const activeOrders = displayOrders.filter(order => 
    ['pending', 'preparing', 'ready'].includes(order.status)
  );
  const completedOrders = displayOrders.filter(order => order.status === 'completed');

  // Categories for menu
  const categories = ['all', ...new Set(menu.map(item => item.category))];

  // Normalize menu items for consistent structure
  const displayMenu = menu && menu.length > 0 ? menu.map(item => ({
    id: item.id || item._id,
    _id: item._id || item.id,
    name: item.name,
    price: parseFloat(item.price),
    category: item.category,
    description: item.description
  })) : [];

  // CUSTOMER VIEW
  if (isCustomerView) {
    return (
      <div className="digital-menu" ref={digitalMenuRef}>
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
        <header 
          className={`menu-header ${headerSticky ? 'sticky' : ''}`}
        >
          <div className="header-content">
            <h1 className="restaurant-name">FlavorFlow</h1>
            {selectedTable && (
              <div className="table-info">Table {selectedTable}</div>
            )}
          </div>
          
          {/* Fixed Cart Button */}
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

            {/* Orders Section */}
            {customer && (
              <div className="orders-section">
                <div className="section-header">
                  <h2>Your Orders</h2>
                  <button 
                    onClick={async () => {
                      try {
                        await loadTableOrders(selectedTable);
                        if (getCustomerOrders) {
                          const orders = await getCustomerOrders();
                          setCustomerOrders(orders);
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