import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface SuggestiveInputProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  categoryLabel?: string;
  required?: boolean;
  onBlur?: () => void;
  onSaveOption?: (value: string) => void;
}

export const SuggestiveInput: React.FC<SuggestiveInputProps> = ({
  value,
  onChange,
  options,
  placeholder = '',
  className = '',
  categoryLabel = 'Options',
  required = false,
  onBlur,
  onSaveOption,
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

  // Filter and rank options:
  // 1. If blank, show every unique option.
  // 2. When query appears, closest match comes at top and non-matches don't show up.
  const displayedOptions = useMemo(() => {
    const uniqueOptions = Array.from(new Set(options.filter(Boolean)));
    const q = value.trim().toLowerCase();

    // If blank: show all options
    if (!q) {
      return uniqueOptions;
    }

    const scored: { text: string; score: number }[] = [];

    for (const opt of uniqueOptions) {
      const lower = opt.toLowerCase();
      let score = -1;

      if (lower === q) {
        score = 0; // Exact match
      } else if (lower.startsWith(q)) {
        score = 1; // Starts with query
      } else if (lower.split(/[\s\-_/(),]+/).some((w) => w.startsWith(q))) {
        score = 2; // Any word starts with query
      } else if (lower.includes(q)) {
        score = 3; // Contains query
      }

      if (score !== -1) {
        scored.push({ text: opt, score });
      }
    }

    // Sort by best score ascending (top match first)
    scored.sort((a, b) => a.score - b.score);

    return scored.map((s) => s.text);
  }, [value, options]);

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
          onBlur={() => {
            const trimmed = value.trim();
            if (trimmed && onSaveOption) {
              onSaveOption(trimmed);
            }
            onBlur?.();
          }}
          placeholder={placeholder}
          required={required}
          className={`${className} pr-8`}
          autoComplete="off"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-0.5 rounded transition-colors"
          title={`Toggle ${categoryLabel}`}
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-neutral-700 dark:text-neutral-200' : ''
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-100 dark:border-neutral-800 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center justify-between">
            <span>
              {isBlank
                ? `${categoryLabel} (${options.length})`
                : `Matching ${categoryLabel} (${displayedOptions.length})`}
            </span>
            {isBlank && (
              <span className="text-[10px] font-normal lowercase tracking-normal text-neutral-400">
                tap to fill
              </span>
            )}
          </div>

          {displayedOptions.length === 0 ? (
            <div className="p-2.5 text-center text-xs text-neutral-500 dark:text-neutral-400">
              No matching suggestions. Continue typing to enter custom value.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {displayedOptions.map((opt, idx) => {
                const isSelected = value.trim().toLowerCase() === opt.trim().toLowerCase();
                const isTopMatch = !isBlank && idx === 0;

                return (
                  <button
                    key={opt}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(opt);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800/80 transition-colors flex items-center justify-between gap-2 active:bg-neutral-100 dark:active:bg-neutral-800 ${
                      isTopMatch ? 'bg-indigo-50/50 dark:bg-indigo-950/20 font-semibold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate flex-1">
                      <span className="text-neutral-800 dark:text-neutral-200 truncate">
                        {opt}
                      </span>
                      {isTopMatch && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 font-mono shrink-0">
                          Top Match
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
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
