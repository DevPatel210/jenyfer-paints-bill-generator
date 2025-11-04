import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, Vendor, Product, Bill } from "./models.js";

// Utility to get financial year string and invoice number
function getFinancialYear(date) {
  const d = date ? new Date(date) : new Date();
  let year = d.getFullYear();
  let month = d.getMonth() + 1;
  if (month < 4) year--;
  const nextYear = (year + 1).toString().slice(-2);
  return `${year}-${nextYear}`;
}

async function getNextInvoiceNo(date) {
  const fy = getFinancialYear(date);
  // Use aggregation to find max invoice number for the financial year
  const result = await Bill.aggregate([
    { $match: { invoiceNo: { $regex: `^${fy}-` } } },
    {
      $addFields: {
        invoiceNumInt: {
          $toInt: { $arrayElemAt: [{ $split: ["$invoiceNo", "-"] }, 2] },
        },
      },
    },
    { $sort: { invoiceNumInt: -1 } },
    { $limit: 1 },
  ]);
  const maxNo = result.length ? result[0].invoiceNumInt : 0;
  const nextNo = maxNo + 1;
  return `${fy}-${nextNo}`;
}

const router = express.Router();

// JWT middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Auth routes
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ message: "Invalid credentials" });
  const token = jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
  res.json({ token });
});
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(409).json({ message: "Username already exists" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  await user.save();
  res.status(201).json({ message: "User registered successfully" });
});

// Vendor CRUD
router.get("/vendors", authenticateToken, async (req, res) => {
  const vendors = await Vendor.find();
  res.json(vendors);
});
router.post("/vendors", authenticateToken, async (req, res) => {
  const vendor = new Vendor(req.body);
  await vendor.save();
  res.json(vendor);
});
router.put("/vendors/:id", authenticateToken, async (req, res) => {
  const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(vendor);
});

// Product CRUD
router.get("/products", authenticateToken, async (req, res) => {
  const products = await Product.find();
  res.json(products);
});
router.post("/products", authenticateToken, async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.json(product);
});
router.put("/products/:id", authenticateToken, async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(product);
});

// Bill CRUD

router.get("/bills", authenticateToken, async (req, res) => {
  const { financialYear } = req.query;
  let filter = {};
  if (financialYear) {
    filter.invoiceNo = { $regex: `^${financialYear}-` };
  }
  const bills = await Bill.find(filter)
    .sort({ invoiceNo: -1, date: -1 })
    .populate("vendorId")
    .populate("products.productId");
  res.json(bills);
});

router.post("/bills", authenticateToken, async (req, res) => {
  // Generate next invoice number in financial year format
  let invoiceNo = req.body.invoiceNo;
  if (!invoiceNo) {
    invoiceNo = await getNextInvoiceNo(req.body.date);
  } else {
    // Validate uniqueness for financial year
    const fy = getFinancialYear(req.body.date);
    const exists = await Bill.findOne({
      invoiceNo: `${fy}-${invoiceNo}`,
    });
    if (exists) {
      return res.status(409).json({
        message: "Invoice number already exists for this financial year.",
      });
    }
    invoiceNo = `${fy}-${invoiceNo}`;
  }
  const bill = new Bill({ ...req.body, invoiceNo, createdBy: req.user.id });
  await bill.save();
  res.json(bill);
});

// Endpoint to get next invoice number for UI
router.get("/next-invoice-no", authenticateToken, async (req, res) => {
  const date = req.query.date || new Date();
  const nextInvoiceNo = await getNextInvoiceNo(date);
  res.json({ invoiceNo: nextInvoiceNo });
});

// Get single bill by ID
router.get("/bills/:id", authenticateToken, async (req, res) => {
  const bill = await Bill.findById(req.params.id)
    .populate("vendorId")
    .populate("products.productId");
  if (!bill) return res.status(404).json({ message: "Bill not found" });
  res.json(bill);
});

export default router;
