import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '../assets/BillHtmlPageGemini.css'; // Create and use an external CSS file

// Helper function to format the date as DD-MM-YYYY
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Helper function to split number into Rupees and Paise
const formatCurrency = (amount) => {
  if (typeof amount !== 'number') {
    return { rs: '', ps: '' };
  }
  const fixedAmount = amount.toFixed(2);
  const [rs, ps] = fixedAmount.split('.');
  return { rs, ps };
};

// Helper function to calculate percent and amount of discount
const formatDiscount = (discount, amount) => {
  
  if (typeof discount !== 'number' || typeof amount !== 'number') {
    return { percent: '', amount: '' };
  }
  const percent = (discount * 100 / amount).toFixed(2);
  return { percent, amount: discount };
};

function BillHtmlPageGemini() {
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
  

  const totalRows = 10;
  const emptyRows = totalRows - (bill.products || []).length;
  const totalAmount = formatCurrency(bill.total);
  const cgstAmount = formatCurrency(bill.cgst);
  const sgstAmount = formatCurrency(bill.sgst);
  const igstAmount = formatCurrency(bill.igst);
  const grandTotalAmount = formatCurrency(bill.grandTotal);


  return (
    <>
      <div className="bill-wrapper">
        <div className="bill-container">
          {/* --- Header --- */}
          <div className="header">
            <div className="header-main">
              <h1>Jenyfer Paints</h1>
              <p>Manufacturer in: All Waterbase paints and Oilbase paints</p>
              <p>21, Comet Estate, Opp. Anant Estate, Nagervel Hanuman Road, Rakhial, Ahmedabad - 380023</p>
            </div>
            <div className="original-copy">ORIGINAL</div>
          </div>

          {/* --- Top Info Bar --- */}
          <div className="info-bar">
            {/* <div className="gst-pan"> */}
              <div>GST NO: <strong>24BGNPP3642R1ZN</strong></div>
              {/* <div>PAN NO: <strong></strong></div> */}
            {/* </div>s */}
            <div className="tax-invoice">TAX INVOICE</div>
          </div>

          {/* --- Billing and Shipping Details --- */}
          <div className="customer-details">
            <div className="bill-to">
              <p><strong>Bill To:</strong></p>
              <p>{bill.vendorId?.name}</p>
              <p>{bill.vendorId?.address}</p>
              <p>Mobile no:- {bill.vendorId?.phone}</p>
            </div>
            <div className="invoice-details">
                <p><strong>INVOICE NO :</strong> {bill.invoiceNo}</p>
                <p><strong>DATE :</strong> {formatDate(bill.date)}</p>
                <p><strong>TRANSPORT NAME :</strong> {bill.transportName}</p>
                <p><strong>VEHICLE NO :</strong> {bill.vehicleNo}</p>
                <p><strong>L.R.NO :</strong> {bill.lrNo}</p>
            </div>
          </div>

          {/* --- Products Table --- */}
          <table className="products-table">
            <thead>
              <tr>
                <th rowSpan="2" className="sr-no">Sr. No.</th>
                <th rowSpan="2" className="item-desc">Item Description</th>
                <th rowSpan="2" className='hsn-code'>HSN CODE</th>
                <th rowSpan="2">Qty.</th>
                <th colSpan="2"> </th>
                <th colSpan="2">Rate</th>
                <th colSpan="2">Discount</th>
                <th colSpan="2">Amount</th>
              </tr>
              <tr>
                <th className="sub-header">Kg | lit</th>
                <th className="sub-header">Gm | ml</th>
                <th className="sub-header">Rs.</th>
                <th className="sub-header">Ps.</th>
                <th className="sub-header">%</th>
                <th className="sub-header">Rs.</th>
                <th className="sub-header">Rs.</th>
                <th className="sub-header">Ps.</th>
              </tr>
            </thead>
            <tbody>
              {bill.products.map((p, i) => {
                 const rate = formatCurrency(p.rate);
                 const amount = formatCurrency(p.amount);
                 const discount = formatDiscount(p.discount, p.amount);
                 const weight = { kg: p.weight?.kg || 0, gm: p.weight?.gm || 0 };

                return (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>
                      {p.productId?.name || p.name || ''}
                      {p.packageInfo && <div className="package-info">{p.packageInfo}</div>}
                    </td>
                    <td>{p.productId?.hsnCode || p.hsnCode || ''}</td>
                    <td className="align-right">25*10</td>
                    <td className="align-right">{weight.kg}</td>
                    <td className="align-right">{weight.gm}</td>
                    <td className="align-right">{rate.rs}</td>
                    <td className="align-right">{rate.ps}</td>
                    <td className="align-right">{discount.percent}</td>
                    <td className="align-right">{discount.amount}</td>
                    <td className="align-right">{amount.rs}</td>
                    <td className="align-right">{amount.ps}</td>
                  </tr>
                )
              })}
              {/* Render empty rows to ensure minimum height */}
              {Array.from({ length: emptyRows > 0 ? emptyRows : 0 }).map((_, i) => (
                <tr key={`empty-${i}`} className="empty-row">
                    <td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* --- Totals and Bank Details*/}
          <div className="summary-footer-container">
            <div className="left-panel">
                <div className="bank-details">
                    <strong>Bank Details :</strong>
                    <pre style={{marginTop: "5px", fontSize: "14px"}}>{bill.bankDetails}</pre>
                </div>
            </div>
            <div className="right-panel">
                <table className="totals-table">
                    <tbody>
                        <tr>
                            <td>TOTAL</td>
                            <td className="align-right">{totalAmount.rs}</td>
                            <td className="align-right ps-col">{totalAmount.ps}</td>
                        </tr>
                        <tr>
                            <td>CGST 9%</td>
                            <td className="align-right">{cgstAmount.rs}</td>
                            <td className="align-right ps-col">{cgstAmount.ps}</td>
                        </tr>
                         <tr>
                            <td>SGST 9%</td>
                            <td className="align-right">{sgstAmount.rs}</td>
                            <td className="align-right ps-col">{sgstAmount.ps}</td>
                        </tr>
                        <tr>
                            <td>IGST 18%</td>
                            <td className="align-right">{igstAmount.rs}</td>
                            <td className="align-right ps-col">{igstAmount.ps}</td>
                        </tr>
                        <tr className="grand-total">
                            <td>GRAND TOTAL</td>
                            <td className="align-right">{grandTotalAmount.rs}</td>
                            <td className="align-right ps-col">{grandTotalAmount.ps}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
          </div>
          <div className="summary-footer-container">
            <div className="amount-in-words">
              <p><strong>RUPEES IN WORDS :</strong> {bill.amountInWords}</p>
            </div>
          </div>
          <div className="summary-footer-container">
            <div className="left-panel">
              <div className="terms">
                  <strong>TERMS & CONDITIONS :</strong>
                  <pre style={{fontSize: "11px", marginTop: "10px"}}>{bill.terms}</pre>
              </div>
            </div>
            <div className="right-panel">
            <div className="signature">
                <p>FOR, <strong>Jenyfer Paints</strong></p>
                <div className="signature-space"></div>
                <p>(Authorised Signator)</p>
            </div>
            </div>
          </div>
           <p className="footer-note">This is a Computer Generated Invoice.</p>
        </div>

        {/* --- Action Buttons (Hidden on Print) --- */}
        <div className="action-buttons">
          <button className="print-btn" onClick={() => window.print()}>Save as PDF / Print</button>
          <button className="back-btn" onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>
    </>
  );
}

export default BillHtmlPageGemini;