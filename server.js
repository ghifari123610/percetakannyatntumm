require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const cors = require('cors');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Basic route
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'owner'], default: 'admin' },
});

const User = mongoose.model('User', userSchema);

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register route
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, role });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error registering user', error: error.message });
  }
});

// Login route
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


const authenticate = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware untuk otorisasi peran
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: You do not have access to this resource' });
    }
    next();
  };
};

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  Timestamp: { type: String, required: true },
  Tanggal: { type: String, required: true },
  Jam: { type: String, required: true },
  'Kode Transaksi': { type: String, required: true, unique: true },
  'Nama Transaksi': { type: String, required: true },
  Admin: { type: String, required: true },
  Barang: { type: String },
  Harga: { type: Number, required: true },
  Metode: { type: String, required: true },
  Tuan: { type: String },
  'Nomor HP': { type: String },
  Panjar: { type: Number },
  Sisa: { type: Number },
  Catatan: { type: String },
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Basic route
app.get('/', (req, res) => {
  res.send('Percetakan 21 Backend is running!');
});

// API endpoint to update user password
app.put('/api/users/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// API endpoint to save a transaction
app.post('/api/transactions', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const newTransaction = new Transaction(req.body);
    await newTransaction.save();
    res.status(201).json({ message: 'Transaction saved successfully', transaction: newTransaction });
  } catch (error) {
    res.status(400).json({ message: 'Error saving transaction', error: error.message });
  }
});

// API endpoint for owner to view all transactions
app.get('/api/transactions', authenticate, authorize(['owner']), async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ _id: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// API endpoint for owner to delete a transaction
app.delete('/api/transactions/:id', authenticate, authorize(['owner']), async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
