import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Vendor, Product, Bill } from './models.js';
import PDFDocument from 'pdfkit';

const router = express.Router();

// JWT middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Auth routes
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
});
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(409).json({ message: 'Username already exists' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  await user.save();
  res.status(201).json({ message: 'User registered successfully' });
});

// Vendor CRUD
router.get('/vendors', authenticateToken, async (req, res) => {
  const vendors = await Vendor.find();
  res.json(vendors);
});
router.post('/vendors', authenticateToken, async (req, res) => {
  const vendor = new Vendor(req.body);
  await vendor.save();
  res.json(vendor);
});
router.put('/vendors/:id', authenticateToken, async (req, res) => {
  const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(vendor);
});

// Product CRUD
router.get('/products', authenticateToken, async (req, res) => {
  const products = await Product.find();
  res.json(products);
});
router.post('/products', authenticateToken, async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.json(product);
});
router.put('/products/:id', authenticateToken, async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(product);
});

// Bill CRUD
router.get('/bills', authenticateToken, async (req, res) => {
  const bills = await Bill.find().sort({ date: -1 }).populate('vendorId').populate('products.productId');
  res.json(bills);
});
router.post('/bills', authenticateToken, async (req, res) => {
  // Generate next invoice number (incremental, padded)
  const lastBill = await Bill.findOne().sort({ invoiceNo: -1 });
  let nextInvoiceNo = '1';
  if (lastBill && lastBill.invoiceNo) {
    const lastNo = parseInt(lastBill.invoiceNo, 10);
    if (!isNaN(lastNo)) nextInvoiceNo = (lastNo + 1).toString();
  }
  const bill = new Bill({ ...req.body, invoiceNo: nextInvoiceNo, createdBy: req.user.id });
  await bill.save();
  res.json(bill);
});

// Get single bill by ID
router.get('/bills/:id', authenticateToken, async (req, res) => {
  const bill = await Bill.findById(req.params.id).populate('vendorId').populate('products.productId');
  if (!bill) return res.status(404).json({ message: 'Bill not found' });
  res.json(bill);
});

export default router;
