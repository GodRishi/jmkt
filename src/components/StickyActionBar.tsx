import React from 'react';
import { Download, Eye, BookmarkPlus } from 'lucide-react';
import { formatCurrency } from '../utils/calculator';

interface StickyActionBarProps {
  grandTotal: number;
  onDownloadPdf: () => void;
  onSaveToLedgerAndDownload?: () => void;
  onPreview: () => void;
  onAddItem?: () => void;
  isGeneratingPdf?: boolean;
  editingLedgerId?: string | null;
}

export const StickyActionBar: React.FC<StickyActionBarProps> = ({
  grandTotal,
  onDownloadPdf,
  onSaveToLedgerAndDownload,
  onPreview,
  isGeneratingPdf = false,
  editingLedgerId,
}) => {
  const formattedTotal = formatCurrency(grandTotal);

  return (
    <div className="depth-dock fixed bottom-0 inset-x-0 bg-white/95 dark:bg-[#161618]/95 backdrop-blur-md border-t border-neutral-200/80 dark:border-neutral-800 px-3 py-2 flex items-center justify-between z-50 md:hidden transition-colors duration-200 gap-2">
      {/* Left: Total live counter */}
      <div className="min-w-0 flex-1 pr-1" title={`₹${formattedTotal}`}>
        <span className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-medium block leading-none mb-0.5">
          Total
        </span>
        <span 
          className={`font-semibold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums tracking-tight block truncate ${
            formattedTotal.length > 13
              ? 'text-xs'
              : formattedTotal.length > 9
              ? 'text-sm'
              : 'text-base'
          }`}
        >
          ₹{formattedTotal}
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onPreview}
          className="depth-btn-secondary h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
          title="Preview invoice"
        >
          <Eye className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
        </button>

        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={isGeneratingPdf}
          className="depth-btn-secondary h-9 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 disabled:opacity-50 shrink-0"
          title="Download PDF without saving to ledger"
        >
          <Download className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
          <span className="text-[11px] whitespace-nowrap">PDF Only</span>
        </button>

        {onSaveToLedgerAndDownload && (
          <button
            type="button"
            onClick={onSaveToLedgerAndDownload}
            disabled={isGeneratingPdf}
            className="depth-btn-primary h-9 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 shrink-0"
            title="Log bill in accounts ledger & download PDF"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px] whitespace-nowrap">
              {isGeneratingPdf
                ? 'Exporting...'
                : (editingLedgerId ? 'Update' : 'Save & PDF')}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
