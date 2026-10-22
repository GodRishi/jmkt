import React, { useState, useRef, useEffect } from 'react';
import { Download, Eye, BookmarkPlus, Send } from 'lucide-react';
import { formatCurrency } from '../utils/calculator';

interface StickyActionBarProps {
  grandTotal: number;
  onDownloadPdf: () => void;
  onSaveToLedgerAndDownload?: () => void;
  onShareWhatsAppAndSave?: () => void;
  onShareWhatsAppOnly?: () => void;
  onShareWhatsApp?: () => void;
  onPreview: () => void;
  onAddItem?: () => void;
  isGeneratingPdf?: boolean;
  editingLedgerId?: string | null;
}

export const StickyActionBar: React.FC<StickyActionBarProps> = ({
  grandTotal,
  onDownloadPdf,
  onSaveToLedgerAndDownload,
  onShareWhatsAppAndSave,
  onShareWhatsAppOnly,
  onShareWhatsApp,
  onPreview,
  isGeneratingPdf = false,
  editingLedgerId,
}) => {
  const formattedTotal = formatCurrency(grandTotal);
  const [isWhatsAppMenuOpen, setIsWhatsAppMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close WhatsApp popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsWhatsAppMenuOpen(false);
      }
    };
    if (isWhatsAppMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isWhatsAppMenuOpen]);

  const hasWhatsApp = Boolean(onShareWhatsAppAndSave || onShareWhatsAppOnly || onShareWhatsApp);

  return (
    <div className="depth-dock fixed bottom-0 inset-x-0 bg-white/95 dark:bg-[#161618]/95 backdrop-blur-md border-t border-neutral-200/80 dark:border-neutral-800 px-3 py-2 flex items-center justify-between z-50 md:hidden transition-colors duration-200 gap-2">
      {/* WhatsApp Action Popover Menu */}
      {isWhatsAppMenuOpen && (
        <div 
          ref={menuRef}
          className="absolute bottom-full right-2 mb-2 w-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 space-y-1.5"
        >
          <div className="px-2 py-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            <span>WhatsApp Options</span>
            <span className="text-[10px] lowercase text-emerald-600 dark:text-emerald-400 font-medium">choose action</span>
          </div>

          {/* Option 1: Share to WhatsApp & Save to Ledger */}
          {(onShareWhatsAppAndSave || onShareWhatsApp) && (
            <button
              type="button"
              onClick={() => {
                setIsWhatsAppMenuOpen(false);
                (onShareWhatsAppAndSave || onShareWhatsApp)?.();
              }}
              className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-500/25 bg-emerald-50/40 dark:bg-emerald-950/25 transition-all flex items-center gap-2.5 active:scale-[0.99]"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <BookmarkPlus className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                  Share &amp; Save to Ledger
                </div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                  Records into accounts &amp; opens WhatsApp
                </div>
              </div>
            </button>
          )}

          {/* Option 2: Share via WhatsApp Only */}
          {(onShareWhatsAppOnly || onShareWhatsApp) && (
            <button
              type="button"
              onClick={() => {
                setIsWhatsAppMenuOpen(false);
                (onShareWhatsAppOnly || onShareWhatsApp)?.();
              }}
              className="w-full text-left p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-800 transition-all flex items-center gap-2.5 active:scale-[0.99]"
            >
              <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center shrink-0">
                <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                  Share via WhatsApp Only
                </div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                  Direct share without saving to ledger
                </div>
              </div>
            </button>
          )}
        </div>
      )}

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

        {hasWhatsApp && (
          <button
            ref={buttonRef}
            type="button"
            onClick={() => {
              if (onShareWhatsAppAndSave && onShareWhatsAppOnly) {
                setIsWhatsAppMenuOpen(prev => !prev);
              } else {
                (onShareWhatsAppOnly || onShareWhatsApp || onShareWhatsAppAndSave)?.();
              }
            }}
            className={`depth-btn-secondary h-9 w-9 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 transition-colors ${
              isWhatsAppMenuOpen ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500/50' : ''
            }`}
            title="WhatsApp Options: Share & Save or Share Only"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={isGeneratingPdf}
          className="depth-btn-secondary h-9 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 disabled:opacity-50 shrink-0"
          title="Download PDF without saving to ledger"
        >
          <Download className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
          <span className="text-[11px] whitespace-nowrap">PDF</span>
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
                ? '...'
                : (editingLedgerId ? 'Update' : 'Save')}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
