import { supabase, isDatabaseConfigured } from '../lib/supabase';
import type { InvoiceData } from '../types/invoice';
import type { LedgerInvoice, LedgerStats, PartySummary } from '../types/ledger';

const LOCAL_STORAGE_LEDGER_KEY = 'jmkt_invoices_ledger_v1';

// Local storage helpers for emergency offline fallback
function getLocalLedger(): LedgerInvoice[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_LEDGER_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function setLocalLedger(invoices: LedgerInvoice[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_LEDGER_KEY, JSON.stringify(invoices));
  } catch {
    // Ignore storage write issues
  }
}

export const ledgerService = {
  isDatabaseConnected(): boolean {
    return isDatabaseConfigured;
  },

  isSupabaseConnected(): boolean {
    return isDatabaseConfigured;
  },

  getLocalLedger(): LedgerInvoice[] {
    return getLocalLedger();
  },

  setLocalLedger(invoices: LedgerInvoice[]): void {
    setLocalLedger(invoices);
  },

  async getAllInvoices(): Promise<LedgerInvoice[]> {
    if (!isDatabaseConfigured) {
      return getLocalLedger();
    }

    try {
      const { data, error } = await supabase
        .from('invoices_ledger')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        // Normalize any missing amount_paid or balance_due fields
        const normalized = (data as any[]).map((inv): LedgerInvoice => {
          const grandTotal = Number(inv.grand_total) || 0;
          let amountPaid = Number(inv.amount_paid);
          if (isNaN(amountPaid)) {
            amountPaid = inv.payment_status === 'paid' ? grandTotal : 0;
          }
          let balanceDue = Number(inv.balance_due);
          if (isNaN(balanceDue)) {
            balanceDue = Math.max(0, grandTotal - amountPaid);
          }
          return {
            ...inv,
            amount_paid: amountPaid,
            balance_due: balanceDue,
          };
        });

        // Sync local cache
        setLocalLedger(normalized);
        return normalized;
      }
    } catch {
      // Return cached entries if query encounters an issue
      return getLocalLedger();
    }

    return [];
  },

  calculateStats(invoices: LedgerInvoice[]): LedgerStats {
    let totalPending = 0;
    let totalCollected = 0;
    let pendingCount = 0;
    let partialCount = 0;
    let paidCount = 0;

    for (const inv of invoices) {
      const grandTotal = Number(inv.grand_total) || 0;
      const paid = typeof inv.amount_paid === 'number' 
        ? inv.amount_paid 
        : (inv.payment_status === 'paid' ? grandTotal : 0);
      const due = typeof inv.balance_due === 'number'
        ? inv.balance_due
        : Math.max(0, grandTotal - paid);

      totalCollected += paid;
      totalPending += due;

      if (inv.payment_status === 'paid' || due <= 0) {
        paidCount++;
      } else if (inv.payment_status === 'partial' || (paid > 0 && due > 0)) {
        partialCount++;
      } else {
        pendingCount++;
      }
    }

    return {
      totalPending,
      totalCollected,
      totalBills: invoices.length,
      pendingCount,
      partialCount,
      paidCount,
    };
  },

  calculatePartySummaries(invoices: LedgerInvoice[]): PartySummary[] {
    const map = new Map<string, PartySummary>();

    for (const inv of invoices) {
      const rawName = (inv.buyer_name || '').trim();
      if (!rawName) continue;
      const key = rawName.toLowerCase();

      const grandTotal = Number(inv.grand_total) || 0;
      const paid = typeof inv.amount_paid === 'number'
        ? inv.amount_paid
        : (inv.payment_status === 'paid' ? grandTotal : 0);
      const due = typeof inv.balance_due === 'number'
        ? inv.balance_due
        : Math.max(0, grandTotal - paid);

      if (!map.has(key)) {
        map.set(key, {
          partyName: rawName,
          phone: inv.party_phone || null,
          address: inv.buyer_address || null,
          gstin: inv.buyer_gstin || null,
          accountNo: inv.account_no || null,
          totalBilled: 0,
          totalPaid: 0,
          balanceDue: 0,
          invoiceCount: 0,
          invoices: [],
        });
      }

      const summary = map.get(key)!;
      summary.totalBilled += grandTotal;
      summary.totalPaid += paid;
      summary.balanceDue += due;
      summary.invoiceCount += 1;
      summary.invoices.push(inv);

      // Keep latest non-empty phone/address/gstin
      if (!summary.phone && inv.party_phone) summary.phone = inv.party_phone;
      if (!summary.address && inv.buyer_address) summary.address = inv.buyer_address;
      if ((!summary.gstin || summary.gstin === 'Unregistered') && inv.buyer_gstin && inv.buyer_gstin !== 'Unregistered') {
        summary.gstin = inv.buyer_gstin;
      }
      if (!summary.accountNo && inv.account_no) summary.accountNo = inv.account_no;
    }

    // Sort parties by highest balance due first, then highest billed
    return Array.from(map.values()).sort((a, b) => {
      if (b.balanceDue !== a.balanceDue) return b.balanceDue - a.balanceDue;
      return b.totalBilled - a.totalBilled;
    });
  },

  // Converts a LedgerInvoice back into the exact InvoiceData shape for the generator
  toInvoiceData(record: LedgerInvoice): InvoiceData {
    return {
      buyer: {
        buyerName: record.buyer_name,
        phone: record.party_phone || '',
        buyerAddress: record.buyer_address,
        gstinUin: record.buyer_gstin,
        accountNo: record.account_no,
        stateAndCode: record.place_of_supply,
      },
      meta: {
        invoiceNo: record.invoice_no,
        dated: record.invoice_date,
        placeOfSupply: record.place_of_supply,
        termsOfPayment: record.terms,
        dispatchMode: record.dispatch_mode,
        copyType: record.copy_badge,
      },
      items: record.items || [],
      charges: {
        packingCharge: Number(record.packing_charge) || 0,
      },
      signatoryName: 'Ujjal Saha',
    };
  },
};
