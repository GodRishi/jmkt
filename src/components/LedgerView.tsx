import React, { useState, useMemo } from 'react';
import type { LedgerInvoice, LedgerStats, PartySummary } from '../types/ledger';
import { formatCurrency } from '../utils/calculator';
import { exportLedgerToCsv } from '../utils/csvExport';
import { ledgerService } from '../services/ledgerService';
import { shareBillViaWhatsApp } from '../utils/whatsapp';
import { RecordPaymentModal } from './RecordPaymentModal';
import { PartyStatementModal } from './PartyStatementModal';
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
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Send,
  Users,
  Phone,
  Banknote,
  Receipt,
} from 'lucide-react';

interface LedgerViewProps {
  invoices: LedgerInvoice[];
  stats: LedgerStats;
  onToggleStatus: (id: string, currentStatus?: string) => void;
  onEditInvoice: (invoice: LedgerInvoice) => void;
  onRedownloadPdf: (invoice: LedgerInvoice) => void;
  onDeleteInvoice: (id: string, invoiceNo: string) => void;
  onNavigateToCreate: () => void;
  onRefresh?: () => void;
  onExportCsv?: (filename: string) => void;
  onPaymentRecorded?: (updatedInvoice: LedgerInvoice) => void;
  isDownloadingId?: string | null;
  isDatabaseConnected?: boolean;
  isSupabaseConnected?: boolean;
}

