import React, { useState, useMemo } from 'react';
import type { LedgerInvoice, LedgerStats } from '../types/ledger';
import { formatCurrency } from '../utils/calculator';
import {
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  Download,
  FileText,
  AlertCircle,
  Plus,
  RefreshCw,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface LedgerViewProps {
  invoices: LedgerInvoice[];
  stats: LedgerStats;
  onToggleStatus: (id: string) => void;
  onEditInvoice: (invoice: LedgerInvoice) => void;
  onRedownloadPdf: (invoice: LedgerInvoice) => void;
  onDeleteInvoice: (id: string, invoiceNo: string) => void;
  onNavigateToCreate: () => void;
  isDownloadingId?: string | null;
}

export const LedgerView: React.FC<LedgerViewProps> = ({
  invoices,
  stats,
  onToggleStatus,
  onEditInvoice,
  onRedownloadPdf,
  onDeleteInvoice,
  onNavigateToCreate,
  isDownloadingId = null,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'paid'>('all');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Filter invoices by search and payment status tab
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // Status filter
      if (filterTab === 'pending' && inv.payment_status !== 'pending') return false;
      if (filterTab === 'paid' && inv.payment_status !== 'paid') return false;

      // Query filter (Party name or Invoice number)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchBuyer = (inv.buyer_name || '').toLowerCase().includes(query);
        const matchInvoiceNo = (inv.invoice_no || '').toLowerCase().includes(query);
        const matchCity = (inv.buyer_address || '').toLowerCase().includes(query);
        return matchBuyer || matchInvoiceNo || matchCity;
      }

      return true;
    });
  }, [invoices, filterTab, searchQuery]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Overview KPI Summary Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Pending / Baki */}
        <div className="depth-card rounded-2xl p-4 flex items-center justify-between gap-3 min-w-0">
          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 truncate">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              Total Pending (Baki)
            </span>
            <div 
              className={`font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 break-all min-w-0 ${
                formatCurrency(stats.totalPending).length > 13
                  ? 'text-lg sm:text-xl'
                  : 'text-xl sm:text-2xl'
              }`}
              title={`₹${formatCurrency(stats.totalPending)}`}
            >
              ₹{formatCurrency(stats.totalPending)}
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
              {stats.pendingCount} unpaid {stats.pendingCount === 1 ? 'bill' : 'bills'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/60 dark:border-rose-900/60">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Total Collected / Paid */}
        <div className="depth-card rounded-2xl p-4 flex items-center justify-between gap-3 min-w-0">
          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 truncate">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              Total Collected (Paid)
            </span>
            <div 
              className={`font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 break-all min-w-0 ${
                formatCurrency(stats.totalCollected).length > 13
                  ? 'text-lg sm:text-xl'
                  : 'text-xl sm:text-2xl'
              }`}
              title={`₹${formatCurrency(stats.totalCollected)}`}
            >
              ₹{formatCurrency(stats.totalCollected)}
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
              {stats.paidCount} cleared {stats.paidCount === 1 ? 'bill' : 'bills'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-900/60">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Total Bills Count */}
        <div className="depth-card rounded-2xl p-4 flex items-center justify-between gap-3 min-w-0">
          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 truncate">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              Total Invoices Logged
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 break-all">
              {stats.totalBills}
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
              Accounts &amp; Ledger entries
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center shrink-0 border border-neutral-200/60 dark:border-neutral-700">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="depth-card rounded-2xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by party name, invoice #, or destination..."
              className="depth-input w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* New Bill Button */}
          <button
            type="button"
            onClick={onNavigateToCreate}
            className="depth-btn-primary h-11 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Bill</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              filterTab === 'all'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                : 'depth-btn-secondary text-neutral-600 dark:text-neutral-300'
            }`}
          >
            All Bills ({stats.totalBills})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              filterTab === 'pending'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'depth-btn-secondary text-rose-700 dark:text-rose-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
            Pending / Baki ({stats.pendingCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('paid')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              filterTab === 'paid'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'depth-btn-secondary text-emerald-700 dark:text-emerald-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            Paid / Clear ({stats.paidCount})
          </button>
        </div>
      </div>

      {/* 3. Invoice Ledger Cards List */}
      <div className="space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="depth-card rounded-2xl p-8 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              No Ledger Records Found
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              {searchQuery || filterTab !== 'all'
                ? 'No bills match your current search or status filter.'
                : 'Generate a bill and click "Save to Ledger & Download" to start tracking payments and baki accounts here.'}
            </p>
            {(!searchQuery && filterTab === 'all') && (
              <button
                type="button"
                onClick={onNavigateToCreate}
                className="depth-btn-primary h-10 px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Bill</span>
              </button>
            )}
          </div>
        ) : (
          filteredInvoices.map((inv) => {
            const isPaid = inv.payment_status === 'paid';
            const isExpanded = expandedCardId === inv.id;
            const isDownloading = isDownloadingId === inv.id;

            return (
              <div
                key={inv.id}
                className="depth-card rounded-2xl p-4 sm:p-5 transition-all space-y-3.5"
              >
                {/* Header row: Invoice #, Date, Status Badge, and Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-neutral-100 dark:border-neutral-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      #{inv.invoice_no}
                    </span>
                    <span className="text-neutral-300 dark:text-neutral-700">&bull;</span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                      {inv.invoice_date}
                    </span>
                  </div>

                  {/* Payment Status Badge & Quick Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(inv.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
                        isPaid
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800'
                      }`}
                      title={isPaid ? 'Click to mark as Pending (Baki)' : 'Click to mark as Paid (Clear)'}
                    >
                      {isPaid ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>PAID</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          <span>PENDING (BAKI)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Main Card Body: Party Info & Amount */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight break-words">
                        {inv.buyer_name}
                      </h4>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700 shrink-0">
                        {inv.total_pairs} prs
                      </span>
                    </div>

                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-md">
                      {inv.buyer_address || 'Destination unassigned'} &bull; GSTIN: {inv.buyer_gstin || 'Unregistered'}
                    </p>

                    {inv.payment_date && isPaid && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                        Cleared on: {new Date(inv.payment_date).toLocaleDateString('en-GB')}
                      </p>
                    )}
                  </div>

                  {/* Grand Total Value */}
                  <div className="sm:text-right min-w-0 shrink-0">
                    <span className="text-[10px] uppercase font-semibold text-neutral-400 dark:text-neutral-500 tracking-wider block">
                      Grand Total
                    </span>
                    <span 
                      className={`font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 break-all min-w-0 ${
                        formatCurrency(inv.grand_total).length > 13
                          ? 'text-lg sm:text-xl'
                          : 'text-xl sm:text-2xl'
                      }`}
                      title={`₹${formatCurrency(inv.grand_total)}`}
                    >
                      ₹{formatCurrency(inv.grand_total)}
                    </span>
                  </div>
                </div>

                {/* Expandable Line Items Preview */}
                {isExpanded && inv.items && inv.items.length > 0 && (
                  <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 space-y-2 animate-in fade-in duration-150">
                    <span className="text-[10px] uppercase font-semibold text-neutral-400 dark:text-neutral-500 tracking-wider block">
                      Line Items ({inv.items.length})
                    </span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {inv.items.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-medium text-neutral-800 dark:text-neutral-200 block truncate">
                              {item.description || 'Footwear Article'}
                            </span>
                            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                              {item.colorSpec || 'Standard'} &bull; HSN: {item.hsnCode}
                            </span>
                          </div>
                          <div className="text-right shrink-0 font-mono tabular-nums">
                            <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                              {item.quantity} prs &times; ₹{item.unitPrice}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
                  {/* Expand / Collapse Button */}
                  <button
                    type="button"
                    onClick={() => setExpandedCardId(isExpanded ? null : inv.id)}
                    className="text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1 transition-colors"
                  >
                    <span>{isExpanded ? 'Hide Items' : 'View Items'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Re-download PDF */}
                    <button
                      type="button"
                      onClick={() => onRedownloadPdf(inv)}
                      disabled={isDownloading}
                      className="depth-btn-secondary h-9 px-3 rounded-xl text-xs font-medium flex items-center gap-1.5"
                      title="Download PDF for this invoice"
                    >
                      {isDownloading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                      )}
                      <span className="hidden min-[380px]:inline">
                        {isDownloading ? 'Exporting...' : 'PDF'}
                      </span>
                    </button>

                    {/* Edit Bill */}
                    <button
                      type="button"
                      onClick={() => onEditInvoice(inv)}
                      className="depth-btn-secondary h-9 px-3 rounded-xl text-xs font-medium flex items-center gap-1.5"
                      title="Edit this invoice in generator"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                      <span className="hidden min-[420px]:inline">Edit</span>
                    </button>

                    {/* Delete Entry */}
                    <button
                      type="button"
                      onClick={() => onDeleteInvoice(inv.id, inv.invoice_no)}
                      className="w-9 h-9 rounded-xl text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-colors active:scale-95"
                      title="Delete invoice entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
