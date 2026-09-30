import React from 'react';
import type { InvoiceData, LineItem } from '../types/invoice';
import { calculateInvoiceTotals, formatCurrency } from '../utils/calculator';
import { 
  User, 
  FileText, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Truck, 
  RotateCcw, 
  Sparkles,
  Calculator,
} from 'lucide-react';

interface InvoiceFormProps {
  data: InvoiceData;
  onChange: (newData: InvoiceData) => void;
  onResetSample: () => void;
  onClearAll: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  data,
  onChange,
  onResetSample,
  onClearAll,
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
    <div className="space-y-6 pb-28">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/20 rounded-3xl p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Mobile Billing Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Jai Maa Kamakhya Traders
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Wholesaler of Air Mix, PVC, PU &amp; TPR Footwear Sole &bull; Fast Invoice Entry
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onResetSample}
              className="min-h-[48px] px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/80 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              <span>Load Sample</span>
            </button>
            <button
              type="button"
              onClick={onClearAll}
              className="min-h-[48px] px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-medium border border-red-500/20 transition-all flex items-center gap-1 active:scale-95"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Financial Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Total Pairs</span>
          <span className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1 block" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {calcs.totalQuantity} <span className="text-xs text-slate-500 font-normal" style={{ fontFamily: "'Inter', sans-serif" }}>prs</span>
          </span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Taxable Val</span>
          <span className="text-xl sm:text-2xl font-bold text-slate-100 mt-1 block" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            ₹{formatCurrency(calcs.totalTaxableValue)}
          </span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Total GST (5%)</span>
          <span className="text-xl sm:text-2xl font-bold text-indigo-400 mt-1 block" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            ₹{formatCurrency(calcs.cgst + calcs.sgst)}
          </span>
        </div>
        <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block relative z-10">Grand Total</span>
          <span className="text-xl sm:text-2xl font-extrabold text-emerald-300 mt-1 block relative z-10" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            ₹{formatCurrency(calcs.grandTotal)}
          </span>
        </div>
      </div>

      {/* SECTION A: Buyer Details */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400"><User className="w-5 h-5" /></div>
          <div>
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Buyer Details</h2>
            <p className="text-xs text-slate-400">Purchaser name, address &amp; tax info</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-300">Buyer Name *</label>
            <input type="text" value={data.buyer.buyerName} onChange={(e) => handleBuyerChange('buyerName', e.target.value)} placeholder="e.g. Nuruddin Sultan" className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all outline-none" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-300">Buyer Address</label>
            <input type="text" value={data.buyer.buyerAddress} onChange={(e) => handleBuyerChange('buyerAddress', e.target.value)} placeholder="e.g. Dalkhola, West Bengal" className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">GSTIN / UIN</label>
            <input type="text" value={data.buyer.gstinUin} onChange={(e) => handleBuyerChange('gstinUin', e.target.value)} placeholder="Unregistered" className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Account No (A/No)</label>
            <input type="text" inputMode="numeric" value={data.buyer.accountNo} onChange={(e) => handleBuyerChange('accountNo', e.target.value)} placeholder="e.g. 998796956823" className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all outline-none" style={{ fontFamily: "'JetBrains Mono', monospace" }} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-300">State &amp; Code</label>
            <input type="text" value={data.buyer.stateAndCode} onChange={(e) => handleBuyerChange('stateAndCode', e.target.value)} placeholder="West Bengal (19)" className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all outline-none" />
          </div>
        </div>
      </div>

      {/* SECTION B: Invoice Meta */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400"><FileText className="w-5 h-5" /></div>
          <div>
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Invoice Metadata</h2>
            <p className="text-xs text-slate-400">Invoice number, date &amp; delivery terms</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Invoice No. *</label>
            <input type="text" value={data.meta.invoiceNo} onChange={(e) => handleMetaChange('invoiceNo', e.target.value)} placeholder="e.g. 130/26-27" className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all outline-none" style={{ fontFamily: "'JetBrains Mono', monospace" }} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Date (DD-MMM-YYYY)</label>
            <input type="text" value={data.meta.dated} onChange={(e) => handleMetaChange('dated', e.target.value)} placeholder="e.g. 28-Sep-2026" className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Place of Supply</label>
            <input type="text" value={data.meta.placeOfSupply} onChange={(e) => handleMetaChange('placeOfSupply', e.target.value)} placeholder="West Bengal (19)" className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Terms of Payment</label>
            <input type="text" value={data.meta.termsOfPayment} onChange={(e) => handleMetaChange('termsOfPayment', e.target.value)} placeholder="Immediate / Against Delivery" className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Dispatch Mode</label>
            <input type="text" value={data.meta.dispatchMode} onChange={(e) => handleMetaChange('dispatchMode', e.target.value)} placeholder="Local Road Transport" className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Copy Badge Text</label>
            <input type="text" value={data.meta.copyType || 'ORIGINAL FOR RECIPIENT'} onChange={(e) => handleMetaChange('copyType', e.target.value)} placeholder="ORIGINAL FOR RECIPIENT" className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all outline-none" />
          </div>
        </div>
      </div>

      {/* SECTION C: Line Items */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400"><ShoppingBag className="w-5 h-5" /></div>
            <div>
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Line Items</h2>
              <p className="text-xs text-slate-400">Article codes, quantities &amp; pricing</p>
            </div>
          </div>
          <button type="button" onClick={handleAddItem} className="min-h-[48px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all active:scale-95">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>

        <div className="space-y-4">
          {data.items.map((item, index) => {
            const itemTaxable = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
            return (
              <div key={item.id || index} className="bg-slate-950 border border-slate-800/90 rounded-2xl p-4 space-y-3 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-emerald-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    # Item {index + 1} &bull; Taxable: ₹{formatCurrency(itemTaxable)}
                  </span>
                  {data.items.length > 1 && (
                    <button type="button" onClick={() => handleDeleteItem(index)} className="min-h-[40px] px-2.5 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg text-xs font-medium transition-colors flex items-center gap-1">
                      <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Delete</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-medium text-slate-400">Article Title / Description *</label>
                    <input type="text" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} placeholder="e.g. 22G-13388N-RESIL" className="w-full min-h-[48px] px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 text-sm font-semibold tracking-wide outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-400">Color / Spec</label>
                    <input type="text" value={item.colorSpec} onChange={(e) => handleItemChange(index, 'colorSpec', e.target.value)} placeholder="e.g. Glacier/D.Teal" className="w-full min-h-[48px] px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 text-sm outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-400">HSN/SAC Code</label>
                    <input type="text" value={item.hsnCode} onChange={(e) => handleItemChange(index, 'hsnCode', e.target.value)} placeholder="64041990" className="w-full min-h-[48px] px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 text-sm outline-none" style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-emerald-400">Quantity (Pairs) *</label>
                    <input type="number" inputMode="numeric" value={item.quantity || ''} onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)} placeholder="12" className="w-full min-h-[48px] px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 text-sm font-bold outline-none" style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-emerald-400">Unit Price / Rate (₹) *</label>
                    <input type="number" inputMode="decimal" step="0.01" value={item.unitPrice || ''} onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)} placeholder="910" className="w-full min-h-[48px] px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 text-sm font-bold outline-none" style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-400">MRP (₹)</label>
                    <input type="number" inputMode="decimal" step="0.01" value={item.mrp || ''} onChange={(e) => handleItemChange(index, 'mrp', parseFloat(e.target.value) || 0)} placeholder="1549" className="w-full min-h-[48px] px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 text-sm outline-none" style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-400">Discount (%)</label>
                    <input type="text" value={item.discount} onChange={(e) => handleItemChange(index, 'discount', e.target.value)} placeholder="—" className="w-full min-h-[48px] px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 text-sm outline-none" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION D: Additional Charges & Signatory */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400"><Truck className="w-5 h-5" /></div>
          <div>
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Extra Charges &amp; Signatory</h2>
            <p className="text-xs text-slate-400">Packing costs &amp; authorized signature name</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Packing Charge (₹)</label>
            <input type="number" inputMode="decimal" step="0.01" value={data.charges.packingCharge} onChange={(e) => onChange({ ...data, charges: { packingCharge: parseFloat(e.target.value) || 0 } })} placeholder="103" className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 text-sm transition-all outline-none" style={{ fontFamily: "'JetBrains Mono', monospace" }} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Authorized Signatory Name</label>
            <input type="text" value={data.signatoryName || 'Rishi Saha'} onChange={(e) => onChange({ ...data, signatoryName: e.target.value })} placeholder="Rishi Saha" className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 text-sm transition-all outline-none" />
          </div>
        </div>
      </div>

      {/* Automated Calculation Summary Box */}
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-2xl space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
          <Calculator className="w-4 h-4" />
          <span>Real-Time Tax Breakdown</span>
        </div>
        <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <div className="flex justify-between"><span>Taxable Value:</span><span className="text-white">₹{formatCurrency(calcs.totalTaxableValue)}</span></div>
          <div className="flex justify-between"><span>Packing Charge:</span><span className="text-white">₹{formatCurrency(calcs.packingCharge)}</span></div>
          <div className="flex justify-between"><span>CGST @ 2.5%:</span><span className="text-indigo-300">₹{formatCurrency(calcs.cgst)}</span></div>
          <div className="flex justify-between"><span>SGST @ 2.5%:</span><span className="text-indigo-300">₹{formatCurrency(calcs.sgst)}</span></div>
          <div className="flex justify-between text-slate-400"><span>Round Off:</span><span>{calcs.roundOff}</span></div>
          <div className="flex justify-between text-base font-bold text-emerald-400 pt-2 border-t border-slate-800">
            <span>Grand Total:</span>
            <span className="text-lg">₹{formatCurrency(calcs.grandTotal)}</span>
          </div>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 mt-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">Amount Chargeable (in words)</span>
          <p className="text-xs font-medium text-emerald-300 italic">"{calcs.amountInWords}"</p>
        </div>
      </div>
    </div>
  );
};
