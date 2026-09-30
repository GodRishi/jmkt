import React from 'react';
import type { InvoiceData } from '../types/invoice';
import { InvoiceTemplate } from './InvoiceTemplate';
import { X, Download, Printer } from 'lucide-react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InvoiceData;
  onDownloadPdf: () => void;
  isGeneratingPdf?: boolean;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  data,
  onDownloadPdf,
  isGeneratingPdf = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white font-display">A4 Printable Invoice Preview</h3>
            <p className="text-xs text-slate-400">
              Invoice #{data.meta.invoiceNo} &bull; Buyer: {data.buyer.buyerName || 'Client'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition-all disabled:opacity-50 min-h-[40px]"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Exporting...' : 'Download PDF'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-all min-h-[40px]"
              title="Print directly"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - Scrollable A4 Template preview */}
        <div className="p-6 sm:p-8 md:p-10 overflow-y-auto bg-slate-950 flex justify-center items-start">
          <div className="transform scale-[0.55] sm:scale-[0.75] md:scale-[0.9] lg:scale-100 origin-top shadow-2xl rounded-md overflow-hidden bg-white border border-slate-300 my-4 ring-1 ring-slate-700/50 ring-offset-4 ring-offset-slate-950">
            <InvoiceTemplate data={data} id="modal-invoice-preview" />
          </div>
        </div>
      </div>
    </div>
  );
};
