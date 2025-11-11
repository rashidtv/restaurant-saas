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

  console.log('🍛 Sample data initialized!');
}

// Generate order number
function generateOrderNumber() {
  return `MESRA${Date.now().toString().slice(-6)}`;
}

// Simple health endpoint for quick response - FIXED CORS
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    orders: orders.length,
    tables: tables.length
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
      payments: payments.length
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
// In server.js - UPDATE the table update endpoint
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

// Return ALL orders
app.get('/api/orders', (req, res) => {
  try {
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// FIXED: Order creation - emit only specific table
app.post('/api/orders', (req, res) => {
  try {
    const { tableId, items, orderType } = req.body;
    
    console.log('📦 Creating order for table:', tableId);
    
    // Validate tableId
    if (!tableId || tableId === 'undefined') {
      return res.status(400).json({ error: 'Valid table ID is required' });
    }
    
    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const order = {
      _id: Date.now().toString(),
      orderNumber: generateOrderNumber(),
      tableId: tableId,
      items: items.map(item => ({
        menuItem: menuItems.find(m => m._id === item.menuItemId) || { 
          _id: item.menuItemId,
          name: item.name || 'Unknown Item', 
          price: item.price || 0 
        },
        quantity: item.quantity,
        specialInstructions: item.specialInstructions,
        price: item.price
      })),
      total,
      status: 'pending',
      paymentStatus: 'pending',
      orderType: orderType || 'dine-in',
      orderedAt: new Date(),
      completedAt: null
    };
    
    orders.push(order);
    
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
    console.log(`📦 New order: ${order.orderNumber} for Table ${tableId}`);
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
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

// Customer orders endpoint for QR codes
app.post('/api/customer/orders', (req, res) => {
  try {
    const { items, orderType = 'dine-in', tableNumber } = req.body;
    
    console.log('📱 QR Order received for table:', tableNumber);
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }

    if (!tableNumber || tableNumber === 'undefined' || tableNumber === 'null') {
      return res.status(400).json({ error: 'Valid table number is required' });
    }

    // Map items using backend menu data
    const mappedItems = items.map(item => {
      const menuItem = menuItems.find(m => m._id === item.menuItemId);

      if (!menuItem) {
        return {
          menuItem: { 
            _id: item.menuItemId,
            name: item.name || 'Unknown Item',
            price: item.price || 0
          },
          quantity: item.quantity || 1,
          specialInstructions: item.specialInstructions || '',
          price: item.price || 0
        };
      }

      return {
        menuItem: menuItem,
        quantity: item.quantity || 1,
        specialInstructions: item.specialInstructions || '',
        price: menuItem.price
      };
    });

    const total = mappedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const order = {
      _id: Date.now().toString(),
      orderNumber: generateOrderNumber(),
      tableId: tableNumber,
      table: tableNumber,
      items: mappedItems,
      total,
      status: 'pending',
      paymentStatus: 'pending',
      customerName: 'QR Customer',
      orderType: orderType,
      orderedAt: new Date(),
      completedAt: null
    };

    orders.push(order);
    
    console.log(`📱 QR Order created: ${order.orderNumber} for Table ${tableNumber}`);
    
    // Update table if available
    const tableIndex = tables.findIndex(t => t.number === tableNumber);
    if (tableIndex !== -1 && tables[tableIndex].status === 'available') {
      tables[tableIndex].status = 'occupied';
      tables[tableIndex].orderId = order._id;
      
      // Emit ONLY this table update
      io.emit('tableUpdated', tables[tableIndex]);
    }
    
    // Emit new order
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
  
  // Initialize data
  initializeData();
});