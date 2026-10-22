import type { SavedParty, SavedArticle } from '../types/ledger';
import {
  suggestionsService,
  BASE_ADDRESSES,
  BASE_SPECS,
  COMMON_PLACES_OF_SUPPLY,
  COMMON_DISPATCH_MODES,
  COMMON_PAYMENT_TERMS,
  COMMON_COPY_BADGES,
} from '../services/suggestionsService';

export {
  BASE_ADDRESSES,
  BASE_SPECS,
  COMMON_PLACES_OF_SUPPLY,
  COMMON_DISPATCH_MODES,
  COMMON_PAYMENT_TERMS,
  COMMON_COPY_BADGES,
};

export function getAddressSuggestions(parties: SavedParty[] = []): string[] {
  return suggestionsService.getAddressSuggestions(parties);
}

export function getSpecSuggestions(articles: SavedArticle[] = []): string[] {
  return suggestionsService.getSpecSuggestions(articles);
}
