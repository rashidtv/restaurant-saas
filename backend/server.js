import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors());
app.use(express.json());

// Connect to MongoDB (using local MongoDB for demo)
mongoose.connect('mongodb://localhost:27017/mesra_pos', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Malaysian-themed Schemas
const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameBM: { type: String }, // Malay translation
  description: String,
  descriptionBM: String,
  price: { type: Number, required: true }, // in MYR
  category: { type: String, required: true },
  image: String,
  isAvailable: { type: Boolean, default: true },
  preparationTime: Number, // in minutes
  spicyLevel: { type: String, enum: ['Mild', 'Medium', 'Spicy', 'Very Spicy'] }
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  tableId: { type: Number, required: true },
  items: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    quantity: Number,
    specialInstructions: String,
    price: Number
  }],
  total: Number,
  status: { 
    type: String, 
    enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  customerName: String,
  customerPhone: String,
  orderType: { type: String, enum: ['dine-in', 'takeaway', 'delivery'], default: 'dine-in' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  paymentMethod: { type: String, enum: ['cash', 'card', 'touchngo', 'qrpay'] },
  orderedAt: { type: Date, default: Date.now },
  completedAt: Date
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);
const Order = mongoose.model('Order', orderSchema);

// Generate order number (MESRA001, MESRA002, etc.)
function generateOrderNumber() {
  return `MESRA${Date.now().toString().slice(-6)}`;
}

// Malaysian Menu Data
const malaysianMenu = [
  // Drinks
  {
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

// Initialize menu data
async function initializeMenu() {
  const count = await MenuItem.countDocuments();
  if (count === 0) {
    await MenuItem.insertMany(malaysianMenu);
    console.log('🍛 Malaysian menu initialized!');
  }
}

// API Routes
app.get('/api/menu', async (req, res) => {
  try {
    const menu = await MenuItem.find({ isAvailable: true });
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find({ status: { $ne: 'completed' } })
      .populate('items.menuItem')
      .sort({ orderedAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { tableId, items, customerName, customerPhone, orderType } = req.body;
    
    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const order = new Order({
      orderNumber: generateOrderNumber(),
      tableId,
      items: items.map(item => ({
        menuItem: item.menuItemId,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions,
        price: item.price
      })),
      total,
      customerName,
      customerPhone,
      orderType
    });
    
    await order.save();
    await order.populate('items.menuItem');
    
    io.emit('newOrder', order);
    console.log(`📦 New order: ${order.orderNumber} for Table ${tableId}`);
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        ...(status === 'completed' && { completedAt: new Date() })
      },
      { new: true }
    ).populate('items.menuItem');
    
    io.emit('orderUpdated', order);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('🔌 Kitchen display connected');
  
  socket.on('disconnect', () => {
    console.log('❌ Kitchen display disconnected');
  });
});

const PORT = process.env.PORT || 5000;

// Start server
mongoose.connection.once('open', async () => {
  console.log('✅ Connected to MongoDB');
  await initializeMenu();
  
  server.listen(PORT, () => {
    console.log(`🚀 Mesra POS Server running on http://localhost:${PORT}`);
    console.log(`🍛 Serving authentic Malaysian cuisine!`);
    console.log(`💵 Currency: Malaysian Ringgit (MYR)`);
  });
});