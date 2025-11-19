const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// CORS configuration - FIXED: Remove cache-control from allowed headers
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://restaurant-saas-demo.onrender.com';

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://restaurant-saas-demo.onrender.com",
    FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  // REMOVED: allowedHeaders to use default ones
}));

app.options('*', cors());

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173", 
      "https://restaurant-saas-demo.onrender.com",
      FRONTEND_URL
    ].filter(Boolean),
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(express.json());

let orders = [];
let tables = [];
let payments = [];
let menuItems = [];
let customers = []; // ✅ NEW: Customer data storage

// Initialize sample data
function initializeData() {
  // Malaysian Menu Data
  menuItems = [
    {
      _id: '1', name: "Teh Tarik", price: 4.50, category: "drinks", preparationTime: 5,
      nameBM: "Teh Tarik", description: "Famous Malaysian pulled tea", descriptionBM: "Teh tarik terkenal Malaysia"
    },
    {
      _id: '2', name: "Kopi O", price: 3.80, category: "drinks", preparationTime: 3,
      nameBM: "Kopi O", description: "Traditional black coffee", descriptionBM: "Kopi hitam tradisional"
    },
    {
      _id: '3', name: "Milo Dinosaur", price: 6.50, category: "drinks", preparationTime: 4,
      nameBM: "Milo Dinosaur", description: "Iced Milo with extra Milo powder", descriptionBM: "Milo ais dengan serbuk Milo tambahan"
    },
    {
      _id: '4', name: "Nasi Lemak", price: 12.90, category: "main", preparationTime: 15,
      nameBM: "Nasi Lemak", description: "Coconut rice with sambal", descriptionBM: "Nasi santan dengan sambal"
    },
    {
      _id: '5', name: "Char Kuey Teow", price: 14.50, category: "main", preparationTime: 12,
      nameBM: "Char Kuey Teow", description: "Stir-fried rice noodles", descriptionBM: "Kuey teow goreng"
    },
    {
      _id: '6', name: "Roti Canai", price: 3.50, category: "main", preparationTime: 8,
      nameBM: "Roti Canai", description: "Flaky flatbread with curry", descriptionBM: "Roti canai dengan kuah kari"
    },
    {
      _id: '7', name: "Satay Set", price: 18.90, category: "main", preparationTime: 20,
      nameBM: "Set Satay", description: "Chicken satay with peanut sauce", descriptionBM: "Satay ayam dengan kuah kacang"
    },
    {
      _id: '8', name: "Cendol", price: 6.90, category: "desserts", preparationTime: 7,
      nameBM: "Cendol", description: "Shaved ice dessert", descriptionBM: "Pencuci mulut ais"
    },
    {
      _id: '9', name: "Apam Balik", price: 5.50, category: "desserts", preparationTime: 10,
      nameBM: "Apam Balik", description: "Malaysian peanut pancake", descriptionBM: "Apam balik kacang"
    }
  ];

  // Sample tables
  tables = [
    { _id: '1', number: 'T01', status: 'available', capacity: 4, lastCleaned: new Date(), orderId: null },
    { _id: '2', number: 'T02', status: 'available', capacity: 2, lastCleaned: new Date(), orderId: null },
    { _id: '3', number: 'T03', status: 'available', capacity: 6, lastCleaned: new Date(), orderId: null },
    { _id: '4', number: 'T04', status: 'available', capacity: 4, lastCleaned: new Date(), orderId: null },
    { _id: '5', number: 'T05', status: 'available', capacity: 4, lastCleaned: new Date(), orderId: null },
    { _id: '6', number: 'T06', status: 'available', capacity: 2, lastCleaned: new Date(), orderId: null },
    { _id: '7', number: 'T07', status: 'available', capacity: 4, lastCleaned: new Date(), orderId: null },
    { _id: '8', number: 'T08', status: 'available', capacity: 8, lastCleaned: new Date(), orderId: null }
  ];

  // ✅ NEW: Initialize empty customers array
  customers = [];

  console.log('🍛 Sample data initialized!');
}

