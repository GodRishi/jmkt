import { supabase, isDatabaseConfigured } from '../lib/supabase';
import type { SavedParty, SavedArticle } from '../types/ledger';
import type { InvoiceData, LineItem } from '../types/invoice';

const LOCAL_STORAGE_PARTIES_KEY = 'jmkt_saved_parties_v2';
const LOCAL_STORAGE_ARTICLES_KEY = 'jmkt_saved_articles_v2';

// Dummy seeds to permanently purge from cache and database
const DUMMY_PARTY_NAMES = [
  'ramesh footwear & traders',
  'gupta shoe house',
  'm/s bengal sole store',
];
const DUMMY_PARTY_IDS = ['party-seed-2', 'party-seed-3', 'party-seed-4'];

const DUMMY_ARTICLE_CODES = [
  'air-902-premium',
  'pu-sole-404',
  'tpr-sports-707',
];
const DUMMY_ARTICLE_IDS = ['art-seed-4', 'art-seed-5', 'art-seed-6'];

// Initial pre-seeded directory: ONLY Nuruddin Sultan
const DEFAULT_PARTIES: SavedParty[] = [
  {
    id: 'party-seed-1',
    name: 'Nuruddin Sultan',
    phone: '9830123456',
    address: 'Dalkhola, West Bengal',
    gstin: 'Unregistered',
    account_no: '998796956823',
  },
];

// Initial template articles
const DEFAULT_ARTICLES: SavedArticle[] = [
  {
    id: 'art-seed-1',
    article_code: '22G-13388N-RESIL',
    color_spec: 'Glacier/D.Teal',
    hsn_code: '64041990',
    default_mrp: 1549,
    default_rate: 910,
  },
  {
    id: 'art-seed-2',
    article_code: '22G-1179N-VESPER',
    color_spec: 'L.Gry/D.Gry',
    hsn_code: '64041990',
    default_mrp: 1799,
    default_rate: 1057,
  },
  {
    id: 'art-seed-3',
    article_code: '22G-13420N-MIBRO',
    color_spec: 'Blk/Slc',
    hsn_code: '64041990',
    default_mrp: 1199,
    default_rate: 759,
  },
];

function sanitizeParties(parties: SavedParty[]): SavedParty[] {
  return parties.filter((p) => {
    const isDummyId = DUMMY_PARTY_IDS.includes(p.id);
    const isDummyName = DUMMY_PARTY_NAMES.includes((p.name || '').trim().toLowerCase());
    return !isDummyId && !isDummyName;
  });
}

function sanitizeArticles(articles: SavedArticle[]): SavedArticle[] {
  return articles.filter((a) => {
    const isDummyId = DUMMY_ARTICLE_IDS.includes(a.id);
    const isDummyCode = DUMMY_ARTICLE_CODES.includes((a.article_code || '').trim().toLowerCase());
    return !isDummyId && !isDummyCode;
  });
}

function getStoredParties(): SavedParty[] {
  try {
    // Check both v2 and old v1
    const raw = localStorage.getItem(LOCAL_STORAGE_PARTIES_KEY) || localStorage.getItem('jmkt_saved_parties_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned = sanitizeParties(parsed);
        if (cleaned.length > 0) {
          saveStoredParties(cleaned);
          return cleaned;
        }
      }
    }
  } catch {
    // Ignore error
  }
  return DEFAULT_PARTIES;
}

function saveStoredParties(parties: SavedParty[]): void {
  try {
    const cleaned = sanitizeParties(parties);
    localStorage.setItem(LOCAL_STORAGE_PARTIES_KEY, JSON.stringify(cleaned));
    // Clear legacy key to avoid old seeds coming back
    localStorage.removeItem('jmkt_saved_parties_v1');
  } catch {
    // Ignore error
  }
}

function getStoredArticles(): SavedArticle[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ARTICLES_KEY) || localStorage.getItem('jmkt_saved_articles_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned = sanitizeArticles(parsed);
        if (cleaned.length > 0) {
          saveStoredArticles(cleaned);
          return cleaned;
        }
      }
    }
  } catch {
    // Ignore error
  }
  return DEFAULT_ARTICLES;
}

function saveStoredArticles(articles: SavedArticle[]): void {
  try {
    const cleaned = sanitizeArticles(articles);
    localStorage.setItem(LOCAL_STORAGE_ARTICLES_KEY, JSON.stringify(cleaned));
    localStorage.removeItem('jmkt_saved_articles_v1');
  } catch {
    // Ignore error
  }
}

