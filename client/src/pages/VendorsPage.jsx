import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', gstNo: '', panNo: '', phone: '', email: '' });

  const fetchVendors = () => {
    axios.get('/vendors')
      .then(res => setVendors(res.data));
  };
  useEffect(fetchVendors, []);

  const handleAdd = async () => {
    try {
      await axios.post('/vendors', form);
      toast.success('Vendor added');
      setShowAdd(false); setForm({ name: '', address: '', gstNo: '', panNo: '', phone: '', email: '' });
      fetchVendors();
    } catch { toast.error('Error adding vendor'); }
  };
  const handleEdit = async () => {
    try {
      await axios.put(`/vendors/${showEdit._id}`, form);
      toast.success('Vendor updated');
      setShowEdit(null); setForm({ name: '', address: '', gstNo: '', panNo: '', phone: '', email: '' });
      fetchVendors();
    } catch { toast.error('Error updating vendor'); }
  };

  return (
    <div className="vendors-page">
      <h2>Vendors</h2>
      <button onClick={() => { setShowAdd(true); setForm({ name: '', address: '', gstNo: '', panNo: '', phone: '', email: '' }); }}>Add Vendor</button>
      <table>
        <thead>
          <tr><th>Name</th><th>GST No</th><th>PAN No.</th><th>Address</th><th>Phone</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {vendors.map(v => (
            <tr key={v._id}>
              <td>{v.name}</td><td>{v.gstNo}</td><td>{v.panNo}</td><td>{v.address}</td><td>{v.phone}</td>
              <td><button onClick={() => { setShowEdit(v); setForm(v); }}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {(showAdd || showEdit) && (
        <div className="modal">
          <div className="modal-content">
            <h3>{showAdd ? 'Add Vendor' : 'Edit Vendor'}</h3>
            <input
              type="text"
              placeholder="Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="GST No."
              value={form.gstNo}
              onChange={e => setForm({ ...form, gstNo: e.target.value.toUpperCase() })}
              required
            />
            <input
              type="text"
              placeholder="PAN No."
              value={form.panNo || ''}
              onChange={e => setForm({ ...form, panNo: e.target.value.toUpperCase() })}
              required
            />
            <input
              type="text"
              placeholder="Address"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Phone"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              required
            />
            <div className="modal-actions">
              <button onClick={showAdd ? handleAdd : handleEdit}>{showAdd ? 'Add' : 'Update'}</button>
              <button onClick={() => { setShowAdd(false); setShowEdit(null); setForm({ name: '', address: '', gstNo: '', panNo: '', phone: '', email: '' }); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorsPage;