// Generate order number
function generateOrderNumber() {
  return `MESRA${Date.now().toString().slice(-6)}`;
}

// ✅ NEW: Customer management functions
function getCustomerByPhone(phone) {
  const cleanPhone = phone.replace(/\D/g, '');
  return customers.find(c => c.phone === cleanPhone);
}

function createOrUpdateCustomer(phone, name = '', pointsToAdd = 0) {
  const cleanPhone = phone.replace(/\D/g, '');
  let customer = customers.find(c => c.phone === cleanPhone);
  
  if (!customer) {
    customer = {
      _id: Date.now().toString(),
      phone: cleanPhone,
      name: name || `Customer-${cleanPhone.slice(-4)}`,
      points: 0,
      totalOrders: 0,
      totalSpent: 0,
      firstVisit: new Date(),
      lastVisit: new Date()
    };
    customers.push(customer);
  }
  
  // Update customer data
  customer.points += pointsToAdd;
  customer.totalOrders += 1;
  customer.lastVisit = new Date();
  
  return customer;
}

// Simple health endpoint for quick response - FIXED CORS
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    orders: orders.length,
    tables: tables.length,
    customers: customers.length // ✅ NEW: Include customers count
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Restaurant SaaS API is running',
    timestamp: new Date().toISOString(),
    data: {
      menuItems: menuItems.length,
      tables: tables.length,
      orders: orders.length,
      payments: payments.length,
      customers: customers.length // ✅ NEW: Include customers count
    }
  });
});

// Initialize data endpoint
app.post('/api/init', (req, res) => {
  initializeData();
  res.json({ message: 'Sample data initialized successfully' });
});

