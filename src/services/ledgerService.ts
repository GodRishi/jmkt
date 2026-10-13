import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { InvoiceData, InvoiceCalculations } from '../types/invoice';
import type { LedgerInvoice, LedgerStats } from '../types/ledger';

const LOCAL_STORAGE_LEDGER_KEY = 'jmkt_invoices_ledger_v1';

// Read optional Supabase configuration from environment variables
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('[Ledger Service] Failed to initialize Supabase client:', err);
  }
}

// Local storage helpers
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
    return !!supabase;
  },

  async getAllInvoices(): Promise<LedgerInvoice[]> {
    // If Supabase is available, try fetching from database first
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('invoices_ledger')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          // Sync with local cache for offline resiliency
          setLocalLedger(data as LedgerInvoice[]);
          return data as LedgerInvoice[];
        }
        if (error) {
          console.warn('[Ledger Service] Supabase fetch error, using local fallback:', error.message);
        }
      } catch (err) {
        console.warn('[Ledger Service] Supabase request failed, using local fallback:', err);
      }
    }

    // Default to local cache
    return getLocalLedger();
  },

  async saveInvoice(
    invoiceData: InvoiceData,
    calcs: InvoiceCalculations,
    existingId?: string,
    paymentStatus: 'pending' | 'paid' = 'pending',
    notes: string = ''
  ): Promise<LedgerInvoice> {
    const now = new Date().toISOString();
    const id = existingId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'inv_' + Date.now());

    const record: LedgerInvoice = {
      id,
      invoice_no: invoiceData.meta.invoiceNo || 'DRAFT-' + Date.now().toString().slice(-4),
      invoice_date: invoiceData.meta.dated || now.split('T')[0],
      buyer_name: invoiceData.buyer.buyerName || 'Unregistered Buyer',
      buyer_address: invoiceData.buyer.buyerAddress || '',
      buyer_gstin: invoiceData.buyer.gstinUin || 'Unregistered',
      account_no: invoiceData.buyer.accountNo || '',
      place_of_supply: invoiceData.meta.placeOfSupply || 'West Bengal (19)',
      dispatch_mode: invoiceData.meta.dispatchMode || 'Local Road Transport',
      terms: invoiceData.meta.termsOfPayment || 'Immediate / Against Delivery',
      copy_badge: invoiceData.meta.copyType || 'ORIGINAL FOR RECIPIENT',
      items: invoiceData.items,
      total_pairs: calcs.totalQuantity,
      taxable_value: calcs.totalTaxableValue,
      packing_charge: calcs.packingCharge,
      cgst: calcs.cgst,
      sgst: calcs.sgst,
      round_off: calcs.roundOff,
      grand_total: calcs.grandTotal,
      payment_status: paymentStatus,
      payment_date: paymentStatus === 'paid' ? now : null,
      notes,
      created_at: now,
      updated_at: now,
    };

    // If existing, preserve original created_at
    const localList = getLocalLedger();
    const existingIndex = localList.findIndex(item => item.id === id);
    if (existingIndex >= 0) {
      record.created_at = localList[existingIndex].created_at || now;
      localList[existingIndex] = record;
    } else {
      localList.unshift(record);
    }
    setLocalLedger(localList);

    // Sync to Supabase if connected
    if (supabase) {
      try {
        const { error } = await supabase
          .from('invoices_ledger')
          .upsert([record]);
        if (error) {
          console.warn('[Ledger Service] Supabase upsert error:', error.message);
        }
      } catch (err) {
        console.warn('[Ledger Service] Supabase upsert failed:', err);
      }
    }

    return record;
  },

  async togglePaymentStatus(id: string): Promise<LedgerInvoice | null> {
    const list = getLocalLedger();
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return null;

    const currentStatus = list[index].payment_status;
    const newStatus: 'pending' | 'paid' = currentStatus === 'paid' ? 'pending' : 'paid';
    const now = new Date().toISOString();

    list[index].payment_status = newStatus;
    list[index].payment_date = newStatus === 'paid' ? now : null;
    list[index].updated_at = now;

    setLocalLedger(list);

    if (supabase) {
      try {
        await supabase
          .from('invoices_ledger')
          .update({
            payment_status: newStatus,
            payment_date: list[index].payment_date,
            updated_at: now,
          })
          .eq('id', id);
      } catch (err) {
        console.warn('[Ledger Service] Supabase update status error:', err);
      }
    }

    return list[index];
  },

  async deleteInvoice(id: string): Promise<boolean> {
    const list = getLocalLedger();
    const filtered = list.filter(item => item.id !== id);
    setLocalLedger(filtered);

    if (supabase) {
      try {
        await supabase
          .from('invoices_ledger')
          .delete()
          .eq('id', id);
      } catch (err) {
        console.warn('[Ledger Service] Supabase delete error:', err);
      }
    }

    return true;
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
