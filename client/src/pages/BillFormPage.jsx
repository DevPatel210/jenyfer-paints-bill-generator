import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Helper function to format packing values for the dropdown label
const formatPackingLabel = (value, unit) => {
  if (!value || !unit) return 'Select Packing';
  
  const numericValue = parseFloat(value);
  const mainUnitVal = Math.floor(numericValue);
  const subUnitVal = Math.round((numericValue - mainUnitVal) * 1000);

  const unitLabels = {
    kg: { main: 'kg', sub: 'gm' },
    litre: { main: 'ltr', sub: 'ml' },
  };

  const labels = unitLabels[unit] || { main: '', sub: '' };
  return `${mainUnitVal} ${labels.main} ${subUnitVal} ${labels.sub}`;
};

const numberToWords = (num) => {
  // Apply Math.round() to the number first based on the requirement
  const roundedNum = Math.round(num);

  if (roundedNum === 0) return 'Zero Only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  // Helper function to convert a number (0-999) to words
  const convertHundreds = (n) => {
    let result = '';
    if (n >= 100) {
      result += units[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 10) {
      if (n >= 10 && n <= 19) {
        result += teens[n - 10] + ' ';
        n = 0; // Handled
      } else {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
    }
    if (n > 0) {
      result += units[n] + ' ';
    }
    return result.trim();
  };

  let words = '';
  let currentNum = roundedNum; // Use the rounded number for conversion

  const segments = [];
  segments.push(currentNum % 1000); // Last three digits
  currentNum = Math.floor(currentNum / 1000);

  while (currentNum > 0) {
    segments.push(currentNum % 100); // Groups of two digits
    currentNum = Math.floor(currentNum / 100);
  }

  const indianScales = [
    '',
    'Thousand',
    'Lakh',
    'Crore',
    'Arab'
  ];

  for (let i = 0; i < segments.length; i++) {
    const segmentValue = segments[i];
    if (segmentValue > 0) {
      words = convertHundreds(segmentValue) + ' ' + indianScales[i] + ' ' + words;
    }
  }

  words = words.trim();
  return words + ' Only';
};


function BillFormPage() {
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    vendorId: '',
    date: '', // This will be set by the date input
    transportName: '',
    vehicleNo: '',
    lrNo: '',
    outsideGujarat: false,
    products: [{ productId: '', packing: '', qty: 1, rate: 0, discount: 0, amount: 0 }],
  });
  const navigate = useNavigate();

  // Calculate totals - these will automatically re-calculate when `form.products` changes
  const total = form.products.reduce((sum, p) => sum + p.amount, 0);
  const cgst = form.outsideGujarat ? 0 : total * 0.09;
  const sgst = form.outsideGujarat ? 0 : total * 0.09;
  const igst = form.outsideGujarat ? total * 0.18 : 0;
  const grandTotal = total + cgst + sgst + igst;

  // Fetch vendors and products
  useEffect(() => {
    axios.get('/vendors').then(res => setVendors(res.data));
    axios.get('/products').then(res => setProducts(res.data));
  }, []);

  // Removed the problematic useEffect for amount calculation
  // The amount will now be calculated directly in handleProductChange

  const handleProductChange = (index, field, value) => {
    const updatedProducts = form.products.map((p, i) => {
      if (i === index) {
        console.log({field, value});
        let newValue = value;
        if (field === 'qty' || field === 'rate' || field === 'discount' || field === 'packing') {
          newValue = parseFloat(value) || 0;
        }
        
        let updatedProduct = { ...p, [field]: newValue };

        // If product ID changes, update packing options and reset packing
        if (field === 'productId') {
          const selectedProduct = products.find(prod => prod._id === newValue);
          console.log(selectedProduct)
          updatedProduct = {
            ...updatedProduct,
            rate: selectedProduct ? selectedProduct.rate : 0,
            qty: 1, // Reset quantity when product changes
            discount: 0, // Reset discount when product changes
            packing: '', // Reset packing when product changes
            packingOptions: selectedProduct ? selectedProduct.packings : []
          };
        }
        console.log(updatedProduct);
        // Recalculate amount immediately after relevant fields change
        const currentQty = (field === 'qty') ? newValue : updatedProduct.qty;
        const currentRate = (field === 'rate') ? newValue : updatedProduct.rate;
        const currentDiscount = (field === 'discount') ? newValue : updatedProduct.discount;
        const currentPacking = (field === 'packing') ? newValue : updatedProduct.packing;
        
        const amount = currentQty * currentPacking * currentRate  - currentDiscount;
        updatedProduct.amount = isNaN(amount) ? 0 : amount;

        return updatedProduct;
      }
      return p;
    });
    setForm({ ...form, products: updatedProducts });
  };

  const addProductRow = () => {
    setForm({
      ...form,
      products: [...form.products, { productId: '', packing: '', qty: 1, rate: 0, discount: 0, amount: 0 }],
    });
  };

  const removeProductRow = (index) => {
    setForm({
      ...form,
      products: form.products.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/bills', { ...form, grandTotal });
      toast.success('Bill generated successfully!');
      navigate('/');
    } catch (error) {
      toast.error('Error generating bill. Please check your inputs.');
      console.error('Error:', error);
    }
  };

  return (
    <div className="bill-form-container">
      <h2>Generate Bill</h2>
      <form onSubmit={handleSubmit} className="bill-form">
        <div className="form-field">
          <label htmlFor="vendor">Vendor:</label>
          <select
            id="vendor"
            value={form.vendorId}
            onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
            required
          >
            <option value="">Select Vendor</option>
            {vendors.map((vendor) => (
              <option key={vendor._id} value={vendor._id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className='flex-horizontal-container'>
          <div className='flex-vertical-container'>
            <div className="form-field">
              <label htmlFor="date">Date:</label>
              <input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="lrNo">LR No:</label>
              <input
                id="lrNo"
                type="text"
                placeholder="LR No"
                value={form.lrNo}
                onChange={(e) => setForm({ ...form, lrNo: e.target.value })}
              />
            </div>
          </div>
          
          <div className='flex-vertical-container'>
            <div className="form-field">
              <label htmlFor="transportName">Transport Name:</label>
              <input
                id="transportName"
                type="text"
                placeholder="Transport Name"
                value={form.transportName}
                onChange={(e) => setForm({ ...form, transportName: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label htmlFor="vehicleNo">Vehicle No:</label>
              <input
                id="vehicleNo"
                type="text"
                placeholder="Vehicle No"
                value={form.vehicleNo}
                onChange={(e) => setForm({ ...form, vehicleNo: e.target.value })}
              />
            </div>
          </div>
        </div>

        <h3>Products</h3>
        {/* Adjusted to display headers for the product rows */}
        <div className="product-row header-row">
          <div>Select Product</div>
          <div>Select Packing</div>
          <div>Quantity</div>
          <div>Rate</div>
          <div>Discount (Rs)</div>
          <div>Amount</div>
          {form.products.length > 1 && <div className="remove-col"></div>} {/* Placeholder for remove button column */}
        </div>

        {form.products.map((p, idx) => {
          const selectedProduct = products.find(prod => prod._id === p.productId);
          const packingOptions = selectedProduct ? selectedProduct.packings : [];
            return (
              <div key={idx} className="product-row">
                <select
                  value={p.productId}
                  onChange={e => handleProductChange(idx, 'productId', e.target.value)}
                  required
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product._id} value={product._id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                
                <select
                  value={p.packing}
                  onChange={e => handleProductChange(idx, 'packing', e.target.value)}
                  required
                  disabled={!p.productId || packingOptions.length === 0}
                >
                  <option value="">Select Packing</option>
                  {packingOptions.map((packingVal, i) => (
                    <option key={i} value={packingVal}>
                      {formatPackingLabel(packingVal, selectedProduct?.unit)}
                    </option>
                  ))}
                </select>

                <input type="number" min="1" value={p.qty} onChange={e => handleProductChange(idx, 'qty', e.target.value)} placeholder="Qty" required />
                <input type="number" min="0" value={p.rate} onChange={e => handleProductChange(idx, 'rate', e.target.value)} placeholder="Rate" required />
                <input type="number" min="0" value={p.discount} onChange={e => handleProductChange(idx, 'discount', e.target.value)} placeholder="Discount" />
                <input type="number" value={p.amount.toFixed(2)} readOnly placeholder="Amount" />
                {form.products.length > 1 && <button type="button" onClick={() => removeProductRow(idx)}>-</button>}
              </div>
            );
        })}
        <button type="button" onClick={addProductRow}>Add Product</button>
        <div>
          <label>
            <input type="checkbox" checked={form.outsideGujarat} onChange={e => setForm({ ...form, outsideGujarat: e.target.checked })}/>
            Is this bill for outside Gujarat?
          </label>
        </div>
        <div className="totals">
          {/* Using toFixed to ensure two decimal places are shown */}
          <div>Total: {total.toFixed(2)}</div>
          <div>CGST (9%): {cgst.toFixed(2)}</div>
          <div>SGST (9%): {sgst.toFixed(2)}</div>
          <div>IGST (18%): {igst.toFixed(2)}</div>
          <div>Grand Total: {grandTotal.toFixed(2)}</div>
          <div>Amount in Words: {numberToWords(grandTotal)}</div>
        </div>
        <button type="submit">Generate Bill</button>
      </form>
    </div>
  );
}

export default BillFormPage;