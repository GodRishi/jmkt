import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { SavedArticle } from '../types/ledger';
import { Tag, Sparkles, ChevronDown, Check } from 'lucide-react';
import { formatCurrency } from '../utils/calculator';

interface ArticleAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectArticle: (article: SavedArticle) => void;
  articles: SavedArticle[];
  placeholder?: string;
  inputClassName?: string;
  required?: boolean;
}

export const ArticleAutocomplete: React.FC<ArticleAutocompleteProps> = ({
  value,
  onChange,
  onSelectArticle,
  articles,
  placeholder = 'e.g. 22G-13388N-RESIL',
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

  // Filter & rank articles:
  // 1. If blank, show every article.
  // 2. When matching query appears, closest match comes at top and non-matches don't show up.
  const displayedArticles = useMemo(() => {
    const q = value.trim().toLowerCase();

    // Blank field: return every article
    if (!q) {
      return articles;
    }

    const scored: { article: SavedArticle; score: number }[] = [];

    for (const art of articles) {
      const code = (art.article_code || '').toLowerCase();
      const spec = (art.color_spec || '').toLowerCase();

      let score = -1;

      if (code === q) {
        score = 0; // Exact article code match
      } else if (code.startsWith(q)) {
        score = 1; // Code starts with query
      } else if (code.split(/[\s\-_/]+/).some((w) => w.startsWith(q))) {
        score = 2; // Any word in code starts with query
      } else if (code.includes(q)) {
        score = 3; // Code includes query
      } else if (spec.startsWith(q)) {
        score = 4; // Color/Spec starts with query
      } else if (spec.includes(q)) {
        score = 5; // Color/Spec includes query
      }

      if (score !== -1) {
        scored.push({ article: art, score });
      }
    }

    // Sort by best score ascending (top match first)
    scored.sort((a, b) => a.score - b.score);

    return scored.map((s) => s.article);
  }, [value, articles]);

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
          title="Toggle article catalog"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${isOpen ? 'rotate-180 text-neutral-700 dark:text-neutral-200' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-100 dark:border-neutral-800 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              {isBlank ? `Saved Articles Catalog (${articles.length})` : `Matching Articles (${displayedArticles.length})`}
            </span>
            {isBlank && (
              <span className="text-[10px] font-normal lowercase tracking-normal text-neutral-400">
                tap to fill
              </span>
            )}
          </div>

          {displayedArticles.length === 0 ? (
            <div className="p-3 text-center text-xs text-neutral-500 dark:text-neutral-400">
              No matching footwear articles. Continue typing to add a new article.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {displayedArticles.map((art, idx) => {
                const isSelected = value.trim().toLowerCase() === art.article_code.trim().toLowerCase();
                const isTopMatch = !isBlank && idx === 0;

                return (
                  <button
                    key={art.id || art.article_code}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelectArticle(art);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 transition-colors flex items-center justify-between gap-2 active:bg-neutral-100 dark:active:bg-neutral-800 ${
                      isTopMatch ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Tag className={`w-3.5 h-3.5 shrink-0 ${isTopMatch ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-400'}`} />
                        <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 font-mono truncate">
                          {art.article_code}
                        </span>
                        {isTopMatch && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-mono shrink-0">
                            Top Match
                          </span>
                        )}
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 ml-auto" />}
                      </div>
                      {art.color_spec && (
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate pl-5">
                          Spec: {art.color_spec}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0 font-mono tabular-nums text-xs">
                      {art.default_rate ? (
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                          ₹{formatCurrency(art.default_rate)}
                        </span>
                      ) : null}
                      {art.default_mrp ? (
                        <span className="text-[10px] text-neutral-400 block line-through">
                          MRP ₹{formatCurrency(art.default_mrp)}
                        </span>
                      ) : null}
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
