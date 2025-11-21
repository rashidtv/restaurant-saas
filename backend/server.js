const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// MongoDB Configuration - FIXED FOR RENDER
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rashhanz_db_user:mawip900@flavorflow.5wxjnlj.mongodb.net/restaurant_saas?retryWrites=true&w=majority&appName=flavorflow';
const DB_NAME = process.env.DB_NAME || 'restaurant_saas';

// Validate environment variables
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

let db = null;
let mongoClient = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

// CORS configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://restaurant-saas-demo.onrender.com';

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://restaurant-saas-demo.onrender.com",
    FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
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

// 🛠️ WEB SOCKET VALIDATION MIDDLEWARE - ADDED FOR PRODUCTION
const validateSocketData = (data, eventName) => {
  if (data === null || data === undefined) {
    console.warn(`⚠️ Blocking null data for event: ${eventName}`);
    return false;
  }
  
  // Validate order updates
  if (eventName === 'orderUpdate' || eventName === 'orderUpdated') {
    if (!data.orderId && !data.orderNumber) {
      console.warn(`⚠️ Invalid order data for ${eventName}:`, data);
      return false;
    }
  }
  
  // Validate table updates
  if (eventName === 'tableUpdate' || eventName === 'tableUpdated') {
    if (!data._id && !data.number) {
      console.warn(`⚠️ Invalid table data for ${eventName}:`, data);
      return false;
    }
  }
  
  // Validate payment updates
  if (eventName === 'paymentProcessed') {
    if (!data.orderId && !data._id) {
      console.warn(`⚠️ Invalid payment data for ${eventName}:`, data);
      return false;
    }
  }
  
  return true;
};

// Enhanced event emitter
const safeEmit = (event, data) => {
  if (validateSocketData(data, event)) {
    io.emit(event, data);
    console.log(`✅ Emitted ${event} successfully`);
  } else {
    console.warn(`🚫 Blocked invalid ${event} emission:`, data);
  }
};

app.use(express.json());

// Fixed MongoDB Connection for Render
async function initializeDatabase() {
  try {
    connectionAttempts++;
    console.log(`🔗 MongoDB connection attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}...`);

    // FIX: Use connection options that work with Render's environment
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      maxPoolSize: 5,
      minPoolSize: 1,
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
    });

    console.log('🔄 Connecting to MongoDB...');
    await client.connect();
    
    mongoClient = client;
    db = client.db(DB_NAME);

    // Test the connection
    await db.command({ ping: 1 });
    console.log('✅ Connected to MongoDB successfully!');
    console.log(`📊 Database: ${DB_NAME}`);

    // Initialize database
    await createDatabaseIndexes();
    await initializeSampleData();

    console.log('🎉 Database initialization completed');

  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    console.error(`🔧 Error details:`, error);
    
    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      const retryDelay = Math.min(3000 * connectionAttempts, 15000);
      console.log(`🔄 Retrying in ${retryDelay/1000} seconds...`);
      setTimeout(initializeDatabase, retryDelay);
    } else {
      console.error('💡 Server running without database connection');
      console.error('🔧 Please check:');
      console.error('   1. MongoDB Atlas IP whitelist includes 0.0.0.0/0');
      console.error('   2. Database user has correct permissions');
      console.error('   3. MongoDB Atlas cluster is running');
    }
  }
}

async function createDatabaseIndexes() {
  try {
    console.log('📊 Creating database indexes...');
    
    await db.collection('customers').createIndex({ phone: 1 }, { unique: true, sparse: true });
    await db.collection('orders').createIndex({ orderNumber: 1 }, { unique: true });
    await db.collection('orders').createIndex({ customerPhone: 1 });
    await db.collection('orders').createIndex({ tableId: 1 });
    await db.collection('orders').createIndex({ createdAt: -1 });
    await db.collection('tables').createIndex({ number: 1 }, { unique: true });
    
    console.log('✅ Database indexes created');
  } catch (error) {
    console.error('❌ Error creating indexes:', error.message);
  }
}

