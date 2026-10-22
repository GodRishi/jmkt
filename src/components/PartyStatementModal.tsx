import React from 'react';
import type { PartySummary } from '../types/ledger';
import { formatCurrency } from '../utils/calculator';
import { normalizeIndianPhone } from '../utils/whatsapp';
import { 
  X, 
  Printer, 
  Phone, 
  Building, 
  MapPin, 
  CreditCard, 
  FileSpreadsheet, 
  Send 
} from 'lucide-react';

interface PartyStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  party: PartySummary | null;
}

export const PartyStatementModal: React.FC<PartyStatementModalProps> = ({
  isOpen,
  onClose,
  party,
}) => {
  if (!isOpen || !party) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = [
      'Invoice No',
      'Invoice Date',
      'Total Pairs',
      'Bill Amount (INR)',
      'Paid Amount (INR)',
      'Balance Due (INR)',
      'Payment Status',
    ];

    const rows = party.invoices.map((inv) => {
      const grandTotal = Number(inv.grand_total) || 0;
      const paid = typeof inv.amount_paid === 'number'
        ? inv.amount_paid
        : (inv.payment_status === 'paid' ? grandTotal : 0);
      const due = typeof inv.balance_due === 'number'
        ? inv.balance_due
        : Math.max(0, grandTotal - paid);

      return [
        `"${inv.invoice_no}"`,
        `"${inv.invoice_date}"`,
        `"${inv.total_pairs}"`,
        `"${grandTotal.toFixed(2)}"`,
        `"${paid.toFixed(2)}"`,
        `"${due.toFixed(2)}"`,
        `"${inv.payment_status.toUpperCase()}"`,
      ].join(',');
    });

    // Add summary row at the bottom
    rows.push('');
    rows.push([
      '"LIFETIME TOTALS"',
      '""',
      '""',
      `"${party.totalBilled.toFixed(2)}"`,
      `"${party.totalPaid.toFixed(2)}"`,
      `"${party.balanceDue.toFixed(2)}"`,
      '""',
    ].join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = party.partyName.replace(/[^a-zA-Z0-9]/g, '_');
    link.href = url;
    link.setAttribute('download', `JMKT_Statement_${safeName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleWhatsAppStatement = () => {
    const phone = normalizeIndianPhone(party.phone);
    let msg = 
      `*JAI MAA KAMAKHYA TRADERS*\n` +
      `*CUSTOMER ACCOUNT STATEMENT*\n\n` +
      `Customer: *${party.partyName}*\n` +
      `Total Bills: ${party.invoiceCount}\n` +
      `Lifetime Billed: ₹${formatCurrency(party.totalBilled)}\n` +
      `Total Payments Received: ₹${formatCurrency(party.totalPaid)}\n` +
      `*Current Net Balance Due (Baki): ₹${formatCurrency(party.balanceDue)}*\n\n` +
      `Recent Invoices:\n`;

    party.invoices.slice(0, 5).forEach((inv) => {
      const grandTotal = Number(inv.grand_total) || 0;
      const due = typeof inv.balance_due === 'number'
        ? inv.balance_due
        : (inv.payment_status === 'paid' ? 0 : grandTotal);
      msg += `• #${inv.invoice_no} (${inv.invoice_date}): ₹${formatCurrency(grandTotal)} (Due: ₹${formatCurrency(due)})\n`;
    });

    msg += `\n_Please clear outstanding dues at your earliest convenience._`;

    const encoded = encodeURIComponent(msg);
    const url = phone 
      ? `https://wa.me/${phone}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/40">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 block font-mono">
              Party Khata Statement
            </span>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              {party.partyName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Party Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-neutral-400 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-800">
            {party.phone && (
              <div className="flex items-center gap-1.5 font-mono">
                <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{party.phone}</span>
              </div>
            )}
            {party.address && (
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="truncate">{party.address}</span>
              </div>
            )}
            {party.gstin && (
              <div className="flex items-center gap-1.5 font-mono">
                <Building className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>GSTIN: {party.gstin}</span>
              </div>
            )}
            {party.accountNo && (
              <div className="flex items-center gap-1.5 font-mono">
                <CreditCard className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>A/No: {party.accountNo}</span>
              </div>
            )}
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-900/80 border border-neutral-200/60 dark:border-neutral-800 text-center">
              <span className="text-[10px] uppercase font-semibold text-neutral-500 dark:text-neutral-400 block tracking-wider">
                Lifetime Billed
              </span>
              <span className="text-sm sm:text-base font-bold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
                ₹{formatCurrency(party.totalBilled)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800 text-center">
              <span className="text-[10px] uppercase font-semibold text-emerald-700 dark:text-emerald-400 block tracking-wider">
                Total Received
              </span>
              <span className="text-sm sm:text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                ₹{formatCurrency(party.totalPaid)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800 text-center">
              <span className="text-[10px] uppercase font-semibold text-rose-700 dark:text-rose-400 block tracking-wider">
                Net Baki (Due)
              </span>
              <span className="text-sm sm:text-base font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                ₹{formatCurrency(party.balanceDue)}
              </span>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleExportCsv}
              className="depth-btn-secondary h-9 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppStatement}
              className="depth-btn-secondary h-9 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>WhatsApp Statement</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="depth-btn-secondary h-9 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 ml-auto"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
              <span>Print</span>
            </button>
          </div>

          {/* Invoices List Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              <span>Itemized Bills ({party.invoices.length})</span>
            </div>

            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
                    <tr>
                      <th className="p-2.5">Invoice #</th>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5 text-center">Pairs</th>
                      <th className="p-2.5 text-right">Total (₹)</th>
                      <th className="p-2.5 text-right">Paid (₹)</th>
                      <th className="p-2.5 text-right">Due (₹)</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono tabular-nums">
                    {party.invoices.map((inv) => {
                      const grandTotal = Number(inv.grand_total) || 0;
                      const paid = typeof inv.amount_paid === 'number'
                        ? inv.amount_paid
                        : (inv.payment_status === 'paid' ? grandTotal : 0);
                      const due = typeof inv.balance_due === 'number'
                        ? inv.balance_due
                        : Math.max(0, grandTotal - paid);

                      return (
                        <tr key={inv.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40">
                          <td className="p-2.5 font-bold text-neutral-900 dark:text-neutral-100">
                            #{inv.invoice_no}
                          </td>
                          <td className="p-2.5 text-neutral-500 dark:text-neutral-400">
                            {inv.invoice_date}
                          </td>
                          <td className="p-2.5 text-center text-neutral-600 dark:text-neutral-300">
                            {inv.total_pairs}
                          </td>
                          <td className="p-2.5 text-right font-medium text-neutral-900 dark:text-neutral-100">
                            {formatCurrency(grandTotal)}
                          </td>
                          <td className="p-2.5 text-right text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(paid)}
                          </td>
                          <td className="p-2.5 text-right font-semibold text-rose-600 dark:text-rose-400">
                            {formatCurrency(due)}
                          </td>
                          <td className="p-2.5 text-center font-sans">
                            <span 
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                inv.payment_status === 'paid'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                  : inv.payment_status === 'partial'
                                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {inv.payment_status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
