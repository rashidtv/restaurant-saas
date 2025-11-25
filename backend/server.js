// backend/server.js - PRODUCTION READY WITH REDIS SESSIONS
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');
const redis = require('redis');

require('dotenv').config();

const app = express();
const server = http.createServer(app);

// 🎯 PRODUCTION: Redis Client Setup
const redisClient = redis.createClient({
  url: `redis://:${process.env.REDIS_PASSWORD}@redis-15846.c10.us-east-1-4.ec2.cloud.redislabs.com:15846`,
  socket: {
    connectTimeout: 10000,
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
  }
});

// Redis event handlers
redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis Cloud');
});

redisClient.on('ready', () => {
  console.log('🎯 Redis ready for production session storage');
});

// Initialize Redis connection
(async () => {
  try {
    await redisClient.connect();
    console.log('🔐 Redis Cloud connection established');
  } catch (error) {
    console.error('❌ Failed to connect to Redis Cloud:', error);
  }
})();

// MongoDB Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rashhanz_db_user:mawip900@flavorflow.5wxjnlj.mongodb.net/restaurant_saas?retryWrites=true&w=majority&appName=flavorflow';
const DB_NAME = process.env.DB_NAME || 'restaurant_saas';

let db = null;
let mongoClient = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

// Middleware
app.use(cookieParser());
app.use(express.json());

// CORS configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://restaurant-saas-demo.onrender.com';

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173'], // Explicitly list allowed origins
  credentials: true, // This is crucial for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Handle preflight requests
app.options('*', cors());

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173", 
      "https://restaurant-saas-demo.onrender.com",
      FRONTEND_URL
    ].filter(Boolean),
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// WebSocket Validation
const validateSocketData = (data, eventName) => {
  if (data === null || data === undefined) {
    console.warn(`⚠️ Blocking null data for event: ${eventName}`);
    return false;
  }
  
  if (eventName === 'orderUpdate' || eventName === 'orderUpdated') {
    if (!data.orderId && !data.orderNumber) {
      console.warn(`⚠️ Invalid order data for ${eventName}:`, data);
      return false;
    }
  }
  
  if (eventName === 'tableUpdate' || eventName === 'tableUpdated') {
    if (!data._id && !data.number) {
      console.warn(`⚠️ Invalid table data for ${eventName}:`, data);
      return false;
    }
  }
  
  if (eventName === 'paymentProcessed') {
    if (!data.orderId && !data._id) {
      console.warn(`⚠️ Invalid payment data for ${eventName}:`, data);
      return false;
    }
  }
  
  return true;
};

const safeEmit = (event, data) => {
  if (validateSocketData(data, event)) {
    io.emit(event, data);
    console.log(`✅ Emitted ${event} successfully`);
  } else {
    console.warn(`🚫 Blocked invalid ${event} emission:`, data);
  }
};

// 🎯 UPDATE existing validateCustomerSession middleware (around line 120)
const validateCustomerSession = async (req, res, next) => {
  try {
    const sessionId = req.cookies.customerSession;
    
    if (!sessionId) {
      return res.status(401).json({ 
        success: false,
        message: 'No active session',
        code: 'SESSION_REQUIRED'  // 🎯 ADD error code
      });
    }
    
    const sessionData = await redisClient.get(`session:${sessionId}`);
    
    if (!sessionData) {
      res.clearCookie('customerSession', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
      
      return res.status(401).json({ 
        success: false,
        message: 'Session expired',
        code: 'SESSION_EXPIRED'  // 🎯 ADD error code
      });
    }
    
    const session = JSON.parse(sessionData);
    
    // Verify session age (24 hours max)
    const sessionAge = Date.now() - new Date(session.createdAt).getTime();
    const maxAge = 24 * 60 * 60 * 1000;
    
    if (sessionAge > maxAge) {
      await redisClient.del(`session:${sessionId}`);
      res.clearCookie('customerSession');
      return res.status(401).json({ 
        success: false,
        message: 'Session expired',
        code: 'SESSION_EXPIRED'  // 🎯 ADD error code
      });
    }
    
    // 🎯 NEW: Refresh session expiry on activity
    await redisClient.expire(`session:${sessionId}`, 24 * 60 * 60);
    
    req.customerSession = session;
    next();
    
  } catch (error) {
    console.error('❌ Session validation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Session validation failed',
      code: 'SESSION_ERROR'  // 🎯 ADD error code
    });
  }
};

