import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [form, setForm] = useState({ name: '', hsnCode: '', unit: 'kg', rate: 0, packings: '' });

  const fetchProducts = () => {
    axios.get('/products')
      .then(res => setProducts(res.data))
      .catch(err => toast.error('Error fetching products'));
  };

  useEffect(fetchProducts, []);

  const validatePackings = (packingsString) => {
    if (!packingsString) return true;
    const packingArray = packingsString.split(',').map(p => p.trim());
    for (let i = 0; i < packingArray.length; i++) {
      const packing = packingArray[i];
      if (isNaN(parseFloat(packing)) || !isFinite(packing)) {
        toast.error(`Invalid packing value: "${packing}". Please enter numbers separated by commas.`);
        return false;
      }
    }
    return true;
  };

  const handleAdd = async () => {
    if (!validatePackings(form.packings)) {
      return;
    }
    const packingsToSend = form.packings ? form.packings.split(',').map(p => parseFloat(p.trim())) : [];

    try {
      await axios.post('/products', { ...form, packings: packingsToSend });
      toast.success('Product added');
      setShowAdd(false);
      setForm({ name: '', hsnCode: '', unit: 'kg', rate: 0, packings: '' });
      fetchProducts();
    } catch (error) {
      toast.error('Error adding product');
      console.error('Add Product Error:', error);
    }
  };

  const handleEdit = async () => {
    if (!validatePackings(form.packings)) {
      return;
    }
    const packingsToSend = form.packings ? form.packings.split(',').map(p => parseFloat(p.trim())) : [];

    try {
      await axios.put(`/products/${showEdit._id}`, { ...form, packings: packingsToSend });
      toast.success('Product updated');
      setShowEdit(null);
      setForm({ name: '', hsnCode: '', unit: 'kg', rate: 0, packings: '' });
      fetchProducts();
    } catch (error) {
      toast.error('Error updating product');
      console.error('Update Product Error:', error);
    }
  };

  return (
    <div className="products-page">
      <h2>Products</h2>
      <button className='new-bill-btn' onClick={() => { setShowAdd(true); setForm({ name: '', hsnCode: '', unit: 'kg', rate: 0, packings: '' }); }}>Add Product</button>
      <table>
        <thead>
          <tr><th>Name</th><th>HSN Code</th><th>Unit</th><th>Rate</th><th>Packings</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p._id}>
              <td>{p.name}</td>
              <td>{p.hsnCode}</td>
              <td>{p.unit}</td>
              <td>{p.rate}</td>
              <td>{Array.isArray(p.packings) ? p.packings.join(', ') : p.packings}</td>
              <td><button onClick={() => { setShowEdit(p); setForm({ ...p, packings: Array.isArray(p.packings) ? p.packings.join(',') : p.packings || '' }); }} className="edit-btn">Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {(showAdd || showEdit) && (
        <div className="modal">
          <div className="modal-content">
            <h3>{showAdd ? 'Add Product' : 'Edit Product'}</h3>
            <div className="form-field">
              <label htmlFor="productName">Product Name:</label>
              <input id="productName" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-field">
              <label htmlFor="hsnCode">HSN Code:</label>
              <input id="hsnCode" placeholder="HSN Code" value={form.hsnCode} onChange={e => setForm({ ...form, hsnCode: e.target.value })} />
            </div>
            <div className="form-field">
              <label htmlFor="unit">Unit:</label>
              <select id="unit" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                <option value="kg">Kg</option>
                <option value="litre">Litre</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="rate">Rate:</label>
              <input id="rate" placeholder="Rate" type="number" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} />
            </div>
            <div className="form-field">
              <label htmlFor="packings">Packings:</label>
              <input
                id="packings"
                placeholder="e.g., 1.0,2.25,1.5,30"
                value={form.packings}
                onChange={e => setForm({ ...form, packings: e.target.value })}
              />
            </div>
            <div className="modal-actions"> {/* Group buttons for better layout */}
              <button onClick={showAdd ? handleAdd : handleEdit}>{showAdd ? 'Add' : 'Update'}</button>
              <button onClick={() => { setShowAdd(false); setShowEdit(null); setForm({ name: '', hsnCode: '', unit: 'kg', rate: 0, packings: '' }); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductsPage;