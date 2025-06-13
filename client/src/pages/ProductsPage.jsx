import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [form, setForm] = useState({ name: '', hsnCode: '', unit: 'kg', rate: 0 });

  const fetchProducts = () => {
    axios.get('/products')
      .then(res => setProducts(res.data));
  };
  useEffect(fetchProducts, []);

  const handleAdd = async () => {
    try {
      await axios.post('/products', form);
      toast.success('Product added');
      setShowAdd(false); setForm({ name: '', hsnCode: '', unit: 'kg', rate: 0 });
      fetchProducts();
    } catch { toast.error('Error adding product'); }
  };
  const handleEdit = async () => {
    try {
      await axios.put(`/products/${showEdit._id}`, form);
      toast.success('Product updated');
      setShowEdit(null); setForm({ name: '', hsnCode: '', unit: 'kg', rate: 0 });
      fetchProducts();
    } catch { toast.error('Error updating product'); }
  };

  return (
    <div className="products-page">
      <h2>Products</h2>
      <button onClick={() => { setShowAdd(true); setForm({ name: '', hsnCode: '', unit: 'kg', rate: 0 }); }}>Add Product</button>
      <table>
        <thead>
          <tr><th>Name</th><th>HSN Code</th><th>Unit</th><th>Rate</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p._id}>
              <td>{p.name}</td><td>{p.hsnCode}</td><td>{p.unit}</td><td>{p.rate}</td>
              <td><button onClick={() => { setShowEdit(p); setForm(p); }}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {(showAdd || showEdit) && (
        <div className="modal">
          <div className="modal-content">
            <h3>{showAdd ? 'Add Product' : 'Edit Product'}</h3>
            <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input placeholder="HSN Code" value={form.hsnCode} onChange={e => setForm({ ...form, hsnCode: e.target.value })} />
            <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
              <option value="kg">Kg</option>
              <option value="litre">Litre</option>
            </select>
            <input placeholder="Rate" type="number" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} />
            <button onClick={showAdd ? handleAdd : handleEdit}>{showAdd ? 'Add' : 'Update'}</button>
            <button onClick={() => { setShowAdd(false); setShowEdit(null); }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductsPage;
