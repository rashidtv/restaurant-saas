// backend/server.js - PRODUCTION READY WITH REDIS FALLBACK
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');

require('dotenv').config();

const app = express();
const server = http.createServer(app);

// ============================================
// 🎯 REDIS: Optional - Falls back to memory store
// ============================================
let redisClient = null;
let useRedis = false;
let redisInitialized = false;

// Memory store fallback (used when Redis is unavailable)
const memoryStore = {
  sessions: {},
  get: async (key) => {
    const sessionKey = key.replace('session:', '');
    return memoryStore.sessions[sessionKey] || null;
  },
  setEx: async (key, expiry, value) => {
    const sessionKey = key.replace('session:', '');
    memoryStore.sessions[sessionKey] = value;
    // Auto-cleanup after expiry
    setTimeout(() => {
      delete memoryStore.sessions[sessionKey];
    }, expiry * 1000);
  },
  del: async (key) => {
    const sessionKey = key.replace('session:', '');
    delete memoryStore.sessions[sessionKey];
  },
  expire: async (key, expiry) => {
    // Memory store handles expiry via setTimeout
    return true;
  },
  isOpen: true
};

// Try to connect to Redis
try {
  const redis = require('redis');
  
  // Check if Redis credentials exist
  if (process.env.REDIS_PASSWORD || process.env.REDIS_URL) {
    const redisUrl = process.env.REDIS_URL || 
      `redis://:${process.env.REDIS_PASSWORD}@redis-15846.c10.us-east-1-4.ec2.cloud.redislabs.com:15846`;
    
    console.log('🔄 Attempting Redis connection...');
    
    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 2) {
            console.log('⚠️ Redis unavailable, switching to memory store');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 1000);
        }
      }
    });

    redisClient.on('error', (err) => {
      console.warn('⚠️ Redis error (using memory store):', err.message);
      useRedis = false;
      redisInitialized = true;
    });

    redisClient.on('connect', () => {
      console.log('✅ Connected to Redis Cloud');
      useRedis = true;
      redisInitialized = true;
    });

    redisClient.on('ready', () => {
      console.log('🎯 Redis ready for production session storage');
      useRedis = true;
      redisInitialized = true;
    });

    // Try to connect
    redisClient.connect().catch((err) => {
      console.warn('⚠️ Redis connection failed, using memory store:', err.message);
      useRedis = false;
      redisInitialized = true;
    });

    // Set a timeout for Redis initialization
    setTimeout(() => {
      if (!redisInitialized) {
        console.log('⏱️ Redis connection timeout, using memory store');
        useRedis = false;
        redisInitialized = true;
      }
    }, 8000);
    
  } else {
    console.log('ℹ️ No Redis configuration found, using memory store');
    useRedis = false;
    redisInitialized = true;
  }
} catch (error) {
  console.log('ℹ️ Redis module not available, using memory store');
  useRedis = false;
  redisInitialized = true;
}

// Session store (Redis or Memory)
const sessionStore = {
  get: async (key) => {
    if (useRedis && redisClient && redisClient.isOpen) {
      try {
        return await redisClient.get(key);
      } catch (e) {
        console.warn('⚠️ Redis get failed, using memory:', e.message);
        return await memoryStore.get(key);
      }
    }
    return await memoryStore.get(key);
  },
  setEx: async (key, expiry, value) => {
    if (useRedis && redisClient && redisClient.isOpen) {
      try {
        await redisClient.setEx(key, expiry, value);
        return;
      } catch (e) {
        console.warn('⚠️ Redis set failed, using memory:', e.message);
      }
    }
    await memoryStore.setEx(key, expiry, value);
  },
  del: async (key) => {
    if (useRedis && redisClient && redisClient.isOpen) {
      try {
        await redisClient.del(key);
        return;
      } catch (e) {
        console.warn('⚠️ Redis del failed, using memory:', e.message);
      }
    }
    await memoryStore.del(key);
  },
  expire: async (key, expiry) => {
    if (useRedis && redisClient && redisClient.isOpen) {
      try {
        await redisClient.expire(key, expiry);
        return;
      } catch (e) {
        console.warn('⚠️ Redis expire failed, using memory:', e.message);
      }
    }
    await memoryStore.expire(key, expiry);
  }
};

