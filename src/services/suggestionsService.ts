import type { SavedParty, SavedArticle, LedgerInvoice } from '../types/ledger';
import type { InvoiceData } from '../types/invoice';

const STORAGE_KEYS = {
  addresses: 'jmkt_custom_addresses_v1',
  specs: 'jmkt_custom_specs_v1',
  placesOfSupply: 'jmkt_custom_places_of_supply_v1',
  dispatchModes: 'jmkt_custom_dispatch_modes_v1',
  paymentTerms: 'jmkt_custom_payment_terms_v1',
  copyBadges: 'jmkt_custom_copy_badges_v1',
} as const;

type SuggestionCategory = keyof typeof STORAGE_KEYS;

// Clean base suggestions
export const BASE_ADDRESSES = [
  'Dalkhola, West Bengal',
  'Kolkata - 700009',
  'Siliguri, West Bengal',
  'Malda Town, West Bengal',
];

export const BASE_SPECS = [
  'Glacier/D.Teal',
  'L.Gry/D.Gry',
  'Blk/Slc',
  'White/Navy',
  'All Black',
  'Grey/Orange',
  'Tan/Brown',
  'Black/Red',
];

export const COMMON_PLACES_OF_SUPPLY = [
  'West Bengal (19)',
  'Bihar (10)',
  'Jharkhand (20)',
  'Assam (18)',
  'Odisha (21)',
  'Uttar Pradesh (09)',
  'Delhi (07)',
  'Tripura (16)',
];

export const COMMON_DISPATCH_MODES = [
  'Local Road Transport',
  'Customer Self Pickup',
  'Trackon Courier',
  'V-Trans Cargo',
  'Railway Cargo',
  'Speed Post / Courier',
  'Direct Delivery Van',
];

export const COMMON_PAYMENT_TERMS = [
  'Immediate / Against Delivery',
  '15 Days Credit',
  '30 Days Credit',
  'Against Lorry Receipt (Bilty / LR)',
  '50% Advance, Balance on Delivery',
  'Cash on Delivery (COD)',
];

export const COMMON_COPY_BADGES = [
  'ORIGINAL FOR RECIPIENT',
  'DUPLICATE FOR TRANSPORTER',
  'TRIPLICATE FOR SUPPLIER',
  'EXTRA COPY',
];

function getStoredList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((s) => String(s).trim()).filter(Boolean);
      }
    }
  } catch {
    // Ignore error
  }
  return [];
}

function saveStoredList(key: string, list: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // Ignore error
  }
}

export const suggestionsService = {
  getCustomEntries(category: SuggestionCategory): string[] {
    const key = STORAGE_KEYS[category];
    return getStoredList(key);
  },

  saveCustomEntry(category: SuggestionCategory, rawValue?: string | null): void {
    if (!rawValue) return;
    const value = rawValue.trim();
    if (value.length < 2) return;

    const key = STORAGE_KEYS[category];
    const existing = getStoredList(key);
    
    // Check case-insensitive duplicate
    const exists = existing.some((item) => item.toLowerCase() === value.toLowerCase());
    if (!exists) {
      const updated = [value, ...existing]; // most recent first
      saveStoredList(key, updated.slice(0, 100)); // cap at 100
    }
  },

  // Automatically captures all new values entered into an invoice
  recordInvoiceEntries(invoice: InvoiceData): void {
    if (!invoice) return;

    // 1. Buyer address
    if (invoice.buyer?.buyerAddress) {
      this.saveCustomEntry('addresses', invoice.buyer.buyerAddress);
    }

    // 2. State & Code
    if (invoice.buyer?.stateAndCode) {
      this.saveCustomEntry('placesOfSupply', invoice.buyer.stateAndCode);
    }

    // 3. Place of supply
    if (invoice.meta?.placeOfSupply) {
      this.saveCustomEntry('placesOfSupply', invoice.meta.placeOfSupply);
    }

    // 4. Dispatch mode
    if (invoice.meta?.dispatchMode) {
      this.saveCustomEntry('dispatchModes', invoice.meta.dispatchMode);
    }

    // 5. Terms of payment
    if (invoice.meta?.termsOfPayment) {
      this.saveCustomEntry('paymentTerms', invoice.meta.termsOfPayment);
    }

    // 6. Copy badge text
    if (invoice.meta?.copyType) {
      this.saveCustomEntry('copyBadges', invoice.meta.copyType);
    }

    // 7. Line item specs
    if (Array.isArray(invoice.items)) {
      for (const item of invoice.items) {
        if (item?.colorSpec) {
          this.saveCustomEntry('specs', item.colorSpec);
        }
      }
    }
  },

  // Dynamic Suggestion Getters (Merge base defaults + custom saved + ledger history)
  getAddressSuggestions(parties: SavedParty[] = [], ledgerInvoices: LedgerInvoice[] = []): string[] {
    const custom = this.getCustomEntries('addresses');
    const fromParties = parties.map((p) => p.address).filter(Boolean) as string[];
    const fromLedger = ledgerInvoices.map((i) => i.buyer_address).filter(Boolean) as string[];
    return Array.from(new Set([...custom, ...fromParties, ...fromLedger, ...BASE_ADDRESSES]));
  },

  getSpecSuggestions(articles: SavedArticle[] = [], ledgerInvoices: LedgerInvoice[] = []): string[] {
    const custom = this.getCustomEntries('specs');
    const fromArticles = articles.map((a) => a.color_spec).filter(Boolean) as string[];
    const fromLedger: string[] = [];
    for (const inv of ledgerInvoices) {
      if (Array.isArray(inv.items)) {
        for (const item of inv.items) {
          if (item?.colorSpec) fromLedger.push(item.colorSpec);
        }
      }
    }
    return Array.from(new Set([...custom, ...fromArticles, ...fromLedger, ...BASE_SPECS]));
  },

  getDispatchModeSuggestions(ledgerInvoices: LedgerInvoice[] = []): string[] {
    const custom = this.getCustomEntries('dispatchModes');
    const fromLedger = ledgerInvoices.map((i) => i.dispatch_mode).filter(Boolean) as string[];
    return Array.from(new Set([...custom, ...fromLedger, ...COMMON_DISPATCH_MODES]));
  },

  getPaymentTermsSuggestions(ledgerInvoices: LedgerInvoice[] = []): string[] {
    const custom = this.getCustomEntries('paymentTerms');
    const fromLedger = ledgerInvoices.map((i) => i.terms).filter(Boolean) as string[];
    return Array.from(new Set([...custom, ...fromLedger, ...COMMON_PAYMENT_TERMS]));
  },

  getPlaceOfSupplySuggestions(ledgerInvoices: LedgerInvoice[] = []): string[] {
    const custom = this.getCustomEntries('placesOfSupply');
    const fromLedger = ledgerInvoices.map((i) => i.place_of_supply).filter(Boolean) as string[];
    return Array.from(new Set([...custom, ...fromLedger, ...COMMON_PLACES_OF_SUPPLY]));
  },

  getCopyBadgeSuggestions(ledgerInvoices: LedgerInvoice[] = []): string[] {
    const custom = this.getCustomEntries('copyBadges');
    const fromLedger = ledgerInvoices.map((i) => i.copy_badge).filter(Boolean) as string[];
    return Array.from(new Set([...custom, ...fromLedger, ...COMMON_COPY_BADGES]));
  },
};
