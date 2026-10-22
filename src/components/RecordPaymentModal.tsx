import React, { useState, useEffect } from 'react';
import type { LedgerInvoice, PaymentTransaction, PaymentMode } from '../types/ledger';
import { formatCurrency } from '../utils/calculator';
import { paymentService } from '../services/paymentService';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  History,
} from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: LedgerInvoice | null;
  onPaymentSuccess: (updatedInvoice: LedgerInvoice) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onPaymentSuccess,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state and load payment history when invoice changes or modal opens
  useEffect(() => {
    if (!isOpen || !invoice) {
      setTransactions([]);
      return;
    }

    const grandTotal = Number(invoice.grand_total) || 0;
    const currentPaid = Number(invoice.amount_paid) || 0;
    const currentDue = typeof invoice.balance_due === 'number'
      ? invoice.balance_due
      : Math.max(0, grandTotal - currentPaid);

    setAmount(currentDue > 0 ? String(currentDue) : '');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMode('UPI');
    setNotes('');
    setErrorMsg(null);

    let isMounted = true;
    paymentService.getPaymentsByInvoiceId(invoice.id)
      .then((txs) => {
        if (isMounted) {
          setTransactions(txs);
          setLoadingHistory(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingHistory(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, invoice]);

  if (!isOpen || !invoice) return null;

  const grandTotal = Number(invoice.grand_total) || 0;
  const currentPaid = Number(invoice.amount_paid) || 0;
  const currentDue = typeof invoice.balance_due === 'number'
    ? invoice.balance_due
    : Math.max(0, grandTotal - currentPaid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await paymentService.recordPayment(invoice, {
        amount: numAmount,
        paymentDate,
        paymentMode,
        notes,
      });

      onPaymentSuccess(result.updatedInvoice);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setPresetAmount = (val: number) => {
    setAmount(String(Math.max(0, Math.round(val))));
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-neutral-500 dark:text-neutral-400">
                #{invoice.invoice_no}
              </span>
              <span className="text-neutral-300 dark:text-neutral-700">&bull;</span>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Record Payment
              </h3>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Party: <strong className="text-neutral-800 dark:text-neutral-200">{invoice.buyer_name}</strong>
            </p>
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
          {/* Summary Balance Card */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-900/80 border border-neutral-200/60 dark:border-neutral-800 text-center font-mono">
            <div>
              <span className="text-[10px] uppercase font-semibold text-neutral-400 block tracking-wider font-sans">
                Bill Total
              </span>
              <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">
                ₹{formatCurrency(grandTotal)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400 block tracking-wider font-sans">
                Already Paid
              </span>
              <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                ₹{formatCurrency(currentPaid)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-rose-600 dark:text-rose-400 block tracking-wider font-sans">
                Balance Due
              </span>
              <span className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400">
                ₹{formatCurrency(currentDue)}
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Payment Amount Received (₹) <span className="text-rose-500">*</span>
                </label>
                {currentDue > 0 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPresetAmount(currentDue)}
                      className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800 hover:bg-rose-100"
                    >
                      Clear Full (₹{formatCurrency(currentDue)})
                    </button>
                    {currentDue > 1000 && (
                      <button
                        type="button"
                        onClick={() => setPresetAmount(currentDue / 2)}
                        className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200"
                      >
                        50%
                      </button>
                    )}
                  </div>
                )}
              </div>
              <input
                type="number"
                inputMode="decimal"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`e.g. ${currentDue > 0 ? currentDue : 5000}`}
                className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-neutral-900 dark:text-neutral-100 text-base font-mono font-bold tabular-nums"
                required
                autoFocus
              />
            </div>

            {/* Date & Mode Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Payment Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-neutral-900 dark:text-neutral-100 text-sm font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                  className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-neutral-900 dark:text-neutral-100 text-sm font-medium"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="Cash">Cash (Rokor)</option>
                  <option value="Bank / RTGS">Bank / RTGS / NEFT</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                Notes / Reference (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. UTR #394829104, Paid at Kolkata shop"
                className="depth-input w-full min-h-[40px] px-3.5 py-2 rounded-xl text-neutral-900 dark:text-neutral-100 text-xs"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="depth-btn-primary w-full min-h-[44px] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 mt-2 shadow-sm"
            >
              {isSubmitting ? (
                <span>Recording Payment...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Confirm &amp; Record ₹{formatCurrency(Number(amount) || 0)} Payment</span>
                </>
              )}
            </button>
          </form>

          {/* Existing Payment Transactions History */}
          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              <span className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-neutral-400" /> Payment History
              </span>
              <span className="text-neutral-400 font-mono text-[11px]">
                {transactions.length} records
              </span>
            </div>

            {loadingHistory ? (
              <p className="text-xs text-neutral-400 italic">Loading past payments...</p>
            ) : transactions.length === 0 ? (
              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/40 text-neutral-500 text-xs text-center border border-dashed border-neutral-200 dark:border-neutral-800">
                No previous payments recorded for this invoice yet.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          +₹{formatCurrency(tx.amount)}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-[10px] font-sans font-medium text-neutral-700 dark:text-neutral-300">
                          {tx.payment_mode}
                        </span>
                      </div>
                      {tx.notes && (
                        <p className="text-[11px] font-sans text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {tx.notes}
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-400">
                      {tx.payment_date}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
