const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// ==================== ENHANCED CONFIGURATION ====================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rashhanz_db_user:mawip900@flavorflow.5wxjnlj.mongodb.net/?appName=flavorflow&retryWrites=true&w=majority&ssl=true';
const DB_NAME = process.env.DB_NAME || 'flavorflow';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://restaurant-saas-demo.onrender.com';
const PORT = process.env.PORT || 10000;

// ==================== ENHANCED DATABASE MANAGER ====================
class DatabaseManager {
  constructor() {
    this.db = null;
    this.client = null;
    this.isConnected = false;
    this.connectionPromise = null;
  }

  async connect() {
    // Prevent multiple connection attempts
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this._connectWithRetry();
    return this.connectionPromise;
  }

  async _connectWithRetry(retries = 5, delay = 5000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔗 MongoDB connection attempt ${attempt}/${retries}...`);
        
        const client = new MongoClient(MONGODB_URI, {
          tls: true,
          tlsAllowInvalidCertificates: false,
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 30000,
          socketTimeoutMS: 45000,
          connectTimeoutMS: 30000,
          retryWrites: true,
          retryReads: true,
        });

        await client.connect();
        this.client = client;
        this.db = client.db(DB_NAME);
        
        // Test connection
        await this.db.command({ ping: 1 });
        
        this.isConnected = true;
        console.log('✅ MongoDB connected successfully');
        
        // Initialize database
        await this._initializeDatabase();
        
        return this.db;
      } catch (error) {
        console.error(`❌ MongoDB connection attempt ${attempt} failed:`, error.message);
        
        if (attempt === retries) {
          console.error('❌ All MongoDB connection attempts failed');
          this.isConnected = false;
          throw error;
        }
        
        console.log(`🔄 Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        // Exponential backoff
        delay = Math.min(delay * 1.5, 30000);
      }
    }
  }

  async _initializeDatabase() {
    try {
      console.log('📦 Initializing database...');
      
      // Create indexes
      await this.db.collection('customers').createIndex({ phone: 1 }, { unique: true, sparse: true });
      await this.db.collection('orders').createIndex({ orderNumber: 1 }, { unique: true });
      await this.db.collection('orders').createIndex({ customerPhone: 1 });
      await this.db.collection('orders').createIndex({ tableId: 1 });
      await this.db.collection('orders').createIndex({ createdAt: -1 });
      await this.db.collection('tables').createIndex({ number: 1 }, { unique: true });
      await this.db.collection('payments').createIndex({ orderId: 1 });
      
      console.log('✅ Database indexes created');
      
      // Initialize sample data if needed
      await this._initializeSampleData();
      
    } catch (error) {
      console.error('❌ Database initialization error:', error.message);
    }
  }

  async _initializeSampleData() {
    try {
      const menuCount = await this.db.collection('menuItems').countDocuments();
      const tablesCount = await this.db.collection('tables').countDocuments();
      
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
        await this.db.collection('menuItems').insertMany(menuItems);
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
        await this.db.collection('tables').insertMany(tables);
        console.log('✅ Sample tables created');
      }
      
    } catch (error) {
      console.error('❌ Error initializing sample data:', error.message);
    }
  }

  getDatabase() {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }
    return this.db;
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      this.db = null;
      this.client = null;
      this.connectionPromise = null;
      console.log('✅ MongoDB disconnected');
    }
  }
}

// Create global database instance
const databaseManager = new DatabaseManager();

// ==================== MIDDLEWARE & CONFIGURATION ====================
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://restaurant-saas-demo.onrender.com",
    FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(express.json({ limit: '10mb' }));

// ==================== DATABASE CONNECTION MIDDLEWARE ====================
app.use(async (req, res, next) => {
  try {
    // Ensure database is connected before handling any request
    if (!databaseManager.isConnected) {
      await databaseManager.connect();
    }
    next();
  } catch (error) {
    console.error('Database connection middleware error:', error);
    res.status(503).json({
      success: false,
      error: 'Service temporarily unavailable. Database connection failed.'
    });
  }
});

