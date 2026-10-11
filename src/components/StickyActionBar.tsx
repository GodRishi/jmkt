import React from 'react';
import { Download, Eye } from 'lucide-react';
import { formatCurrency } from '../utils/calculator';

interface StickyActionBarProps {
  grandTotal: number;
  onDownloadPdf: () => void;
  onPreview: () => void;
  onAddItem?: () => void;
  isGeneratingPdf?: boolean;
}

export const StickyActionBar: React.FC<StickyActionBarProps> = ({
  grandTotal,
  onDownloadPdf,
  onPreview,
  isGeneratingPdf = false,
}) => {
  return (
    <div className="depth-dock fixed bottom-0 inset-x-0 bg-white/90 dark:bg-[#161618]/95 backdrop-blur-md border-t border-neutral-200/80 dark:border-neutral-800 px-4 py-3 flex items-center justify-between z-50 md:hidden transition-colors duration-200">
      {/* Left: Total live counter */}
      <div className="min-w-0">
        <span className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-medium block">
          Total
        </span>
        <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums tracking-tight block truncate">
          ₹{formatCurrency(grandTotal)}
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onPreview}
          className="depth-btn-secondary h-10 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5"
          title="Preview invoice"
        >
          <Eye className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
          <span className="hidden min-[360px]:inline">Preview</span>
        </button>

        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={isGeneratingPdf}
          className="depth-btn-primary h-10 px-4 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isGeneratingPdf ? 'Exporting...' : 'Download PDF'}</span>
        </button>
      </div>
    </div>
  );
};
