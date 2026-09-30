import React from 'react';
import { Download, Eye, Plus } from 'lucide-react';
import { formatCurrency } from '../utils/calculator';

interface StickyActionBarProps {
  grandTotal: number;
  onDownloadPdf: () => void;
  onPreview: () => void;
  onAddItem: () => void;
  isGeneratingPdf?: boolean;
}

export const StickyActionBar: React.FC<StickyActionBarProps> = ({
  grandTotal,
  onDownloadPdf,
  onPreview,
  onAddItem,
  isGeneratingPdf = false,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 p-3 sm:p-4 shadow-2xl">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        <div className="hidden min-[400px]:block">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">Grand Total</span>
          <span className="text-base sm:text-lg font-bold text-emerald-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            ₹{formatCurrency(grandTotal)}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full min-[400px]:w-auto justify-end">
          <button type="button" onClick={onAddItem} className="min-h-[48px] px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-all flex items-center gap-1.5 active:scale-95" title="Add line item">
            <Plus className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Add Item</span>
          </button>

          <button type="button" onClick={onPreview} className="min-h-[48px] px-3.5 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-all flex items-center gap-1.5 active:scale-95">
            <Eye className="w-4 h-4 text-indigo-400" /> Preview
          </button>

          <button type="button" onClick={onDownloadPdf} disabled={isGeneratingPdf} className="flex-1 min-[400px]:flex-none min-h-[48px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950 transition-all active:scale-95 disabled:opacity-50">
            <Download className="w-4 h-4" />
            <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
