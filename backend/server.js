const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Get frontend URL from environment or use the actual deployed URL
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://restaurant-saas-demo.onrender.com';

console.log('🔧 CORS configured for frontend:', FRONTEND_URL);

// Enhanced CORS configuration
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://restaurant-saas-demo.onrender.com", // YOUR ACTUAL FRONTEND
    FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173", 
      "https://restaurant-saas-demo.onrender.com", // YOUR ACTUAL FRONTEND
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
    // Drinks
    {
      _id: '1',
      name: "Teh Tarik",
      nameBM: "Teh Tarik",
      description: "Famous Malaysian pulled tea with creamy texture",
      descriptionBM: "Teh tarik terkenal Malaysia dengan tekstur berkrim",
      price: 4.50,
      category: "drinks",
      preparationTime: 5,
      spicyLevel: "Mild"
    },
    {
      _id: '2',
      name: "Kopi O",
      nameBM: "Kopi O",
      description: "Traditional black coffee",
      descriptionBM: "Kopi hitam tradisional",
      price: 3.80,
      category: "drinks",
      preparationTime: 3,
      spicyLevel: "Mild"
    },
    {
      _id: '3',
      name: "Milo Dinosaur",
      nameBM: "Milo Dinosaur",
      description: "Iced Milo with extra Milo powder on top",
      descriptionBM: "Milo ais dengan serbuk Milo tambahan",
      price: 6.50,
      category: "drinks",
      preparationTime: 4,
      spicyLevel: "Mild"
    },

    // Malaysian Main Courses
    {
      _id: '4',
      name: "Nasi Lemak",
      nameBM: "Nasi Lemak",
      description: "Coconut rice with sambal, anchovies, peanuts, and egg",
      descriptionBM: "Nasi santan dengan sambal, ikan bilis, kacang dan telur",
      price: 12.90,
      category: "main",
      preparationTime: 15,
      spicyLevel: "Medium"
    },
    {
      _id: '5',
      name: "Char Kuey Teow",
      nameBM: "Char Kuey Teow",
      description: "Stir-fried rice noodles with prawns, cockles, and bean sprouts",
      descriptionBM: "Kuey teow goreng dengan udang, kerang dan taugeh",
      price: 14.50,
      category: "main",
      preparationTime: 12,
      spicyLevel: "Medium"
    },
    {
      _id: '6',
      name: "Roti Canai",
      nameBM: "Roti Canai",
      description: "Flaky flatbread served with dhal curry",
      descriptionBM: "Roti canai berlapis dihidang dengan kuah dhal",
      price: 3.50,
      category: "main",
      preparationTime: 8,
      spicyLevel: "Mild"
    },
    {
      _id: '7',
      name: "Satay Set",
      nameBM: "Set Satay",
      description: "6 chicken satay sticks with peanut sauce and ketupat",
      descriptionBM: "6 cucuk satay ayam dengan kuah kacang dan ketupat",
      price: 18.90,
      category: "main",
      preparationTime: 20,
      spicyLevel: "Mild"
    },

    // Desserts
    {
      _id: '8',
      name: "Cendol",
      nameBM: "Cendol",
      description: "Shaved ice dessert with coconut milk and palm sugar",
      descriptionBM: "Pencuci mulut ais dengan santan dan gula melaka",
      price: 6.90,
      category: "desserts",
      preparationTime: 7,
      spicyLevel: "Mild"
    },
    {
      _id: '9',
      name: "Apam Balik",
      nameBM: "Apam Balik",
      description: "Malaysian peanut pancake",
      descriptionBM: "Apam balik kacang",
      price: 5.50,
      category: "desserts",
      preparationTime: 10,
      spicyLevel: "Mild"
    }
  ];

  // Sample tables
  tables = [
    { _id: '1', number: 'T01', status: 'available', capacity: 4, lastCleaned: new Date() },
    { _id: '2', number: 'T02', status: 'available', capacity: 2, lastCleaned: new Date() },
    { _id: '3', number: 'T03', status: 'available', capacity: 6, lastCleaned: new Date() },
    { _id: '4', number: 'T04', status: 'available', capacity: 4, lastCleaned: new Date() },
    { _id: '5', number: 'T05', status: 'available', capacity: 4, lastCleaned: new Date() },
    { _id: '6', number: 'T06', status: 'available', capacity: 2, lastCleaned: new Date() },
    { _id: '7', number: 'T07', status: 'available', capacity: 4, lastCleaned: new Date() },
    { _id: '8', number: 'T08', status: 'available', capacity: 8, lastCleaned: new Date() }
  ];

  console.log('🍛 Sample data initialized!');
}

// Generate order number (MESRA001, MESRA002, etc.)
function generateOrderNumber() {
  return `MESRA${Date.now().toString().slice(-6)}`;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Restaurant SaaS API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
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

app.put('/api/tables/:id', (req, res) => {
  try {
    const tableId = req.params.id;
    const tableIndex = tables.findIndex(t => t._id === tableId);
    
    if (tableIndex === -1) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    tables[tableIndex] = { ...tables[tableIndex], ...req.body };
    res.json(tables[tableIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders', (req, res) => {
  try {
    const activeOrders = orders.filter(order => order.status !== 'completed');
    res.json(activeOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', (req, res) => {
  try {
    const { tableId, items, customerName, customerPhone, orderType } = req.body;
    
    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const order = {
      _id: Date.now().toString(),
      orderNumber: generateOrderNumber(),
      tableId,
      items: items.map(item => ({
        menuItem: menuItems.find(m => m._id === item.menuItemId) || { name: 'Unknown Item', price: 0 },
        quantity: item.quantity,
        specialInstructions: item.specialInstructions,
        price: item.price
      })),
      total,
      status: 'pending',
      customerName: customerName || '',
      customerPhone: customerPhone || '',
      orderType: orderType || 'dine-in',
      paymentStatus: 'pending',
      orderedAt: new Date(),
      completedAt: null
    };
    
    orders.push(order);
    
    // Update table status
    const tableIndex = tables.findIndex(t => t.number === tableId);
    if (tableIndex !== -1) {
      tables[tableIndex].status = 'occupied';
      tables[tableIndex].orderId = order._id;
    }
    
    io.emit('newOrder', order);
    console.log(`📦 New order: ${order.orderNumber} for Table ${tableId}`);
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/orders/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    const orderIndex = orders.findIndex(o => o._id === orderId);
    
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    orders[orderIndex].status = status;
    
    if (status === 'completed') {
      orders[orderIndex].completedAt = new Date();
      
      // Free the table and mark for cleaning
      const tableIndex = tables.findIndex(t => t.orderId === orderId);
      if (tableIndex !== -1) {
        tables[tableIndex].status = 'needs_cleaning';
        tables[tableIndex].orderId = null;
      }
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

app.post('/api/payments', (req, res) => {
  try {
    const { orderId, amount, method } = req.body;
    
    const payment = {
      _id: Date.now().toString(),
      orderId,
      amount,
      method,
      status: 'completed',
      paidAt: new Date()
    };
    
    payments.push(payment);
    
    // Update order payment status
    const orderIndex = orders.findIndex(o => o.orderNumber === orderId);
    if (orderIndex !== -1) {
      orders[orderIndex].paymentStatus = 'paid';
      orders[orderIndex].paymentMethod = method;
    }
    
    res.json(payment);
  } catch (error) {
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
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 CORS enabled for: ${FRONTEND_URL}`);
  console.log(`🍛 Serving authentic Malaysian cuisine!`);
  console.log(`💵 Currency: Malaysian Ringgit (MYR)`);
  
  // Initialize data
  initializeData();
});