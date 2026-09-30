import type { InvoiceData, InvoiceCalculations } from '../types/invoice';
import { numberToWordsINR } from './numberToWords';

export function calculateInvoiceTotals(data: InvoiceData): InvoiceCalculations {
  const itemTaxableAmounts = data.items.map(item => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return qty * price;
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
