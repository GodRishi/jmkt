import type { LedgerInvoice } from '../types/ledger';

/**
 * Escapes a cell value for standard CSV compatibility.
 * Surrounds with quotes if containing commas, quotes, or newlines.
 */
function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exports ledger invoices into an accountant/CA-friendly CSV file.
 * Includes UTF-8 BOM (\uFEFF) for immediate, perfect rendering in Microsoft Excel.
 */
export function exportLedgerToCsv(invoices: LedgerInvoice[]): string {
  const headers = [
    'Invoice No',
    'Date',
    'Buyer Name',
    'Phone',
    'GSTIN',
    'Total Pairs',
    'Taxable Value (INR)',
    'CGST (2.5%)',
    'SGST (2.5%)',
    'Packing (INR)',
    'Grand Total (INR)',
    'Paid Amount (INR)',
    'Balance Due (INR)',
    'Payment Status',
    'Payment Date',
  ];

  const rows = invoices.map(inv => {
    const pairs = Number(inv.total_pairs || 0);
    const taxable = Number(inv.taxable_value || 0).toFixed(2);
    const cgst = Number(inv.cgst || 0).toFixed(2);
    const sgst = Number(inv.sgst || 0).toFixed(2);
    const packing = Number(inv.packing_charge || 0).toFixed(2);
    const grand = Number(inv.grand_total || 0).toFixed(2);
    const paid = (typeof inv.amount_paid === 'number' 
      ? inv.amount_paid 
      : (inv.payment_status === 'paid' ? Number(inv.grand_total || 0) : 0)).toFixed(2);
    const due = (typeof inv.balance_due === 'number' 
      ? inv.balance_due 
      : Math.max(0, Number(inv.grand_total || 0) - Number(paid))).toFixed(2);
    const status = (inv.payment_status || 'pending').toUpperCase();
    const payDate = inv.payment_date 
      ? new Date(inv.payment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
      : '—';

    return [
      escapeCsvCell(inv.invoice_no),
      escapeCsvCell(inv.invoice_date),
      escapeCsvCell(inv.buyer_name),
      escapeCsvCell(inv.party_phone || '—'),
      escapeCsvCell(inv.buyer_gstin || 'Unregistered'),
      escapeCsvCell(pairs),
      escapeCsvCell(taxable),
      escapeCsvCell(cgst),
      escapeCsvCell(sgst),
      escapeCsvCell(packing),
      escapeCsvCell(grand),
      escapeCsvCell(paid),
      escapeCsvCell(due),
      escapeCsvCell(status),
      escapeCsvCell(payDate),
    ].join(',');
  });

  // UTF-8 BOM + Header + Rows
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

  // Trigger browser download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const now = new Date().toISOString().split('T')[0];
  const filename = `JMKT_Ledger_${now}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}
