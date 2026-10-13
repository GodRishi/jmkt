import type { LineItem } from './invoice';

export interface LedgerInvoice {
  id: string;
  invoice_no: string;
  invoice_date: string;
  buyer_name: string;
  buyer_address: string;
  buyer_gstin: string;
  account_no: string;
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
  payment_status: 'pending' | 'paid';
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
  paidCount: number;
}
