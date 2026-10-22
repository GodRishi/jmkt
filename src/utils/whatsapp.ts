import { formatCurrency } from './calculator';

export interface WhatsAppBillDetails {
  invoiceNo: string;
  invoiceDate: string;
  buyerName: string;
  phone?: string | null;
  totalPairs: number;
  grandTotal: number;
  amountPaid?: number;
  balanceDue?: number;
  paymentStatus?: string;
}

/**
 * Normalizes Indian mobile number to international format without + or spaces
 * (e.g. "9830123456" -> "919830123456")
 */
export function normalizeIndianPhone(rawPhone?: string | null): string {
  if (!rawPhone) return '';
  const cleaned = rawPhone.replace(/[^\d]/g, '');
  if (!cleaned) return '';

  // 10-digit Indian mobile number
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  // 11-digit starting with 0
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `91${cleaned.slice(1)}`;
  }
  // Already has 91 prefix
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned;
  }

  return cleaned;
}

/**
 * Builds standard WhatsApp bill summary text for Jai Maa Kamakhya Traders
 */
export function formatWhatsAppBillSummary(details: WhatsAppBillDetails): string {
  const invNo = details.invoiceNo.startsWith('JMKT/') 
    ? details.invoiceNo 
    : `JMKT/${details.invoiceNo || 'INV'}`;
  
  const statusLabel = (details.paymentStatus || 'pending').toUpperCase();
  const grandTotalStr = formatCurrency(details.grandTotal);

  let message = 
    `*JAI MAA KAMAKHYA TRADERS*\n` +
    `Tax Invoice: ${invNo}\n` +
    `Date: ${details.invoiceDate || new Date().toISOString().split('T')[0]}\n` +
    `Buyer: ${details.buyerName || 'Valued Customer'}\n` +
    `Total Pairs: ${details.totalPairs} prs\n` +
    `Grand Total: ₹${grandTotalStr}\n` +
    `Status: ${statusLabel}`;

  if (typeof details.amountPaid === 'number' && details.amountPaid > 0) {
    message += `\nAmount Paid: ₹${formatCurrency(details.amountPaid)}`;
  }
  if (typeof details.balanceDue === 'number' && details.balanceDue > 0) {
    message += `\nBalance Due (Baki): ₹${formatCurrency(details.balanceDue)}`;
  }

  message += `\n\n_Thank you for your business!_`;

  return message;
}

/**
 * Direct WhatsApp sharing with Web Share API fallback
 */
export async function shareBillViaWhatsApp(
  details: WhatsAppBillDetails,
  pdfFile?: File | null
): Promise<boolean> {
  const message = formatWhatsAppBillSummary(details);
  const normalizedPhone = normalizeIndianPhone(details.phone);

  // Try Web Share API with attached PDF file if supported on device
  if (pdfFile && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        title: `JMKT Invoice #${details.invoiceNo}`,
        text: message,
        files: [pdfFile],
      });
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') return false;
      // If native sharing fails or is cancelled, fall through to wa.me link
    }
  }

  // Fallback to direct WhatsApp link
  const encodedText = encodeURIComponent(message);
  let url = '';
  if (normalizedPhone) {
    url = `https://wa.me/${normalizedPhone}?text=${encodedText}`;
  } else {
    url = `https://api.whatsapp.com/send?text=${encodedText}`;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}
