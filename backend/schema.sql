-- Create tables
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100),
  points INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  first_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tier VARCHAR(20) DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  preparation_time INTEGER DEFAULT 10,
  description TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tables (
  id SERIAL PRIMARY KEY,
  number VARCHAR(10) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'available',
  capacity INTEGER DEFAULT 4,
  order_id INTEGER,
  last_cleaned TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  table_id INTEGER,
  customer_phone VARCHAR(20),
  customer_name VARCHAR(100),
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  payment_status VARCHAR(20) DEFAULT 'pending',
  order_type VARCHAR(20) DEFAULT 'dine-in',
  ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (table_id) REFERENCES tables(id),
  FOREIGN KEY (customer_phone) REFERENCES customers(phone)
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  menu_item_id INTEGER,
  item_name VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(50),
  special_instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER,
  order_number VARCHAR(50),
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(20) DEFAULT 'cash',
  status VARCHAR(20) DEFAULT 'completed',
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Insert sample data
INSERT INTO menu_items (name, price, category, preparation_time) VALUES
('Teh Tarik', 4.50, 'drinks', 5),
('Kopi O', 3.80, 'drinks', 3),
('Milo Dinosaur', 6.50, 'drinks', 4),
('Nasi Lemak', 12.90, 'main', 15),
('Char Kuey Teow', 14.50, 'main', 12),
('Roti Canai', 3.50, 'main', 8),
('Satay Set', 18.90, 'main', 20),
('Cendol', 6.90, 'desserts', 7),
('Apam Balik', 5.50, 'desserts', 10)
ON CONFLICT DO NOTHING;

INSERT INTO tables (number, status, capacity) VALUES
('T01', 'available', 4),
('T02', 'available', 2),
('T03', 'available', 6),
('T04', 'available', 4),
('T05', 'available', 4),
('T06', 'available', 2),
('T07', 'available', 4),
('T08', 'available', 8)
ON CONFLICT (number) DO NOTHING;

-- Make sure prices are stored as DECIMAL/NUMERIC
ALTER TABLE menu_items ALTER COLUMN price TYPE DECIMAL(10,2);
ALTER TABLE orders ALTER COLUMN total TYPE DECIMAL(10,2);
ALTER TABLE order_items ALTER COLUMN price TYPE DECIMAL(10,2);
ALTER TABLE payments ALTER COLUMN amount TYPE DECIMAL(10,2);