// Initialize sample data
async function initializeSampleData() {
  try {
    if (!db) return;
    
    console.log('📦 Checking for sample data...');
    
    const menuCount = await db.collection('menuItems').countDocuments();
    const tablesCount = await db.collection('tables').countDocuments();
    
    if (menuCount === 0) {
      const menuItems = [
        {
          _id: new ObjectId(),
          name: "Teh Tarik", 
          price: 4.50, 
          category: "drinks", 
          preparationTime: 5,
          nameBM: "Teh Tarik", 
          description: "Famous Malaysian pulled tea", 
          descriptionBM: "Teh tarik terkenal Malaysia",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId(),
          name: "Kopi O", 
          price: 3.80, 
          category: "drinks", 
          preparationTime: 3,
          nameBM: "Kopi O", 
          description: "Traditional black coffee", 
          descriptionBM: "Kopi hitam tradisional",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId(),
          name: "Milo Dinosaur", 
          price: 6.50, 
          category: "drinks", 
          preparationTime: 4,
          nameBM: "Milo Dinosaur", 
          description: "Iced Milo with extra Milo powder", 
          descriptionBM: "Milo ais dengan serbuk Milo tambahan",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId(),
          name: "Nasi Lemak", 
          price: 12.90, 
          category: "main", 
          preparationTime: 15,
          nameBM: "Nasi Lemak", 
          description: "Coconut rice with sambal", 
          descriptionBM: "Nasi santan dengan sambal",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId(),
          name: "Char Kuey Teow", 
          price: 14.50, 
          category: "main", 
          preparationTime: 12,
          nameBM: "Char Kuey Teow", 
          description: "Stir-fried rice noodles", 
          descriptionBM: "Kuey teow goreng",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId(),
          name: "Roti Canai", 
          price: 3.50, 
          category: "main", 
          preparationTime: 8,
          nameBM: "Roti Canai", 
          description: "Flaky flatbread with curry", 
          descriptionBM: "Roti canai dengan kuah kari",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId(),
          name: "Satay Set", 
          price: 18.90, 
          category: "main", 
          preparationTime: 20,
          nameBM: "Set Satay", 
          description: "Chicken satay with peanut sauce", 
          descriptionBM: "Satay ayam dengan kuah kacang",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId(),
          name: "Cendol", 
          price: 6.90, 
          category: "desserts", 
          preparationTime: 7,
          nameBM: "Cendol", 
          description: "Shaved ice dessert", 
          descriptionBM: "Pencuci mulut ais",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId(),
          name: "Apam Balik", 
          price: 5.50, 
          category: "desserts", 
          preparationTime: 10,
          nameBM: "Apam Balik", 
          description: "Malaysian peanut pancake", 
          descriptionBM: "Apam balik kacang",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      await db.collection('menuItems').insertMany(menuItems);
      console.log('✅ Sample menu items created');
    }
    
    if (tablesCount === 0) {
      const tables = [
        { _id: new ObjectId(), number: 'T01', status: 'available', capacity: 4, lastCleaned: new Date(), orderId: null, createdAt: new Date(), updatedAt: new Date() },
        { _id: new ObjectId(), number: 'T02', status: 'available', capacity: 2, lastCleaned: new Date(), orderId: null, createdAt: new Date(), updatedAt: new Date() },
        { _id: new ObjectId(), number: 'T03', status: 'available', capacity: 6, lastCleaned: new Date(), orderId: null, createdAt: new Date(), updatedAt: new Date() },
        { _id: new ObjectId(), number: 'T04', status: 'available', capacity: 4, lastCleaned: new Date(), orderId: null, createdAt: new Date(), updatedAt: new Date() },
        { _id: new ObjectId(), number: 'T05', status: 'available', capacity: 4, lastCleaned: new Date(), orderId: null, createdAt: new Date(), updatedAt: new Date() },
        { _id: new ObjectId(), number: 'T06', status: 'available', capacity: 2, lastCleaned: new Date(), orderId: null, createdAt: new Date(), updatedAt: new Date() },
        { _id: new ObjectId(), number: 'T07', status: 'available', capacity: 4, lastCleaned: new Date(), orderId: null, createdAt: new Date(), updatedAt: new Date() },
        { _id: new ObjectId(), number: 'T08', status: 'available', capacity: 8, lastCleaned: new Date(), orderId: null, createdAt: new Date(), updatedAt: new Date() }
      ];
      await db.collection('tables').insertMany(tables);
      console.log('✅ Sample tables created');
    }
    
    console.log('🎉 Database initialization completed');
    
  } catch (error) {
    console.error('❌ Error initializing sample data:', error.message);
  }
}

// Generate order number
function generateOrderNumber() {
  return `MESRA${Date.now().toString().slice(-6)}`;
}

// Customer management functions
async function getCustomerByPhone(phone) {
  try {
    if (!db) throw new Error('Database not connected');
    const cleanPhone = phone.replace(/\D/g, '');
    return await db.collection('customers').findOne({ phone: cleanPhone });
  } catch (error) {
    console.error('Error getting customer:', error);
    return null;
  }
}

// In backend/server.js - FIX the createOrUpdateCustomer function
async function createOrUpdateCustomer(phone, name = '', pointsToAdd = 0, orderTotal = 0) {
  try {
    if (!db) throw new Error('Database not connected');
    
    const cleanPhone = phone.replace(/\D/g, '');
    const now = new Date();
    
    console.log('🔄 Creating/updating customer:', cleanPhone, 'Points to add:', pointsToAdd);
    
    // 🛠️ FIX: Use a cleaner update operation to avoid conflicts
    const updateOperations = {
      $set: {
        lastVisit: now,
        updatedAt: now
      },
      $setOnInsert: {
        name: name || `Customer-${cleanPhone.slice(-4)}`,
        points: 0, // Start with 0 points
        totalOrders: 0,
        totalSpent: 0,
        firstVisit: now,
        tier: 'member',
        createdAt: now
      }
    };
    
    // Only add increment operations if we're adding points/orders
    if (pointsToAdd > 0) {
      updateOperations.$inc = {
        points: pointsToAdd,
        ...(orderTotal > 0 && {
          totalOrders: 1,
          totalSpent: orderTotal
        })
      };
    }
    
    // If name is provided, update it
    if (name) {
      updateOperations.$set.name = name;
    }
    
    const result = await db.collection('customers').findOneAndUpdate(
      { phone: cleanPhone },
      updateOperations,
      { 
        upsert: true,
        returnDocument: 'after'
      }
    );
    
    console.log('✅ Customer updated successfully:', cleanPhone);
    return result.value;
    
  } catch (error) {
    console.error('❌ Error creating/updating customer:', error);
    throw error;
  }
}

// Database connection check middleware
app.use((req, res, next) => {
  if (!db) {
    return res.status(503).json({ 
      success: false,
      error: 'Database connection establishing. Please try again in a moment.',
      retry: true
    });
  }
  next();
});

// ==================== HEALTH & INIT ENDPOINTS ====================

app.get('/health', async (req, res) => {
  try {
    const dbStatus = db ? 'connected' : 'connecting';
    
    if (db) {
      const ordersCount = await db.collection('orders').countDocuments();
      const tablesCount = await db.collection('tables').countDocuments();
      const customersCount = await db.collection('customers').countDocuments();
      const menuItemsCount = await db.collection('menuItems').countDocuments();
      
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        database: dbStatus,
        connectionAttempts: connectionAttempts,
        data: {
          orders: ordersCount,
          tables: tablesCount,
          customers: customersCount,
          menuItems: menuItemsCount
        }
      });
    } else {
      res.json({ 
        status: 'connecting', 
        timestamp: new Date().toISOString(),
        database: dbStatus,
        connectionAttempts: connectionAttempts,
        message: 'Database connection in progress'
      });
    }
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      error: error.message,
      database: 'disconnected'
    });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        status: 'CONNECTING', 
        message: 'Database connection establishing',
        timestamp: new Date().toISOString(),
        connectionAttempts: connectionAttempts
      });
    }

    const ordersCount = await db.collection('orders').countDocuments();
    const tablesCount = await db.collection('tables').countDocuments();
    const customersCount = await db.collection('customers').countDocuments();
    const menuItemsCount = await db.collection('menuItems').countDocuments();
    const paymentsCount = await db.collection('payments').countDocuments();
    
    res.json({ 
      status: 'OK', 
      message: 'Restaurant SaaS API is running with MongoDB',
      timestamp: new Date().toISOString(),
      data: {
        menuItems: menuItemsCount,
        tables: tablesCount,
        orders: ordersCount,
        payments: paymentsCount,
        customers: customersCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/init', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    await initializeSampleData();
    res.json({ message: 'Sample data initialized successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== MENU ENDPOINTS ====================

app.get('/api/menu', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const menuItems = await db.collection('menuItems').find().sort({ category: 1, name: 1 }).toArray();
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== TABLES ENDPOINTS ====================

app.get('/api/tables', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const tables = await db.collection('tables').find().sort({ number: 1 }).toArray();
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// In backend/server.js - Enhanced table update
app.put('/api/tables/:id', async (req, res) => {
  try {
    const tableId = req.params.id;
    const updateData = req.body;
    
    console.log('🔄 Table update request:', tableId, updateData);
    
    let query;
    try {
      query = { _id: new ObjectId(tableId) };
    } catch (error) {
      query = { number: tableId };
    }
    
    // Try direct update first
    const updateResult = await db.collection('tables').updateOne(
      query,
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );
    
    if (updateResult.modifiedCount === 0) {
      console.log('❌ No documents matched, trying alternative query...');
      // Try alternative query approaches
      const alternativeQuery = { $or: [
        { _id: new ObjectId(tableId) },
        { number: tableId },
        { _id: tableId }
      ]};
      
      const fallbackUpdate = await db.collection('tables').updateOne(
        alternativeQuery,
        { $set: { ...updateData, updatedAt: new Date() } }
      );
      
      if (fallbackUpdate.modifiedCount === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Table not found with any identifier' 
        });
      }
    }
    
    // Get updated table
    const updatedTable = await db.collection('tables').findOne(query);
    safeEmit('tableUpdated', updatedTable);
    
    res.json({
      success: true,
      table: updatedTable
    });
    
  } catch (error) {
    console.error('❌ Table update error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ==================== ORDERS ENDPOINTS ====================

app.get('/api/orders', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const orders = await db.collection('orders').find().sort({ createdAt: -1 }).toArray();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// In backend/server.js - ORDER CREATION ENDPOINT
app.post('/api/orders', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        success: false,
        error: 'Database connection establishing. Please try again in a moment.',
        retry: true
      });
    }

    const { tableId, items, orderType, customerPhone, customerName } = req.body;
    
    console.log('📦 Creating order for table:', tableId, 'Customer:', customerPhone || 'No customer');
    
    // VALIDATION: Check for required fields
    if (!tableId || tableId === 'undefined') {
      return res.status(400).json({ 
        success: false,
        error: 'Valid table ID is required' 
      });
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Order must contain at least one item' 
      });
    }

    // Calculate total
    const total = items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0);

    const now = new Date();
    
    // Create order object
    const order = {
      _id: new ObjectId(),
      orderNumber: generateOrderNumber(),
      tableId: tableId,
      table: tableId,
      items: items.map(item => ({
        menuItemId: item.menuItemId || item.id,
        name: item.name || 'Menu Item',
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 1,
        category: item.category || 'uncategorized',
        description: item.description || '',
        specialInstructions: item.specialInstructions || ''
      })),
      total,
      status: 'pending',
      paymentStatus: 'pending', // 🛠️ IMPORTANT: Start as pending
      orderType: orderType || 'dine-in',
      customerPhone: customerPhone || '',
      customerName: customerName || '',
      orderedAt: now,
      completedAt: null,
      createdAt: now,
      updatedAt: now
    };
    
    console.log('💾 Saving order to database:', order.orderNumber);
    
    // Save order to database
    await db.collection('orders').insertOne(order);
    
    // 🛠️ CRITICAL FIX: REMOVE POINTS FROM ORDER CREATION
    // Points will be added later during payment processing
    console.log('ℹ️ Points will be added during payment processing, not order creation');
    
    // Update table status
    console.log('🔄 Updating table status for:', tableId);
    const updatedTable = await db.collection('tables').findOneAndUpdate(
      { number: tableId },
      { $set: { status: 'occupied', orderId: order._id, updatedAt: now } },
      { returnDocument: 'after' }
    );
    
    if (updatedTable.value) {
      console.log(`✅ Table ${updatedTable.value.number} updated to: ${updatedTable.value.status}`);
      safeEmit('tableUpdated', updatedTable.value);
    }
    
    // Emit new order event
    safeEmit('newOrder', order);
    console.log(`📦 New order created: ${order.orderNumber} for Table ${tableId}`);
    
    // SUCCESS RESPONSE
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

// In backend/server.js - FIX order status update endpoint
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        success: false,
        error: 'Database not connected' 
      });
    }
    
    const { status } = req.body;
    const orderId = req.params.id;
    
    console.log(`🔄 Updating order ${orderId} to status: ${status}`);
    
    if (!status) {
      return res.status(400).json({ 
        success: false,
        error: 'Status is required' 
      });
    }
    
    let query;
    try {
      query = { _id: new ObjectId(orderId) };
    } catch (error) {
      query = { orderNumber: orderId };
    }
    
    const order = await db.collection('orders').findOne(query);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }
    
    const updateData = {
      status: status,
      updatedAt: new Date()
    };
    
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }
    
    const updatedOrder = await db.collection('orders').findOneAndUpdate(
      query,
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    // 🛠️ FIX: Check if updatedOrder.value exists before emitting
    if (updatedOrder && updatedOrder.value) {
      safeEmit('orderUpdated', updatedOrder.value);
      res.json({
        success: true,
        order: updatedOrder.value
      });
    } else {
      // If no updated order, at least return the original order with new status
      const fallbackOrder = { ...order, ...updateData };
      safeEmit('orderUpdated', fallbackOrder);
      res.json({
        success: true,
        order: fallbackOrder
      });
    }
    
  } catch (error) {
    console.error('❌ Order status update error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ==================== CUSTOMER ENDPOINTS ====================

app.get('/api/customers', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const customers = await db.collection('customers').find().sort({ createdAt: -1 }).toArray();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/customers/:phone', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const { phone } = req.params;
    const customer = await getCustomerByPhone(phone);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const { phone, name } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    const customer = await createOrUpdateCustomer(phone, name);
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🛠️ ENHANCED POINTS ENDPOINT - FIXED FOR PRODUCTION
app.post('/api/customers/:phone/points', async (req, res) => {
  try {
    console.log('➕ Add points request:', req.params.phone, req.body);
    
    if (!db) {
      return res.status(503).json({ 
        success: false,
        message: 'Database not connected' 
      });
    }
    
    const { phone } = req.params;
    const { points, orderTotal } = req.body;
    
    // ENHANCED VALIDATION
    if (!phone || phone === 'undefined' || phone === 'null') {
      return res.status(400).json({ 
        success: false,
        message: 'Valid phone number is required' 
      });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number must be at least 10 digits' 
      });
    }

    const pointsToAdd = parseInt(points) || 0;
    if (pointsToAdd <= 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid points value is required' 
      });
    }

    console.log('➕ Adding points:', pointsToAdd, 'for customer:', cleanPhone);
    
    const customer = await createOrUpdateCustomer(cleanPhone, '', pointsToAdd, parseFloat(orderTotal) || 0);
    
    if (!customer) {
      return res.status(404).json({ 
        success: false,
        message: 'Customer not found' 
      });
    }
    
    console.log('✅ Points updated for customer:', cleanPhone, 'Total points:', customer.points);
    
    res.json({
      success: true,
      customer: customer,
      pointsAdded: pointsToAdd,
      totalPoints: customer.points
    });
    
  } catch (error) {
    console.error('❌ Add points error:', error);
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to update points: ' + error.message 
    });
  }
});

