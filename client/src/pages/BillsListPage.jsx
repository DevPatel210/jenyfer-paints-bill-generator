import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function BillsListPage() {
  const [bills, setBills] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/bills')
      .then(res => setBills(res.data));
  }, []);

  const handleDownload = (id) => {
    window.open(`/bill/${id}/html`, '_blank');
  };

  return (
    <div className="bills-list-container">
      <h2>Bills</h2>
      <button onClick={() => navigate('/bill/new')} className="new-bill-btn">Generate New Bill</button>
      <table>
        <thead>
          <tr>
            <th>Invoice No</th>
            <th>Date</th>
            <th>Vendor</th>
            <th>Grand Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bills.map(bill => (
            <tr key={bill._id}>
              <td>{bill.invoiceNo}</td>
              <td>{bill.date?.slice(0,10)}</td>
              <td>{bill.vendorId?.name}</td>
              <td>{bill.grandTotal}</td>
              <td>
                <button onClick={() => handleDownload(bill._id)} className="download-btn">Download PDF</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BillsListPage;