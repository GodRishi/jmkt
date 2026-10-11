import { useState, useEffect } from 'react';
import type { InvoiceData } from './types/invoice';
import { initialInvoiceData, sampleInvoiceData } from './utils/defaultData';
import { InvoiceForm } from './components/InvoiceForm';
import { MobileInvoiceForm } from './components/MobileInvoiceForm';
import { InvoiceTemplate } from './components/InvoiceTemplate';
import { PreviewModal } from './components/PreviewModal';
import { StickyActionBar } from './components/StickyActionBar';
import { exportToPdf } from './utils/pdfExport';
import { calculateInvoiceTotals } from './utils/calculator';
import { Check } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'jmkt_invoice_data_v3';
const THEME_STORAGE_KEY = 'jmkt_theme_preference_v1';

export function App() {
  const [data, setData] = useState<InvoiceData>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load local storage:', e);
    }
    return initialInvoiceData;
  });

  // Persistent theme preference — default is strictly light mode unless changed by user
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
    } catch (e) {
      console.error('Failed to load theme preference:', e);
    }
    return 'light'; // Default theme is light
  });

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleResetSample = () => {
    if (window.confirm('Load sample footwear invoice? Current data will be overwritten.')) {
      setData(sampleInvoiceData);
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

  const handleDownloadPdf = async () => {
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

  const calcs = calculateInvoiceTotals(data);

  return (
    <div
      className="min-h-screen bg-[#fafafa] dark:bg-[#0c0c0e] text-neutral-900 dark:text-neutral-100 flex flex-col relative antialiased selection:bg-neutral-200 dark:selection:bg-neutral-800 transition-colors duration-200"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-3.5 py-2 rounded-lg font-medium text-xs shadow-lg border border-neutral-800 dark:border-neutral-200 flex items-center gap-2 transition-all">
          <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" /> {toastMessage}
        </div>
      )}

      {/* Main Content Container with mobile bottom padding */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 py-4 sm:px-6 sm:py-8 lg:py-10 pb-28 md:pb-12">
        {/* PC Layout: Untouched desktop interface */}
        <div className="hidden md:block">
          <InvoiceForm
            data={data}
            onChange={setData}
            onResetSample={handleResetSample}
            onClearAll={handleClearAll}
            onDownloadPdf={handleDownloadPdf}
            onPreview={() => setIsPreviewOpen(true)}
            isGeneratingPdf={isGeneratingPdf}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        </div>

        {/* Mobile Layout: Specially tailored layout for mobile phones */}
        <div className="block md:hidden">
          <MobileInvoiceForm
            data={data}
            onChange={setData}
            onResetSample={handleResetSample}
            onClearAll={handleClearAll}
            onDownloadPdf={handleDownloadPdf}
            onPreview={() => setIsPreviewOpen(true)}
            isGeneratingPdf={isGeneratingPdf}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        </div>
      </main>

      {/* Off-screen Invoice Template — preserved exactly for PDF export */}
      <div data-pdf-wrapper style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <InvoiceTemplate data={data} id="printable-invoice" />
      </div>

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={data}
        onDownloadPdf={handleDownloadPdf}
        isGeneratingPdf={isGeneratingPdf}
      />

      {/* Mobile-Only Docked Frosted Bar (< 768px) */}
      <StickyActionBar
        grandTotal={calcs.grandTotal}
        onDownloadPdf={handleDownloadPdf}
        onPreview={() => setIsPreviewOpen(true)}
        onAddItem={handleAddItem}
        isGeneratingPdf={isGeneratingPdf}
      />
    </div>
  );
}

export default App;