app.post('/api/customers/register', async (req, res) => {
  try {
    console.log('📝 Registration request received:', req.body);
    
    if (!db) {
      return res.status(503).json({ 
        success: false,
        message: 'Database not connected' 
      });
    }
    
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number is required' 
      });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid phone number required (at least 10 digits)' 
      });
    }

    // FIX: Call without points for registration
    const customer = await createOrUpdateCustomer(cleanPhone);
    
    console.log('✅ Registration successful for:', cleanPhone);
    res.json({
      success: true,
      customer: customer
    });
    
  } catch (error) {
    console.error('💥 Registration endpoint error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false,
        message: 'Phone number already registered' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Registration failed: ' + error.message 
    });
  }
});

app.get('/api/customers/:phone/orders', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const { phone } = req.params;
    const cleanPhone = phone.replace(/\D/g, '');
    
    console.log('📋 Fetching orders for customer:', cleanPhone);
    
    const customerOrders = await db.collection('orders')
      .find({ customerPhone: cleanPhone })
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`✅ Found ${customerOrders.length} orders for customer ${cleanPhone}`);
    res.json(customerOrders);
  } catch (error) {
    console.error('❌ Customer orders error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch customer orders' 
    });
  }
});

// ==================== PAYMENTS ENDPOINTS ====================

