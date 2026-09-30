import React from 'react';
import type { InvoiceData } from '../types/invoice';
import { calculateInvoiceTotals, formatCurrency } from '../utils/calculator';

interface InvoiceTemplateProps {
  data: InvoiceData;
  id?: string;
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ data, id = 'printable-invoice' }) => {
  const calcs = calculateInvoiceTotals(data);

  return (
    <div className="invoice-template-wrapper flex justify-center items-start">
      <div className="invoice-container" id={id}>
        <table className="invoice-table">
          <colgroup>
            <col style={{ width: '4%' }} />   {/* SL NO */}
            <col style={{ width: '11%' }} />  {/* HSN */}
            <col style={{ width: '35%' }} />  {/* DESCRIPTION */}
            <col style={{ width: '7%' }} />   {/* QNTY */}
            <col style={{ width: '9%' }} />   {/* MRP */}
            <col style={{ width: '11%' }} />  {/* PRICE/UNIT */}
            <col style={{ width: '6%' }} />   {/* DISCOUNT */}
            <col style={{ width: '17%' }} />  {/* AMOUNT */}
          </colgroup>

          <thead>
            <tr>
              <th colSpan={8} className="header-cell">
                <span className="copy-badge">{data.meta.copyType || 'ORIGINAL FOR RECIPIENT'}</span>
                <div className="title-main">TAX INVOICE</div>
                <div className="title-company">JAI MAA KAMAKHYA TRADERS</div>
                <div className="header-subtext">WHOLE SELLER OF QUALITY AIR MIX, PVC, PU &amp; TPR, SOLE</div>
                <div className="header-contact">
                  Office: 136, Keshab Chandra Sen Street, Kolkata - 700 009<br />
                  <strong>Mobile No.:</strong> +91 7003784212 / +91 6291645907 &nbsp;|&nbsp; <strong>GSTIN:</strong> 19BLJPS5232D2ZY<br />
                  <strong>State:</strong> West Bengal &nbsp;|&nbsp; <strong>State Code:</strong> 19
                </div>
              </th>
            </tr>

            <tr>
              <td colSpan={4} className="meta-cell">
                <div className="field-row"><span className="field-label">Details of Buyer:</span><span className="field-val"><strong>{data.buyer.buyerName || '—'}</strong></span></div>
                <div className="field-row"><span className="field-label">Address:</span><span className="field-val">{data.buyer.buyerAddress || '—'}</span></div>
                <div className="field-row"><span className="field-label">GSTIN / UIN:</span><span className="field-val">{data.buyer.gstinUin || 'Unregistered'}</span></div>
                <div className="field-row"><span className="field-label">A/No:</span><span className="field-val">{data.buyer.accountNo || '—'}</span></div>
                <div className="field-row"><span className="field-label">State &amp; Code:</span><span className="field-val">{data.buyer.stateAndCode || 'West Bengal (19)'}</span></div>
              </td>
              <td colSpan={4} className="meta-cell">
                <div className="field-row"><span className="field-label">Invoice No.:</span><span className="field-val"><strong>{data.meta.invoiceNo || '—'}</strong></span></div>
                <div className="field-row"><span className="field-label">Dated:</span><span className="field-val">{data.meta.dated || '—'}</span></div>
                <div className="field-row"><span className="field-label">Place of Supply:</span><span className="field-val">{data.meta.placeOfSupply || 'West Bengal (19)'}</span></div>
                <div className="field-row"><span className="field-label">Terms of Payment:</span><span className="field-val">{data.meta.termsOfPayment || 'Immediate / Against Delivery'}</span></div>
                <div className="field-row"><span className="field-label">Dispatch Mode:</span><span className="field-val">{data.meta.dispatchMode || 'Local Road Transport'}</span></div>
              </td>
            </tr>

            <tr>
              <th className="item-header">SL<br />NO</th>
              <th className="item-header">HSN/SAC<br />CODE</th>
              <th className="item-header">DESCRIPTION OF GOODS</th>
              <th className="item-header">QNTY<br />(PRS)</th>
              <th className="item-header">MRP<br />(₹)</th>
              <th className="item-header">PRICE /<br />UNIT (₹)</th>
              <th className="item-header">DISC<br />(%)</th>
              <th className="item-header">TAXABLE<br />AMOUNT (₹)</th>
            </tr>
          </thead>

          <tbody>
            {data.items.map((item, idx) => (
              <tr key={item.id || idx} className="item-row">
                <td className="text-center">{idx + 1}</td>
                <td className="text-center">{item.hsnCode || '64041990'}</td>
                <td className="text-left">
                  <span className="desc-title">{item.description || '—'}</span>
                  {item.colorSpec && (
                    <span className="desc-sub">Color / Spec: ({item.colorSpec})</span>
                  )}
                </td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-right">{formatCurrency(item.mrp)}</td>
                <td className="text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="text-center">{item.discount || '—'}</td>
                <td className="text-right">{formatCurrency(calcs.itemTaxableAmounts[idx] || 0)}</td>
              </tr>
            ))}

            <tr className="qty-total-row">
              <td colSpan={3} className="text-right">TOTAL QUANTITY:</td>
              <td className="text-center">{calcs.totalQuantity}</td>
              <td colSpan={4}></td>
            </tr>
          </tbody>

          <tfoot>
            <tr>
              <td colSpan={5} rowSpan={6} className="words-cell">
                <div className="words-box">
                  <strong>Amount Chargeable (in words):</strong><br />
                  <span style={{ fontStyle: 'italic', fontSize: '11px' }}>
                    {calcs.amountInWords}
                  </span>
                </div>

                <div className="signatory-box">
                  <span className="signature-name">{data.signatoryName || 'Ujjal Saha'}</span>
                  <strong>For JAI MAA KAMAKHYA TRADERS</strong><br /><br />
                  <span>Authorized Signatory</span>
                </div>
              </td>
              <td colSpan={2} className="calc-label-cell">TAXABLE VALUE</td>
              <td className="calc-val-cell">₹ {formatCurrency(calcs.totalTaxableValue)}</td>
            </tr>
            <tr>
              <td colSpan={2} className="calc-label-cell">PACKING CHARGE</td>
              <td className="calc-val-cell">₹ {formatCurrency(calcs.packingCharge)}</td>
            </tr>
            <tr>
              <td colSpan={2} className="calc-label-cell">CGST @ 2.5%</td>
              <td className="calc-val-cell">₹ {formatCurrency(calcs.cgst)}</td>
            </tr>
            <tr>
              <td colSpan={2} className="calc-label-cell">SGST @ 2.5%</td>
              <td className="calc-val-cell">₹ {formatCurrency(calcs.sgst)}</td>
            </tr>
            <tr>
              <td colSpan={2} className="calc-label-cell">ROUND OFF</td>
              <td className="calc-val-cell">{calcs.roundOff}</td>
            </tr>
            <tr>
              <td colSpan={2} className="calc-label-cell grand-total-label">TOTAL AMOUNT</td>
              <td className="calc-val-cell grand-total-val">₹ {formatCurrency(calcs.grandTotal)}</td>
            </tr>
            <tr>
              <td colSpan={8} className="legal-bar">
                Subject to Kolkata Jurisdiction &nbsp;|&nbsp; Goods once sold will not be taken back &nbsp;|&nbsp; This is a Computer Generated Invoice
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
