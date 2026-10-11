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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-neutral-950/50 dark:bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="depth-popover relative w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-200/70 dark:border-neutral-800 bg-white dark:bg-[#141416] shrink-0">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              A4 Invoice Preview
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
              Invoice #{data.meta.invoiceNo || 'INV'} &bull; Buyer: {data.buyer.buyerName || 'Unassigned'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={isGeneratingPdf}
              className="depth-btn-primary h-9 px-3.5 rounded-lg text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="depth-btn-secondary h-9 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5"
              title="Print directly"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="depth-btn-secondary h-9 w-9 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
              title="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body - Scrollable A4 Template preview */}
        <div className="p-6 sm:p-8 md:p-10 overflow-y-auto bg-neutral-100/70 dark:bg-[#0c0c0e] flex justify-center items-start">
          <div className="transform scale-[0.55] sm:scale-[0.75] md:scale-[0.9] lg:scale-100 origin-top shadow-xl rounded-sm overflow-hidden bg-white border border-neutral-300 my-4 ring-1 ring-neutral-900/5">
            <InvoiceTemplate data={data} id="modal-invoice-preview" />
          </div>
        </div>
      </div>
    </div>
  );
};
