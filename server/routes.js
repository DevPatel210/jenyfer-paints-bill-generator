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

// Regenerate/download bill as PDF
router.get('/bills/:id/pdf', authenticateToken, async (req, res) => {
  const bill = await Bill.findById(req.params.id).populate('vendorId').populate('products.productId');
  if (!bill) return res.status(404).send('Bill not found');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice_${bill.invoiceNo}.pdf`);
  const doc = new PDFDocument({ size: 'A4', margin: 30 });
  doc.pipe(res);

  // --- PDF content generation logic using bill-format.jpg as background ---
  const fs = await import('fs');
  const path = await import('path');
  const bgPath = path.resolve(process.cwd(), 'bill-format.jpg');
  if (fs.existsSync(bgPath)) {
    doc.image(bgPath, 0, 0, { width: 595, height: 842 }); // A4 size in points
  }

  // Overlay bill data at approximate positions (tuned for the provided image)
  doc.fontSize(12).fillColor('black');
  // Header
  doc.text(bill.vendorId?.name || '', 120, 110, { width: 250 });
  doc.text(bill.vendorId?.address || '', 120, 130, { width: 300 });
  doc.text(bill.vendorId?.phone || '', 120, 150);
  doc.text(bill.vendorId?.gstNo || '', 120, 170);
  doc.text(bill.vendorId?.panNo || '', 320, 170);

  // Invoice details
  doc.text(bill.invoiceNo, 470, 80);
  doc.text(bill.date?.toISOString().slice(0,10), 470, 100);
  doc.text(bill.transportName || '', 470, 120);
  // Products table
  let y = 240;
  bill.products.forEach((p, i) => {
    doc.text(i + 1, 40, y);
    doc.text(p.productId?.name || '', 80, y, { width: 100 });
    doc.text(p.productId?.hsnCode || '', 190, y);
    doc.text(p.qty, 250, y);
    doc.text(p.unit, 290, y);
    doc.text(p.rate, 340, y);
    doc.text(p.amount, 420, y);
    y += 20;
  });
  // Totals
  doc.text(bill.total, 420, 420);
  doc.text(bill.cgst, 420, 450);
  doc.text(bill.sgst, 420, 470);
  doc.text(bill.grandTotal, 420, 500);
  doc.text(bill.amountInWords, 60, 530, { width: 400 });

  // Bank details and terms
  doc.fontSize(10);
  doc.text(bill.bankDetails || '', 60, 560, { width: 400 });
  doc.text(bill.terms || '', 60, 600, { width: 400 });

  doc.end();
});

// Bill HTML generation (instead of PDF)
router.get('/bills/:id/html', authenticateToken, async (req, res) => {
  const bill = await Bill.findById(req.params.id).populate('vendorId').populate('products.productId');
  if (!bill) return res.status(404).send('Bill not found');
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${bill.invoiceNo}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #fff; }
        .bill-container { max-width: 900px; margin: 0 auto; background: #fff; padding: 32px; }
        h1 { text-align: center; margin-bottom: 0; }
        .header, .footer { text-align: center; }
        .section { margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #222; padding: 6px 8px; font-size: 14px; }
        th { background: #f0f0f0; }
        .totals td { font-weight: bold; }
        .right { text-align: right; }
        .center { text-align: center; }
        .save-btn { margin: 20px 0; padding: 8px 18px; font-size: 16px; background: #1976d2; color: #fff; border: none; border-radius: 5px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="bill-container">
        <div class="header">
          <h1>RAJESH CHEMICAL</h1>
          <div>DEALER IN : ACID SLURRY, SODA, WASHING POWDER, A.O.S, OIL SOAP AND OTHER CHEMICALS</div>
          <div>18, PARMANAND'S CHAWL, OPP. VIKRAM MILL, SARASPUR, AHMEDABAD-380018</div>
          <div>GST NO: 24AHUPP1093M1ZO &nbsp; PAN NO: AHUPP1093M</div>
        </div>
        <hr />
        <div class="section">
          <div><b>Bill to:</b> ${bill.vendorId?.name || ''}</div>
          <div>${bill.vendorId?.address || ''}</div>
          <div>Mobile no.: ${bill.vendorId?.phone || ''}</div>
        </div>
        <div class="section">
          <table>
            <tr>
              <td>GST NO: ${bill.vendorId?.gstNo || ''}</td>
              <td>PAN NO: ${bill.vendorId?.panNo || ''}</td>
              <td>INVOICE NO: ${bill.invoiceNo}</td>
              <td>DATE: ${(bill.date ? new Date(bill.date).toISOString().slice(0,10) : '')}</td>
              <td>TRANSPORT NAME: ${bill.transportName || ''}</td>
            </tr>
          </table>
        </div>
        <table>
          <thead>
            <tr>
              <th>Sr.</th>
              <th>Item Description</th>
              <th>HSN CODE</th>
              <th>Qty.</th>
              <th>Unit</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${(bill.products || []).map((p, i) => `
              <tr>
                <td class="center">${i + 1}</td>
                <td>${p.productId?.name || p.name || ''}</td>
                <td class="center">${p.productId?.hsnCode || p.hsnCode || ''}</td>
                <td class="center">${p.qty}</td>
                <td class="center">${p.unit}</td>
                <td class="right">${p.rate}</td>
                <td class="right">${p.amount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <table>
          <tr class="totals"><td colspan="6" class="right">TOTAL</td><td class="right">${bill.total}</td></tr>
          <tr><td colspan="6" class="right">CGST 9%</td><td class="right">${bill.cgst}</td></tr>
          <tr><td colspan="6" class="right">SGST 9%</td><td class="right">${bill.sgst}</td></tr>
          <tr class="totals"><td colspan="6" class="right">GRAND TOTAL</td><td class="right">${bill.grandTotal}</td></tr>
        </table>
        <div class="section"><b>RUPEES IN WORDS :</b> ${bill.amountInWords}</div>
        <div class="section">
          <b>BANK DETAILS:</b><br />
          <pre style="font-size:13px;">${bill.bankDetails || ''}</pre>
        </div>
        <div class="section">
          <b>TERMS & CONDITIONS:</b><br />
          <pre style="font-size:13px;">${bill.terms || ''}</pre>
        </div>
        <div class="footer">
          <b>FOR, RAJESH CHEMICAL</b><br />
          <span style="font-size:12px;">(Authorised Signatory)</span>
        </div>
        <button class="save-btn" onclick="window.print()">Save as PDF / Print</button>
      </div>
    </body>
    </html>
  `);
});

export default router;
