import React from 'react';
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
} from 'lucide-react';

interface InvoiceFormProps {
  data: InvoiceData;
  onChange: (newData: InvoiceData) => void;
  onResetSample: () => void;
  onClearAll: () => void;
  onDownloadPdf?: () => void;
  onPreview?: () => void;
  isGeneratingPdf?: boolean;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  data,
  onChange,
  onResetSample,
  onClearAll,
  onDownloadPdf,
  onPreview,
  isGeneratingPdf = false,
  theme = 'light',
  onToggleTheme,
}) => {
  const calcs = calculateInvoiceTotals(data);

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
    <div className="space-y-6">
      {/* 1. Minimalist Top Bar with Theme Toggle Button */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200/60 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              Jai Maa Kamakhya Traders
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium tracking-wide bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-700">
              B2B Billing
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Wholesale Footwear Sole &bull; Kolkata (WB-19)
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Theme Toggle Button */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="depth-btn-secondary h-9 px-2.5 sm:px-3 rounded-lg text-xs font-medium flex items-center gap-1.5"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-neutral-600" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onResetSample}
            className="depth-btn-secondary h-9 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5"
            title="Load sample wholesale footwear invoice"
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
            <span className="hidden min-[400px]:inline">Load Sample</span>
          </button>

          <button
            type="button"
            onClick={onClearAll}
            className="h-9 px-3 rounded-lg bg-transparent hover:bg-rose-50 dark:hover:bg-rose-950/30 text-neutral-500 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-medium transition-all flex items-center gap-1.5 active:scale-[0.98]"
            title="Clear all fields"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </header>

      {/* 2. Buyer & Invoice Information (2-Column Grid) */}
      <section className="depth-card rounded-xl p-5 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 divide-y lg:divide-y-0 lg:divide-x divide-neutral-100 dark:divide-neutral-800/80">
          {/* Buyer Details Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100 dark:border-neutral-800/80">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" /> Buyer Details
              </span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Buyer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={data.buyer.buyerName}
                  onChange={(e) => handleBuyerChange('buyerName', e.target.value)}
                  placeholder="e.g. Nuruddin Sultan"
                  className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
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
                  className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    GSTIN / UIN
                  </label>
                  <input
                    type="text"
                    value={data.buyer.gstinUin}
                    onChange={(e) => handleBuyerChange('gstinUin', e.target.value)}
                    placeholder="Unregistered"
                    className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Account No (A/No)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={data.buyer.accountNo}
                    onChange={(e) => handleBuyerChange('accountNo', e.target.value)}
                    placeholder="e.g. 998796956823"
                    className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm font-mono tabular-nums placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
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
                  className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                />
              </div>
            </div>
          </div>

          {/* Invoice Meta Column */}
          <div className="space-y-4 pt-6 lg:pt-0 lg:pl-8">
            <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100 dark:border-neutral-800/80">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" /> Invoice Metadata
              </span>
            </div>

            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Invoice No. <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={data.meta.invoiceNo}
                    onChange={(e) => handleMetaChange('invoiceNo', e.target.value)}
                    placeholder="e.g. 130/26-27"
                    className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm font-mono font-medium placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Invoice Date
                  </label>
                  <DatePickerPopover
                    value={data.meta.dated}
                    onChange={(newDate) => handleMetaChange('dated', newDate)}
                    placeholder="e.g. 28-Sep-2026"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Place of Supply
                  </label>
                  <input
                    type="text"
                    value={data.meta.placeOfSupply}
                    onChange={(e) => handleMetaChange('placeOfSupply', e.target.value)}
                    placeholder="West Bengal (19)"
                    className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
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
                    placeholder="Local Road Transport"
                    className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
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
                  className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Copy Badge Text
                </label>
                <input
                  type="text"
                  value={data.meta.copyType || 'ORIGINAL FOR RECIPIENT'}
                  onChange={(e) => handleMetaChange('copyType', e.target.value)}
                  placeholder="ORIGINAL FOR RECIPIENT"
                  className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Line Items Architecture (Ledger Style) */}
      <section className="depth-card rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
              Line Items
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-700">
              {data.items.length}
            </span>
          </div>
          <span className="text-xs font-mono tabular-nums text-neutral-500 dark:text-neutral-400">
            Total Pairs: <strong className="text-neutral-900 dark:text-neutral-100 font-semibold">{calcs.totalQuantity}</strong>
          </span>
        </div>

        <div className="space-y-3">
          {data.items.map((item, index) => {
            const itemTaxable = calcs.itemTaxableAmounts[index] || 0;
            return (
              <div
                key={item.id || index}
                className="depth-subcard p-4 rounded-lg"
              >
                {/* Item Card Header */}
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-neutral-200/60 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 font-mono">
                      #{index + 1}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 text-xs font-mono font-medium text-neutral-800 dark:text-neutral-200 shadow-xs">
                      {item.quantity || 0} prs &times; ₹{item.unitPrice || 0} = <strong className="text-neutral-900 dark:text-neutral-100 ml-1">₹{formatCurrency(itemTaxable)}</strong>
                    </span>
                  </div>

                  {data.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(index)}
                      className="p-1.5 rounded text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Grid Layout Row 1: Code & Spec & HSN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 mb-3">
                  <div className="sm:col-span-2 md:col-span-5">
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                      Article Description / Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="e.g. 22G-13388N-RESIL"
                      className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm font-medium placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                      Color / Spec
                    </label>
                    <input
                      type="text"
                      value={item.colorSpec}
                      onChange={(e) => handleItemChange(index, 'colorSpec', e.target.value)}
                      placeholder="e.g. Glacier/D.Teal"
                      className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                      HSN / SAC Code
                    </label>
                    <input
                      type="text"
                      value={item.hsnCode}
                      onChange={(e) => handleItemChange(index, 'hsnCode', e.target.value)}
                      placeholder="64041990"
                      className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm font-mono tabular-nums placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                    />
                  </div>
                </div>

                {/* Grid Layout Row 2: Qty, Unit Rate, MRP, and Discount */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                      Quantity (Pairs) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={item.quantity || ''}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="12"
                      className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm font-mono tabular-nums font-semibold placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
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
                      className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm font-mono tabular-nums font-semibold placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
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
                      className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm font-mono tabular-nums placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                      Discount (₹ or %)
                    </label>
                    <input
                      type="text"
                      value={item.discount}
                      onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                      placeholder="—"
                      className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm font-mono tabular-nums placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Minimalist Dashed Add Item Button */}
          <button
            type="button"
            onClick={handleAddItem}
            className="depth-btn-dashed w-full py-3 rounded-lg text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 text-sm font-medium flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            <span>Add Line Item</span>
          </button>
        </div>
      </section>

      {/* 4. Settlement & Executive Summary Card */}
      <section className="depth-card rounded-xl p-5 sm:p-6 space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800/80">
          <Receipt className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
            Settlement &amp; Summary
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Side: Extra Charges, Signatory & Words */}
          <div className="md:col-span-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm font-mono tabular-nums placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Authorized Signatory
                </label>
                <input
                  type="text"
                  value={data.signatoryName || 'Ujjal Saha'}
                  onChange={(e) => onChange({ ...data, signatoryName: e.target.value })}
                  placeholder="Ujjal Saha"
                  className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm font-medium placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                />
              </div>
            </div>

            {/* Amount in Words Callout */}
            <div className="depth-recessed text-neutral-700 dark:text-neutral-300 p-3.5 rounded-lg text-xs space-y-1">
              <span className="text-[10px] uppercase font-semibold text-neutral-400 dark:text-neutral-500 tracking-wider block">
                Amount Chargeable (in words)
              </span>
              <p className="font-medium text-neutral-800 dark:text-neutral-200 italic leading-relaxed">
                &ldquo;{calcs.amountInWords}&rdquo;
              </p>
            </div>
          </div>

          {/* Right Side: Financial Calculation Breakdown */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-4 pt-2 md:pt-0">
            <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
              <div className="flex justify-between py-1">
                <span>Taxable Value:</span>
                <span className="font-mono tabular-nums font-medium text-neutral-900 dark:text-neutral-100">
                  ₹{formatCurrency(calcs.totalTaxableValue)}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span>Packing Charge:</span>
                <span className="font-mono tabular-nums font-medium text-neutral-900 dark:text-neutral-100">
                  ₹{formatCurrency(calcs.packingCharge)}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span>CGST @ 2.5%:</span>
                <span className="font-mono tabular-nums font-medium text-neutral-900 dark:text-neutral-100">
                  ₹{formatCurrency(calcs.cgst)}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span>SGST @ 2.5%:</span>
                <span className="font-mono tabular-nums font-medium text-neutral-900 dark:text-neutral-100">
                  ₹{formatCurrency(calcs.sgst)}
                </span>
              </div>

              <div className="flex justify-between py-1 text-neutral-400 dark:text-neutral-500">
                <span>Round Off:</span>
                <span className="font-mono tabular-nums text-neutral-600 dark:text-neutral-400">
                  {calcs.roundOff}
                </span>
              </div>

              <div className="border-t border-neutral-200 dark:border-neutral-800 my-2 pt-2 flex justify-between items-baseline">
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Grand Total:</span>
                <span className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                  ₹{formatCurrency(calcs.grandTotal)}
                </span>
              </div>
            </div>

            {/* Desktop Action Buttons */}
            {onDownloadPdf && onPreview && (
              <div className="hidden md:flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onPreview}
                  className="depth-btn-secondary h-10 px-4 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  onClick={onDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="depth-btn-primary h-10 px-5 flex-1 rounded-lg text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
