import { useState, useEffect } from 'react';
import type { InvoiceData } from './types/invoice';
import type { LedgerInvoice } from './types/ledger';
import { initialInvoiceData, sampleInvoiceData } from './utils/defaultData';
import { InvoiceForm } from './components/InvoiceForm';
import { MobileInvoiceForm } from './components/MobileInvoiceForm';
import { InvoiceTemplate } from './components/InvoiceTemplate';
import { PreviewModal } from './components/PreviewModal';
import { StickyActionBar } from './components/StickyActionBar';
import { PinLockScreen } from './components/PinLockScreen';
import { LedgerView } from './components/LedgerView';
import { exportToPdf } from './utils/pdfExport';
import { calculateInvoiceTotals } from './utils/calculator';
import { ledgerService } from './services/ledgerService';
import { 
  Check, 
  FileText, 
  BookOpen, 
  Lock, 
  Sun, 
  Moon,
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'jmkt_invoice_data_v3';
const THEME_STORAGE_KEY = 'jmkt_theme_preference_v1';
const AUTH_SESSION_KEY = 'jmkt_auth_session';

export function App() {
  // 1. PIN Authentication State with 30-Day Persistence
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(AUTH_SESSION_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (parsed.authenticated && parsed.expiresAt && Date.now() < parsed.expiresAt) {
        return true;
      }
    } catch (e) {
      console.error('Failed to parse auth session:', e);
    }
    return false;
  });

  // 2. Tab Navigation: 'create' (Bill Generator) or 'ledger' (Khata / Accounts)
  const [activeTab, setActiveTab] = useState<'create' | 'ledger'>('create');

  // 3. Invoice Generator Data
  const [data, setData] = useState<InvoiceData>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load local storage:', e);
    }
    return initialInvoiceData;
  });

  // 4. Ledger Invoices & Active Edit Tracking
  const [ledgerInvoices, setLedgerInvoices] = useState<LedgerInvoice[]>([]);
  const [editingLedgerId, setEditingLedgerId] = useState<string | null>(null);
  const [reDownloadingInvoice, setReDownloadingInvoice] = useState<LedgerInvoice | null>(null);
  const [downloadingLedgerId, setDownloadingLedgerId] = useState<string | null>(null);

  // 5. Persistent Theme Preference
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
    } catch (e) {
      console.error('Failed to load theme preference:', e);
    }
    return 'light';
  });

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load ledger invoices on start & refresh
  const refreshLedger = async () => {
    try {
      const records = await ledgerService.getAllInvoices();
      setLedgerInvoices(records);
    } catch (err) {
      console.error('Failed to load ledger records:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshLedger();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to local storage:', e);
    }
  }, [data]);

  // Synchronize theme with <html> class and localStorage
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.error('Failed to save theme preference:', e);
    }

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLockSession = () => {
    localStorage.removeItem(AUTH_SESSION_KEY);
    setIsAuthenticated(false);
    showToast('Application locked.');
  };

  const handleResetSample = () => {
    if (window.confirm('Load sample footwear invoice? Current form data will be overwritten.')) {
      setData(sampleInvoiceData);
      setEditingLedgerId(null);
      showToast('Sample footwear data loaded');
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all form fields?')) {
      setData({
        buyer: { buyerName: '', buyerAddress: '', gstinUin: 'Unregistered', accountNo: '', stateAndCode: 'West Bengal (19)' },
        meta: {
          invoiceNo: '',
          dated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
          placeOfSupply: 'West Bengal (19)',
          termsOfPayment: 'Immediate / Against Delivery',
          dispatchMode: 'Local Road Transport',
          copyType: 'ORIGINAL FOR RECIPIENT',
        },
        items: [{ id: '1', hsnCode: '64041990', description: '', colorSpec: '', quantity: 0, mrp: 0, unitPrice: 0, discount: '—' }],
        charges: { packingCharge: 0 },
        signatoryName: 'Ujjal Saha',
      });
      setEditingLedgerId(null);
      showToast('All fields cleared');
    }
  };

  const handleAddItem = () => {
    setData({
      ...data,
      items: [
        ...data.items,
        {
          id: Date.now().toString(),
          hsnCode: '64041990',
          description: '',
          colorSpec: '',
          quantity: 12,
          mrp: 0,
          unitPrice: 0,
          discount: '—',
        },
      ],
    });
    showToast('New item added');
  };

  // 1. "Download PDF Only" — Never writes to database
  const handleDownloadPdfOnly = async () => {
    setIsGeneratingPdf(true);
    showToast('Generating high-res PDF...');
    try {
      const cleanInvoiceNo = (data.meta.invoiceNo || 'INV').replace(/[/\\?%*:|"<>]/g, '_');
      const cleanBuyer = (data.buyer.buyerName || 'Buyer').trim().replace(/\s+/g, '_').replace(/[/\\?%*:|"<>]/g, '');
      await exportToPdf('printable-invoice', `Invoice_${cleanInvoiceNo}_${cleanBuyer}`);
      showToast('PDF downloaded successfully');
    } catch (err) {
      console.error('PDF error:', err);
      showToast('PDF export failed. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 2. "Save to Ledger & Download" — Logs record into ledger & generates PDF
  const handleSaveToLedgerAndDownload = async () => {
    setIsGeneratingPdf(true);
    showToast('Saving to ledger & generating PDF...');
    try {
      const calcs = calculateInvoiceTotals(data);
      // Save/update record in ledger database
      await ledgerService.saveInvoice(
        data, 
        calcs, 
        editingLedgerId || undefined, 
        'pending'
      );
      await refreshLedger();

      // Download PDF
      const cleanInvoiceNo = (data.meta.invoiceNo || 'INV').replace(/[/\\?%*:|"<>]/g, '_');
      const cleanBuyer = (data.buyer.buyerName || 'Buyer').trim().replace(/\s+/g, '_').replace(/[/\\?%*:|"<>]/g, '');
      await exportToPdf('printable-invoice', `Invoice_${cleanInvoiceNo}_${cleanBuyer}`);

      if (editingLedgerId) {
        setEditingLedgerId(null);
        showToast('Ledger invoice updated & PDF downloaded successfully!');
      } else {
        showToast('Bill saved to ledger & PDF downloaded successfully!');
      }
    } catch (err) {
      console.error('Save to ledger error:', err);
      showToast('Failed to save to ledger.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Ledger actions
  const handleTogglePaymentStatus = async (id: string) => {
    try {
      const updated = await ledgerService.togglePaymentStatus(id);
      if (updated) {
        await refreshLedger();
        showToast(`Invoice #${updated.invoice_no} marked as ${updated.payment_status.toUpperCase()}`);
      }
    } catch (err) {
      console.error('Error toggling payment status:', err);
      showToast('Failed to update status');
    }
  };

  const handleEditInvoiceFromLedger = (invoice: LedgerInvoice) => {
    const loadedData = ledgerService.toInvoiceData(invoice);
    setData(loadedData);
    setEditingLedgerId(invoice.id);
    setActiveTab('create');
    showToast(`Loaded Invoice #${invoice.invoice_no} for editing`);
  };

  const handleCancelEdit = () => {
    setEditingLedgerId(null);
    showToast('Edit mode cancelled');
  };

  const handleDeleteLedgerInvoice = async (id: string, invoiceNo: string) => {
    if (window.confirm(`Are you sure you want to delete Invoice #${invoiceNo} from the ledger?`)) {
      try {
        await ledgerService.deleteInvoice(id);
        if (editingLedgerId === id) setEditingLedgerId(null);
        await refreshLedger();
        showToast(`Invoice #${invoiceNo} deleted from ledger.`);
      } catch (err) {
        console.error('Failed to delete invoice:', err);
        showToast('Failed to delete invoice');
      }
    }
  };

  // Re-download PDF directly from ledger without altering current user draft
  const handleRedownloadPdf = async (invoice: LedgerInvoice) => {
    setDownloadingLedgerId(invoice.id);
    setReDownloadingInvoice(invoice);
    showToast(`Generating PDF for #${invoice.invoice_no}...`);

    try {
      // Small pause to allow hidden DOM container to bind
      await new Promise(r => setTimeout(r, 150));
      const cleanInvoiceNo = (invoice.invoice_no || 'INV').replace(/[/\\?%*:|"<>]/g, '_');
      const cleanBuyer = (invoice.buyer_name || 'Buyer').trim().replace(/\s+/g, '_').replace(/[/\\?%*:|"<>]/g, '');
      await exportToPdf('printable-ledger-invoice', `Invoice_${cleanInvoiceNo}_${cleanBuyer}`);
      showToast(`PDF for #${invoice.invoice_no} downloaded.`);
    } catch (err) {
      console.error('Redownload error:', err);
      showToast('PDF download failed.');
    } finally {
      setDownloadingLedgerId(null);
      setReDownloadingInvoice(null);
    }
  };

  const calcs = calculateInvoiceTotals(data);
  const ledgerStats = ledgerService.calculateStats(ledgerInvoices);

  // If locked, gate with Master PIN screen
  if (!isAuthenticated) {
    return (
      <PinLockScreen
        onUnlock={() => setIsAuthenticated(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div
      className="min-h-screen bg-[#fafafa] dark:bg-[#0c0c0e] text-neutral-900 dark:text-neutral-100 flex flex-col relative antialiased selection:bg-neutral-200 dark:selection:bg-neutral-800 transition-colors duration-200"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-4 py-2.5 rounded-xl font-medium text-xs shadow-xl border border-neutral-800 dark:border-neutral-200 flex items-center gap-2 transition-all animate-in fade-in slide-in-from-top-2">
          <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" /> {toastMessage}
        </div>
      )}

      {/* Global Top App Bar with Tab Navigation & Merchant Status */}
      <nav className="sticky top-0 z-40 bg-white/90 dark:bg-[#121214]/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 px-3 sm:px-6 py-2.5 transition-colors duration-200">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Tab Switcher (Create Bill vs Ledger & Accounts) */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-900/80 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`h-8 sm:h-9 px-3 sm:px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'create'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Create Bill</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ledger')}
              className={`h-8 sm:h-9 px-3 sm:px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all relative ${
                activeTab === 'ledger'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Khata / Ledger</span>
              {ledgerStats.pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-500 text-white leading-tight">
                  {ledgerStats.pendingCount}
                </span>
              )}
            </button>
          </div>

          {/* Right: Merchant Badge & Lock / Sign Out */}
          <div className="flex items-center gap-2">
            {/* Merchant Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/50 dark:border-neutral-700/60 text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>JMKT Store</span>
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="depth-btn-secondary h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center text-neutral-700 dark:text-neutral-200"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-neutral-600" />
              )}
            </button>

            {/* Lock / Sign Out Button */}
            <button
              type="button"
              onClick={handleLockSession}
              className="depth-btn-secondary h-8 px-2.5 sm:h-9 sm:px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 text-neutral-700 dark:text-neutral-200"
              title="Lock application session"
            >
              <Lock className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span className="hidden min-[480px]:inline">Lock</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 py-4 sm:px-6 sm:py-6 lg:py-8 pb-28 md:pb-12">
        {activeTab === 'create' ? (
          <>
            {/* PC Layout: Desktop interface */}
            <div className="hidden md:block">
              <InvoiceForm
                data={data}
                onChange={setData}
                onResetSample={handleResetSample}
                onClearAll={handleClearAll}
                onDownloadPdf={handleDownloadPdfOnly}
                onSaveToLedgerAndDownload={handleSaveToLedgerAndDownload}
                onPreview={() => setIsPreviewOpen(true)}
                isGeneratingPdf={isGeneratingPdf}
                theme={theme}
                onToggleTheme={toggleTheme}
                editingLedgerId={editingLedgerId}
                onCancelEdit={handleCancelEdit}
              />
            </div>

            {/* Mobile Layout: Specially tailored layout for mobile phones */}
            <div className="block md:hidden">
              <MobileInvoiceForm
                data={data}
                onChange={setData}
                onResetSample={handleResetSample}
                onClearAll={handleClearAll}
                onDownloadPdf={handleDownloadPdfOnly}
                onSaveToLedgerAndDownload={handleSaveToLedgerAndDownload}
                onPreview={() => setIsPreviewOpen(true)}
                isGeneratingPdf={isGeneratingPdf}
                theme={theme}
                onToggleTheme={toggleTheme}
                editingLedgerId={editingLedgerId}
                onCancelEdit={handleCancelEdit}
              />
            </div>
          </>
        ) : (
          /* Khata / Ledger Tab Section */
          <LedgerView
            invoices={ledgerInvoices}
            stats={ledgerStats}
            onToggleStatus={handleTogglePaymentStatus}
            onEditInvoice={handleEditInvoiceFromLedger}
            onRedownloadPdf={handleRedownloadPdf}
            onDeleteInvoice={handleDeleteLedgerInvoice}
            onNavigateToCreate={() => setActiveTab('create')}
            isDownloadingId={downloadingLedgerId}
          />
        )}
      </main>

      {/* Off-screen Primary Invoice Template — preserved untouched for PDF export */}
      <div data-pdf-wrapper style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <InvoiceTemplate data={data} id="printable-invoice" />
      </div>

      {/* Off-screen Ledger Re-download Template — ensures current draft is never altered */}
      {reDownloadingInvoice && (
        <div data-pdf-wrapper style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <InvoiceTemplate
            data={ledgerService.toInvoiceData(reDownloadingInvoice)}
            id="printable-ledger-invoice"
          />
        </div>
      )}

      {/* Preview Modal */}
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={data}
        onDownloadPdf={handleDownloadPdfOnly}
        isGeneratingPdf={isGeneratingPdf}
      />

      {/* Mobile-Only Docked Action Bar (Only on 'create' bill tab) */}
      {activeTab === 'create' && (
        <StickyActionBar
          grandTotal={calcs.grandTotal}
          onDownloadPdf={handleDownloadPdfOnly}
          onSaveToLedgerAndDownload={handleSaveToLedgerAndDownload}
          onPreview={() => setIsPreviewOpen(true)}
          onAddItem={handleAddItem}
          isGeneratingPdf={isGeneratingPdf}
          editingLedgerId={editingLedgerId}
        />
      )}
    </div>
  );
}

export default App;
