import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { InvoiceData } from '../types/invoice';
import type { LedgerInvoice, LedgerStats } from '../types/ledger';

const LOCAL_STORAGE_LEDGER_KEY = 'jmkt_invoices_ledger_v1';

// Local storage helpers for emergency offline fallback
function getLocalLedger(): LedgerInvoice[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_LEDGER_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('[Ledger Service] Error parsing local ledger:', err);
    return [];
  }
}

function setLocalLedger(invoices: LedgerInvoice[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_LEDGER_KEY, JSON.stringify(invoices));
  } catch (err) {
    console.error('[Ledger Service] Error saving local ledger:', err);
  }
}

export const ledgerService = {
  isSupabaseConnected(): boolean {
    return isSupabaseConfigured;
  },

  async getAllInvoices(): Promise<LedgerInvoice[]> {
    if (!isSupabaseConfigured) {
      console.warn('[Ledger Service] Supabase credentials not detected, falling back to local cache.');
      return getLocalLedger();
    }

    console.log('[Ledger Service] Fetching live records from Supabase...');
    const { data, error } = await supabase
      .from('invoices_ledger')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Ledger Service] Supabase fetch error:', error);
      throw error;
    }

    if (data) {
      // Sync local cache
      setLocalLedger(data as LedgerInvoice[]);
      return data as LedgerInvoice[];
    }

    return [];
  },

  calculateStats(invoices: LedgerInvoice[]): LedgerStats {
    let totalPending = 0;
    let totalCollected = 0;
    let pendingCount = 0;
    let paidCount = 0;

    for (const inv of invoices) {
      const amt = Number(inv.grand_total) || 0;
      if (inv.payment_status === 'paid') {
        totalCollected += amt;
        paidCount++;
      } else {
        totalPending += amt;
        pendingCount++;
      }
    }

    return {
      totalPending,
      totalCollected,
      totalBills: invoices.length,
      pendingCount,
      paidCount,
    };
  },

  // Converts a LedgerInvoice back into the exact InvoiceData shape for the generator
  toInvoiceData(record: LedgerInvoice): InvoiceData {
    return {
      buyer: {
        buyerName: record.buyer_name,
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
