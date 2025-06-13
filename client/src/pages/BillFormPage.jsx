import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function BillFormPage() {
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    vendorId: '',
    date: '',
    transportName: '',
    products: [{ productId: '', qty: 1, rate: 0, discount: 0, amount: 0 }],
  });
  const [bankDetails] = useState('UNION BANK OF INDIA\nA/C: 454801010028124\nIFSC: UBIN0545481\nBranch: Bapunagar Ahmedabad');
  const [terms] = useState('1. Goods once sold will not be taken back.\n2. Payment in 10 days from bill date.\n3. Subject to Ahmedabad Jurisdiction.');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/vendors')
      .then(res => setVendors(res.data));
    axios.get('/products')
      .then(res => setProducts(res.data));
  }, []);

  const handleProductChange = (idx, field, value) => {
    const updated = [...form.products];
    updated[idx][field] = value;
    // Auto-fill rate if product selected
    if (field === 'productId') {
      const prod = products.find(p => p._id === value);
      if (prod) {
        updated[idx].rate = prod.rate;
        updated[idx].amount = prod.rate * (updated[idx].qty || 1);
      }
    }
    if (field === 'qty' || field === 'rate' || field === 'discount') {
      const rate = parseFloat(updated[idx].rate) || 0;
      const qty = parseFloat(updated[idx].qty) || 0;
      const discount = parseFloat(updated[idx].discount) || 0;
      updated[idx].amount = (rate * qty) - discount;
    }
    setForm({ ...form, products: updated });
  };

  const addProductRow = () => {
    setForm({ ...form, products: [...form.products, { productId: '', qty: 1, rate: 0, discount: 0, amount: 0 }] });
  };

  const removeProductRow = (idx) => {
    const updated = form.products.filter((_, i) => i !== idx);
    setForm({ ...form, products: updated });
  };

  const calcTotal = () => form.products.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const total = calcTotal();
  const cgst = +(total * 0.09).toFixed(2);
  const sgst = +(total * 0.09).toFixed(2);
  const grandTotal = +(total + cgst + sgst).toFixed(2);

  function numberToWords(num) {
    // Simple number to words (English, up to 99999)
    const a = [ '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen' ];
    const b = [ '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety' ];
    if ((num = num.toString()).length > 5) return 'Amount too large';
    let n = ('00000' + num).substr(-5).match(/^(\d{2})(\d{3})$/);
    if (!n) return 'Invalid';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' Thousand ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) : '';
    return str.trim() + ' Only';
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/bills', {
        ...form,
        total,
        cgst,
        sgst,
        grandTotal,
        amountInWords: numberToWords(grandTotal),
        bankDetails,
        terms,
      });
      toast.success('Bill generated');
      navigate('/');
    } catch (err) {
      toast.error('Error generating bill');
    }
  };

  return (
    <div className="bill-form-container">
      <form onSubmit={handleSubmit} className="bill-form">
        <h2>Generate Bill</h2>
        <select value={form.vendorId} onChange={e => setForm({ ...form, vendorId: e.target.value })} required>
          <option value="">Select Vendor</option>
          {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
        </select>
        {/* <input type="text" placeholder="Invoice No" value={form.invoiceNo} onChange={e => setForm({ ...form, invoiceNo: e.target.value })} required /> */}
        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
        <input type="text" placeholder="Transport Name" value={form.transportName} onChange={e => setForm({ ...form, transportName: e.target.value })} />
        <h3>Products</h3>
        {form.products.map((p, idx) => (
          <div key={idx} className="product-row">
            <select value={p.productId} onChange={e => handleProductChange(idx, 'productId', e.target.value)} required>
              <option value="">Select Product</option>
              {products.map(prod => <option key={prod._id} value={prod._id}>{prod.name}</option>)}
            </select>
            <input type="number" min="1" value={p.qty} onChange={e => handleProductChange(idx, 'qty', e.target.value)} placeholder="Qty" required />
            <input type="number" min="0" value={p.rate} onChange={e => handleProductChange(idx, 'rate', e.target.value)} placeholder="Rate" required />
            <input type="number" min="0" value={p.discount} onChange={e => handleProductChange(idx, 'discount', e.target.value)} placeholder="Discount" />
            <input type="number" value={p.amount} readOnly placeholder="Amount" />
            {form.products.length > 1 && <button type="button" onClick={() => removeProductRow(idx)}>-</button>}
          </div>
        ))}
        <button type="button" onClick={addProductRow}>Add Product</button>
        <div className="totals">
          <div>Total: {total}</div>
          <div>CGST (9%): {cgst}</div>
          <div>SGST (9%): {sgst}</div>
          <div>Grand Total: {grandTotal}</div>
          <div>Amount in Words: {numberToWords(grandTotal)}</div>
        </div>
        <div className="bank-details">
          <h4>Bank Details</h4>
          <pre>{bankDetails}</pre>
        </div>
        <div className="terms">
          <h4>Terms & Conditions</h4>
          <pre>{terms}</pre>
        </div>
        <button type="submit">Generate Bill</button>
      </form>
    </div>
  );
}

export default BillFormPage;
