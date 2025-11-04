import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function getCurrentFinancialYear() {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  if (month < 4) year--;
  const nextYear = (year + 1).toString().slice(-2);
  return `${year}-${nextYear}`;
}

function getFinancialYearOptions() {
  const startYear = 2024;
  const endYear = 2030;
  const options = [];
  for (let y = startYear; y <= endYear; y++) {
    options.push(`${y}-${(y + 1).toString().slice(-2)}`);
  }
  return options;
}

function BillsListPage() {
  const [bills, setBills] = useState([]);
  const [financialYear, setFinancialYear] = useState(getCurrentFinancialYear());
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`/bills?financialYear=${financialYear}`)
      .then((res) => setBills(res.data));
  }, [financialYear]);

  const handleDownload = (id) => {
    window.open(`/bill/${id}/html`, "_blank");
  };

  // Sort bills by invoice number (numeric part) descending
  const sortedBills = [...bills].sort((a, b) => {
    const numA = parseInt(a.invoiceNo.split("-")[2], 10);
    const numB = parseInt(b.invoiceNo.split("-")[2], 10);
    return numB - numA;
  });

  return (
    <div className="bills-list-container">
      <h2>Bills</h2>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <button onClick={() => navigate("/bill/new")} className="new-bill-btn">
          Generate New Bill
        </button>

        <select
          value={financialYear}
          onChange={(e) => setFinancialYear(e.target.value)}
          style={{ fontSize: "1rem", padding: "0.3rem 0.6rem" }}
        >
          {getFinancialYearOptions().map((fy) => (
            <option key={fy} value={fy}>
              {fy}
            </option>
          ))}
        </select>
      </div>
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
          {sortedBills.map((bill) => (
            <tr key={bill._id}>
              <td>{bill.invoiceNo.split("-")[2]}</td>
              <td>{bill.date?.slice(0, 10)}</td>
              <td>{bill.vendorId?.name}</td>
              <td>{bill.grandTotal}</td>
              <td>
                <button
                  onClick={() => handleDownload(bill._id)}
                  className="download-btn"
                >
                  Download PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BillsListPage;