// Database Functions
async function initializeDatabase() {
  try {
    connectionAttempts++;
    console.log(`🔗 MongoDB connection attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}...`);

    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      maxPoolSize: 5,
      minPoolSize: 1,
      tls: true,
    });

    console.log('🔄 Connecting to MongoDB...');
    await client.connect();
    
    mongoClient = client;
    db = client.db(DB_NAME);

    await db.command({ ping: 1 });
    console.log('✅ Connected to MongoDB successfully!');

    await createDatabaseIndexes();
    await initializeSampleData();

    console.log('🎉 Database initialization completed');

  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    
    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      const retryDelay = Math.min(3000 * connectionAttempts, 15000);
      console.log(`🔄 Retrying in ${retryDelay/1000} seconds...`);
      setTimeout(initializeDatabase, retryDelay);
    }
  }
}

async function createDatabaseIndexes() {
  try {
    console.log('📊 Creating database indexes...');
    
    // Drop existing indexes first to avoid conflicts
    try {
      await db.collection('customers').dropIndex('phone_1');
    } catch (error) {
      // Index might not exist, that's fine
    }
    
    await db.collection('customers').createIndex({ phone: 1 }, { unique: true });
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

async function initializeSampleData() {
  try {
    if (!db) return;
    
    const menuCount = await db.collection('menuItems').countDocuments();
    const tablesCount = await db.collection('tables').countDocuments();
    
    if (menuCount === 0) {
      const menuItems = [
        { _id: new ObjectId(), name: "Teh Tarik", price: 4.50, category: "drinks", preparationTime: 5, createdAt: new Date(), updatedAt: new Date() },
        { _id: new ObjectId(), name: "Kopi O", price: 3.80, category: "drinks", preparationTime: 3, createdAt: new Date(), updatedAt: new Date() },
        { _id: new ObjectId(), name: "Milo Dinosaur", price: 6.50, category: "drinks", preparationTime: 4, createdAt: new Date(), updatedAt: new Date() },
        { _id: new ObjectId(), name: "Nasi Lemak", price: 12.90, category: "main", preparationTime: 15, createdAt: new Date(), updatedAt: new Date() },
        { _id: new ObjectId(), name: "Char Kuey Teow", price: 14.50, category: "main", preparationTime: 12, createdAt: new Date(), updatedAt: new Date() },
        { _id: new ObjectId(), name: "Roti Canai", price: 3.50, category: "main", preparationTime: 8, createdAt: new Date(), updatedAt: new Date() },
        { _id: new ObjectId(), name: "Satay Set", price: 18.90, category: "main", preparationTime: 20, createdAt: new Date(), updatedAt: new Date() },
        { _id: new ObjectId(), name: "Cendol", price: 6.90, category: "desserts", preparationTime: 7, createdAt: new Date(), updatedAt: new Date() },
        { _id: new ObjectId(), name: "Apam Balik", price: 5.50, category: "desserts", preparationTime: 10, createdAt: new Date(), updatedAt: new Date() }
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
    
  } catch (error) {
    console.error('❌ Error initializing sample data:', error.message);
  }
}

function generateOrderNumber() {
  return `MESRA${Date.now().toString().slice(-6)}`;
}

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

async function createOrUpdateCustomer(phone, name = '', pointsToAdd = 0, orderTotal = 0) {
  try {
    if (!db) throw new Error('Database not connected');
    
    const cleanPhone = phone.replace(/\D/g, '');
    const now = new Date();
    
    console.log('🔄 Creating/updating customer:', cleanPhone, 'Points to add:', pointsToAdd);
    
    // First, try to find existing customer
    const existingCustomer = await db.collection('customers').findOne({ phone: cleanPhone });
    
    if (existingCustomer) {
      // 🛠️ FIX: UPDATE EXISTING CUSTOMER
      console.log('✅ Customer exists, updating:', cleanPhone);
      
      const updateOperations = {
        $set: {
          lastVisit: now,
          updatedAt: now
        }
      };
      
      // Only update name if it's provided and different from current
      if (name && name !== existingCustomer.name) {
        updateOperations.$set.name = name;
      }
      
      // Add points if any
      if (pointsToAdd > 0) {
        updateOperations.$inc = {
          points: pointsToAdd,
          ...(orderTotal > 0 && {
            totalOrders: 1,
            totalSpent: orderTotal
          })
        };
      }
      
      const result = await db.collection('customers').findOneAndUpdate(
        { phone: cleanPhone },
        updateOperations,
        { returnDocument: 'after' }
      );
      
      console.log('✅ Existing customer updated successfully:', cleanPhone);
      return result.value;
      
    } else {
      // 🛠️ FIX: CREATE NEW CUSTOMER
      console.log('✅ Creating new customer:', cleanPhone);
      
      const newCustomer = {
        phone: cleanPhone,
        name: name || `Customer-${cleanPhone.slice(-4)}`,
        points: pointsToAdd || 0,
        totalOrders: orderTotal > 0 ? 1 : 0,
        totalSpent: orderTotal || 0,
        firstVisit: now,
        lastVisit: now,
        tier: 'member',
        createdAt: now,
        updatedAt: now
      };
      
      const result = await db.collection('customers').insertOne(newCustomer);
      console.log('✅ New customer created successfully:', cleanPhone);
      
      return { ...newCustomer, _id: result.insertedId };
    }
    
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
      error: 'Database connection establishing. Please try again.',
      retry: true
    });
  }
  next();
});

// ==================== HEALTH ENDPOINTS ====================

app.get('/health', async (req, res) => {
  try {
    const dbStatus = db ? 'connected' : 'connecting';
    const redisStatus = redisClient.isOpen ? 'connected' : 'disconnected';
    
    if (db) {
      const ordersCount = await db.collection('orders').countDocuments();
      const tablesCount = await db.collection('tables').countDocuments();
      const customersCount = await db.collection('customers').countDocuments();
      const menuItemsCount = await db.collection('menuItems').countDocuments();
      
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        database: dbStatus,
        redis: redisStatus,
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
        redis: redisStatus,
        message: 'Services starting up'
      });
    }
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      error: error.message,
      database: 'disconnected',
      redis: 'disconnected'
    });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        status: 'CONNECTING', 
        message: 'Database connection establishing',
        timestamp: new Date().toISOString()
      });
    }

    const ordersCount = await db.collection('orders').countDocuments();
    const tablesCount = await db.collection('tables').countDocuments();
    const customersCount = await db.collection('customers').countDocuments();
    const menuItemsCount = await db.collection('menuItems').countDocuments();
    const paymentsCount = await db.collection('payments').countDocuments();
    
    res.json({ 
      status: 'OK', 
      message: 'Restaurant SaaS API is running with Redis Sessions',
      timestamp: new Date().toISOString(),
      redis: redisClient.isOpen ? 'connected' : 'disconnected',
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

// ==================== CUSTOMER ENDPOINTS ====================

// 🎯 PRODUCTION: Customer Registration with Fixed Cookie Settings
app.post('/api/customers/register', async (req, res) => {
  try {
    console.log('📝 Registration request received:', req.body);
    
    const { phone, name } = req.body;
    
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

    const customerName = name && name.trim() !== '' ? name : '';
    const customer = await createOrUpdateCustomer(cleanPhone, customerName);
    
    // Generate secure session ID
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
    
    // Store session in Redis (24 hour expiry)
    await redisClient.setEx(
      `session:${sessionId}`,
      24 * 60 * 60,
      JSON.stringify({
        customerId: customer._id.toString(),
        phone: customer.phone,
        createdAt: new Date().toISOString()
      })
    );
    
    // 🛠️ FIXED: Production cookie settings
    const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('customerSession', sessionId, {
      httpOnly: true,     // Prevents XSS attacks
      secure: isProduction, // True in production (HTTPS only)
      sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-site in production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
      // domain: isProduction ? '.onrender.com' : undefined // Uncomment if needed
    });
    
  
    
     res.json({ success: true, customer: customer });
  } catch (error) {
    console.error('❌ Registration error:', error);
    
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

// Add this endpoint for basic connectivity test
app.get('/api/ping', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend is running',
    timestamp: new Date().toISOString()
  });
});

// 🎯 PRODUCTION: Get Current Customer (Session Validation)
app.get('/api/customers/me', validateCustomerSession, async (req, res) => {
  try {
    const customer = await getCustomerByPhone(req.customerSession.phone);
    
    if (!customer) {
      await redisClient.del(`session:${req.cookies.customerSession}`);
      res.clearCookie('customerSession');
      return res.status(404).json({ 
        success: false,
        message: 'Customer not found' 
      });
    }
    
    res.json({
      success: true,
      customer: customer
    });
    
  } catch (error) {
    console.error('❌ Get customer error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get customer' 
    });
  }
});



// 🎯 PRODUCTION: Logout Endpoint
app.post('/api/customers/logout', validateCustomerSession, async (req, res) => {
  try {
    const sessionId = req.cookies.customerSession;
    
    await redisClient.del(`session:${sessionId}`);
    
    res.clearCookie('customerSession', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    });
    
    console.log('✅ Customer logged out:', req.customerSession.phone);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Logout failed' 
    });
  }
});

