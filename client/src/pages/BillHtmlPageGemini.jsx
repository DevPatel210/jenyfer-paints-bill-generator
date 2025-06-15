import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import styles from '../assets/BillHtmlPageGemini.module.css'; // Create and use an external CSS file

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

const formatPackingLabel = (value,unit) => {
  if (!value) return { kg: '', gm: '' };
  
  const numericValue = parseFloat(value);
  const mainUnitVal = Math.floor(numericValue);
  const subUnitVal = Math.round((numericValue - mainUnitVal) * 1000);

  const isKg = unit === 'kg';

  return {
    kg: (mainUnitVal > 0 ? mainUnitVal : "0") + (isKg ? " kg" : " lit"),
    gm: (subUnitVal > 0 ? subUnitVal : "0") + (isKg ? " grm" : " ml")
  };  
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

function BillHtmlPageGemini() {
  const { id } = useParams();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bankDetails] = useState('BANK OF BARODA\nA/C: 03360200001853\nIFSC: BARBOINDRAK\nBranch: Rakhial Industrial Estate Branch');
  const [terms] = useState('1. Goods once sold will not be taken back.\n2. Payment in 45 days from bill date.\n3. Subject to Ahmedabad Jurisdiction.');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`/bills/${id}`)
      .then(res => { setBill(res.data); console.log(res.data); setLoading(false); })
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
      <div className={styles["bill-wrapper"]}>
        <div className={styles["bill-container"]}>
          {/* --- Header --- */}
          <div className={styles.header}>
            <div className={styles["header-main"]}>
              <h1>Jenyfer Paints</h1>
              <p>Manufacturer in: All Waterbase paints and Oilbase paints</p>
              <p>21, Comet Estate, Opp. Anant Estate, Nagervel Hanuman Road, Rakhial, Ahmedabad - 380023</p>
            </div>
            <div className={styles["original-copy"]}>ORIGINAL</div>
          </div>

          {/* --- Top Info Bar --- */}
          <div className={styles["info-bar"]}>
            {/* <div className="gst-pan"> */}
              <div>GST NO: <strong>24BGNPP3642R1ZN</strong></div>
              {/* <div>PAN NO: <strong></strong></div> */}
            {/* </div>s */}
            <div className={styles["tax-invoice"]}>TAX INVOICE</div>
          </div>

          {/* --- Billing and Shipping Details --- */}
          <div className={styles["customer-details"]}>
            <div className={styles["bill-to"]}>
              <p><strong>Bill To:</strong></p>
              <p>{bill.vendorId?.name}</p>
              <p>{bill.vendorId?.address}</p>
              <p>Mobile no:- {bill.vendorId?.phone}</p>
            </div>
            <div className={styles["invoice-details"]}>
                <p><strong>INVOICE NO :</strong> {bill.invoiceNo}</p>
                <p><strong>DATE :</strong> {formatDate(bill.date)}</p>
                <p><strong>TRANSPORT NAME :</strong> {bill.transportName}</p>
                <p><strong>VEHICLE NO :</strong> {bill.vehicleNo}</p>
                <p><strong>L.R.NO :</strong> {bill.lrNo}</p>
            </div>
          </div>

          {/* --- Products Table --- */}
          <table className={styles["products-table"]}>
            <thead>
              <tr>
                <th rowSpan="2" className={styles["sr-no"]}>Sr. No.</th>
                <th rowSpan="2" className={styles["item-desc"]}>Item Description</th>
                <th rowSpan="2" className={styles["hsn-code"]}>HSN CODE</th>
                <th rowSpan="2">Qty.</th>
                <th colSpan="2"> </th>
                <th colSpan="2">Rate</th>
                <th colSpan="2">Discount</th>
                <th colSpan="2">Amount</th>
              </tr>
              <tr>
                <th className={styles["sub-header"]}>Kg | lit</th>
                <th className={styles["sub-header"]}>Gm | ml</th>
                <th className={styles["sub-header"]}>Rs.</th>
                <th className={styles["sub-header"]}>Ps.</th>
                <th className={styles["sub-header"]}>%</th>
                <th className={styles["sub-header"]}>Rs.</th>
                <th className={styles["sub-header"]}>Rs.</th>
                <th className={styles["sub-header"]}>Ps.</th>
              </tr>
            </thead>
            <tbody>
              {bill.products.map((p, i) => {
                 const rate = formatCurrency(p.rate);
                 const amount = formatCurrency(p.amount);
                 const discount = formatDiscount(p.discount, p.amount);
                 const weight = formatPackingLabel(p.packing || "0",p.productId?.unit);

                return (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>
                      {p.productId?.name || p.name || ''}
                      {p.packageInfo && <div className={styles["package-info"]}>{p.packageInfo}</div>}
                    </td>
                    <td>{p.productId?.hsnCode || p.hsnCode || ''}</td>
                    <td className={styles["align-right"]}>{p.qty}</td>
                    <td className={styles["align-right"]}>{weight.kg}</td>
                    <td className={styles["align-right"]}>{weight.gm}</td>
                    <td className={styles["align-right"]}>{rate.rs}</td>
                    <td className={styles["align-right"]}>{rate.ps}</td>
                    <td className={styles["align-right"]}>{discount.percent}</td>
                    <td className={styles["align-right"]}>{discount.amount}</td>
                    <td className={styles["align-right"]}>{amount.rs}</td>
                    <td className={styles["align-right"]}>{amount.ps}</td>
                  </tr>
                )
              })}
              {/* Render empty rows to ensure minimum height */}
              {Array.from({ length: emptyRows > 0 ? emptyRows : 0 }).map((_, i) => (
                <tr key={`empty-${i}`} className={styles["empty-row"]}>
                    <td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* --- Totals and Bank Details*/}
          <div className={styles["summary-footer-container"]}>
            <div className={styles["left-panel"]}>
                <div className={styles["bank-details"]}>
                    <strong>Bank Details :</strong>
                    <pre style={{marginTop: "8px", fontSize: "14px"}}>{bankDetails}</pre>
                </div>
            </div>
            <div className={styles["right-panel"]}>
                <table className={styles["totals-table"]}>
                    <tbody>
                        <tr>
                            <td><strong>TOTAL</strong></td>
                            <td className={styles["align-right"]}><strong>{totalAmount.rs}</strong></td>
                            <td className={`${styles["align-right"]} ${styles["ps-col"]}`}><strong>{totalAmount.ps}</strong></td>
                        </tr>
                        <tr>
                            <td>CGST 9%</td>
                            <td className={styles["align-right"]}>{cgstAmount.rs}</td>
                            <td className={`${styles["align-right"]} ${styles["ps-col"]}`}>{cgstAmount.ps}</td>
                        </tr>
                         <tr>
                            <td>SGST 9%</td>
                            <td className={styles["align-right"]}>{sgstAmount.rs}</td>
                            <td className={`${styles["align-right"]} ${styles["ps-col"]}`}>{sgstAmount.ps}</td>
                        </tr>
                        <tr>
                            <td>IGST 18%</td>
                            <td className={styles["align-right"]}>{igstAmount.rs}</td>
                            <td className={`${styles["align-right"]} ${styles["ps-col"]}`}>{igstAmount.ps}</td>
                        </tr>
                        <tr className="grand-total">
                            <td><strong>GRAND TOTAL</strong></td>
                            <td className={styles["align-right"]}><strong>{grandTotalAmount.rs}</strong></td>
                            <td className={`${styles["align-right"]} ${styles["ps-col"]}`}><strong>{grandTotalAmount.ps}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
          </div>
          <div className={styles["summary-footer-container"]}>
            <div className={styles['amount-in-words']}>
              <p><strong>RUPEES IN WORDS :</strong> {numberToWords(bill.grandTotal)}</p>
            </div>
          </div>
          <div className={styles["summary-footer-container"]} style={{borderBottom: "2px solid"}}>
            <div className={styles["left-panel"]}>
              <div className={styles["terms"]}>
                  <strong>TERMS & CONDITIONS :</strong>
                  <pre style={{fontSize: "11px", marginTop: "8px"}}>{terms}</pre>
              </div>
            </div>
            <div className={styles["right-panel"]}>
            <div className={styles.signature}>
                <p>FOR, <strong>Jenyfer Paints</strong></p>
                <div className={styles["signature-space"]}></div>
                <p>(Authorised Signator)</p>
            </div>
            </div>
          </div>
           <p className={styles["footer-note"]}>This is a Computer Generated Invoice.</p>
        </div>

        {/* --- Action Buttons (Hidden on Print) --- */}
        <div className={styles["action-buttons"]}>
          <button className={styles["print-btn"]} onClick={() => window.print()}>Save as PDF / Print</button>
          <button className={styles["back-btn"]} onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>
    </>
  );
}

export default BillHtmlPageGemini;