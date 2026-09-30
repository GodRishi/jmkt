import type { InvoiceData, InvoiceCalculations } from '../types/invoice';
import { numberToWordsINR } from './numberToWords';

export function calculateInvoiceTotals(data: InvoiceData): InvoiceCalculations {
  const itemTaxableAmounts = data.items.map(item => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const grossTotal = qty * price;

    const discountStr = (item.discount || '').trim();
    if (!discountStr || discountStr === '—' || discountStr === '-') {
      return grossTotal;
    }

    let discountDeduction = 0;
    if (discountStr.includes('%')) {
      const pct = parseFloat(discountStr.replace(/[^0-9.]/g, '')) || 0;
      discountDeduction = (grossTotal * pct) / 100;
    } else {
      const amt = parseFloat(discountStr.replace(/[^0-9.]/g, '')) || 0;
      discountDeduction = amt;
    }

    return Math.max(0, grossTotal - discountDeduction);
  });

  const totalQuantity = data.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalTaxableValue = itemTaxableAmounts.reduce((sum, amt) => sum + amt, 0);

  const packingCharge = Number(data.charges.packingCharge) || 0;

  // 2.5% CGST & SGST
  const cgst = totalTaxableValue * 0.025;
  const sgst = totalTaxableValue * 0.025;

  const subtotal = totalTaxableValue + packingCharge + cgst + sgst;
  const grandTotal = Math.round(subtotal);
  const roundOff = (grandTotal - subtotal).toFixed(2);

  const amountInWords = numberToWordsINR(grandTotal);

  return {
    itemTaxableAmounts,
    totalQuantity,
    totalTaxableValue,
    packingCharge,
    cgst,
    sgst,
    subtotal,
    grandTotal,
    roundOff,
    amountInWords,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