console.log(`✅ Session store: ${useRedis ? 'Redis (Cloud)' : 'In-Memory (Fallback)'}`);

// ============================================
// 📦 MONGODB CONFIGURATION
// ============================================
const dns = require('dns');
// Force IPv4 (helps with some network issues)
dns.setDefaultResultOrder('ipv4first');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://rashhanz_db_user:mawip900@flavorflow.5wxjnlj.mongodb.net:27017/restaurant_saas?retryWrites=true&w=majority&appName=flavorflow';
const DB_NAME = process.env.DB_NAME || 'restaurant_saas';

let db = null;
let mongoClient = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;

console.log('📦 MongoDB URI configured (standard format)');

// ============================================
// 🔧 MIDDLEWARE
// ============================================
app.use(cookieParser());
app.use(express.json());

// CORS Configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://restaurant-saas-demo.onrender.com';

const allowedOrigins = [
  'https://restaurant-saas-demo.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://restaurant-saas-frontend.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log('⚠️ Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
}));

app.options('*', cors());

// ============================================
// 🔌 SOCKET.IO CONFIGURATION
// ============================================
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

// ============================================
// 🎯 SESSION MIDDLEWARE
// ============================================
const validateCustomerSession = async (req, res, next) => {
  try {
    const sessionId = req.cookies.customerSession;
    
    if (!sessionId) {
      return res.status(401).json({ 
        success: false,
        message: 'No active session',
        code: 'SESSION_REQUIRED'
      });
    }
    
    // Use session store (Redis or memory)
    const sessionData = await sessionStore.get(`session:${sessionId}`);
    
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
        code: 'SESSION_EXPIRED'
      });
    }
    
    const session = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
    
    // Verify session age (24 hours max)
    const sessionAge = Date.now() - new Date(session.createdAt).getTime();
    const maxAge = 24 * 60 * 60 * 1000;
    
    if (sessionAge > maxAge) {
      await sessionStore.del(`session:${sessionId}`);
      res.clearCookie('customerSession');
      return res.status(401).json({ 
        success: false,
        message: 'Session expired',
        code: 'SESSION_EXPIRED'
      });
    }
    
    // Refresh session expiry on activity
    await sessionStore.expire(`session:${sessionId}`, 24 * 60 * 60);
    
    req.customerSession = session;
    next();
    
  } catch (error) {
    console.error('❌ Session validation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Session validation failed',
      code: 'SESSION_ERROR'
    });
  }
};

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

// ============================================
// 📊 DATABASE FUNCTIONS
// ============================================
async function initializeDatabase() {
  try {
    connectionAttempts++;
    console.log(`🔗 MongoDB connection attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}...`);

    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 2,
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
    } else {
      console.error('❌ Max connection attempts reached. Database unavailable.');
    }
  }
}

