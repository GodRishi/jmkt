import { supabase, isDatabaseConfigured } from '../lib/supabase';
import type { PaymentTransaction, LedgerInvoice, PaymentMode, PaymentStatus } from '../types/ledger';
import { ledgerService } from './ledgerService';

const LOCAL_STORAGE_PAYMENTS_KEY = 'jmkt_payment_transactions_v1';

function getStoredPayments(): PaymentTransaction[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PAYMENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return [];
}

function saveStoredPayments(payments: PaymentTransaction[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(payments));
  } catch {
    // Ignore
  }
}

export const paymentService = {
  async getPaymentsByInvoiceId(invoiceId: string): Promise<PaymentTransaction[]> {
    const allLocal = getStoredPayments();
    const localMatches = allLocal.filter((p) => p.invoice_id === invoiceId);

    if (!isDatabaseConfigured) {
      return localMatches;
    }

    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('payment_date', { ascending: false });

      if (error) {
        return localMatches;
      }

      if (data) {
        // Merge and cache
        const otherPayments = allLocal.filter((p) => p.invoice_id !== invoiceId);
        saveStoredPayments([...otherPayments, ...(data as PaymentTransaction[])]);
        return data as PaymentTransaction[];
      }
    } catch {
      return localMatches;
    }

    return localMatches;
  },

  async recordPayment(
    invoice: LedgerInvoice,
    params: {
      amount: number;
      paymentDate: string;
      paymentMode: PaymentMode;
      notes?: string;
    }
  ): Promise<{ updatedInvoice: LedgerInvoice; newTransaction: PaymentTransaction }> {
    const amount = Number(params.amount) || 0;
    if (amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    const currentPaid = Number(invoice.amount_paid) || 0;
    const grandTotal = Number(invoice.grand_total) || 0;
    const newAmountPaid = currentPaid + amount;
    const newBalanceDue = Math.max(0, grandTotal - newAmountPaid);

    let newStatus: PaymentStatus = 'pending';
    if (newBalanceDue <= 0 || newAmountPaid >= grandTotal) {
      newStatus = 'paid';
    } else if (newAmountPaid > 0) {
      newStatus = 'partial';
    }

    const newTx: PaymentTransaction = {
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      invoice_id: invoice.id,
      payment_date: params.paymentDate || new Date().toISOString().split('T')[0],
      amount,
      payment_mode: params.paymentMode,
      notes: params.notes?.trim() || null,
      created_at: new Date().toISOString(),
    };

    // Update local storage for transactions
    const existing = getStoredPayments();
    saveStoredPayments([newTx, ...existing]);

    // Prepare updated invoice object
    const updatedInvoice: LedgerInvoice = {
      ...invoice,
      amount_paid: newAmountPaid,
      balance_due: newBalanceDue,
      payment_status: newStatus,
      payment_date: newStatus === 'paid' ? newTx.payment_date : invoice.payment_date,
      updated_at: new Date().toISOString(),
    };

    // Update local ledger cache
    const localLedger = ledgerService.getLocalLedger();
    const invIndex = localLedger.findIndex((i) => i.id === invoice.id);
    if (invIndex >= 0) {
      localLedger[invIndex] = updatedInvoice;
      ledgerService.setLocalLedger(localLedger);
    }

    // Push to Supabase if available
    if (isDatabaseConfigured) {
      try {
        // 1. Insert transaction
        await supabase.from('payment_transactions').insert({
          invoice_id: invoice.id,
          payment_date: newTx.payment_date,
          amount: newTx.amount,
          payment_mode: newTx.payment_mode,
          notes: newTx.notes,
        });

        // 2. Update invoices_ledger row
        await supabase
          .from('invoices_ledger')
          .update({
            amount_paid: newAmountPaid,
            balance_due: newBalanceDue,
            payment_status: newStatus,
            payment_date: updatedInvoice.payment_date,
            updated_at: updatedInvoice.updated_at,
          })
          .eq('id', invoice.id);
      } catch (err) {
        console.warn('Error syncing payment to cloud database, cached locally:', err);
      }
    }

    return { updatedInvoice, newTransaction: newTx };
  },
};