// ==================== ENHANCED ERROR HANDLER ====================
function handleError(res, error, context = 'Operation') {
  console.error(`❌ ${context} failed:`, error.message);

  // MongoDB duplicate key error
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry found'
    });
  }

  // MongoDB connection errors
  if (error.name === 'MongoNetworkError' || error.message.includes('connection')) {
    return res.status(503).json({
      success: false,
      error: 'Database connection lost. Please try again.'
    });
  }

  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
}

// ==================== UTILITY FUNCTIONS ====================
function generateOrderNumber() {
  return `MESRA${Date.now().toString().slice(-6)}`;
}

async function getCustomerByPhone(phone) {
  try {
    const db = databaseManager.getDatabase();
    const cleanPhone = phone.replace(/\D/g, '');
    return await db.collection('customers').findOne({ phone: cleanPhone });
  } catch (error) {
    console.error('Error getting customer:', error);
    return null;
  }
}

async function createOrUpdateCustomer(phone, name = '', pointsToAdd = 0, orderTotal = 0) {
  try {
    const db = databaseManager.getDatabase();
    const cleanPhone = phone.replace(/\D/g, '');
    const now = new Date();
    
    const result = await db.collection('customers').findOneAndUpdate(
      { phone: cleanPhone },
      { 
        $setOnInsert: {
          name: name || `Customer-${cleanPhone.slice(-4)}`,
          points: 0,
          totalOrders: 0,
          totalSpent: 0,
          firstVisit: now,
          tier: 'member',
          createdAt: now
        },
        $inc: {
          points: pointsToAdd,
          totalOrders: pointsToAdd > 0 ? 1 : 0,
          totalSpent: orderTotal
        },
        $set: {
          lastVisit: now,
          updatedAt: now,
          ...(name && { name })
        }
      },
      { 
        upsert: true,
        returnDocument: 'after'
      }
    );
    
    return result.value;
  } catch (error) {
    console.error('Error creating/updating customer:', error);
    throw error;
  }
}

// ==================== HEALTH ENDPOINTS ====================
app.get('/health', async (req, res) => {
  try {
    const db = databaseManager.getDatabase();
    const ordersCount = await db.collection('orders').countDocuments();
    const tablesCount = await db.collection('tables').countDocuments();
    const customersCount = await db.collection('customers').countDocuments();
    const menuItemsCount = await db.collection('menuItems').countDocuments();
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: databaseManager.isConnected ? 'connected' : 'disconnected',
      data: {
        orders: ordersCount,
        tables: tablesCount,
        customers: customersCount,
        menuItems: menuItemsCount
      }
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
    const db = databaseManager.getDatabase();
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
    handleError(res, error, 'Health check');
  }
});

app.post('/api/init', async (req, res) => {
  try {
    await databaseManager._initializeSampleData();
    res.json({ message: 'Sample data initialized successfully' });
  } catch (error) {
    handleError(res, error, 'Initialize data');
  }
});

// ==================== MENU ENDPOINTS ====================
app.get('/api/menu', async (req, res) => {
  try {
    const db = databaseManager.getDatabase();
    const menuItems = await db.collection('menuItems').find().sort({ category: 1, name: 1 }).toArray();
    res.json(menuItems);
  } catch (error) {
    handleError(res, error, 'Fetch menu');
  }
});

// ==================== TABLES ENDPOINTS ====================
app.get('/api/tables', async (req, res) => {
  try {
    const db = databaseManager.getDatabase();
    const tables = await db.collection('tables').find().sort({ number: 1 }).toArray();
    res.json(tables);
  } catch (error) {
    handleError(res, error, 'Fetch tables');
  }
});