export const directoryService = {
  // Fetch parties from Supabase with local fallback
  async getParties(): Promise<SavedParty[]> {
    const local = getStoredParties();

    if (!isDatabaseConfigured) {
      return local;
    }

    try {
      const { data, error } = await supabase
        .from('saved_parties')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        return local;
      }

      if (data && data.length > 0) {
        const cleaned = sanitizeParties(data as SavedParty[]);
        
        // Asynchronously purge dummy entries from Supabase if they exist
        if (cleaned.length !== data.length) {
          try {
            await supabase
              .from('saved_parties')
              .delete()
              .in('name', ['Ramesh Footwear & Traders', 'Gupta Shoe House', 'M/S Bengal Sole Store']);
          } catch {
            // Quiet
          }
        }

        saveStoredParties(cleaned);
        return cleaned.length > 0 ? cleaned : DEFAULT_PARTIES;
      } else {
        // If Supabase table is empty, seed ONLY Nuruddin Sultan
        for (const p of DEFAULT_PARTIES) {
          try {
            await supabase.from('saved_parties').insert({
              name: p.name,
              phone: p.phone,
              address: p.address,
              gstin: p.gstin,
              account_no: p.account_no,
            });
          } catch {
            // Quiet
          }
        }
        return DEFAULT_PARTIES;
      }
    } catch {
      return local;
    }
  },

  // Fetch articles from Supabase with local fallback
  async getArticles(): Promise<SavedArticle[]> {
    const local = getStoredArticles();

    if (!isDatabaseConfigured) {
      return local;
    }

    try {
      const { data, error } = await supabase
        .from('saved_articles')
        .select('*')
        .order('article_code', { ascending: true });

      if (error) {
        return local;
      }

      if (data && data.length > 0) {
        const cleaned = sanitizeArticles(data as SavedArticle[]);
        if (cleaned.length !== data.length) {
          try {
            await supabase
              .from('saved_articles')
              .delete()
              .in('article_code', ['AIR-902-PREMIUM', 'PU-SOLE-404', 'TPR-SPORTS-707']);
          } catch {
            // Quiet
          }
        }
        saveStoredArticles(cleaned);
        return cleaned.length > 0 ? cleaned : DEFAULT_ARTICLES;
      } else {
        // Seed default template articles into Supabase
        for (const a of DEFAULT_ARTICLES) {
          try {
            await supabase.from('saved_articles').insert({
              article_code: a.article_code,
              color_spec: a.color_spec,
              hsn_code: a.hsn_code,
              default_mrp: a.default_mrp,
              default_rate: a.default_rate,
            });
          } catch {
            // Quiet
          }
        }
        return DEFAULT_ARTICLES;
      }
    } catch {
      return local;
    }
  },

  // Auto-save buyer to directory if not present or update if details changed
  async upsertPartyFromInvoice(data: InvoiceData): Promise<void> {
    const name = data.buyer?.buyerName?.trim();
    if (!name) return;

    const currentParties = getStoredParties();
    const existingIndex = currentParties.findIndex(
      (p) => p.name.trim().toLowerCase() === name.toLowerCase()
    );

    const partyRecord: SavedParty = {
      id: existingIndex >= 0 ? currentParties[existingIndex].id : 'party-' + Date.now(),
      name,
      phone: data.buyer.phone || (existingIndex >= 0 ? currentParties[existingIndex].phone : null),
      address: data.buyer.buyerAddress || (existingIndex >= 0 ? currentParties[existingIndex].address : null),
      gstin: data.buyer.gstinUin || (existingIndex >= 0 ? currentParties[existingIndex].gstin : 'Unregistered'),
      account_no: data.buyer.accountNo || (existingIndex >= 0 ? currentParties[existingIndex].account_no : null),
    };

    let updatedList: SavedParty[];
    if (existingIndex >= 0) {
      updatedList = [...currentParties];
      updatedList[existingIndex] = partyRecord;
    } else {
      updatedList = [partyRecord, ...currentParties];
    }
    saveStoredParties(updatedList);

    // Sync to Supabase if available
    if (isDatabaseConfigured) {
      try {
        if (existingIndex >= 0) {
          await supabase
            .from('saved_parties')
            .update({
              phone: partyRecord.phone,
              address: partyRecord.address,
              gstin: partyRecord.gstin,
              account_no: partyRecord.account_no,
            })
            .ilike('name', name);
        } else {
          await supabase.from('saved_parties').insert({
            name: partyRecord.name,
            phone: partyRecord.phone,
            address: partyRecord.address,
            gstin: partyRecord.gstin,
            account_no: partyRecord.account_no,
          });
        }
      } catch {
        // Fail silently
      }
    }
  },

  // Auto-save new line item articles to directory
  async upsertArticlesFromInvoice(items: LineItem[]): Promise<void> {
    if (!items || items.length === 0) return;

    const currentArticles = getStoredArticles();
    let hasChanges = false;
    const newArticles = [...currentArticles];

    for (const item of items) {
      const code = item.description?.trim();
      if (!code) continue;

      const existingIndex = newArticles.findIndex(
        (a) => a.article_code.trim().toLowerCase() === code.toLowerCase()
      );

      if (existingIndex === -1) {
        hasChanges = true;
        const newArt: SavedArticle = {
          id: 'art-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          article_code: code,
          color_spec: item.colorSpec || null,
          hsn_code: item.hsnCode || '64041990',
          default_mrp: Number(item.mrp) || 0,
          default_rate: Number(item.unitPrice) || 0,
        };
        newArticles.unshift(newArt);

        if (isDatabaseConfigured) {
          try {
            await supabase.from('saved_articles').insert({
              article_code: newArt.article_code,
              color_spec: newArt.color_spec,
              hsn_code: newArt.hsn_code,
              default_mrp: newArt.default_mrp,
              default_rate: newArt.default_rate,
            });
          } catch {
            // Fail silently
          }
        }
      }
    }

    if (hasChanges) {
      saveStoredArticles(newArticles);
    }
  },
};