async function createDatabaseIndexes() {
  try {
    console.log('📊 Creating database indexes...');
    
    try {
      await db.collection('customers').dropIndex('phone_1');
    } catch (error) {
      // Index might not exist
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

// ============================================
// 🔧 HELPER FUNCTIONS
// ============================================
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
    
    const existingCustomer = await db.collection('customers').findOne({ phone: cleanPhone });
    
    if (existingCustomer) {
      console.log('✅ Customer exists, updating:', cleanPhone);
      
      const updateOperations = {
        $set: {
          lastVisit: now,
          updatedAt: now
        }
      };
      
      if (name && name !== existingCustomer.name) {
        updateOperations.$set.name = name;
      }
      
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

// ============================================
// 🏥 HEALTH ENDPOINTS
// ============================================
app.get('/health', async (req, res) => {
  try {
    const dbStatus = db ? 'connected' : 'connecting';
    const redisStatus = useRedis && redisClient?.isOpen ? 'connected' : 'disconnected (using memory)';
    
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
      message: 'Restaurant SaaS API is running',
      timestamp: new Date().toISOString(),
      redis: useRedis && redisClient?.isOpen ? 'connected' : 'disconnected (using memory)',
      sessionStore: useRedis ? 'Redis' : 'Memory',
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

app.get('/api/ping', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    sessionStore: useRedis ? 'Redis' : 'Memory'
  });
});

// ============================================
// 👤 CUSTOMER ENDPOINTS
// ============================================
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
    
    // Store session (Redis or memory)
    await sessionStore.setEx(
      `session:${sessionId}`,
      24 * 60 * 60,
      JSON.stringify({
        customerId: customer._id.toString(),
        phone: customer.phone,
        createdAt: new Date().toISOString()
      })
    );
    
    const isProduction = process.env.NODE_ENV === 'production';
    const isLocalhost = req.get('origin')?.includes('localhost');
    
    res.cookie('customerSession', sessionId, {
      httpOnly: true,
      secure: isProduction && !isLocalhost,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
      domain: isProduction ? '.onrender.com' : undefined
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

app.get('/api/customers/me', validateCustomerSession, async (req, res) => {
  try {
    const customer = await getCustomerByPhone(req.customerSession.phone);
    
    if (!customer) {
      await sessionStore.del(`session:${req.cookies.customerSession}`);
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

app.post('/api/customers/logout', validateCustomerSession, async (req, res) => {
  try {
    const sessionId = req.cookies.customerSession;
    
    await sessionStore.del(`session:${sessionId}`);
    
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

app.post('/api/customers/session/refresh', validateCustomerSession, async (req, res) => {
  try {
    const sessionId = req.cookies.customerSession;
    
    await sessionStore.expire(`session:${sessionId}`, 24 * 60 * 60);
    
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

// ============================================
// 📋 MENU ENDPOINTS
// ============================================
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

// ============================================
// 🪑 TABLES ENDPOINTS
// ============================================
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

// ============================================
// 📦 ORDERS ENDPOINTS
// ============================================
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

// ============================================
// 💳 PAYMENTS ENDPOINTS
// ============================================
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
          return res.status(400).json({ 
            success: false,
            message: 'Invalid order ID format' 
          });
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
    let pointsAwarded = 0;

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

      // Award points after successful payment
      if (order.customerPhone && paymentAmount > 0) {
        try {
          console.log(`🎯 Calculating points for customer: ${order.customerPhone}, amount: ${paymentAmount}`);
          pointsAwarded = Math.floor(paymentAmount);
          
          if (pointsAwarded > 0) {
            console.log(`➕ Adding ${pointsAwarded} points to customer: ${order.customerPhone}`);
            
            const updatedCustomer = await createOrUpdateCustomer(
              order.customerPhone, 
              order.customerName || '', 
              pointsAwarded, 
              paymentAmount
            );
            
            console.log(`✅ Points awarded successfully. Total points: ${updatedCustomer.points}`);
            
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

      safeEmit('paymentProcessed', {
        ...payment,
        pointsAwarded: pointsAwarded,
        customerPhone: order.customerPhone
      });
      
      safeEmit('orderUpdated', updatedOrder.value);

      console.log('✅ Payment processed successfully for order:', order.orderNumber);
      
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
        message: 'Failed to save payment' 
      });
    }
    
  } catch (error) {
    console.error('💥 Payment endpoint error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Payment processing failed' 
    });
  }
});

// ============================================
// 🔌 WEBSOCKET HANDLERS
// ============================================
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('disconnect', (reason) => {
    console.log('❌ Client disconnected:', socket.id, reason);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });
});

// ============================================
// 🚀 START SERVER
// ============================================
const PORT = process.env.PORT || 10000;

server.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Restaurant SaaS Server running on port ${PORT}`);
  console.log(`🔐 Session Store: ${useRedis ? 'Redis (Cloud)' : 'In-Memory (Fallback)'}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
  console.log(`${'='.repeat(60)}\n`);
  
  await initializeDatabase();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
  }
  
  if (mongoClient) {
    await mongoClient.close();
  }
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});