export const LedgerView: React.FC<LedgerViewProps> = ({
  invoices,
  stats,
  onToggleStatus,
  onEditInvoice,
  onRedownloadPdf,
  onDeleteInvoice,
  onNavigateToCreate,
  onRefresh,
  onExportCsv,
  onPaymentRecorded,
  isDownloadingId = null,
  isDatabaseConnected,
  isSupabaseConnected = true,
}) => {
  const isDbConnected = isDatabaseConnected ?? isSupabaseConnected;
  
  // Navigation View: 'invoices' (Chronological Bills) or 'parties' (Customer-wise Khata)
  const [viewMode, setViewMode] = useState<'invoices' | 'parties'>('invoices');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'partial' | 'paid'>('all');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Modals state
  const [activePaymentInvoice, setActivePaymentInvoice] = useState<LedgerInvoice | null>(null);
  const [activeStatementParty, setActiveStatementParty] = useState<PartySummary | null>(null);

  const handleExportCsv = () => {
    if (invoices.length === 0) {
      alert('No ledger records found to export.');
      return;
    }
    const targetInvoices = filteredInvoices.length > 0 ? filteredInvoices : invoices;
    const filename = exportLedgerToCsv(targetInvoices);
    if (onExportCsv) onExportCsv(filename);
  };

  // Filter chronological invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Status filter
      if (filterTab === 'pending' && inv.payment_status !== 'pending') return false;
      if (filterTab === 'partial' && inv.payment_status !== 'partial') return false;
      if (filterTab === 'paid' && inv.payment_status !== 'paid') return false;

      // Query filter (Party name, Invoice number, Phone, or City)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchBuyer = (inv.buyer_name || '').toLowerCase().includes(query);
        const matchInvoiceNo = (inv.invoice_no || '').toLowerCase().includes(query);
        const matchCity = (inv.buyer_address || '').toLowerCase().includes(query);
        const matchPhone = (inv.party_phone || '').replace(/[^\d]/g, '').includes(query.replace(/[^\d]/g, ''));
        return matchBuyer || matchInvoiceNo || matchCity || matchPhone;
      }

      return true;
    });
  }, [invoices, filterTab, searchQuery]);

  // Group party summaries for Customer-Wise Khata
  const partySummaries = useMemo(() => {
    return ledgerService.calculatePartySummaries(invoices);
  }, [invoices]);

  const filteredParties = useMemo(() => {
    if (!searchQuery.trim()) return partySummaries;
    const q = searchQuery.toLowerCase().trim();
    return partySummaries.filter((p) => {
      const matchName = p.partyName.toLowerCase().includes(q);
      const matchPhone = (p.phone || '').replace(/[^\d]/g, '').includes(q.replace(/[^\d]/g, ''));
      const matchAddress = (p.address || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchAddress;
    });
  }, [partySummaries, searchQuery]);

  const handleShareWhatsApp = (inv: LedgerInvoice) => {
    const grandTotal = Number(inv.grand_total) || 0;
    const paid = typeof inv.amount_paid === 'number'
      ? inv.amount_paid
      : (inv.payment_status === 'paid' ? grandTotal : 0);
    const due = typeof inv.balance_due === 'number'
      ? inv.balance_due
      : Math.max(0, grandTotal - paid);

    shareBillViaWhatsApp({
      invoiceNo: inv.invoice_no,
      invoiceDate: inv.invoice_date,
      buyerName: inv.buyer_name,
      phone: inv.party_phone,
      totalPairs: inv.total_pairs,
      grandTotal,
      amountPaid: paid,
      balanceDue: due,
      paymentStatus: inv.payment_status,
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Database Disconnected Notice in Ledger */}
      {!isDbConnected && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Database connection not detected:</strong> Cloud ledger syncing is inactive. Offline local ledger is active.
            </span>
          </div>
        </div>
      )}

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
              {stats.pendingCount + stats.partialCount} unpaid/partial {stats.pendingCount + stats.partialCount === 1 ? 'bill' : 'bills'}
            </p>
          </div>
        </div>

        {/* Total Collected */}
        <div className="depth-card rounded-2xl p-4 flex items-center justify-between gap-3 min-w-0">
          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 truncate">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              Total Collected
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
              {stats.paidCount} fully settled {stats.paidCount === 1 ? 'bill' : 'bills'}
            </p>
          </div>
        </div>

        {/* Total Bills / Parties */}
        <div className="depth-card rounded-2xl p-4 flex items-center justify-between gap-3 min-w-0">
          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 truncate">
              <Receipt className="w-3.5 h-3.5 shrink-0" />
              Total Bills Recorded
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
              {stats.totalBills}
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
              Across {partySummaries.length} active wholesale parties
            </p>
          </div>
        </div>
      </div>

      {/* 2. Mode Toggle (All Invoices vs View by Party) & Actions */}
      <div className="depth-card rounded-2xl p-4 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Main View Mode Selector Pills */}
          <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode('invoices')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                viewMode === 'invoices'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Chronological Bills</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('parties')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                viewMode === 'parties'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>View by Party / Customer</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-mono">
                {partySummaries.length}
              </span>
            </button>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="depth-btn-secondary h-10 px-3 sm:px-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0"
                title="Fetch live records from database"
              >
                <RefreshCw className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}

            {/* Export Ledger (CSV / Excel) Button */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="depth-btn-secondary h-10 px-3 sm:px-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0"
              title="Export ledger spreadsheet (CSV / Excel) for CA and accounting"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Export Ledger (CSV)</span>
              <span className="inline sm:hidden">Export</span>
            </button>

            {/* New Bill Button */}
            <button
              type="button"
              onClick={onNavigateToCreate}
              className="depth-btn-primary h-10 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Bill</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              viewMode === 'invoices'
                ? "Search by party name, phone, invoice no, or city..."
                : "Search party by name, phone, or location..."
            }
            className="depth-input w-full min-h-[42px] pl-9 pr-4 py-2 rounded-xl text-neutral-900 dark:text-neutral-100 text-xs placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
          />
        </div>

        {/* Filter Pills (for chronological invoices view) */}
        {viewMode === 'invoices' && (
          <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
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
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
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
              onClick={() => setFilterTab('partial')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                filterTab === 'partial'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'depth-btn-secondary text-amber-700 dark:text-amber-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              Partial ({stats.partialCount})
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('paid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                filterTab === 'paid'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'depth-btn-secondary text-emerald-700 dark:text-emerald-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              Paid / Clear ({stats.paidCount})
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: Chronological Invoices List */}
      {viewMode === 'invoices' && (
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
                  : 'Generate a bill and click "Save to Ledger & Download" to start tracking wholesale accounts here.'}
              </p>
              {!searchQuery && filterTab === 'all' && (
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
              const grandTotal = Number(inv.grand_total) || 0;
              const paid = typeof inv.amount_paid === 'number'
                ? inv.amount_paid
                : (inv.payment_status === 'paid' ? grandTotal : 0);
              const due = typeof inv.balance_due === 'number'
                ? inv.balance_due
                : Math.max(0, grandTotal - paid);

              const isPaid = inv.payment_status === 'paid' || due <= 0;
              const isPartial = inv.payment_status === 'partial' || (paid > 0 && due > 0);
              const isExpanded = expandedCardId === inv.id;
              const isDownloading = isDownloadingId === inv.id;

              return (
                <div
                  key={inv.id}
                  className="depth-card rounded-2xl p-4 sm:p-5 transition-all space-y-3.5"
                >
                  {/* Header row: Invoice #, Date, Status Badge, Quick Actions */}
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

                    {/* Status Badge & Partial Payment Action */}
                    <div className="flex items-center gap-2">
                      {/* Record Payment Button */}
                      {!isPaid && (
                        <button
                          type="button"
                          onClick={() => setActivePaymentInvoice(inv)}
                          className="h-7 px-2.5 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 transition-all"
                        >
                          <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Record Payment</span>
                        </button>
                      )}

                      {/* Payment Status Pill */}
                      <button
                        type="button"
                        onClick={() => onToggleStatus(inv.id, inv.payment_status)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
                          isPaid
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800'
                            : isPartial
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800'
                        }`}
                        title={isPaid ? 'Click to mark as Pending (Baki)' : 'Click to mark as Paid (Clear)'}
                      >
                        {isPaid ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>PAID</span>
                          </>
                        ) : isPartial ? (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>PARTIAL</span>
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

                  {/* Main Card Body: Party Info & Amount Breakdown */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight break-words">
                          {inv.buyer_name}
                        </h4>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700 shrink-0">
                          {inv.total_pairs} prs
                        </span>
                        {inv.party_phone && (
                          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-600" /> {inv.party_phone}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-md">
                        {inv.buyer_address || 'Destination unassigned'} &bull; GSTIN: {inv.buyer_gstin || 'Unregistered'}
                      </p>

                      {/* Payment Progress bar if partial */}
                      {isPartial && (
                        <div className="pt-1 max-w-xs space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                            <span>Paid: ₹{formatCurrency(paid)}</span>
                            <span className="text-rose-600 dark:text-rose-400 font-bold">
                              Due: ₹{formatCurrency(due)}
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, Math.round((paid / (grandTotal || 1)) * 100))}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Grand Total Value */}
                    <div className="sm:text-right min-w-0 shrink-0">
                      <span className="text-[10px] uppercase font-semibold text-neutral-400 dark:text-neutral-500 tracking-wider block">
                        Grand Total
                      </span>
                      <span 
                        className={`font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 break-all min-w-0 ${
                          formatCurrency(grandTotal).length > 13
                            ? 'text-lg sm:text-xl'
                            : 'text-xl sm:text-2xl'
                        }`}
                        title={`₹${formatCurrency(grandTotal)}`}
                      >
                        ₹{formatCurrency(grandTotal)}
                      </span>
                      {due > 0 && !isPartial && (
                        <span className="text-xs font-mono text-rose-600 dark:text-rose-400 block font-semibold">
                          Baki: ₹{formatCurrency(due)}
                        </span>
                      )}
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
                      {/* Direct WhatsApp Bill Sharing */}
                      <button
                        type="button"
                        onClick={() => handleShareWhatsApp(inv)}
                        className="depth-btn-secondary h-9 px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        title="Share bill summary via WhatsApp"
                      >
                        <Send className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="hidden min-[380px]:inline">WhatsApp</span>
                      </button>

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
      )}

      {/* VIEW 2: View by Party / Customer Khata */}
      {viewMode === 'parties' && (
        <div className="space-y-3">
          {filteredParties.length === 0 ? (
            <div className="depth-card rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                No Customer Accounts Found
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                {searchQuery
                  ? 'No parties match your current search.'
                  : 'As you save invoices to the ledger, each customer will automatically have a dedicated Khata statement generated here.'}
              </p>
            </div>
          ) : (
            filteredParties.map((party) => (
              <div
                key={party.partyName}
                className="depth-card rounded-2xl p-4 sm:p-5 transition-all space-y-3.5"
              >
                {/* Party Header: Name, Contact & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-neutral-100 dark:border-neutral-800/80">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        {party.partyName}
                      </h4>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700">
                        {party.invoiceCount} {party.invoiceCount === 1 ? 'bill' : 'bills'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {party.phone && (
                        <span className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400">
                          <Phone className="w-3 h-3" /> {party.phone}
                        </span>
                      )}
                      {party.address && (
                        <span className="truncate max-w-xs">{party.address}</span>
                      )}
                    </div>
                  </div>

                  {/* Net Outstanding Tag */}
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-semibold text-neutral-400 dark:text-neutral-500 tracking-wider block">
                      Net Market Baki (Due)
                    </span>
                    <span 
                      className={`text-lg sm:text-xl font-bold font-mono tabular-nums ${
                        party.balanceDue > 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      ₹{formatCurrency(party.balanceDue)}
                    </span>
                  </div>
                </div>

                {/* Financial Summary 3-Box Grid */}
                <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-neutral-50/70 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800 text-center font-mono">
                  <div>
                    <span className="text-[10px] font-sans uppercase font-medium text-neutral-400 block">
                      Lifetime Billed
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      ₹{formatCurrency(party.totalBilled)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-sans uppercase font-medium text-emerald-600 dark:text-emerald-400 block">
                      Total Received
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      ₹{formatCurrency(party.totalPaid)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-sans uppercase font-medium text-rose-600 dark:text-rose-400 block">
                      Current Due
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400">
                      ₹{formatCurrency(party.balanceDue)}
                    </span>
                  </div>
                </div>

                {/* Actions: View Statement, Export Statement */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Latest Bill: #{party.invoices[0]?.invoice_no} ({party.invoices[0]?.invoice_date})
                  </span>

                  <button
                    type="button"
                    onClick={() => setActiveStatementParty(party)}
                    className="depth-btn-primary h-9 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View &amp; Export Statement</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Record Payment Modal */}
      {activePaymentInvoice && (
        <RecordPaymentModal
          isOpen={Boolean(activePaymentInvoice)}
          invoice={activePaymentInvoice}
          onClose={() => setActivePaymentInvoice(null)}
          onPaymentSuccess={(updatedInv) => {
            if (onPaymentRecorded) onPaymentRecorded(updatedInv);
            setActivePaymentInvoice(null);
          }}
        />
      )}

      {/* Party Statement Modal */}
      {activeStatementParty && (
        <PartyStatementModal
          isOpen={Boolean(activeStatementParty)}
          party={activeStatementParty}
          onClose={() => setActiveStatementParty(null)}
        />
      )}
    </div>
  );
};
