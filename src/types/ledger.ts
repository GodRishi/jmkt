import type { LineItem } from './invoice';

export type PaymentStatus = 'pending' | 'partial' | 'paid';
export type PaymentMode = 'Cash' | 'UPI' | 'Bank / RTGS' | 'Cheque';

export interface LedgerInvoice {
  id: string;
  invoice_no: string;
  invoice_date: string;
  buyer_name: string;
  buyer_address: string;
  buyer_gstin: string;
  account_no: string;
  party_phone?: string | null;
  place_of_supply: string;
  dispatch_mode: string;
  terms: string;
  copy_badge: string;
  items: LineItem[];
  total_pairs: number;
  taxable_value: number;
  packing_charge: number;
  cgst: number;
  sgst: number;
  round_off: string;
  grand_total: number;
  amount_paid?: number;
  balance_due?: number;
  payment_status: PaymentStatus;
  payment_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LedgerStats {
  totalPending: number;
  totalCollected: number;
  totalBills: number;
  pendingCount: number;
  partialCount: number;
  paidCount: number;
}

export interface SavedParty {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  gstin?: string | null;
  account_no?: string | null;
  created_at?: string;
}

export interface SavedArticle {
  id: string;
  article_code: string;
  color_spec?: string | null;
  hsn_code?: string | null;
  default_mrp?: number | null;
  default_rate?: number | null;
  created_at?: string;
}

export interface PaymentTransaction {
  id: string;
  invoice_id: string;
  payment_date: string;
  amount: number;
  payment_mode: PaymentMode;
  notes?: string | null;
  created_at?: string;
}

export interface PartySummary {
  partyName: string;
  phone?: string | null;
  address?: string | null;
  gstin?: string | null;
  accountNo?: string | null;
  totalBilled: number;
  totalPaid: number;
  balanceDue: number;
  invoiceCount: number;
  invoices: LedgerInvoice[];
}
