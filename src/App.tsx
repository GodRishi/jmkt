import { useState, useEffect } from 'react';
import type { InvoiceData } from './types/invoice';
import type { LedgerInvoice, SavedParty, SavedArticle } from './types/ledger';
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
import { directoryService } from './services/directoryService';
import { suggestionsService } from './services/suggestionsService';
import { getNextSuggestedInvoiceNo, incrementInvoiceNumber } from './utils/invoiceNumber';
import { shareBillViaWhatsApp } from './utils/whatsapp';
import { supabase, isDatabaseConfigured } from './lib/supabase';
import { checkRateLimit, sanitizeInvoicePayload, maskDatabaseError, validateInvoiceData } from './utils/security';
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
const SESSION_STORAGE_KEY = 'jmkt_invoice_draft_session_v1';
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

  // Verify stored session token with server API on startup
  useEffect(() => {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.token) {
        fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: parsed.token }),
        })
          .then(res => res.json())
          .then(data => {
            if (data && data.valid === false) {
              localStorage.removeItem(AUTH_SESSION_KEY);
              setIsAuthenticated(false);
            }
          })
          .catch(() => {
            // If offline, rely on local expiresAt timestamp
          });
      }
    } catch {
      // Ignore
    }
  }, []);

  // 2. Tab Navigation: 'create' (Bill Generator) or 'ledger' (Khata / Accounts)
  const [activeTab, setActiveTab] = useState<'create' | 'ledger'>('create');

  // 3. Invoice Generator Data with Dual Storage (Session draft protection + LocalStorage)
  const [data, setData] = useState<InvoiceData>(() => {
    try {
      // Check session storage first for uncommitted active draft
      const sessionDraft = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionDraft) return JSON.parse(sessionDraft);

      // Fallback to local storage
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load storage draft:', e);
    }
    return initialInvoiceData;
  });

  // Prevent accidental navigation/refresh if there is active draft work on Create Bill tab
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeTab === 'create') {
        const hasDraftWork = 
          Boolean(data.buyer.buyerName?.trim()) || 
          data.items.some(item => (Number(item.quantity) > 0 && Number(item.unitPrice) > 0) || Boolean(item.description?.trim()));
        if (hasDraftWork) {
          e.preventDefault();
          e.returnValue = '';
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeTab, data]);

  // 4. Ledger Invoices & Active Edit Tracking
  const [ledgerInvoices, setLedgerInvoices] = useState<LedgerInvoice[]>(() => {
    return ledgerService.getLocalLedger();
  });
  const [editingLedgerId, setEditingLedgerId] = useState<string | null>(null);
  const [reDownloadingInvoice, setReDownloadingInvoice] = useState<LedgerInvoice | null>(null);
  const [downloadingLedgerId, setDownloadingLedgerId] = useState<string | null>(null);

  // 5. Party Directory & Articles Catalog State
  const [parties, setParties] = useState<SavedParty[]>([]);
  const [articles, setArticles] = useState<SavedArticle[]>([]);

  const refreshDirectory = async () => {
    try {
      const [pList, aList] = await Promise.all([
        directoryService.getParties(),
        directoryService.getArticles(),
      ]);
      setParties(pList);
      setArticles(aList);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshDirectory();
    }
  }, [isAuthenticated]);

  // 6. Persistent Theme Preference
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

  // 7. Fetch live rows directly from database with anti-spam rate limiting
  const fetchLedger = async () => {
    if (!isDatabaseConfigured) {
      setLedgerInvoices(ledgerService.getLocalLedger());
      return;
    }

    const rate = checkRateLimit('fetch_ledger', 8, 10000);
    if (!rate.allowed) {
      return;
    }

    try {
      const invoices = await ledgerService.getAllInvoices();
      setLedgerInvoices(invoices);
    } catch {
      // Quiet recovery
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchLedger();
    }
  }, [isAuthenticated, activeTab]);

  // Synchronize active draft in real-time to both localStorage and sessionStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to storage:', e);
    }
  }, [data]);

  // Auto-Increment Sequential Invoice Number on initial empty load
  useEffect(() => {
    if (!editingLedgerId && (!data.meta.invoiceNo || data.meta.invoiceNo === '')) {
      const nextNo = getNextSuggestedInvoiceNo(ledgerInvoices);
      if (nextNo) {
        setData((prev) => ({
          ...prev,
          meta: {
            ...prev.meta,
            invoiceNo: nextNo,
          },
        }));
      }
    }
  }, [ledgerInvoices, editingLedgerId, data.meta.invoiceNo]);

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
      const nextNo = getNextSuggestedInvoiceNo(ledgerInvoices);
      const cleanData: InvoiceData = {
        buyer: { 
          buyerName: '', 
          phone: '', 
          buyerAddress: '', 
          gstinUin: 'Unregistered', 
          accountNo: '', 
          stateAndCode: 'West Bengal (19)' 
        },
        meta: {
          invoiceNo: nextNo,
          dated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
          placeOfSupply: 'West Bengal (19)',
          termsOfPayment: 'Immediate / Against Delivery',
          dispatchMode: 'Local Road Transport',
          copyType: 'ORIGINAL FOR RECIPIENT',
        },
        items: [{ id: '1', hsnCode: '64041990', description: '', colorSpec: '', quantity: 0, mrp: 0, unitPrice: 0, discount: '—' }],
        charges: { packingCharge: 0 },
        signatoryName: 'Ujjal Saha',
      };
      setData(cleanData);
      setEditingLedgerId(null);
      try {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      } catch {
        // Ignore
      }
      showToast('All fields cleared — sequential invoice assigned');
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

  // Helper to persist new party, articles, and repeating suggestions from an active bill
  const recordAllNewInvoiceData = async (invData: InvoiceData) => {
    try {
      await Promise.all([
        directoryService.upsertPartyFromInvoice(invData),
        directoryService.upsertArticlesFromInvoice(invData.items),
      ]);
      suggestionsService.recordInvoiceEntries(invData);
      refreshDirectory();
    } catch {
      // Quiet
    }
  };

  // Helper: Saves current bill to database (Supabase / local cache) and updates party & article directories
  const saveInvoiceToDatabase = async (): Promise<boolean> => {
    const validation = validateInvoiceData(data);
    if (!validation.valid) {
      alert(validation.error);
      return false;
    }

    // Anti-DDoS / Request flood guard
    const rateCheck = checkRateLimit('save_bill', 3, 10000);
    if (!rateCheck.allowed) {
      alert(`Too many requests. Please wait ${rateCheck.waitSeconds}s before trying again.`);
      return false;
    }

    try {
      const calcs = calculateInvoiceTotals(data);
      
      // Auto-save buyer, articles, and all repeating fields into the system
      await recordAllNewInvoiceData(data);

      const existingInv = editingLedgerId 
        ? ledgerInvoices.find(i => i.id === editingLedgerId) 
        : null;

      const paidAmount = existingInv ? (Number(existingInv.amount_paid) || 0) : 0;
      const balanceDue = Math.max(0, calcs.grandTotal - paidAmount);
      let status: 'pending' | 'partial' | 'paid' = 'pending';
      if (balanceDue <= 0 && calcs.grandTotal > 0) {
        status = 'paid';
      } else if (paidAmount > 0) {
        status = 'partial';
      }

      const rawPayload = {
        invoice_no: data.meta.invoiceNo || 'DRAFT-' + Date.now().toString().slice(-4),
        invoice_date: data.meta.dated || new Date().toISOString().split('T')[0],
        buyer_name: data.buyer.buyerName || 'Unregistered Buyer',
        buyer_address: data.buyer.buyerAddress || '',
        buyer_gstin: data.buyer.gstinUin || 'Unregistered',
        account_no: data.buyer.accountNo || '',
        party_phone: data.buyer.phone || '',
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
        amount_paid: paidAmount,
        balance_due: balanceDue,
        payment_status: status,
        notes: '',
      };

      // Sanitize against XSS, ReDoS, and buffer overflow attacks
      const invoicePayload = sanitizeInvoicePayload(rawPayload);

      if (isDatabaseConfigured) {
        if (editingLedgerId) {
          const { error: updateError } = await supabase
            .from('invoices_ledger')
            .update(invoicePayload)
            .eq('id', editingLedgerId)
            .select();

          if (updateError) {
            alert("Database Error: " + maskDatabaseError(updateError));
            return false;
          }

          setEditingLedgerId(null);
          showToast('Ledger updated successfully');
        } else {
          const { error: insertError } = await supabase
            .from('invoices_ledger')
            .insert([invoicePayload])
            .select();

          if (insertError) {
            alert("Database Error: " + maskDatabaseError(insertError));
            return false;
          }

          showToast('Bill saved to ledger successfully');
        }
      } else {
        // Offline local fallback
        const local = ledgerService.getLocalLedger();
        if (editingLedgerId) {
          const idx = local.findIndex(i => i.id === editingLedgerId);
          if (idx >= 0) {
            local[idx] = { ...local[idx], ...invoicePayload, updated_at: new Date().toISOString() };
            ledgerService.setLocalLedger(local);
          }
          setEditingLedgerId(null);
        } else {
          const newEntry: LedgerInvoice = {
            id: 'local-' + Date.now(),
            ...invoicePayload,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          ledgerService.setLocalLedger([newEntry, ...local]);
        }
        showToast('Bill saved to local ledger');
      }

      // Re-fetch live rows from database
      await fetchLedger();
      return true;
    } catch (err) {
      showToast('Unable to connect to database. Please check your internet connection.');
      alert("Database Error: " + maskDatabaseError(err));
      return false;
    }
  };

  // 1. "Share via WhatsApp Only" — Directly shares without writing to database
  const handleShareWhatsAppOnly = async () => {
    const validation = validateInvoiceData(data);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Auto-record new party, articles, and repeating fields for next bills
    await recordAllNewInvoiceData(data);

    const calcs = calculateInvoiceTotals(data);
    showToast('Opening WhatsApp...');
    await shareBillViaWhatsApp({
      invoiceNo: data.meta.invoiceNo || 'INV',
      invoiceDate: data.meta.dated || new Date().toISOString().split('T')[0],
      buyerName: data.buyer.buyerName || 'Buyer',
      phone: data.buyer.phone,
      totalPairs: calcs.totalQuantity,
      grandTotal: calcs.grandTotal,
      paymentStatus: 'pending',
    });
  };

  // 2. "Share to WhatsApp & Save to Ledger" — Logs record to database and opens WhatsApp
  const handleShareWhatsAppAndSave = async () => {
    const currentData = { ...data };
    const calcs = calculateInvoiceTotals(currentData);

    showToast('Saving to ledger & opening WhatsApp...');
    const saved = await saveInvoiceToDatabase();
    if (!saved) return;

    await shareBillViaWhatsApp({
      invoiceNo: currentData.meta.invoiceNo || 'INV',
      invoiceDate: currentData.meta.dated || new Date().toISOString().split('T')[0],
      buyerName: currentData.buyer.buyerName || 'Buyer',
      phone: currentData.buyer.phone,
      totalPairs: calcs.totalQuantity,
      grandTotal: calcs.grandTotal,
      paymentStatus: 'pending',
    });

    // Auto-Increment Sequential Invoice Number for next bill
    const nextNo = incrementInvoiceNumber(currentData.meta.invoiceNo);
    setData((prev) => ({
      ...prev,
      meta: {
        ...prev.meta,
        invoiceNo: nextNo,
      },
    }));
  };

  // 3. "Download PDF Only" — Never writes to database
  const handleDownloadPdfOnly = async () => {
    const validation = validateInvoiceData(data);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Auto-record new party, articles, and repeating fields for next bills
    await recordAllNewInvoiceData(data);

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

  // 4. "Save to Ledger & Download" — Logs record into database & generates PDF
  const handleSaveToLedgerAndDownload = async () => {
    if (isGeneratingPdf) return;

    setIsGeneratingPdf(true);
    showToast('Saving to database & generating PDF...');

    try {
      const saved = await saveInvoiceToDatabase();
      if (!saved) return;

      // Download PDF
      const cleanInvoiceNo = (data.meta.invoiceNo || 'INV').replace(/[/\\?%*:|"<>]/g, '_');
      const cleanBuyer = (data.buyer.buyerName || 'Buyer').trim().replace(/\s+/g, '_').replace(/[/\\?%*:|"<>]/g, '');
      await exportToPdf('printable-invoice', `Invoice_${cleanInvoiceNo}_${cleanBuyer}`);

      showToast('PDF downloaded successfully');

      // Auto-Increment Sequential Invoice Number for next bill
      const nextNo = incrementInvoiceNumber(data.meta.invoiceNo);
      setData((prev) => ({
        ...prev,
        meta: {
          ...prev.meta,
          invoiceNo: nextNo,
        },
      }));
    } catch (err) {
      console.error('PDF error:', err);
      showToast('PDF export failed. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Ledger actions: direct database status update with rate limiting
  const handleTogglePaymentStatus = async (id: string, currentStatus?: string) => {
    const rateCheck = checkRateLimit('status_update', 6, 10000);
    if (!rateCheck.allowed) {
      showToast(`Too many requests. Please wait ${rateCheck.waitSeconds}s.`);
      return;
    }

    const currentInv = ledgerInvoices.find(inv => inv.id === id);
    const resolvedStatus = currentStatus || currentInv?.payment_status || 'pending';
    const newStatus: 'pending' | 'paid' = resolvedStatus === 'paid' ? 'pending' : 'paid';
    const now = new Date().toISOString();

    const grandTotal = Number(currentInv?.grand_total) || 0;
    const newAmountPaid = newStatus === 'paid' ? grandTotal : 0;
    const newBalanceDue = newStatus === 'paid' ? 0 : grandTotal;

    if (isDatabaseConfigured) {
      const { error } = await supabase
        .from('invoices_ledger')
        .update({
          payment_status: newStatus,
          payment_date: newStatus === 'paid' ? now : null,
          amount_paid: newAmountPaid,
          balance_due: newBalanceDue,
          updated_at: now,
        })
        .eq('id', id);

      if (error) {
        alert("Database Error: " + maskDatabaseError(error));
        return;
      }
    } else {
      const local = ledgerService.getLocalLedger();
      const idx = local.findIndex(i => i.id === id);
      if (idx >= 0) {
        local[idx] = {
          ...local[idx],
          payment_status: newStatus,
          payment_date: newStatus === 'paid' ? now : null,
          amount_paid: newAmountPaid,
          balance_due: newBalanceDue,
          updated_at: now,
        };
        ledgerService.setLocalLedger(local);
      }
    }

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
    const rateCheck = checkRateLimit('delete_invoice', 5, 10000);
    if (!rateCheck.allowed) {
      showToast(`Too many requests. Please wait ${rateCheck.waitSeconds}s.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete Invoice #${invoiceNo}?`)) {
      return;
    }

    if (isDatabaseConfigured) {
      const { error } = await supabase
        .from('invoices_ledger')
        .delete()
        .eq('id', id);

      if (error) {
        alert("Database Error: " + maskDatabaseError(error));
        return;
      }
    } else {
      const local = ledgerService.getLocalLedger();
      ledgerService.setLocalLedger(local.filter(i => i.id !== id));
    }

    if (editingLedgerId === id) setEditingLedgerId(null);
    showToast(`Invoice #${invoiceNo} deleted from ledger.`);
    await fetchLedger();
  };

  const handlePaymentRecorded = async (updatedInvoice: LedgerInvoice) => {
    showToast(`Payment recorded for #${updatedInvoice.invoice_no}`);
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
              {(ledgerStats.pendingCount + ledgerStats.partialCount) > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-500 text-white leading-tight">
                  {ledgerStats.pendingCount + ledgerStats.partialCount}
                </span>
              )}
            </button>
          </div>

          {/* Right: Merchant Badge & Lock / Sign Out */}
          <div className="flex items-center gap-2">
            {/* Database Status Badge */}
            <div 
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/50 dark:border-neutral-700/60 text-[11px] font-medium text-neutral-700 dark:text-neutral-300"
              title={isDatabaseConfigured ? 'Database connected & operational' : 'Database connection not configured'}
            >
              <span className={`w-2 h-2 rounded-full ${isDatabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{isDatabaseConfigured ? 'Database Online' : 'Database Offline'}</span>
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
        {/* Banner if database credentials are not detected */}
        {!isDatabaseConfigured && (
          <div className="mb-5 p-3.5 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <p className="font-semibold text-amber-950 dark:text-amber-100">
                  Database connection not detected
                </p>
                <p className="text-[11px] sm:text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                  Offline storage active. Configure database credentials in your environment file to sync records across devices.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 shrink-0 border border-amber-300/80 dark:border-amber-800">
              Offline Cache
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
                onShareWhatsAppAndSave={handleShareWhatsAppAndSave}
                onShareWhatsAppOnly={handleShareWhatsAppOnly}
                onShareWhatsApp={handleShareWhatsAppOnly}
                onPreview={() => setIsPreviewOpen(true)}
                isGeneratingPdf={isGeneratingPdf}
                theme={theme}
                onToggleTheme={toggleTheme}
                editingLedgerId={editingLedgerId}
                onCancelEdit={handleCancelEdit}
                parties={parties}
                articles={articles}
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
                onShareWhatsAppAndSave={handleShareWhatsAppAndSave}
                onShareWhatsAppOnly={handleShareWhatsAppOnly}
                onShareWhatsApp={handleShareWhatsAppOnly}
                onPreview={() => setIsPreviewOpen(true)}
                isGeneratingPdf={isGeneratingPdf}
                theme={theme}
                onToggleTheme={toggleTheme}
                editingLedgerId={editingLedgerId}
                onCancelEdit={handleCancelEdit}
                parties={parties}
                articles={articles}
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
            onExportCsv={(filename) => showToast(`Ledger exported: ${filename}`)}
            onPaymentRecorded={handlePaymentRecorded}
            isDownloadingId={downloadingLedgerId}
            isDatabaseConnected={isDatabaseConfigured}
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
          onShareWhatsAppAndSave={handleShareWhatsAppAndSave}
          onShareWhatsAppOnly={handleShareWhatsAppOnly}
          onShareWhatsApp={handleShareWhatsAppOnly}
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
