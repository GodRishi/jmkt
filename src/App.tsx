import { useState, useEffect } from 'react';
import type { InvoiceData } from './types/invoice';
import { initialInvoiceData } from './utils/defaultData';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoiceTemplate } from './components/InvoiceTemplate';
import { PreviewModal } from './components/PreviewModal';
import { StickyActionBar } from './components/StickyActionBar';
import { exportToPdf } from './utils/pdfExport';
import { calculateInvoiceTotals } from './utils/calculator';
import { Sparkles } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'jmkt_invoice_data_v1';

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleResetSample = () => {
    if (window.confirm('Load sample footwear invoice? Current data will be overwritten.')) {
      setData(initialInvoiceData);
      showToast('Sample data loaded!');
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all fields?')) {
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
        signatoryName: 'Rishi Saha',
      });
      showToast('Form cleared.');
    }
  };

  const handleAddItem = () => {
    setData({
      ...data,
      items: [...data.items, { id: Date.now().toString(), hsnCode: '64041990', description: '', colorSpec: '', quantity: 12, mrp: 0, unitPrice: 0, discount: '—' }],
    });
    showToast('New item added!');
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    showToast('Preparing PDF...');
    try {
      const cleanInvoiceNo = (data.meta.invoiceNo || 'INV').replace(/[/\\?%*:|"<>]/g, '_');
      const cleanBuyer = (data.buyer.buyerName || 'Buyer').trim().replace(/\s+/g, '_').replace(/[/\\?%*:|"<>]/g, '');
      await exportToPdf('printable-invoice', `Invoice_${cleanInvoiceNo}_${cleanBuyer}`);
      showToast('PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF error:', err);
      showToast('PDF export failed. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const calcs = calculateInvoiceTotals(data);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-emerald-500 text-slate-950 px-5 py-2.5 rounded-full font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" /> {toastMessage}
        </div>
      )}

      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-6 lg:p-8">
        <InvoiceForm
          data={data}
          onChange={setData}
          onResetSample={handleResetSample}
          onClearAll={handleClearAll}
        />
      </main>

      {/* Off-screen Invoice Template — temporarily shown during PDF export */}
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