// 🎯 ADD THIS AFTER THE LOGOUT ENDPOINT (around line 400)
app.post('/api/customers/session/refresh', validateCustomerSession, async (req, res) => {
  try {
    const sessionId = req.cookies.customerSession;
    
    // Refresh session expiry in Redis (24 hours)
    await redisClient.expire(`session:${sessionId}`, 24 * 60 * 60);
    
    res.json({
      success: true,
      message: 'Session refreshed'
    });
    
  } catch (error) {
    console.error('Session refresh error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to refresh session'
    });
  }
});

// 🎯 PRODUCTION: Protected Points Endpoint
app.post('/api/customers/:phone/points', validateCustomerSession, async (req, res) => {
  try {
    const { phone } = req.params;
    const { points, orderTotal } = req.body;
    
    if (req.customerSession.phone !== phone) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this customer' 
      });
    }
    
    const pointsToAdd = parseInt(points) || 0;
    
    if (pointsToAdd <= 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid points value is required' 
      });
    }

    console.log('➕ Adding points via session:', pointsToAdd, 'for customer:', phone);
    
    const customer = await createOrUpdateCustomer(phone, '', pointsToAdd, parseFloat(orderTotal) || 0);
    
    console.log('✅ Points updated via session:', phone, 'Total points:', customer.points);
    
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

