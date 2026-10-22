import type { LedgerInvoice } from '../types/ledger';

/**
 * Extracts numeric sequence and increments it for the next invoice.
 * Examples:
 * - "130/26-27" -> "131/26-27"
 * - "JMKT/130/26-27" -> "JMKT/131/26-27"
 * - "INV-109" -> "INV-110"
 * - "142" -> "143"
 */
export function incrementInvoiceNumber(invNo: string): string {
  const trimmed = invNo.trim();
  if (!trimmed) {
    return '101/26-27';
  }

  // Case 1: Prefix + Number + Suffix e.g. "JMKT/130/26-27" or "130/26-27"
  const prefixNumberSuffixMatch = trimmed.match(/^(.*?)(\d+)(\/[^\d]*\d+[^\d]*|\/.*)$/);
  if (prefixNumberSuffixMatch) {
    const prefix = prefixNumberSuffixMatch[1];
    const numStr = prefixNumberSuffixMatch[2];
    const suffix = prefixNumberSuffixMatch[3];
    const nextNum = (parseInt(numStr, 10) + 1).toString().padStart(numStr.length, '0');
    return `${prefix}${nextNum}${suffix}`;
  }

  // Case 2: Ends with number e.g. "INV-101" or "130"
  const endsWithNumMatch = trimmed.match(/^(.*?)(\d+)$/);
  if (endsWithNumMatch) {
    const prefix = endsWithNumMatch[1];
    const numStr = endsWithNumMatch[2];
    const nextNum = (parseInt(numStr, 10) + 1).toString().padStart(numStr.length, '0');
    return `${prefix}${nextNum}`;
  }

  // Default fallback
  return `${trimmed}-1`;
}

/**
 * Finds the latest sequential invoice number from existing ledger invoices
 * and suggests the next one.
 */
export function getNextSuggestedInvoiceNo(invoices: LedgerInvoice[]): string {
  if (!invoices || invoices.length === 0) {
    return '131/26-27';
  }

  // Look for invoices matching the pattern (e.g. "130/26-27")
  let maxFoundNum = 0;
  let sampleTemplate = '130/26-27';

  for (const inv of invoices) {
    const no = (inv.invoice_no || '').trim();
    if (!no) continue;

    // Try to extract the primary sequence number
    const match = no.match(/(?:^|[^\d])(\d{1,6})(?:\/|$)/);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (parsed > maxFoundNum) {
        maxFoundNum = parsed;
        sampleTemplate = no;
      }
    }
  }

  if (maxFoundNum > 0) {
    return incrementInvoiceNumber(sampleTemplate);
  }

  // Fallback to latest invoice in ledger
  return incrementInvoiceNumber(invoices[0].invoice_no || '130/26-27');
}
