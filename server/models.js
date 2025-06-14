import mongoose from 'mongoose';

// User, Vendor, Product, and Bill models for MongoDB
// User: username, password (hashed)
// Vendor: name, address, gstNo, phone, email
// Product: name, hsnCode, unit (kg/litre), rate
// Bill: vendorId, products [{productId, qty, rate, discount, amount}], invoiceNo, date, transportName, total, cgst, sgst, grandTotal, amountInWords, bankDetails, terms, createdBy

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  gstNo: String,
  panNo: String,
  phone: String,
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  hsnCode: String,
  unit: { type: String, enum: ['kg', 'litre'], default: 'kg' },
  packings: [{type: String}], // e.g., '1.0', '0.500', '1.25
  rate: { type: Number, required: true },
});

const billSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      name: String,
      hsnCode: String,
      qty: Number,
      unit: String,
      packing: String, // e.g., '1.0', '0.500', '1.25'
      rate: Number,
      discount: Number,
      amount: Number,
    }
  ],
  invoiceNo: { type: String, required: true },
  date: { type: Date, required: true },
  transportName: String,
  vehicleNo: String,
  lrNo: String,
  total: Number,
  cgst: Number,
  sgst: Number,
  igst: Number,
  grandTotal: Number,
  amountInWords: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

export const User = mongoose.model('User', userSchema);
export const Vendor = mongoose.model('Vendor', vendorSchema);
export const Product = mongoose.model('Product', productSchema);
export const Bill = mongoose.model('Bill', billSchema);
