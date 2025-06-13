import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function BillHtmlPage() {
  const { id } = useParams();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`/bills/${id}`)
      .then(res => { setBill(res.data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!bill) return <div>Bill not found</div>;

  return (
    <div className="bill-container" style={{ maxWidth: 900, margin: '0 auto', background: '#fff', padding: 32, border: '1px solid #ccc', borderRadius: 8 }}>
      <div className="header" style={{ textAlign: 'center' }}>
        <h1>Jenyfer Paints</h1>
        <div>DEALER IN : ACID SLURRY, SODA, WASHING POWDER, A.O.S, OIL SOAP AND OTHER CHEMICALS</div>
        <div>18, PARMANAND'S CHAWL, OPP. VIKRAM MILL, SARASPUR, AHMEDABAD-380018</div>
      </div>
      <hr />
      <div>GST NO: 24AHUPP1093M1ZO &nbsp; PAN NO: AHUPP1093M</div>
      <hr />
      <div className="section">
        <div><b>Bill to:</b> {bill.vendorId?.name || ''}</div>
        <div>{bill.vendorId?.address || ''}</div>
        <div>Mobile no.: {bill.vendorId?.phone || ''}</div>
      </div>
      <div className="section">
        <table>
          <tbody>
            <tr>
              <td>GST NO: {bill.vendorId?.gstNo || ''}</td>
              <td>PAN NO: {bill.vendorId?.panNo || ''}</td>
              <td>INVOICE NO: {bill.invoiceNo}</td>
              <td>DATE: {(bill.date ? new Date(bill.date).toISOString().slice(0,10) : '')}</td>
              <td>TRANSPORT NAME: {bill.transportName || ''}</td>
            </tr>
          </tbody>
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
          {(bill.products || []).map((p, i) => (
            <tr key={i}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td>{p.productId?.name || p.name || ''}</td>
              <td style={{ textAlign: 'center' }}>{p.productId?.hsnCode || p.hsnCode || ''}</td>
              <td style={{ textAlign: 'center' }}>{p.qty}</td>
              <td style={{ textAlign: 'center' }}>{p.unit}</td>
              <td style={{ textAlign: 'right' }}>{p.rate}</td>
              <td style={{ textAlign: 'right' }}>{p.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table>
        <tbody>
          <tr className="totals"><td colSpan={6} style={{ textAlign: 'right' }}>TOTAL</td><td style={{ textAlign: 'right' }}>{bill.total}</td></tr>
          <tr><td colSpan={6} style={{ textAlign: 'right' }}>CGST 9%</td><td style={{ textAlign: 'right' }}>{bill.cgst}</td></tr>
          <tr><td colSpan={6} style={{ textAlign: 'right' }}>SGST 9%</td><td style={{ textAlign: 'right' }}>{bill.sgst}</td></tr>
          <tr className="totals"><td colSpan={6} style={{ textAlign: 'right' }}>GRAND TOTAL</td><td style={{ textAlign: 'right' }}>{bill.grandTotal}</td></tr>
        </tbody>
      </table>
      <div className="section"><b>RUPEES IN WORDS :</b> {bill.amountInWords}</div>
      <div className="section">
        <b>BANK DETAILS:</b><br />
        <pre style={{ fontSize: 13 }}>{bill.bankDetails || ''}</pre>
      </div>
      <div className="section">
        <b>TERMS & CONDITIONS:</b><br />
        <pre style={{ fontSize: 13 }}>{bill.terms || ''}</pre>
      </div>
      <div className="footer" style={{ textAlign: 'center' }}>
        <b>FOR, RAJESH CHEMICAL</b><br />
        <span style={{ fontSize: 12 }}>(Authorised Signatory)</span>
      </div>
      <button className="save-btn" style={{ margin: '20px 0', padding: '8px 18px', fontSize: 16, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer' }} onClick={() => window.print()}>Save as PDF / Print</button>
      <button style={{ marginLeft: 16 }} onClick={() => navigate(-1)}>Back</button>
    </div>
  );
}

export default BillHtmlPage;