app.get('/api/payments', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const payments = await db.collection('payments').find().sort({ paidAt: -1 }).toArray();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    console.log('💰 Payment request received:', req.body);
    
    if (!db) {
      console.error('❌ Database not connected in payment endpoint');
      return res.status(503).json({ 
        success: false,
        message: 'Database not connected' 
      });
    }
    
    const { orderId, amount, method = 'cash' } = req.body;
    
    // Validate required fields
    if (!orderId) {
      return res.status(400).json({ 
        success: false,
        message: 'Order ID is required' 
      });
    }

    console.log('🔍 Processing payment for order:', orderId);

    // Find order with multiple fallback options
    let order;
    try {
      // Try by orderNumber first
      order = await db.collection('orders').findOne({ orderNumber: orderId });
      
      // If not found, try by _id
      if (!order) {
        try {
          order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
        } catch (idError) {
          console.log('⚠️ Invalid order ID format:', orderId);
        }
      }
    } catch (dbError) {
      console.error('❌ Database query error:', dbError);
      return res.status(500).json({ 
        success: false,
        message: 'Database error while finding order' 
      });
    }

    if (!order) {
      console.error('❌ Order not found:', orderId);
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    const now = new Date();
    const paymentAmount = amount || order.total;

    // Create payment record
    const payment = {
      _id: new ObjectId(),
      orderId: order.orderNumber,
      orderInternalId: order._id,
      amount: paymentAmount,
      method: method,
      status: 'completed',
      paidAt: now,
      createdAt: now
    };

    console.log('💾 Saving payment record:', payment);

    // Database operations with error handling
    try {
      await db.collection('payments').insertOne(payment);
      
      // Update order status
      const updatedOrder = await db.collection('orders').findOneAndUpdate(
        { _id: order._id },
        { 
          $set: { 
            paymentStatus: 'paid', 
            paymentMethod: method,
            updatedAt: now
          } 
        },
        { returnDocument: 'after' }
      );

      // Update table status if exists
      if (order.tableId) {
        const updatedTable = await db.collection('tables').findOneAndUpdate(
          { number: order.tableId },
          { $set: { status: 'needs_cleaning', orderId: null, updatedAt: now } },
          { returnDocument: 'after' }
        );
        
        if (updatedTable.value) {
          safeEmit('tableUpdated', updatedTable.value);
        }
      }

      // Emit events
      safeEmit('paymentProcessed', payment);
      safeEmit('orderUpdated', updatedOrder.value);

      console.log('✅ Payment processed successfully for order:', order.orderNumber);
      
      res.json({
        success: true,
        payment: payment,
        order: updatedOrder.value
      });

    } catch (dbWriteError) {
      console.error('❌ Database write error:', dbWriteError);
      return res.status(500).json({ 
        success: false,
        message: 'Failed to save payment: ' + dbWriteError.message 
      });
    }
    
  } catch (error) {
    console.error('💥 Payment endpoint error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Payment processing failed: ' + error.message 
    });
  }
}); 