// Existing customer endpoints
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

app.post('/api/orders', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        success: false,
        error: 'Database connection establishing. Please try again.',
        retry: true
      });
    }

    const { tableId, items, orderType, customerPhone, customerName } = req.body;
    
    console.log('📦 Creating order for table:', tableId, 'Customer:', customerPhone || 'No customer');
    
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

    const total = items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0);

    const now = new Date();
    
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
      paymentStatus: 'pending',
      orderType: orderType || 'dine-in',
      customerPhone: customerPhone || '',
      customerName: customerName || '',
      orderedAt: now,
      completedAt: null,
      createdAt: now,
      updatedAt: now
    };
    
    console.log('💾 Saving order to database:', order.orderNumber);
    
    await db.collection('orders').insertOne(order);
    
    console.log('ℹ️ Points will be added during payment processing, not order creation');
    
    const updatedTable = await db.collection('tables').findOneAndUpdate(
      { number: tableId },
      { $set: { status: 'occupied', orderId: order._id, updatedAt: now } },
      { returnDocument: 'after' }
    );
    
    if (updatedTable.value) {
      console.log(`✅ Table ${updatedTable.value.number} updated to: ${updatedTable.value.status}`);
      safeEmit('tableUpdated', updatedTable.value);
    }
    
    safeEmit('newOrder', order);
    console.log(`📦 New order created: ${order.orderNumber} for Table ${tableId}`);
    
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
    
    if (updatedOrder && updatedOrder.value) {
      safeEmit('orderUpdated', updatedOrder.value);
      res.json({
        success: true,
        order: updatedOrder.value
      });
    } else {
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
      return res.status(503).json({ 
        success: false,
        message: 'Database not connected' 
      });
    }
    
    const { orderId, amount, method = 'cash' } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ 
        success: false,
        message: 'Order ID is required' 
      });
    }

    console.log('🔍 Processing payment for order:', orderId);

    let order;
    try {
      order = await db.collection('orders').findOne({ orderNumber: orderId });
      
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

    // 🎯 FIX: Define pointsAwarded at proper scope
    let pointsAwarded = 0;

    try {
      await db.collection('payments').insertOne(payment);
      
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

      // 🎯 PERMANENT FIX: AWARD POINTS AFTER PAYMENT
      if (order.customerPhone && paymentAmount > 0) {
        try {
          console.log(`🎯 Calculating points for customer: ${order.customerPhone}, amount: ${paymentAmount}`);
          
          // Calculate points (1 point per ringgit, floor value)
          pointsAwarded = Math.floor(paymentAmount);
          
          if (pointsAwarded > 0) {
            console.log(`➕ Adding ${pointsAwarded} points to customer: ${order.customerPhone}`);
            
            // Use your existing customer update function
            const updatedCustomer = await createOrUpdateCustomer(
              order.customerPhone, 
              order.customerName || '', 
              pointsAwarded, 
              paymentAmount
            );
            
            console.log(`✅ Points awarded successfully. Total points: ${updatedCustomer.points}`);
            
            // 🎯 Emit specific points update event
            safeEmit('pointsUpdated', {
              customerPhone: order.customerPhone,
              pointsAdded: pointsAwarded,
              totalPoints: updatedCustomer.points,
              orderId: order.orderNumber,
              timestamp: now.toISOString()
            });
          }
        } catch (pointsError) {
          console.error('❌ Points calculation failed:', pointsError);
          // Don't fail payment if points fail
        }
      }

      // Table cleanup
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

      // 🎯 EMIT EVENTS
      safeEmit('paymentProcessed', {
        ...payment,
        pointsAwarded: pointsAwarded,
        customerPhone: order.customerPhone
      });
      
      safeEmit('orderUpdated', updatedOrder.value);

      console.log('✅ Payment processed successfully for order:', order.orderNumber);
      
      // 🎯 FIX: Use the properly scoped variable
      res.json({
        success: true,
        payment: payment,
        order: updatedOrder.value,
        pointsAwarded: pointsAwarded
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

// WebSocket handlers
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('disconnect', (reason) => {
    console.log('❌ Client disconnected:', socket.id, reason);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });
});

const PORT = process.env.PORT || 10000;

// Start server
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n🚀 Production Restaurant SaaS Server running on port ${PORT}`);
  console.log(`🔐 Session Management: Redis Cloud + HTTP-only Cookies`);
  console.log(`🎯 Customer Persistence: Production Ready`);
  console.log(`📊 Architecture: Microservices Ready\n`);
  
  await initializeDatabase();
});