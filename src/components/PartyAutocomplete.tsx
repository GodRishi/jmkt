import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { SavedParty } from '../types/ledger';
import { User, Phone, MapPin, Building, ChevronDown, Check } from 'lucide-react';

interface PartyAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectParty: (party: SavedParty) => void;
  parties: SavedParty[];
  placeholder?: string;
  inputClassName?: string;
  required?: boolean;
}

export const PartyAutocomplete: React.FC<PartyAutocompleteProps> = ({
  value,
  onChange,
  onSelectParty,
  parties,
  placeholder = 'e.g. Nuruddin Sultan',
  inputClassName = '',
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter & rank parties:
  // 1. If blank, show every party name.
  // 2. When matching query appears, closest match comes at top and non-matches don't show up.
  const displayedParties = useMemo(() => {
    const q = value.trim().toLowerCase();
    const cleanDigits = q.replace(/[^\d]/g, '');

    // Blank field: return every party
    if (!q) {
      return parties;
    }

    const scored: { party: SavedParty; score: number }[] = [];

    for (const p of parties) {
      const name = (p.name || '').toLowerCase();
      const phoneDigits = (p.phone || '').replace(/[^\d]/g, '');
      const address = (p.address || '').toLowerCase();
      const gstin = (p.gstin || '').toLowerCase();

      let score = -1;

      if (name === q) {
        score = 0; // Exact name match
      } else if (name.startsWith(q)) {
        score = 1; // Name starts with query
      } else if (name.split(/[\s\-_/]+/).some((w) => w.startsWith(q))) {
        score = 2; // Any word in name starts with query
      } else if (cleanDigits.length >= 3 && phoneDigits.includes(cleanDigits)) {
        score = 3; // Phone match
      } else if (name.includes(q)) {
        score = 4; // Name contains query
      } else if (address.includes(q)) {
        score = 5; // Address match
      } else if (gstin.includes(q) && gstin !== 'unregistered') {
        score = 6; // GSTIN match
      }

      if (score !== -1) {
        scored.push({ party: p, score });
      }
    }

    // Sort by best score ascending (top match first)
    scored.sort((a, b) => a.score - b.score);

    return scored.map((s) => s.party);
  }, [value, parties]);

  const isBlank = !value.trim();

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className={`${inputClassName} pr-8`}
          autoComplete="off"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-0.5 rounded transition-colors"
          title="Toggle party directory"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${isOpen ? 'rotate-180 text-neutral-700 dark:text-neutral-200' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-100 dark:border-neutral-800 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center justify-between">
            <span>
              {isBlank ? `Saved Parties Directory (${parties.length})` : `Matching Parties (${displayedParties.length})`}
            </span>
            {isBlank && (
              <span className="text-[10px] font-normal lowercase tracking-normal text-neutral-400">
                tap to select
              </span>
            )}
          </div>

          {displayedParties.length === 0 ? (
            <div className="p-3 text-center text-xs text-neutral-500 dark:text-neutral-400">
              No matching saved parties. Continue typing to add a new buyer.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {displayedParties.map((party, idx) => {
                const isSelected = value.trim().toLowerCase() === party.name.trim().toLowerCase();
                const isTopMatch = !isBlank && idx === 0;

                return (
                  <button
                    key={party.id || party.name}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelectParty(party);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 transition-colors flex flex-col gap-1 active:bg-neutral-100 dark:active:bg-neutral-800 ${
                      isTopMatch ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User className={`w-3.5 h-3.5 shrink-0 ${isTopMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'}`} />
                        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {party.name}
                        </span>
                        {isTopMatch && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-mono shrink-0">
                            Top Match
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {party.phone && (
                          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {party.phone}
                          </span>
                        )}
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 pl-5">
                      {party.address && (
                        <span className="flex items-center gap-1 truncate max-w-[220px]">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {party.address}
                        </span>
                      )}
                      {party.gstin && party.gstin !== 'Unregistered' && (
                        <span className="flex items-center gap-1 font-mono text-[11px] truncate">
                          <Building className="w-3 h-3 shrink-0" />
                          {party.gstin}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
