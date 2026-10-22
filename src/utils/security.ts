/**
 * Security and Anti-DDoS Utilities for Jai Maa Kamakhya Traders
 * - Client-side sliding-window rate limiting to prevent request spam / DDoS
 * - Input sanitization & bounds clamping against injection / buffer bloat
 * - Error masking to hide backend vendor & internal schema details
 */

// Sliding-window timestamp store for rate limiting
const rateLimitTracker: Record<string, number[]> = {};

/**
 * Checks if an action is within rate limits.
 * @param action Unique identifier for the action (e.g. 'save_bill', 'fetch_ledger')
 * @param maxRequests Maximum allowable requests in the window
 * @param windowMs Time window in milliseconds (default 10,000ms = 10s)
 */
export function checkRateLimit(
  action: string,
  maxRequests: number = 4,
  windowMs: number = 10000
): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const history = rateLimitTracker[action] || [];

  // Filter out timestamps outside the active window
  const recent = history.filter(timestamp => now - timestamp < windowMs);

  if (recent.length >= maxRequests) {
    const oldest = recent[0];
    const waitSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    rateLimitTracker[action] = recent;
    return { allowed: false, waitSeconds };
  }

  recent.push(now);
  rateLimitTracker[action] = recent;
  return { allowed: true };
}

/**
 * Strips HTML tags, script constructs, and truncates string to maxLength.
 */
export function sanitizeString(val: unknown, maxLength: number = 255): string {
  if (typeof val !== 'string') {
    return '';
  }
  return val
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/javascript:/gi, '') // Strip inline JS protocols
    .replace(/[<>'"]/g, c => {
      // Basic character escaping
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case "'": return '&#39;';
        case '"': return '&quot;';
        default: return c;
      }
    })
    .trim()
    .slice(0, maxLength);
}

/**
 * Clamps numeric inputs to safe bounds and ensures finite numbers.
 */
export function sanitizeNumber(
  val: unknown,
  fallback: number = 0,
  min: number = 0,
  max: number = 99999999
): number {
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (isNaN(num) || !isFinite(num)) {
    return fallback;
  }
  return Math.min(Math.max(num, min), max);
}

/**
 * Sanitizes and validates the entire invoice payload before sending to database.
 * Prevents ReDoS, oversized payloads, script injection, and corrupted data.
 */
export function sanitizeInvoicePayload(raw: any) {
  const safeItems = Array.isArray(raw.items)
    ? raw.items.slice(0, 100).map((item: any, idx: number) => ({
        id: sanitizeString(item.id || String(idx + 1), 50),
        title: sanitizeString(item.title || item.description || '', 120),
        description: sanitizeString(item.description || item.title || '', 120),
        spec: sanitizeString(item.spec || item.colorSpec || '', 100),
        colorSpec: sanitizeString(item.colorSpec || item.spec || '', 100),
        hsn: sanitizeString(item.hsn || item.hsnCode || '64041990', 20),
        hsnCode: sanitizeString(item.hsnCode || item.hsn || '64041990', 20),
        quantity: sanitizeNumber(item.quantity ?? item.qty, 0, 0, 500000),
        qty: sanitizeNumber(item.qty ?? item.quantity, 0, 0, 500000),
        mrp: sanitizeNumber(item.mrp, 0, 0, 10000000),
        unitPrice: sanitizeNumber(item.unitPrice ?? item.rate, 0, 0, 10000000),
        rate: sanitizeNumber(item.rate ?? item.unitPrice, 0, 0, 10000000),
        discount: sanitizeString(item.discount || item.disc || '—', 20),
        disc: sanitizeString(item.disc || item.discount || '—', 20),
      }))
    : [];

  return {
    invoice_no: sanitizeString(raw.invoice_no, 60),
    invoice_date: sanitizeString(raw.invoice_date, 30),
    buyer_name: sanitizeString(raw.buyer_name, 120),
    buyer_address: sanitizeString(raw.buyer_address, 300),
    buyer_gstin: sanitizeString(raw.buyer_gstin, 25),
    account_no: sanitizeString(raw.account_no, 40),
    party_phone: sanitizeString(raw.party_phone, 30),
    place_of_supply: sanitizeString(raw.place_of_supply, 80),
    dispatch_mode: sanitizeString(raw.dispatch_mode, 80),
    terms: sanitizeString(raw.terms, 100),
    copy_badge: sanitizeString(raw.copy_badge, 60),
    items: safeItems,
    total_pairs: sanitizeNumber(raw.total_pairs, 0, 0, 10000000),
    taxable_value: sanitizeNumber(raw.taxable_value, 0, 0, 100000000),
    packing_charge: sanitizeNumber(raw.packing_charge, 0, 0, 10000000),
    cgst: sanitizeNumber(raw.cgst, 0, 0, 10000000),
    sgst: sanitizeNumber(raw.sgst, 0, 0, 10000000),
    round_off: String(sanitizeNumber(raw.round_off, 0, -100, 100).toFixed(2)),
    grand_total: sanitizeNumber(raw.grand_total, 0, 0, 100000000),
    amount_paid: sanitizeNumber(raw.amount_paid, 0, 0, 100000000),
    balance_due: sanitizeNumber(raw.balance_due, 0, 0, 100000000),
    payment_status: (raw.payment_status === 'paid' ? 'paid' : (raw.payment_status === 'partial' ? 'partial' : 'pending')) as 'pending' | 'partial' | 'paid',
    notes: sanitizeString(raw.notes, 500),
  };
}

