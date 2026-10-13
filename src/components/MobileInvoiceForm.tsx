import React, { useState } from 'react';
import type { InvoiceData, LineItem } from '../types/invoice';
import { calculateInvoiceTotals, formatCurrency } from '../utils/calculator';
import { DatePickerPopover } from './DatePickerPopover';
import { 
  Building2, 
  FileText, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Receipt,
  Download,
  Eye,
  Sun,
  Moon,
  Package,
  Layers,
  ChevronDown,
  ChevronUp,
  BookmarkPlus,
  CheckCircle,
} from 'lucide-react';

interface MobileInvoiceFormProps {
  data: InvoiceData;
  onChange: (newData: InvoiceData) => void;
  onResetSample: () => void;
  onClearAll: () => void;
  onDownloadPdf?: () => void;
  onSaveToLedgerAndDownload?: () => void;
  onPreview?: () => void;
  isGeneratingPdf?: boolean;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  editingLedgerId?: string | null;
  onCancelEdit?: () => void;
}

export const MobileInvoiceForm: React.FC<MobileInvoiceFormProps> = ({
  data,
  onChange,
  onResetSample,
  onClearAll,
  onDownloadPdf,
  onSaveToLedgerAndDownload,
  onPreview,
  isGeneratingPdf = false,
  theme = 'light',
  onToggleTheme,
  editingLedgerId,
  onCancelEdit,
}) => {
  const calcs = calculateInvoiceTotals(data);

  // Mobile section collapsibility for faster shop-floor navigation
  const [buyerExpanded, setBuyerExpanded] = useState(true);
  const [metaExpanded, setMetaExpanded] = useState(true);

  const handleBuyerChange = (field: keyof InvoiceData['buyer'], value: string) => {
    onChange({ ...data, buyer: { ...data.buyer, [field]: value } });
  };

  const handleMetaChange = (field: keyof InvoiceData['meta'], value: string) => {
    onChange({ ...data, meta: { ...data.meta, [field]: value } });
  };

  const handleItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange({ ...data, items: newItems });
  };

  const handleAddItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      hsnCode: '64041990',
      description: '',
      colorSpec: '',
      quantity: 12,
      mrp: 0,
      unitPrice: 0,
      discount: '—',
    };
    onChange({ ...data, items: [...data.items, newItem] });
  };

  const handleDeleteItem = (index: number) => {
    if (data.items.length <= 1) return;
    onChange({ ...data, items: data.items.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4 pb-2">
      {/* 1. Mobile App Top Bar */}
      <div className="depth-card rounded-2xl p-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-sm flex items-center justify-center shrink-0 shadow-sm font-mono">
            JMKT
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 truncate">
              Jai Maa Kamakhya
            </h1>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
              Wholesale Footwear &bull; WB-19
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="depth-btn-secondary w-9 h-9 rounded-xl flex items-center justify-center"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-neutral-600" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onResetSample}
            className="depth-btn-secondary px-2.5 h-9 rounded-xl text-xs font-medium flex items-center gap-1"
            title="Load sample wholesale footwear invoice"
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
            <span className="text-[11px]">Sample</span>
          </button>

          <button
            type="button"
            onClick={onClearAll}
            className="w-9 h-9 rounded-xl bg-transparent hover:bg-rose-50 dark:hover:bg-rose-950/40 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-colors active:scale-95"
            title="Clear all fields"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Edit Mode Alert Banner */}
      {editingLedgerId && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 p-3 rounded-xl flex items-center justify-between text-xs font-medium animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Editing Ledger Entry #{data.meta.invoiceNo || 'INV'}. Saving updates this record.</span>
          </div>
          {onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="text-amber-800 dark:text-amber-200 underline hover:opacity-75 font-semibold shrink-0 ml-2"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* 2. Mobile Quick Metric Chips */}
      <div className="grid grid-cols-3 gap-2">
        <div className="depth-subcard p-2.5 rounded-xl text-center">
          <span className="text-[10px] uppercase font-semibold text-neutral-400 dark:text-neutral-500 block">
            Items
          </span>
          <span className="text-sm font-semibold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
            {data.items.length}
          </span>
        </div>

        <div className="depth-subcard p-2.5 rounded-xl text-center">
          <span className="text-[10px] uppercase font-semibold text-neutral-400 dark:text-neutral-500 block">
            Total Pairs
          </span>
          <span className="text-sm font-semibold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
            {calcs.totalQuantity}
          </span>
        </div>

        <div className="depth-subcard p-2.5 rounded-xl text-center">
          <span className="text-[10px] uppercase font-semibold text-neutral-400 dark:text-neutral-500 block">
            Taxable
          </span>
          <span className="text-sm font-semibold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 truncate block">
            ₹{formatCurrency(calcs.totalTaxableValue)}
          </span>
        </div>
      </div>

      {/* 3. Buyer Details Card (Collapsible for speed) */}
      <section className="depth-card rounded-2xl p-4 space-y-3">
        <button
          type="button"
          onClick={() => setBuyerExpanded(prev => !prev)}
          className="w-full flex items-center justify-between text-left pb-1"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
            Buyer Information
          </span>
          <div className="flex items-center gap-1.5 text-neutral-400">
            <span className="text-[11px] truncate max-w-[120px] font-normal text-neutral-600 dark:text-neutral-300">
              {data.buyer.buyerName || 'Unassigned'}
            </span>
            {buyerExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {buyerExpanded && (
          <div className="space-y-3 pt-1 border-t border-neutral-100 dark:border-neutral-800/80 animate-in fade-in duration-150">
            <div>
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                Buyer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={data.buyer.buyerName}
                onChange={(e) => handleBuyerChange('buyerName', e.target.value)}
                placeholder="e.g. Nuruddin Sultan"
                className="depth-input w-full min-h-[46px] px-3.5 py-2.5 rounded-xl text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                Address / Destination
              </label>
              <input
                type="text"
                value={data.buyer.buyerAddress}
                onChange={(e) => handleBuyerChange('buyerAddress', e.target.value)}
                placeholder="e.g. Dalkhola, West Bengal"
                className="depth-input w-full min-h-[46px] px-3.5 py-2.5 rounded-xl text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1 truncate">
                  GSTIN / UIN
                </label>
                <input
                  type="text"
                  value={data.buyer.gstinUin}
                  onChange={(e) => handleBuyerChange('gstinUin', e.target.value)}
                  placeholder="Unregistered"
                  className="depth-input w-full min-h-[46px] px-3 py-2.5 rounded-xl text-neutral-900 dark:text-neutral-100 text-xs placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1 truncate">
                  Account No (A/No)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={data.buyer.accountNo}
                  onChange={(e) => handleBuyerChange('accountNo', e.target.value)}
                  placeholder="998796956823"
                  className="depth-input w-full min-h-[46px] px-3 py-2.5 rounded-xl text-neutral-900 dark:text-neutral-100 text-xs font-mono tabular-nums placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                State &amp; State Code
              </label>
              <input
                type="text"
                value={data.buyer.stateAndCode}
                onChange={(e) => handleBuyerChange('stateAndCode', e.target.value)}
                placeholder="West Bengal (19)"
                className="depth-input w-full min-h-[46px] px-3.5 py-2.5 rounded-xl text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
              />
            </div>
          </div>
        )}
      </section>

      {/* 4. Invoice Metadata Card (Collapsible) */}
      <section className="depth-card rounded-2xl p-4 space-y-3">
        <button
          type="button"
          onClick={() => setMetaExpanded(prev => !prev)}
          className="w-full flex items-center justify-between text-left pb-1"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
            Invoice Details
          </span>
          <div className="flex items-center gap-1.5 text-neutral-400">
            <span className="text-[11px] font-mono text-neutral-600 dark:text-neutral-300">
              #{data.meta.invoiceNo || 'Draft'}
            </span>
            {metaExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {metaExpanded && (
          <div className="space-y-3 pt-1 border-t border-neutral-100 dark:border-neutral-800/80 animate-in fade-in duration-150">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Invoice No. <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={data.meta.invoiceNo}
                  onChange={(e) => handleMetaChange('invoiceNo', e.target.value)}
                  placeholder="e.g. 130/26-27"
                  className="depth-input w-full min-h-[46px] px-3 py-2.5 rounded-xl text-neutral-900 dark:text-neutral-100 text-xs font-mono font-medium placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Date
                </label>
                <DatePickerPopover
                  value={data.meta.dated}
                  onChange={(newDate) => handleMetaChange('dated', newDate)}
                  placeholder="28-Sep-2026"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Place of Supply
                </label>
                <input
                  type="text"
                  value={data.meta.placeOfSupply}
                  onChange={(e) => handleMetaChange('placeOfSupply', e.target.value)}
                  placeholder="West Bengal (19)"
                  className="depth-input w-full min-h-[46px] px-3 py-2.5 rounded-xl text-neutral-900 dark:text-neutral-100 text-xs placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Dispatch Mode
                </label>
                <input
                  type="text"
                  value={data.meta.dispatchMode}
                  onChange={(e) => handleMetaChange('dispatchMode', e.target.value)}
                  placeholder="Road Transport"
                  className="depth-input w-full min-h-[46px] px-3 py-2.5 rounded-xl text-neutral-900 dark:text-neutral-100 text-xs placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                Terms of Payment
              </label>
              <input
                type="text"
                value={data.meta.termsOfPayment}
                onChange={(e) => handleMetaChange('termsOfPayment', e.target.value)}
                placeholder="Immediate / Against Delivery"
                className="depth-input w-full min-h-[46px] px-3.5 py-2.5 rounded-xl text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
              />
            </div>
          </div>
        )}
      </section>

      {/* 5. Mobile Line Items Section */}
      <section className="depth-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
              Line Items
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-700">
              {data.items.length}
            </span>
          </div>

          <span className="text-xs font-mono tabular-nums text-neutral-500 dark:text-neutral-400">
            {calcs.totalQuantity} prs
          </span>
        </div>

        {/* Item Cards Stack */}
        <div className="space-y-3">
          {data.items.map((item, index) => {
            const itemTaxable = calcs.itemTaxableAmounts[index] || 0;
            return (
              <div
                key={item.id || index}
                className="depth-subcard p-3.5 rounded-xl space-y-3"
              >
                {/* Item Card Header Bar */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-200/60 dark:border-neutral-800">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span 
                      className="text-xs font-mono font-medium text-neutral-800 dark:text-neutral-200 truncate min-w-0"
                      title={`${item.quantity || 0} prs × ₹${item.unitPrice || 0} = ₹${formatCurrency(itemTaxable)}`}
                    >
                      {item.quantity || 0} prs &times; ₹{item.unitPrice || 0} = <strong className="text-neutral-900 dark:text-neutral-100">₹{formatCurrency(itemTaxable)}</strong>
                    </span>
                  </div>

                  {data.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(index)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-90 transition-all shrink-0"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Article Name / Title */}
                <div>
                  <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                    Article Title / Description <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="e.g. 22G-13388N-RESIL"
                    className="depth-input w-full min-h-[46px] px-3.5 py-2.5 rounded-xl text-neutral-900 dark:text-neutral-100 text-sm font-medium placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                  />
                </div>

                {/* Color/Spec & HSN */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1 truncate">
                      Color / Spec
                    </label>
                    <input
                      type="text"
                      value={item.colorSpec}
                      onChange={(e) => handleItemChange(index, 'colorSpec', e.target.value)}
                      placeholder="Glacier/D.Teal"
                      className="depth-input w-full min-h-[44px] px-3 py-2 rounded-xl text-neutral-900 dark:text-neutral-100 text-xs placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1 truncate">
                      HSN / SAC
                    </label>
                    <input
                      type="text"
                      value={item.hsnCode}
                      onChange={(e) => handleItemChange(index, 'hsnCode', e.target.value)}
                      placeholder="64041990"
                      className="depth-input w-full min-h-[44px] px-3 py-2 rounded-xl text-neutral-900 dark:text-neutral-100 text-xs font-mono tabular-nums placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                    />
                  </div>
                </div>

                {/* 2x2 Numeric Input Grid */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                      Pairs (Qty) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={item.quantity || ''}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="12"
                      className="depth-input w-full min-h-[46px] px-3.5 py-2.5 rounded-xl text-neutral-900 dark:text-neutral-100 text-base font-mono tabular-nums font-semibold placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                      Rate / Unit (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={item.unitPrice || ''}
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      placeholder="910.00"
                      className="depth-input w-full min-h-[46px] px-3.5 py-2.5 rounded-xl text-neutral-900 dark:text-neutral-100 text-base font-mono tabular-nums font-semibold placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                      MRP (₹)
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={item.mrp || ''}
                      onChange={(e) => handleItemChange(index, 'mrp', parseFloat(e.target.value) || 0)}
                      placeholder="1549.00"
                      className="depth-input w-full min-h-[44px] px-3.5 py-2 rounded-xl text-neutral-900 dark:text-neutral-100 text-xs font-mono tabular-nums placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                      Discount
                    </label>
                    <input
                      type="text"
                      value={item.discount}
                      onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                      placeholder="—"
                      className="depth-input w-full min-h-[44px] px-3.5 py-2 rounded-xl text-neutral-900 dark:text-neutral-100 text-xs font-mono tabular-nums placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Tactile + Add Line Item Button */}
          <button
            type="button"
            onClick={handleAddItem}
            className="depth-btn-dashed w-full py-3.5 rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <Plus className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
            <span>Add Line Item</span>
          </button>
        </div>
      </section>

      {/* 6. Mobile Extra Charges & Signatory */}
      <section className="depth-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-1.5 pb-2 border-b border-neutral-100 dark:border-neutral-800/80">
          <Package className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Charges &amp; Signatory
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
              Packing Charge (₹)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={data.charges.packingCharge}
              onChange={(e) =>
                onChange({
                  ...data,
                  charges: { packingCharge: parseFloat(e.target.value) || 0 },
                })
              }
              placeholder="0.00"
              className="depth-input w-full min-h-[46px] px-3.5 py-2.5 rounded-xl text-neutral-900 dark:text-neutral-100 text-sm font-mono tabular-nums placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
              Signatory Name
            </label>
            <input
              type="text"
              value={data.signatoryName || 'Ujjal Saha'}
              onChange={(e) => onChange({ ...data, signatoryName: e.target.value })}
              placeholder="Ujjal Saha"
              className="depth-input w-full min-h-[46px] px-3.5 py-2.5 rounded-xl text-neutral-900 dark:text-neutral-100 text-sm font-medium placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
            />
          </div>
        </div>

        {/* Amount in Words Recessed Callout */}
        <div className="depth-recessed text-neutral-700 dark:text-neutral-300 p-3 rounded-xl text-xs space-y-1">
          <span className="text-[10px] uppercase font-semibold text-neutral-400 dark:text-neutral-500 tracking-wider block">
            Amount Chargeable (in words)
          </span>
          <p className="font-medium text-neutral-800 dark:text-neutral-200 italic leading-relaxed text-xs">
            &ldquo;{calcs.amountInWords}&rdquo;
          </p>
        </div>
      </section>

      {/* 7. Mobile Settlement Breakdown Card */}
      <section className="depth-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-1.5 pb-2 border-b border-neutral-100 dark:border-neutral-800/80">
          <Receipt className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Financial Settlement
          </span>
        </div>

        <div className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400 pt-1">
          <div className="flex justify-between py-1 gap-2 items-baseline">
            <span className="shrink-0">Taxable Value:</span>
            <span className="font-mono tabular-nums font-medium text-neutral-900 dark:text-neutral-100 text-right break-all min-w-0">
              ₹{formatCurrency(calcs.totalTaxableValue)}
            </span>
          </div>

          <div className="flex justify-between py-1 gap-2 items-baseline">
            <span className="shrink-0">Packing Charge:</span>
            <span className="font-mono tabular-nums font-medium text-neutral-900 dark:text-neutral-100 text-right break-all min-w-0">
              ₹{formatCurrency(calcs.packingCharge)}
            </span>
          </div>

          <div className="flex justify-between py-1 gap-2 items-baseline">
            <span className="shrink-0">CGST @ 2.5%:</span>
            <span className="font-mono tabular-nums font-medium text-neutral-900 dark:text-neutral-100 text-right break-all min-w-0">
              ₹{formatCurrency(calcs.cgst)}
            </span>
          </div>

          <div className="flex justify-between py-1 gap-2 items-baseline">
            <span className="shrink-0">SGST @ 2.5%:</span>
            <span className="font-mono tabular-nums font-medium text-neutral-900 dark:text-neutral-100 text-right break-all min-w-0">
              ₹{formatCurrency(calcs.sgst)}
            </span>
          </div>

          <div className="flex justify-between py-1 gap-2 items-baseline text-neutral-400 dark:text-neutral-500">
            <span className="shrink-0">Round Off:</span>
            <span className="font-mono tabular-nums text-neutral-600 dark:text-neutral-400 text-right break-all min-w-0">
              {calcs.roundOff}
            </span>
          </div>

          <div className="border-t border-neutral-200 dark:border-neutral-800 my-2 pt-2.5 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 shrink-0">Grand Total:</span>
            <span 
              className={`font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono tabular-nums text-right break-all min-w-0 ${
                formatCurrency(calcs.grandTotal).length > 15
                  ? 'text-lg'
                  : formatCurrency(calcs.grandTotal).length > 11
                  ? 'text-xl'
                  : 'text-2xl'
              }`}
            >
              ₹{formatCurrency(calcs.grandTotal)}
            </span>
          </div>
        </div>

        {/* Quick in-page action buttons for mobile (Stacked primary button, 50/50 secondary grid) */}
        {onDownloadPdf && onPreview && (
          <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
            {onSaveToLedgerAndDownload && (
              <button
                type="button"
                onClick={onSaveToLedgerAndDownload}
                disabled={isGeneratingPdf}
                className="depth-btn-primary w-full h-11 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.99]"
                title="Log bill in accounts ledger and download PDF"
              >
                <BookmarkPlus className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">
                  {isGeneratingPdf
                    ? 'Generating PDF...'
                    : (editingLedgerId ? 'Update & Download PDF' : 'Save to Ledger & Download')}
                </span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onDownloadPdf}
                disabled={isGeneratingPdf}
                className="depth-btn-secondary h-10 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
                title="Download PDF immediately without saving to accounts"
              >
                <Download className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300 shrink-0" />
                <span className="truncate">Download PDF</span>
              </button>

              <button
                type="button"
                onClick={onPreview}
                className="depth-btn-secondary h-10 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300 shrink-0" />
                <span>Preview</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