app.put('/api/tables/:id', async (req, res) => {
  try {
    const db = databaseManager.getDatabase();
    const tableId = req.params.id;
    const newStatus = req.body.status;
    
    let query;
    try {
      query = { _id: new ObjectId(tableId) };
    } catch (error) {
      query = { number: tableId };
    }
    
    const currentTable = await db.collection('tables').findOne(query);
    
    if (!currentTable) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    if (currentTable.status === newStatus) {
      console.log(`⚠️ Table ${currentTable.number} status unchanged (${newStatus}), skipping update`);
      return res.json(currentTable);
    }
    
    const updatedTable = await db.collection('tables').findOneAndUpdate(
      query,
      { $set: { ...req.body, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    
    console.log(`🔄 Table ${updatedTable.value.number} status changed from ${currentTable.status} to ${newStatus}`);
    
    io.emit('tableUpdated', updatedTable.value);
    res.json(updatedTable.value);
  } catch (error) {
    handleError(res, error, 'Update table');
  }
});

// ==================== ORDERS ENDPOINTS ====================
app.get('/api/orders', async (req, res) => {
  try {
    const db = databaseManager.getDatabase();
    const orders = await db.collection('orders').find().sort({ createdAt: -1 }).toArray();
    res.json(orders);
  } catch (error) {
    handleError(res, error, 'Fetch orders');
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const db = databaseManager.getDatabase();
    const { tableId, items, orderType, customerPhone, customerName } = req.body;
    
    console.log('📦 Creating order for table:', tableId, 'Customer:', customerPhone);
    
    if (!tableId || tableId === 'undefined') {
      return res.status(400).json({ error: 'Valid table ID is required' });
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
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
    
    await db.collection('orders').insertOne(order);
    
    if (customerPhone) {
      const pointsEarned = Math.floor(total);
      await createOrUpdateCustomer(customerPhone, customerName, pointsEarned, total);
      console.log(`🎯 Customer ${customerPhone} earned ${pointsEarned} points`);
    }
    
    const updatedTable = await db.collection('tables').findOneAndUpdate(
      { number: tableId },
      { $set: { status: 'occupied', orderId: order._id, updatedAt: now } },
      { returnDocument: 'after' }
    );
    
    if (updatedTable.value) {
      console.log(`🔄 Emitting table update for: ${updatedTable.value.number}`);
      io.emit('tableUpdated', updatedTable.value);
    }
    
    io.emit('newOrder', order);
    console.log(`📦 New order: ${order.orderNumber} for Table ${tableId}`);
    
    res.json({
      success: true,
      orderNumber: order.orderNumber,
      order: order,
      message: `Order created successfully`
    });
  } catch (error) {
    handleError(res, error, 'Create order');
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const db = databaseManager.getDatabase();
    const { status } = req.body;
    const orderId = req.params.id;
    
    console.log(`🔄 Updating order ${orderId} to status: ${status}`);
    
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
    
    const updateData = {
      status: status,
      updatedAt: new Date()
    };
    
    if (status === 'completed') {
      updateData.completedAt = new Date();
      updateData.paymentStatus = 'pending';
    }
    
    const updatedOrder = await db.collection('orders').findOneAndUpdate(
      query,
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    io.emit('orderUpdated', updatedOrder.value);
    res.json(updatedOrder.value);
    
  } catch (error) {
    handleError(res, error, 'Update order status');
  }
});

// ==================== CUSTOMER ENDPOINTS ====================
app.get('/api/customers', async (req, res) => {
  try {
    const db = databaseManager.getDatabase();
    const customers = await db.collection('customers').find().sort({ createdAt: -1 }).toArray();
    res.json(customers);
  } catch (error) {
    handleError(res, error, 'Fetch customers');
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
    handleError(res, error, 'Fetch customer');
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { phone, name } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    const customer = await createOrUpdateCustomer(phone, name);
    res.json(customer);
  } catch (error) {
    handleError(res, error, 'Create customer');
  }
});

app.post('/api/customers/:phone/points', async (req, res) => {
  try {
    const { phone } = req.params;
    const { points, orderTotal } = req.body;
    
    console.log('➕ Adding points:', points, 'for customer:', phone);
    
    const customer = await createOrUpdateCustomer(phone, '', parseInt(points) || 0, parseFloat(orderTotal) || 0);
    
    if (!customer) {
      return res.status(404).json({ 
        success: false,
        message: 'Customer not found' 
      });
    }
    
    console.log('✅ Points updated for customer:', phone, 'Total points:', customer.points);
    res.json(customer);
  } catch (error) {
    handleError(res, error, 'Add points');
  }
});

app.post('/api/customers/register', async (req, res) => {
  try {
    const { phone } = req.body;
    
    console.log('📝 Customer registration attempt for:', phone);
    
    if (!phone || phone.length < 10) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid phone number required (at least 10 digits)' 
      });
    }

    const customer = await createOrUpdateCustomer(phone);
    
    res.json({
      success: true,
      ...customer
    });
  } catch (error) {
    handleError(res, error, 'Register customer');
  }
});

app.get('/api/customers/:phone/orders', async (req, res) => {
  try {
    const db = databaseManager.getDatabase();
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
    handleError(res, error, 'Fetch customer orders');
  }
});

// ==================== PAYMENTS ENDPOINTS ====================
app.get('/api/payments', async (req, res) => {
  try {
    const db = databaseManager.getDatabase();
    const payments = await db.collection('payments').find().sort({ paidAt: -1 }).toArray();
    res.json(payments);
  } catch (error) {
    handleError(res, error, 'Fetch payments');
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    const db = databaseManager.getDatabase();
    const { orderId, amount, method } = req.body;
    
    console.log('💰 Processing payment for order:', orderId);
    
    const order = await db.collection('orders').findOne({ 
      $or: [{ orderNumber: orderId }, { _id: new ObjectId(orderId) }] 
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const now = new Date();
    const payment = {
      _id: new ObjectId(),
      orderId: order.orderNumber,
      orderInternalId: order._id,
      amount: amount || order.total,
      method: method || 'cash',
      status: 'completed',
      paidAt: now,
      createdAt: now
    };
    
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
    
    if (order.tableId) {
      const updatedTable = await db.collection('tables').findOneAndUpdate(
        { number: order.tableId },
        { $set: { status: 'needs_cleaning', orderId: null, updatedAt: now } },
        { returnDocument: 'after' }
      );
      
      if (updatedTable.value) {
        io.emit('tableUpdated', updatedTable.value);
      }
    }
    
    io.emit('paymentProcessed', payment);
    io.emit('orderUpdated', updatedOrder.value);
    
    res.json(payment);
  } catch (error) {
    handleError(res, error, 'Process payment');
  }
});

// ==================== UTILITY ENDPOINTS ====================
app.get('/api/orders/table/:tableId', async (req, res) => {
  try {
    const db = databaseManager.getDatabase();
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
    handleError(res, error, 'Check active orders');
  }
});

app.put('/api/orders/:id/items', async (req, res) => {
  try {
    const db = databaseManager.getDatabase();
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
    
    io.emit('orderUpdated', updatedOrder.value);
    res.json(updatedOrder.value);
  } catch (error) {
    handleError(res, error, 'Add items to order');
  }
});

// ==================== SOCKET.IO HANDLING ====================
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('disconnect', (reason) => {
    console.log('❌ Client disconnected:', socket.id, 'Reason:', reason);
  });
  
  socket.on('error', (error) => {
    console.error('🔌 Socket error:', error);
  });
});

// ==================== GRACEFUL SHUTDOWN ====================
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  await databaseManager.disconnect();
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  await databaseManager.disconnect();
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

// ==================== START SERVER ====================
async function startServer() {
  try {
    // Initialize database connection first
    await databaseManager.connect();
    
    // Then start the server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 PRODUCTION Mesra POS Server running on port ${PORT}`);
      console.log(`📍 Health check: https://restaurant-saas-backend-hbdz.onrender.com/health`);
      console.log(`🔧 CORS enabled for: ${FRONTEND_URL}`);
      console.log(`💾 Database: MongoDB (Production Ready)`);
      console.log(`👥 Customer tracking: PERSISTENT`);
      console.log(`🎯 Loyalty points: PERSISTENT`);
      console.log(`🔄 Real-time updates: ENABLED`);
      console.log(`🛡️  Production ready: YES\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();