/**
 * Mask internal database / vendor errors to prevent revealing backend infrastructure,
 * table schemas, or vendor-specific signatures to end-users or potential attackers.
 */
export function maskDatabaseError(err: unknown): string {
  if (!err) return 'Operation could not be completed. Please try again.';

  const str = String(err).toLowerCase();

  // Rate limiting / throttle error
  if (str.includes('rate') || str.includes('too many') || str.includes('429')) {
    return 'Too many requests. Please wait a moment before trying again.';
  }

  // Network / connection drop
  if (str.includes('network') || str.includes('failed to fetch') || str.includes('timeout')) {
    return 'Network connection issue. Please check your internet connection.';
  }

  // Authentication / permission
  if (str.includes('jwt') || str.includes('auth') || str.includes('apikey') || str.includes('unauthorized')) {
    return 'Database authorization issue. Please verify configuration keys.';
  }

  // Standard masked error for any SQL or backend internal error
  return 'Database operation failed. Please verify your connection and try again.';
}

/**
 * Validates invoice form data before generating PDF or saving to ledger.
 * Strictly disallows empty or invalid Buyer Name, Invoice No., and zero/empty line items.
 */
export function validateInvoiceData(data: {
  buyer?: { buyerName?: string };
  meta?: { invoiceNo?: string };
  items?: Array<{ description?: string; title?: string; quantity?: number; unitPrice?: number; mrp?: number }>;
  charges?: { packingCharge?: number };
}): { valid: boolean; error?: string } {
  const buyerName = data.buyer?.buyerName?.trim();
  if (!buyerName) {
    return { valid: false, error: 'Validation Error: Buyer Name is required to generate or save a bill.' };
  }

  const invoiceNo = data.meta?.invoiceNo?.trim();
  if (!invoiceNo) {
    return { valid: false, error: 'Validation Error: Invoice No. is required to generate or save a bill.' };
  }

  const items = data.items;
  if (!items || items.length === 0) {
    return { valid: false, error: 'Validation Error: At least one line item is required.' };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const desc = (item.description || item.title || '').trim();
    if (!desc) {
      return { valid: false, error: `Validation Error: Item #${i + 1} is missing an Article Title / Description.` };
    }

    const qty = Number(item.quantity);
    if (isNaN(qty) || qty <= 0) {
      return { valid: false, error: `Validation Error: Item #${i + 1} ("${desc}") must have Quantity greater than 0.` };
    }

    const rate = Number(item.unitPrice);
    if (isNaN(rate) || rate <= 0) {
      return { valid: false, error: `Validation Error: Item #${i + 1} ("${desc}") must have Rate / Unit greater than 0.` };
    }

    const mrp = Number(item.mrp || 0);
    if (mrp < 0) {
      return { valid: false, error: `Validation Error: Item #${i + 1} ("${desc}") MRP cannot be negative.` };
    }
  }

  if (Number(data.charges?.packingCharge || 0) < 0) {
    return { valid: false, error: 'Validation Error: Packing Charge cannot be negative.' };
  }

  return { valid: true };
}