// API Routes
app.get('/api/menu', (req, res) => {
  try {
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tables', (req, res) => {
  try {
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// FIXED: Table update endpoint
app.put('/api/tables/:id', (req, res) => {
  try {
    const tableId = req.params.id;
    const tableIndex = tables.findIndex(t => t._id === tableId);
    
    if (tableIndex === -1) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    const currentTable = tables[tableIndex];
    const newStatus = req.body.status;
    
    // 🎯 CRITICAL: Only update if status actually changed
    if (currentTable.status === newStatus) {
      console.log(`⚠️ Table ${currentTable.number} status unchanged (${newStatus}), skipping update`);
      return res.json(currentTable);
    }
    
    // Update table
    tables[tableIndex] = { ...currentTable, ...req.body };
    
    console.log(`🔄 Table ${tables[tableIndex].number} status changed from ${currentTable.status} to ${newStatus}`);
    
    // Emit update for ONLY this table
    io.emit('tableUpdated', tables[tableIndex]);
    
    res.json(tables[tableIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ ENHANCED: Return ALL orders with proper data structure
app.get('/api/orders', (req, res) => {
  try {
    // ✅ ENHANCED: Ensure all orders have proper data structure
    const enhancedOrders = orders.map(order => ({
      ...order,
      // Ensure items have proper structure with names and prices
      items: order.items?.map(item => {
        // Find the menu item to get proper name and details
        const menuItem = menuItems.find(m => m._id === (item.menuItemId || item.menuItem?._id));
        
        return {
          menuItemId: item.menuItemId || item.menuItem?._id,
          name: item.name || menuItem?.name || item.menuItem?.name || 'Menu Item',
          price: parseFloat(item.price) || parseFloat(menuItem?.price) || parseFloat(item.menuItem?.price) || 0,
          quantity: parseInt(item.quantity) || 1,
          category: item.category || menuItem?.category,
          description: item.description || menuItem?.description,
          // Include any other existing fields
          ...item
        };
      }) || [],
      // Ensure dates are properly formatted
      createdAt: order.createdAt || order.orderedAt || order.timestamp,
      updatedAt: order.updatedAt || order.orderedAt || order.timestamp,
      // Ensure customer info is included
      customerPhone: order.customerPhone || '',
      customerName: order.customerName || ''
    }));
    
    res.json(enhancedOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ ENHANCED: Order creation with customer tracking
app.post('/api/orders', (req, res) => {
  try {
    const { 
      tableId, 
      items, 
      orderType, 
      customerPhone,  // ✅ NEW: Accept customer info
      customerName    // ✅ NEW: Optional customer name
    } = req.body;
    
    console.log('📦 Creating order for table:', tableId, 'Customer:', customerPhone);
    
    // Validate tableId
    if (!tableId || tableId === 'undefined') {
      return res.status(400).json({ error: 'Valid table ID is required' });
    }
    
    // ✅ ENHANCED: Calculate total properly with validation
    const total = items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0);

    // ✅ ENHANCED: Map items with proper structure
    const orderItems = items.map(item => {
      const menuItem = menuItems.find(m => m._id === item.menuItemId);
      
      return {
        menuItemId: item.menuItemId,
        name: item.name || menuItem?.name || 'Menu Item',
        price: parseFloat(item.price) || parseFloat(menuItem?.price) || 0,
        quantity: parseInt(item.quantity) || 1,
        category: item.category || menuItem?.category,
        description: item.description || menuItem?.description,
        specialInstructions: item.specialInstructions || ''
      };
    });

    const order = {
      _id: Date.now().toString(),
      orderNumber: generateOrderNumber(),
      tableId: tableId,
      table: tableId, // Maintain compatibility
      items: orderItems,
      total,
      status: 'pending',
      paymentStatus: 'pending',
      orderType: orderType || 'dine-in',
      orderedAt: new Date(),
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // ✅ NEW: Store customer information
      ...(customerPhone && { customerPhone }),
      ...(customerName && { customerName })
    };
    
    orders.push(order);
    
    // ✅ NEW: Update customer points if customer provided
    if (customerPhone) {
      const pointsEarned = Math.floor(total); // 1 point per RM 1
      const customer = createOrUpdateCustomer(customerPhone, customerName, pointsEarned);
      console.log(`🎯 Customer ${customerPhone} earned ${pointsEarned} points, total: ${customer.points}`);
    }
    
    // Update table status - FIXED: Only update the specific table
    const tableIndex = tables.findIndex(t => t.number === tableId);
    if (tableIndex !== -1) {
      tables[tableIndex].status = 'occupied';
      tables[tableIndex].orderId = order._id;
      
      // Emit table update for ONLY this table
      console.log(`🔄 Emitting table update for: ${tables[tableIndex].number}`);
      io.emit('tableUpdated', tables[tableIndex]);
    }
    
    // Emit new order
    io.emit('newOrder', order);
    console.log(`📦 New order: ${order.orderNumber} for Table ${tableId}, Customer: ${customerPhone || 'No customer'}`);
    
    res.json({
      success: true,
      orderNumber: order.orderNumber,
      order: order,
      message: `Order created successfully`
    });
  } catch (error) {
    console.error('❌ Order creation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create order: ' + error.message 
    });
  }
});

// Order status endpoint
app.put('/api/orders/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    
    console.log(`🔄 Updating order ${orderId} to status: ${status}`);
    
    const orderIndex = orders.findIndex(o => 
      o._id === orderId || o.orderNumber === orderId
    );
    
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    orders[orderIndex].status = status;
    orders[orderIndex].updatedAt = new Date();
    
    if (status === 'completed') {
      orders[orderIndex].completedAt = new Date();
      orders[orderIndex].paymentStatus = 'pending';
    }
    
    io.emit('orderUpdated', orders[orderIndex]);
    res.json(orders[orderIndex]);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ NEW: Customer management endpoints
app.get('/api/customers', (req, res) => {
  try {
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/customers/:phone', (req, res) => {
  try {
    const { phone } = req.params;
    const customer = getCustomerByPhone(phone);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', (req, res) => {
  try {
    const { phone, name } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    const customer = createOrUpdateCustomer(phone, name);
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/customers/:phone/points', (req, res) => {
  try {
    const { phone } = req.params;
    const { points, action = 'add' } = req.body; // action: 'add' or 'set'
    
    let customer = getCustomerByPhone(phone);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    if (action === 'set') {
      customer.points = parseInt(points) || 0;
    } else {
      customer.points += parseInt(points) || 0;
    }
    
    customer.lastVisit = new Date();
    
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Payments endpoints
app.get('/api/payments', (req, res) => {
  try {
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// In server.js - UPDATE the payments endpoint
app.post('/api/payments', (req, res) => {
  try {
    const { orderId, amount, method } = req.body;
    
    console.log('💰 Processing payment for order:', orderId);
    
    const orderIndex = orders.findIndex(o => 
      o.orderNumber === orderId || o._id === orderId
    );
    
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orders[orderIndex];
    const payment = {
      _id: Date.now().toString(),
      orderId: order.orderNumber,
      orderInternalId: order._id,
      amount,
      method,
      status: 'completed',
      paidAt: new Date()
    };
    
    payments.push(payment);
    
    // UPDATE ORDER STATUS
    orders[orderIndex].paymentStatus = 'paid';
    orders[orderIndex].paymentMethod = method;
    orders[orderIndex].updatedAt = new Date();
    
    console.log('✅ Payment processed for order:', order.orderNumber);
    
    // 🎯 CRITICAL: Only update table if it exists and status will actually change
    const tableId = order.tableId;
    
    if (tableId && tableId !== 'undefined' && tableId !== 'null') {
      const tableIndex = tables.findIndex(t => t.number === tableId);
      
      if (tableIndex !== -1) {
        const currentTable = tables[tableIndex];
        
        // Only update if table is not already needs_cleaning
        if (currentTable.status !== 'needs_cleaning') {
          tables[tableIndex].status = 'needs_cleaning';
          tables[tableIndex].orderId = null;
          
          console.log('🎯 Table marked for cleaning:', tables[tableIndex].number);
          // Emit ONLY this table update
          io.emit('tableUpdated', tables[tableIndex]);
        } else {
          console.log('⚠️ Table already needs cleaning, skipping update:', currentTable.number);
        }
      }
    }
    
    // Emit events
    io.emit('paymentProcessed', payment);
    io.emit('orderUpdated', orders[orderIndex]);
    
    res.json(payment);
  } catch (error) {
    console.error('❌ Payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/orders/table/:tableId - Check for active orders
app.get('/api/orders/table/:tableId', (req, res) => {
  try {
    const tableId = req.params.tableId;
    console.log('🔍 Checking active orders for table:', tableId);
    
    const activeOrders = orders.filter(order => 
      order.tableId === tableId && 
      ['pending', 'preparing', 'ready'].includes(order.status)
    );
    
    // Return the most recent active order
    const latestOrder = activeOrders.length > 0 
      ? activeOrders.reduce((latest, order) => 
          new Date(order.orderedAt) > new Date(latest.orderedAt) ? order : latest
        )
      : null;
    
    console.log('✅ Active order check result:', latestOrder ? latestOrder.orderNumber : 'No active orders');
    res.json(latestOrder);
  } catch (error) {
    console.error('❌ Error checking active orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/orders/:id/items - Add items to existing order
app.put('/api/orders/:id/items', (req, res) => {
  try {
    const orderId = req.params.id;
    const { newItems } = req.body;
    
    console.log('➕ Adding items to order:', orderId, newItems);
    
    const orderIndex = orders.findIndex(o => o._id === orderId);
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orders[orderIndex];
    
    // Add new items to the order
    const addedItems = newItems.map(item => {
      const menuItem = menuItems.find(m => m._id === item.menuItemId);
      
      return {
        menuItemId: item.menuItemId,
        name: item.name || menuItem?.name || 'Menu Item',
        price: parseFloat(item.price) || parseFloat(menuItem?.price) || 0,
        quantity: parseInt(item.quantity) || 1,
        category: item.category || menuItem?.category,
        specialInstructions: item.specialInstructions || ''
      };
    });
    
    order.items.push(...addedItems);
    order.total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    order.updatedAt = new Date();
    
    console.log('✅ Order updated with new items:', order.orderNumber);
    
    // Emit order update
    io.emit('orderUpdated', order);
    res.json(order);
  } catch (error) {
    console.error('❌ Error adding items to order:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ ENHANCED: Customer orders endpoint with proper data structure
app.post('/api/customer/orders', (req, res) => {
  try {
    const { items, orderType = 'dine-in', tableNumber, customerPhone, customerName } = req.body;
    
    console.log('📱 QR Order received for table:', tableNumber, 'Customer:', customerPhone, customerName);
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }

    if (!tableNumber || tableNumber === 'undefined' || tableNumber === 'null') {
      return res.status(400).json({ error: 'Valid table number is required' });
    }

    // ✅ ENHANCED: Calculate total properly
    const total = items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0);

    // ✅ ENHANCED: Map items with proper structure
    const orderItems = items.map(item => {
      const menuItem = menuItems.find(m => m._id === item.menuItemId);
      
      return {
        menuItemId: item.menuItemId,
        name: item.name || menuItem?.name || 'Menu Item',
        price: parseFloat(item.price) || parseFloat(menuItem?.price) || 0,
        quantity: parseInt(item.quantity) || 1,
        category: item.category || menuItem?.category,
        description: item.description || menuItem?.description,
        specialInstructions: item.specialInstructions || ''
      };
    });

    const order = {
      _id: Date.now().toString(),
      orderNumber: generateOrderNumber(),
      tableId: tableNumber,
      table: tableNumber,
      items: orderItems,
      total,
      status: 'pending',
      paymentStatus: 'pending',
      // 🎯 CRITICAL: Save customer info
      customerPhone: customerPhone || '',
      customerName: customerName || '',
      orderType: orderType,
      orderedAt: new Date(),
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    orders.push(order);
    
    // ✅ NEW: Update customer points if customer provided
    if (customerPhone) {
      const pointsEarned = Math.floor(total); // 1 point per RM 1
      const customer = createOrUpdateCustomer(customerPhone, customerName, pointsEarned);
      console.log(`🎯 Customer ${customerPhone} earned ${pointsEarned} points, total: ${customer.points}`);
    }
    
    console.log(`📱 QR Order created: ${order.orderNumber} for Table ${tableNumber}, Customer: ${customerName} (${customerPhone})`);
    
    // Update table if available
    const tableIndex = tables.findIndex(t => t.number === tableNumber);
    if (tableIndex !== -1 && tables[tableIndex].status === 'available') {
      tables[tableIndex].status = 'occupied';
      tables[tableIndex].orderId = order._id;
      
      // Emit ONLY this table update
      io.emit('tableUpdated', tables[tableIndex]);
    }
    
    // Emit new order with customer info
    io.emit('newOrder', order);
    
    res.json({
      success: true,
      orderNumber: order.orderNumber,
      message: `Order placed successfully! Order Number: ${order.orderNumber}`,
      order: order
    });
  } catch (error) {
    console.error('❌ QR Order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('🔌 Client connected');
  
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected');
  });
});

const PORT = process.env.PORT || 10000;

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Mesra POS Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 CORS enabled for: ${FRONTEND_URL}`);
  console.log(`👥 Customer tracking: ENABLED`);
  console.log(`🎯 Loyalty points: ENABLED`);
  
  // Initialize data
  initializeData();
});