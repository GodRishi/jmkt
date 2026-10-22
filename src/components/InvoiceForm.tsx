import React, { useMemo } from 'react';
import type { InvoiceData, LineItem } from '../types/invoice';
import type { SavedParty, SavedArticle } from '../types/ledger';
import { calculateInvoiceTotals, formatCurrency } from '../utils/calculator';
import { DatePickerPopover } from './DatePickerPopover';
import { PartyAutocomplete } from './PartyAutocomplete';
import { ArticleAutocomplete } from './ArticleAutocomplete';
import { SuggestiveInput } from './SuggestiveInput';
import { suggestionsService } from '../services/suggestionsService';
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
  BookmarkPlus,
  CheckCircle,
  Send,
  Phone,
} from 'lucide-react';

interface InvoiceFormProps {
  data: InvoiceData;
  onChange: (newData: InvoiceData) => void;
  onResetSample: () => void;
  onClearAll: () => void;
  onDownloadPdf?: () => void;
  onSaveToLedgerAndDownload?: () => void;
  onShareWhatsAppAndSave?: () => void;
  onShareWhatsAppOnly?: () => void;
  onShareWhatsApp?: () => void;
  onPreview?: () => void;
  isGeneratingPdf?: boolean;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  editingLedgerId?: string | null;
  onCancelEdit?: () => void;
  parties?: SavedParty[];
  articles?: SavedArticle[];
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  data,
  onChange,
  onResetSample,
  onClearAll,
  onDownloadPdf,
  onSaveToLedgerAndDownload,
  onShareWhatsAppAndSave,
  onShareWhatsAppOnly,
  onShareWhatsApp,
  onPreview,
  isGeneratingPdf = false,
  theme = 'light',
  onToggleTheme,
  editingLedgerId,
  onCancelEdit,
  parties = [],
  articles = [],
}) => {
  const calcs = calculateInvoiceTotals(data);

  // Dynamic suggestions for all repeating fields (with user-learned additions)
  const addressSuggestions = useMemo(() => suggestionsService.getAddressSuggestions(parties), [parties]);
  const specSuggestions = useMemo(() => suggestionsService.getSpecSuggestions(articles), [articles]);
  const placeSuggestions = useMemo(() => suggestionsService.getPlaceOfSupplySuggestions(), []);
  const dispatchSuggestions = useMemo(() => suggestionsService.getDispatchModeSuggestions(), []);
  const termsSuggestions = useMemo(() => suggestionsService.getPaymentTermsSuggestions(), []);
  const copyBadgeSuggestions = useMemo(() => suggestionsService.getCopyBadgeSuggestions(), []);

  const handleBuyerChange = (field: keyof InvoiceData['buyer'], value: string) => {
    onChange({ ...data, buyer: { ...data.buyer, [field]: value } });
  };

  const handleSelectParty = (party: SavedParty) => {
    onChange({
      ...data,
      buyer: {
        ...data.buyer,
        buyerName: party.name,
        phone: party.phone || data.buyer.phone || '',
        buyerAddress: party.address || data.buyer.buyerAddress,
        gstinUin: party.gstin || data.buyer.gstinUin,
        accountNo: party.account_no || data.buyer.accountNo,
      },
    });
  };

  const handleSelectArticle = (index: number, art: SavedArticle) => {
    const newItems = [...data.items];
    newItems[index] = {
      ...newItems[index],
      description: art.article_code,
      colorSpec: art.color_spec || newItems[index].colorSpec,
      hsnCode: art.hsn_code || newItems[index].hsnCode || '64041990',
      mrp: typeof art.default_mrp === 'number' && art.default_mrp > 0 ? art.default_mrp : newItems[index].mrp,
      unitPrice: typeof art.default_rate === 'number' && art.default_rate > 0 ? art.default_rate : newItems[index].unitPrice,
    };
    onChange({ ...data, items: newItems });
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

      {/* Edit Mode Alert Banner */}
      {editingLedgerId && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-medium animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Editing Ledger Entry #{data.meta.invoiceNo || 'INV'}. Saving will update the existing ledger record.</span>
          </div>
          {onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="text-amber-800 dark:text-amber-200 underline hover:opacity-75 ml-3 font-semibold shrink-0"
            >
              Cancel Edit
            </button>
          )}
        </div>
      )}

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
                <PartyAutocomplete
                  value={data.buyer.buyerName}
                  onChange={(val) => handleBuyerChange('buyerName', val)}
                  onSelectParty={handleSelectParty}
                  parties={parties}
                  placeholder="e.g. Nuruddin Sultan"
                  inputClassName="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={data.buyer.phone || ''}
                    onChange={(e) => handleBuyerChange('phone', e.target.value)}
                    placeholder="e.g. 9830123456"
                    className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm font-mono placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Address / Destination
                  </label>
                  <SuggestiveInput
                    value={data.buyer.buyerAddress}
                    onChange={(val) => handleBuyerChange('buyerAddress', val)}
                    onSaveOption={(val) => suggestionsService.saveCustomEntry('addresses', val)}
                    options={addressSuggestions}
                    placeholder="e.g. Dalkhola, West Bengal"
                    categoryLabel="Destination Hubs"
                    className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                  />
                </div>
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
                <SuggestiveInput
                  value={data.buyer.stateAndCode}
                  onChange={(val) => handleBuyerChange('stateAndCode', val)}
                  onSaveOption={(val) => suggestionsService.saveCustomEntry('placesOfSupply', val)}
                  options={placeSuggestions}
                  placeholder="West Bengal (19)"
                  categoryLabel="States &amp; Codes"
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
                  <SuggestiveInput
                    value={data.meta.placeOfSupply}
                    onChange={(val) => handleMetaChange('placeOfSupply', val)}
                    onSaveOption={(val) => suggestionsService.saveCustomEntry('placesOfSupply', val)}
                    options={placeSuggestions}
                    placeholder="West Bengal (19)"
                    categoryLabel="Places of Supply"
                    className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Dispatch Mode
                  </label>
                  <SuggestiveInput
                    value={data.meta.dispatchMode}
                    onChange={(val) => handleMetaChange('dispatchMode', val)}
                    onSaveOption={(val) => suggestionsService.saveCustomEntry('dispatchModes', val)}
                    options={dispatchSuggestions}
                    placeholder="Local Road Transport"
                    categoryLabel="Dispatch Modes"
                    className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Terms of Payment
                </label>
                <SuggestiveInput
                  value={data.meta.termsOfPayment}
                  onChange={(val) => handleMetaChange('termsOfPayment', val)}
                  onSaveOption={(val) => suggestionsService.saveCustomEntry('paymentTerms', val)}
                  options={termsSuggestions}
                  placeholder="Immediate / Against Delivery"
                  categoryLabel="Payment Terms"
                  className="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Copy Badge Text
                </label>
                <SuggestiveInput
                  value={data.meta.copyType || 'ORIGINAL FOR RECIPIENT'}
                  onChange={(val) => handleMetaChange('copyType', val)}
                  onSaveOption={(val) => suggestionsService.saveCustomEntry('copyBadges', val)}
                  options={copyBadgeSuggestions}
                  placeholder="ORIGINAL FOR RECIPIENT"
                  categoryLabel="Copy Badge Types"
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
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 font-mono shrink-0">
                      #{index + 1}
                    </span>
                    <span 
                      className="inline-flex items-center px-2.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 text-xs font-mono font-medium text-neutral-800 dark:text-neutral-200 shadow-xs max-w-full truncate"
                      title={`${item.quantity || 0} prs × ₹${item.unitPrice || 0} = ₹${formatCurrency(itemTaxable)}`}
                    >
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
                    <ArticleAutocomplete
                      value={item.description}
                      onChange={(val) => handleItemChange(index, 'description', val)}
                      onSelectArticle={(art) => handleSelectArticle(index, art)}
                      articles={articles}
                      placeholder="e.g. 22G-13388N-RESIL"
                      inputClassName="depth-input w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm font-medium placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                      required
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                      Color / Spec
                    </label>
                    <SuggestiveInput
                      value={item.colorSpec}
                      onChange={(val) => handleItemChange(index, 'colorSpec', val)}
                      onSaveOption={(val) => suggestionsService.saveCustomEntry('specs', val)}
                      options={specSuggestions}
                      placeholder="e.g. Glacier/D.Teal"
                      categoryLabel="Color Specs"
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
                      min={0}
                      value={item.quantity || ''}
                      onChange={(e) => handleItemChange(index, 'quantity', Math.max(0, parseFloat(e.target.value) || 0))}
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
                      min={0}
                      value={item.unitPrice || ''}
                      onChange={(e) => handleItemChange(index, 'unitPrice', Math.max(0, parseFloat(e.target.value) || 0))}
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
                      min={0}
                      value={item.mrp || ''}
                      onChange={(e) => handleItemChange(index, 'mrp', Math.max(0, parseFloat(e.target.value) || 0))}
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
                  min={0}
                  value={data.charges.packingCharge}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      charges: { packingCharge: Math.max(0, parseFloat(e.target.value) || 0) },
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
          <div className="md:col-span-6 flex flex-col justify-between space-y-4 pt-2 md:pt-0 min-w-0">
            <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
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

            {/* Desktop Action Buttons (Stacked & Grid for zero overflow) */}
            {onDownloadPdf && onPreview && (
              <div className="hidden md:flex flex-col gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
                {/* 1. Primary Save to Ledger & Download */}
                {onSaveToLedgerAndDownload && (
                  <button
                    type="button"
                    onClick={onSaveToLedgerAndDownload}
                    disabled={isGeneratingPdf}
                    className="depth-btn-primary h-11 w-full px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 transition-all active:scale-[0.99]"
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

                {/* 2. Share to WhatsApp & Save to Ledger */}
                {(onShareWhatsAppAndSave || onShareWhatsApp) && (
                  <button
                    type="button"
                    onClick={onShareWhatsAppAndSave || onShareWhatsApp}
                    disabled={isGeneratingPdf}
                    className="depth-btn-secondary h-11 w-full px-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition-all active:scale-[0.99] disabled:opacity-50"
                    title="Save bill in accounts ledger and share via WhatsApp"
                  >
                    <div className="flex items-center gap-1 shrink-0">
                      <Send className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <BookmarkPlus className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <span className="truncate">Share to WhatsApp &amp; Save to Ledger</span>
                  </button>
                )}

                {/* 3. Non-saving actions grid */}
                <div className="grid grid-cols-2 gap-2">
                  {(onShareWhatsAppOnly || onShareWhatsApp) && (
                    <button
                      type="button"
                      onClick={onShareWhatsAppOnly || onShareWhatsApp}
                      className="depth-btn-secondary h-10 px-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      title="Share bill via WhatsApp without saving to ledger"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">WhatsApp Only</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onDownloadPdf}
                    disabled={isGeneratingPdf}
                    className="depth-btn-secondary h-10 px-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
                    title="Generate and download PDF immediately without saving to accounts"
                  >
                    <Download className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400 shrink-0" />
                    <span className="truncate">Download PDF Only</span>
                  </button>
                </div>

                {/* 4. Full-width Preview */}
                <button
                  type="button"
                  onClick={onPreview}
                  className="depth-btn-secondary h-10 w-full px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  title="Preview exact A4 invoice"
                >
                  <Eye className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400 shrink-0" />
                  <span>Preview</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
