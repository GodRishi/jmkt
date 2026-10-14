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
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { 
  Check, 
  FileText, 
  BookOpen, 
  Lock, 
  Sun, 
  Moon,
  AlertTriangle,
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

  // 3. Fetch live rows directly from Supabase
  const fetchLedger = async () => {
    if (!isSupabaseConfigured) {
      console.error("CRITICAL: Supabase environment variables are missing!");
      return;
    }

    console.log("Fetching live ledger from Supabase...");
    const { data, error } = await supabase
      .from('invoices_ledger')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching ledger:", error);
      return;
    }

    console.log("Fetched ledger successfully:", data);
    setLedgerInvoices((data as LedgerInvoice[]) || []);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchLedger();
    }
  }, [isAuthenticated, activeTab]);

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

  // 2. "Save to Ledger & Download" — Logs record into Supabase & generates PDF
  const handleSaveToLedgerAndDownload = async () => {
    if (!isSupabaseConfigured) {
      console.error("CRITICAL: Supabase environment variables are missing!");
      alert("Supabase credentials not detected.\n\nPlease configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file to enable cloud ledger syncing.");
      return;
    }

    setIsGeneratingPdf(true);
    showToast('Saving to Supabase & generating PDF...');

    try {
      const calcs = calculateInvoiceTotals(data);
      const invoicePayload = {
        invoice_no: data.meta.invoiceNo || 'DRAFT-' + Date.now().toString().slice(-4),
        invoice_date: data.meta.dated || new Date().toISOString().split('T')[0],
        buyer_name: data.buyer.buyerName || 'Unregistered Buyer',
        buyer_address: data.buyer.buyerAddress || '',
        buyer_gstin: data.buyer.gstinUin || 'Unregistered',
        account_no: data.buyer.accountNo || '',
        place_of_supply: data.meta.placeOfSupply || 'West Bengal (19)',
        dispatch_mode: data.meta.dispatchMode || 'Local Road Transport',
        terms: data.meta.termsOfPayment || 'Immediate / Against Delivery',
        copy_badge: data.meta.copyType || 'ORIGINAL FOR RECIPIENT',
        items: data.items,
        total_pairs: calcs.totalQuantity,
        taxable_value: calcs.totalTaxableValue,
        packing_charge: calcs.packingCharge,
        cgst: calcs.cgst,
        sgst: calcs.sgst,
        round_off: calcs.roundOff,
        grand_total: calcs.grandTotal,
        payment_status: 'pending',
        notes: '',
      };

      console.log("Submitting to Supabase...", invoicePayload);

      if (editingLedgerId) {
        const { data: updatedData, error: updateError } = await supabase
          .from('invoices_ledger')
          .update(invoicePayload)
          .eq('id', editingLedgerId)
          .select();

        if (updateError) {
          console.error("Supabase Insert Error:", updateError);
          alert("Database Error: " + updateError.message);
          return;
        }

        console.log("Saved successfully to Supabase:", updatedData);
        setEditingLedgerId(null);
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from('invoices_ledger')
          .insert([invoicePayload])
          .select();

        if (insertError) {
          console.error("Supabase Insert Error:", insertError);
          alert("Database Error: " + insertError.message);
          return;
        }

        console.log("Saved successfully to Supabase:", insertData);
      }

      // Re-fetch live rows from Supabase
      await fetchLedger();

      // Download PDF
      const cleanInvoiceNo = (data.meta.invoiceNo || 'INV').replace(/[/\\?%*:|"<>]/g, '_');
      const cleanBuyer = (data.buyer.buyerName || 'Buyer').trim().replace(/\s+/g, '_').replace(/[/\\?%*:|"<>]/g, '');
      await exportToPdf('printable-invoice', `Invoice_${cleanInvoiceNo}_${cleanBuyer}`);

      showToast('Saved to Supabase & PDF downloaded successfully!');
    } catch (err) {
      console.error('Save to ledger error:', err);
      alert('Database Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Ledger actions: direct Supabase status update
  const handleTogglePaymentStatus = async (id: string, currentStatus?: string) => {
    if (!isSupabaseConfigured) {
      console.error("CRITICAL: Supabase environment variables are missing!");
      alert("Supabase credentials not detected");
      return;
    }

    const currentInv = ledgerInvoices.find(inv => inv.id === id);
    const resolvedStatus = currentStatus || currentInv?.payment_status || 'pending';
    const newStatus: 'pending' | 'paid' = resolvedStatus === 'paid' ? 'pending' : 'paid';
    const now = new Date().toISOString();

    console.log(`Updating status in Supabase for ${id} to ${newStatus}...`);

    const { error } = await supabase
      .from('invoices_ledger')
      .update({
        payment_status: newStatus,
        payment_date: newStatus === 'paid' ? now : null,
        updated_at: now,
      })
      .eq('id', id);

    if (error) {
      console.error("Supabase Update Status Error:", error);
      alert("Database Error: " + error.message);
      return;
    }

    console.log(`Payment status updated to ${newStatus} in Supabase`);
    showToast(`Invoice marked as ${newStatus.toUpperCase()}`);
    await fetchLedger();
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
    if (!isSupabaseConfigured) {
      console.error("CRITICAL: Supabase environment variables are missing!");
      alert("Supabase credentials not detected");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete Invoice #${invoiceNo}?`)) {
      return;
    }

    console.log(`Deleting invoice ${id} from Supabase...`);

    const { error } = await supabase
      .from('invoices_ledger')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Supabase Delete Error:", error);
      alert("Database Error: " + error.message);
      return;
    }

    console.log(`Invoice ${id} deleted successfully from Supabase`);
    if (editingLedgerId === id) setEditingLedgerId(null);
    showToast(`Invoice #${invoiceNo} deleted from ledger.`);
    await fetchLedger();
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
            {/* Supabase Status Badge */}
            <div 
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/50 dark:border-neutral-700/60 text-[11px] font-medium text-neutral-700 dark:text-neutral-300"
              title={isSupabaseConfigured ? 'Supabase connected & ready' : 'Supabase credentials not detected in .env'}
            >
              <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Supabase Not Detected'}</span>
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
        {/* Banner if Supabase credentials are not detected */}
        {!isSupabaseConfigured && (
          <div className="mb-5 p-3.5 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <p className="font-semibold text-amber-950 dark:text-amber-100">
                  Supabase credentials not detected
                </p>
                <p className="text-[11px] sm:text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                  Configure <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your <code>.env</code> file to enable live database saving and fetching.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 shrink-0 border border-amber-300/80 dark:border-amber-800">
              Disconnected
            </span>
          </div>
        )}

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
            onRefresh={fetchLedger}
            isDownloadingId={downloadingLedgerId}
            isSupabaseConnected={isSupabaseConfigured}
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