// ==================== UTILITY ENDPOINTS ====================

app.get('/api/orders/table/:tableId', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const tableId = req.params.tableId;
    console.log('🔍 Checking active orders for table:', tableId);
    
    const activeOrders = await db.collection('orders')
      .find({ 
        tableId: tableId,
        status: { $in: ['pending', 'preparing', 'ready'] }
      })
      .sort({ orderedAt: -1 })
      .toArray();
    
    const latestOrder = activeOrders.length > 0 ? activeOrders[0] : null;
    
    console.log('✅ Active order check result:', latestOrder ? latestOrder.orderNumber : 'No active orders');
    res.json(latestOrder);
  } catch (error) {
    console.error('❌ Error checking active orders:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/orders/:id/items', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const orderId = req.params.id;
    const { newItems } = req.body;
    
    console.log('➕ Adding items to order:', orderId, newItems);
    
    let query;
    try {
      query = { _id: new ObjectId(orderId) };
    } catch (error) {
      query = { orderNumber: orderId };
    }
    
    const order = await db.collection('orders').findOne(query);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const addedItems = newItems.map(item => {
      return {
        menuItemId: item.menuItemId,
        name: item.name || 'Menu Item',
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 1,
        category: item.category || 'uncategorized',
        specialInstructions: item.specialInstructions || ''
      };
    });
    
    const updatedItems = [...order.items, ...addedItems];
    const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const updatedOrder = await db.collection('orders').findOneAndUpdate(
      query,
      { 
        $set: { 
          items: updatedItems,
          total: newTotal,
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after' }
    );
    
    console.log('✅ Order updated with new items:', updatedOrder.value.orderNumber);
    
    safeEmit('orderUpdated', updatedOrder.value);
    res.json(updatedOrder.value);
  } catch (error) {
    console.error('❌ Error adding items to order:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🛠️ ENHANCED Socket.io for real-time updates - FIXED FOR PRODUCTION
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  // Wrap emit function with validation
  const originalEmit = socket.emit;
  socket.emit = function(event, data) {
    if (validateSocketData(data, event)) {
      originalEmit.call(this, event, data);
    } else {
      console.warn(`🚫 Blocked invalid socket.emit for ${event}:`, data);
    }
  };

  socket.on('disconnect', (reason) => {
    console.log('❌ Client disconnected:', socket.id, reason);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });
});

const PORT = process.env.PORT || 10000;

// Start server immediately, database will connect in background
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Mesra POS Server running on port ${PORT}`);
  console.log(`📍 Health check: https://restaurant-saas-backend-hbdz.onrender.com/health`);
  console.log(`🔧 CORS enabled for: ${FRONTEND_URL}`);
  console.log(`💾 Database: MongoDB (Auto-connecting)`);
  console.log(`👥 Customer tracking: PERSISTENT`);
  console.log(`🎯 Loyalty points: PERSISTENT`);
  console.log(`🔄 Real-time updates: ENABLED`);
  console.log(`🛠️ Production fixes: ✅ WebSocket Validation, ✅ Customer Validation, ✅ Error Handling\n`);
  
  // Start database connection in background
  initializeDatabase();
});