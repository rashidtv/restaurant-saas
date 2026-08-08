// backend/server.js - PostgreSQL Version
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pool = require('./db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// ============================================
// 🎯 REDIS: Optional - Falls back to memory store
// ============================================
let redisClient = null;
let useRedis = false;
let redisInitialized = false;

// Memory store fallback
const memoryStore = {
  sessions: {},
  get: async (key) => {
    const sessionKey = key.replace('session:', '');
    return memoryStore.sessions[sessionKey] || null;
  },
  setEx: async (key, expiry, value) => {
    const sessionKey = key.replace('session:', '');
    memoryStore.sessions[sessionKey] = value;
    setTimeout(() => {
      delete memoryStore.sessions[sessionKey];
    }, expiry * 1000);
  },
  del: async (key) => {
    const sessionKey = key.replace('session:', '');
    delete memoryStore.sessions[sessionKey];
  },
  expire: async (key, expiry) => {
    return true;
  },
  isOpen: true
};

// Try Redis connection
try {
  const redis = require('redis');
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

    redisClient.connect().catch((err) => {
      console.warn('⚠️ Redis connection failed, using memory store:', err.message);
      useRedis = false;
      redisInitialized = true;
    });

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

// Session store
const sessionStore = {
  get: async (key) => {
    if (useRedis && redisClient && redisClient.isOpen) {
      try {
        return await redisClient.get(key);
      } catch (e) {
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
        // Fall through
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
        // Fall through
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
        // Fall through
      }
    }
    await memoryStore.expire(key, expiry);
  }
};

console.log(`✅ Session store: ${useRedis ? 'Redis (Cloud)' : 'In-Memory (Fallback)'}`);

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

// ============================================
// 🔧 HELPER FUNCTIONS
// ============================================
function generateOrderNumber() {
  return `MESRA${Date.now().toString().slice(-6)}`;
}

async function getCustomerByPhone(phone) {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const result = await pool.query('SELECT * FROM customers WHERE phone = $1', [cleanPhone]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting customer:', error);
    return null;
  }
}

async function createOrUpdateCustomer(phone, name = '', pointsToAdd = 0, orderTotal = 0) {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const now = new Date();
    
    console.log('🔄 Creating/updating customer:', cleanPhone, 'Points to add:', pointsToAdd);
    
    const existing = await pool.query('SELECT * FROM customers WHERE phone = $1', [cleanPhone]);
    
    if (existing.rows.length > 0) {
      console.log('✅ Customer exists, updating:', cleanPhone);
      const customer = existing.rows[0];
      
      let updateQuery = 'UPDATE customers SET last_visit = $1, updated_at = $2';
      const params = [now, now];
      let paramCount = 3;
      
      if (name && name !== customer.name) {
        updateQuery += `, name = $${paramCount}`;
        params.push(name);
        paramCount++;
      }
      
      if (pointsToAdd > 0) {
        updateQuery += `, points = points + $${paramCount}`;
        params.push(pointsToAdd);
        paramCount++;
        
        if (orderTotal > 0) {
          updateQuery += `, total_orders = total_orders + 1, total_spent = total_spent + $${paramCount}`;
          params.push(orderTotal);
          paramCount++;
        }
      }
      
      updateQuery += ` WHERE phone = $${paramCount} RETURNING *`;
      params.push(cleanPhone);
      
      const result = await pool.query(updateQuery, params);
      console.log('✅ Existing customer updated successfully:', cleanPhone);
      return result.rows[0];
      
    } else {
      console.log('✅ Creating new customer:', cleanPhone);
      
      const result = await pool.query(
        `INSERT INTO customers (phone, name, points, total_orders, total_spent, first_visit, last_visit, tier)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'member') RETURNING *`,
        [
          cleanPhone,
          name || `Customer-${cleanPhone.slice(-4)}`,
          pointsToAdd || 0,
          orderTotal > 0 ? 1 : 0,
          orderTotal || 0,
          now,
          now
        ]
      );
      
      console.log('✅ New customer created successfully:', cleanPhone);
      return result.rows[0];
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
    const result = await pool.query('SELECT 1 as connected');
    const redisStatus = useRedis && redisClient?.isOpen ? 'connected' : 'disconnected (using memory)';
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      redis: redisStatus,
      sessionStore: useRedis ? 'Redis' : 'Memory'
    });
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
    const ordersCount = await pool.query('SELECT COUNT(*) FROM orders');
    const tablesCount = await pool.query('SELECT COUNT(*) FROM tables');
    const customersCount = await pool.query('SELECT COUNT(*) FROM customers');
    const menuItemsCount = await pool.query('SELECT COUNT(*) FROM menu_items');
    const paymentsCount = await pool.query('SELECT COUNT(*) FROM payments');
    
    res.json({ 
      status: 'OK', 
      message: 'Restaurant SaaS API is running with PostgreSQL',
      timestamp: new Date().toISOString(),
      redis: useRedis && redisClient?.isOpen ? 'connected' : 'disconnected (using memory)',
      sessionStore: useRedis ? 'Redis' : 'Memory',
      data: {
        menuItems: parseInt(menuItemsCount.rows[0].count),
        tables: parseInt(tablesCount.rows[0].count),
        orders: parseInt(ordersCount.rows[0].count),
        payments: parseInt(paymentsCount.rows[0].count),
        customers: parseInt(customersCount.rows[0].count)
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
    sessionStore: useRedis ? 'Redis' : 'Memory',
    database: 'PostgreSQL'
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
    
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
    
    await sessionStore.setEx(
      `session:${sessionId}`,
      24 * 60 * 60,
      JSON.stringify({
        customerId: customer.id,
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
    
    res.json({ success: true, customer });
    
  } catch (error) {
    console.error('❌ Registration error:', error);
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
    res.json({ success: true, message: 'Logged out successfully' });
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
});

app.post('/api/customers/session/refresh', validateCustomerSession, async (req, res) => {
  try {
    const sessionId = req.cookies.customerSession;
    await sessionStore.expire(`session:${sessionId}`, 24 * 60 * 60);
    res.json({ success: true, message: 'Session refreshed' });
  } catch (error) {
    console.error('Session refresh error:', error);
    res.status(500).json({ success: false, message: 'Failed to refresh session' });
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
    const result = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/customers/:phone', async (req, res) => {
  try {
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
    const { phone } = req.params;
    const cleanPhone = phone.replace(/\D/g, '');
    
    console.log('📋 Fetching orders for customer:', cleanPhone);
    
    const result = await pool.query(`
      SELECT o.*, json_agg(oi.*) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_phone = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [cleanPhone]);
    
    console.log(`✅ Found ${result.rows.length} orders for customer ${cleanPhone}`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Customer orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch customer orders' });
  }
});

// ============================================
// 📋 MENU ENDPOINTS
// ============================================
app.get('/api/menu', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM menu_items ORDER BY category, name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 🪑 TABLES ENDPOINTS
// ============================================
app.get('/api/tables', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tables ORDER BY number');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tables/:id', async (req, res) => {
  try {
    const tableId = req.params.id;
    const updateData = req.body;
    
    console.log('🔄 Table update request:', tableId, updateData);
    
    const result = await pool.query(
      `UPDATE tables 
       SET status = $1, order_id = $2, updated_at = CURRENT_TIMESTAMP
       WHERE number = $3 OR id = $3::integer
       RETURNING *`,
      [updateData.status, updateData.orderId || null, tableId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Table not found' 
      });
    }
    
    const updatedTable = result.rows[0];
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
    const result = await pool.query(`
      SELECT o.*, 
             COALESCE(json_agg(oi.*) FILTER (WHERE oi.id IS NOT NULL), '[]') as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Orders fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  const client = await pool.connect();
  
  try {
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
    const orderNumber = generateOrderNumber();
    
    await client.query('BEGIN');
    
    // Get table ID from number
    const tableResult = await client.query('SELECT id FROM tables WHERE number = $1', [tableId]);
    let tableIdInt = null;
    if (tableResult.rows.length > 0) {
      tableIdInt = tableResult.rows[0].id;
    }
    
    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders 
       (order_number, table_id, customer_phone, customer_name, total, order_type, ordered_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [orderNumber, tableIdInt, customerPhone || '', customerName || '', total, orderType || 'dine-in', now]
    );
    
    const order = orderResult.rows[0];
    
    // Insert order items
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items 
         (order_id, menu_item_id, item_name, quantity, price, category, special_instructions)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          order.id,
          item.menuItemId || item.id || null,
          item.name || 'Menu Item',
          parseInt(item.quantity) || 1,
          parseFloat(item.price) || 0,
          item.category || 'uncategorized',
          item.specialInstructions || ''
        ]
      );
    }
    
    // Update table status
    if (tableIdInt) {
      await client.query(
        `UPDATE tables SET status = 'occupied', order_id = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [order.id, tableIdInt]
      );
    }
    
    await client.query('COMMIT');
    
    // Get full order with items
    const fullOrderResult = await client.query(`
      SELECT o.*, 
             COALESCE(json_agg(oi.*) FILTER (WHERE oi.id IS NOT NULL), '[]') as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id
    `, [order.id]);
    
    const fullOrder = fullOrderResult.rows[0];
    
    safeEmit('newOrder', fullOrder);
    console.log(`📦 New order created: ${orderNumber} for Table ${tableId}`);
    
    res.json({
      success: true,
      orderNumber: orderNumber,
      order: fullOrder,
      message: `Order created successfully`
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Order creation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create order: ' + error.message 
    });
  } finally {
    client.release();
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    
    console.log(`🔄 Updating order ${orderId} to status: ${status}`);
    
    if (!status) {
      return res.status(400).json({ 
        success: false,
        error: 'Status is required' 
      });
    }
    
    let query = `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP`;
    const params = [status];
    
    if (status === 'completed') {
      query += `, completed_at = CURRENT_TIMESTAMP`;
    }
    
    query += ` WHERE order_number = $2 OR id = $2::integer RETURNING *`;
    params.push(orderId);
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }
    
    const updatedOrder = result.rows[0];
    safeEmit('orderUpdated', updatedOrder);
    
    res.json({
      success: true,
      order: updatedOrder
    });
    
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
    const tableId = req.params.tableId;
    console.log('🔍 Checking active orders for table:', tableId);
    
    const result = await pool.query(`
      SELECT o.*, 
             COALESCE(json_agg(oi.*) FILTER (WHERE oi.id IS NOT NULL), '[]') as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.table_id = (SELECT id FROM tables WHERE number = $1)
        AND o.status IN ('pending', 'preparing', 'ready')
      GROUP BY o.id
      ORDER BY o.ordered_at DESC
    `, [tableId]);
    
    const latestOrder = result.rows.length > 0 ? result.rows[0] : null;
    
    console.log('✅ Active order check result:', latestOrder ? latestOrder.order_number : 'No active orders');
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
    const result = await pool.query('SELECT * FROM payments ORDER BY paid_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments', async (req, res) => {
  const client = await pool.connect();
  
  try {
    console.log('💰 Payment request received:', req.body);
    
    const { orderId, amount, method = 'cash' } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ 
        success: false,
        message: 'Order ID is required' 
      });
    }

    console.log('🔍 Processing payment for order:', orderId);
    
    await client.query('BEGIN');
    
    // Find order
    const orderResult = await client.query(
      `SELECT * FROM orders WHERE order_number = $1 OR id = $2::integer`,
      [orderId, orderId]
    );
    
    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }
    
    const order = orderResult.rows[0];
    const paymentAmount = amount || order.total;
    let pointsAwarded = 0;
    
    // Create payment
    const paymentResult = await client.query(
      `INSERT INTO payments (order_id, order_number, amount, method, paid_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING *`,
      [order.id, order.order_number, paymentAmount, method]
    );
    
    const payment = paymentResult.rows[0];
    
    // Update order payment status
    await client.query(
      `UPDATE orders SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [order.id]
    );
    
    // Award points if customer exists
    if (order.customer_phone && paymentAmount > 0) {
      try {
        console.log(`🎯 Calculating points for customer: ${order.customer_phone}, amount: ${paymentAmount}`);
        pointsAwarded = Math.floor(paymentAmount);
        
        if (pointsAwarded > 0) {
          console.log(`➕ Adding ${pointsAwarded} points to customer: ${order.customer_phone}`);
          
          const updatedCustomer = await createOrUpdateCustomer(
            order.customer_phone,
            order.customer_name || '',
            pointsAwarded,
            paymentAmount
          );
          
          console.log(`✅ Points awarded successfully. Total points: ${updatedCustomer.points}`);
          
          safeEmit('pointsUpdated', {
            customerPhone: order.customer_phone,
            pointsAdded: pointsAwarded,
            totalPoints: updatedCustomer.points,
            orderId: order.order_number,
            timestamp: new Date().toISOString()
          });
        }
      } catch (pointsError) {
        console.error('❌ Points calculation failed:', pointsError);
      }
    }
    
    // Update table status
    if (order.table_id) {
      await client.query(
        `UPDATE tables SET status = 'needs_cleaning', order_id = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [order.table_id]
      );
    }
    
    await client.query('COMMIT');
    
    // Get updated order
    const updatedOrderResult = await client.query(
      'SELECT * FROM orders WHERE id = $1',
      [order.id]
    );
    const updatedOrder = updatedOrderResult.rows[0];
    
    safeEmit('paymentProcessed', {
      ...payment,
      pointsAwarded: pointsAwarded,
      customerPhone: order.customer_phone
    });
    
    safeEmit('orderUpdated', updatedOrder);
    
    console.log('✅ Payment processed successfully for order:', order.order_number);
    
    res.json({
      success: true,
      payment: payment,
      order: updatedOrder,
      pointsAwarded: pointsAwarded
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Payment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Payment processing failed' 
    });
  } finally {
    client.release();
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
  console.log(`🗄️  Database: PostgreSQL on Render`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
  console.log(`${'='.repeat(60)}\n`);
  
  // Test database connection
  try {
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL database connection verified');
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  await pool.end();
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
  }
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});