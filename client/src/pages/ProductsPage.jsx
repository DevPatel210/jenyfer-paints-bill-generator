import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const initialPackingRate = { value: '', rate: '' };

const formatPackingLabel = (value, unit, rate) => {
  if (!value || !unit || !rate) return 'Invalid Packing';
  
  const numericValue = parseFloat(value);
  const mainUnitVal = Math.floor(numericValue);
  const subUnitVal = Math.round((numericValue - mainUnitVal) * 1000);

  const unitLabels = {
    kg: { main: 'kg', sub: 'gm' },
    litre: { main: 'ltr', sub: 'ml' },
  };

  const labels = unitLabels[unit] || { main: '', sub: '' };
  return `${mainUnitVal} ${labels.main} ${subUnitVal} ${labels.sub}  |  ${rate}`;
};

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [form, setForm] = useState({
    name: '',
    hsnCode: '',
    unit: 'kg',
    packings: [{ ...initialPackingRate }] // Default one entry for packing and rate
  });

  const fetchProducts = () => {
    axios.get('/products')
      .then(res => setProducts(res.data))
      .catch(err => toast.error('Error fetching products'));
  };

  useEffect(fetchProducts, []);

  // New validation for array of packing objects
  const validatePackings = (packingsArray) => {
    if (!packingsArray || packingsArray.length === 0) {
      toast.error('At least one packing entry is required.');
      return false;
    }
    for (let i = 0; i < packingsArray.length; i++) {
      const packing = packingsArray[i];
      const packingValue = parseFloat(packing.value);
      const packingRate = parseFloat(packing.rate);

      if (isNaN(packingValue) || !isFinite(packingValue)) {
        toast.error(`Invalid packing value: "${packing.value}" at row ${i + 1}. Please enter a valid number.`);
        return false;
      }
      if (isNaN(packingRate) || !isFinite(packingRate)) {
        toast.error(`Invalid rate: "${packing.rate}" for packing value "${packing.value}" at row ${i + 1}. Please enter a valid number.`);
        return false;
      }
      if (packingValue <= 0 || packingRate < 0) {
        toast.error(`Packing value must be greater than 0 and Rate must be non-negative at row ${i + 1}.`);
        return false;
      }
    }
    return true;
  };

  const handleAdd = async () => {
    if (!validatePackings(form.packings)) {
      return;
    }

    // Ensure all values are numbers
    const packingsToSend = form.packings.map(p => ({
      value: parseFloat(p.value),
      rate: parseFloat(p.rate)
    }));

    try {
      // console.log({...form,packings: packingsToSend});
      await axios.post('/products', { ...form, packings: packingsToSend });
      toast.success('Product added');
      setShowAdd(false);
      setForm({
        name: '',
        hsnCode: '',
        unit: 'kg',
        packings: [{ ...initialPackingRate }] // Reset to default single entry
      });
      fetchProducts();
    } catch (error) {
      toast.error('Error adding product');
      console.error('Add Product Error:', error);
    }
  };

  const handleEdit = async () => {
    // Validate the new 'packings' array structure
    if (!validatePackings(form.packings)) {
      return;
    }

    // Prepare packings data to send to backend
    // Ensure all values are numbers
    const packingsToSend = form.packings.map(p => ({
      value: parseFloat(p.value),
      rate: parseFloat(p.rate)
    }));

    try {
      // Remove 'rate' from form data being sent as it's now per packing
      const { rate, ...dataToSend } = form; // Destructure to exclude 'rate'
      await axios.put(`/products/${showEdit._id}`, { ...dataToSend, packings: packingsToSend });
      toast.success('Product updated');
      setShowEdit(null);
      setForm({
        name: '',
        hsnCode: '',
        unit: 'kg',
        packings: [{ ...initialPackingRate }] // Reset to default single entry
      });
      fetchProducts();
    } catch (error) {
      toast.error('Error updating product');
      console.error('Update Product Error:', error);
    }
  };

  // Handler for changing packing value or rate
  const handlePackingRateChange = (index, field, value) => {
    const newPackings = [...form.packings];
    newPackings[index][field] = value;
    setForm({ ...form, packings: newPackings });
  };

  // Handler for adding a new packing-rate row
  const addPackingRow = () => {
    setForm({
      ...form,
      packings: [...form.packings, { ...initialPackingRate }]
    });
  };

  // Handler for removing a packing-rate row
  const removePackingRow = (index) => {
    const newPackings = form.packings.filter((_, i) => i !== index);
    setForm({ ...form, packings: newPackings });
  };

  // Handler to prevent number input fields from changing value on scroll
  const preventScrollChange = (e) => {
    e.target.blur(); // Remove focus to prevent further changes
    e.preventDefault(); // Prevent default scroll behavior
  };


  return (
    <div className="products-page">
      <h2>Products</h2>
      <button
        className='new-bill-btn'
        onClick={() => {
          setShowAdd(true);
          setForm({
            name: '',
            hsnCode: '',
            unit: 'kg',
            packings: [{ ...initialPackingRate }] // Reset for add
          });
        }}>Add Product</button>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>HSN Code</th>
            <th>Unit</th>
            <th>Packings & Rates</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p._id}>
              <td>{p.name}</td>
              <td>{p.hsnCode}</td>
              <td>{p.unit}</td>
              <td>
                {Array.isArray(p.packings) && p.packings.length > 0 ? (
                  p.packings.map((pr, idx) => (
                    <div key={idx}>
                      {formatPackingLabel(pr.value, p.unit, pr.rate)}
                    </div>
                  ))
                ) : (
                  'N/A' // Handle cases where packings might be empty or not an array
                )}
              </td>
              <td>
                <button
                  onClick={() => {
                    setShowEdit(p);
                    // Ensure packings are formatted as array of objects for edit
                    setForm({
                      ...p,
                      // If p.packings is old string/array of numbers, convert to new format
                      packings: Array.isArray(p.packings) && p.packings.length > 0
                        ? p.packings.map(pr => ({
                            value: pr.value !== undefined ? pr.value : pr, // Handle old array of numbers
                            rate: pr.rate !== undefined ? pr.rate : 0 // Default rate for old packing values
                          }))
                        : [{ ...initialPackingRate }] // Default for empty/non-array
                    });
                  }}
                  className="edit-btn"
                >
                  Edit
                </button>
              </td>
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

            {/* Dynamic Packing and Rate Inputs */}
            <div className="form-field">
              <label>Packings & Rates:</label>
              {form.packings.map((packing, index) => (
                <div key={index} className="packing-rate-row" style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Packing Value"
                    value={packing.value}
                    onChange={(e) => handlePackingRateChange(index, 'value', e.target.value)}
                    onWheel={preventScrollChange}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Rate"
                    value={packing.rate}
                    onChange={(e) => handlePackingRateChange(index, 'rate', e.target.value)}
                    onWheel={preventScrollChange}
                    style={{ flex: 1 }}
                  />
                  {form.packings.length > 1 && ( // Allow removing if more than one entry
                    <button type="button" onClick={() => removePackingRow(index)}>-</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addPackingRow} style={{ marginTop: '10px' }}>
                Add New Packing
              </button>
            </div>

            <div className="modal-actions">
              <button onClick={showAdd ? handleAdd : handleEdit}>{showAdd ? 'Add' : 'Update'}</button>
              <button
                onClick={() => {
                  setShowAdd(false);
                  setShowEdit(null);
                  setForm({
                    name: '',
                    hsnCode: '',
                    unit: 'kg',
                    packings: [{ ...initialPackingRate }] // Reset to default
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductsPage;