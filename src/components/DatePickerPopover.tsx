import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerPopoverProps {
  value: string;
  onChange: (formattedDate: string) => void;
  placeholder?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Formats a Date object to "DD-MMM-YYYY" (e.g. 28-Sep-2026)
const formatDateToDisplay = (d: Date): string => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mmm = SHORT_MONTH_NAMES[d.getMonth()];
  const yyyy = d.getFullYear();
  return `${dd}-${mmm}-${yyyy}`;
};

// Parses "DD-MMM-YYYY" or standard date strings into a Date object
const parseDisplayToDate = (displayString: string): Date | null => {
  if (!displayString) return null;
  const str = displayString.trim();

  // Try DD-MMM-YYYY
  const parts = str.split(/[-/ ]/);
  if (parts.length === 3) {
    const monthMap: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const m = monthMap[parts[1]?.toLowerCase()];
    if (m !== undefined) {
      const day = parseInt(parts[0], 10);
      const year = parseInt(parts[2].length === 2 ? `20${parts[2]}` : parts[2], 10);
      if (!isNaN(day) && !isNaN(year)) {
        return new Date(year, m, day);
      }
    }
  }

  // Try standard Date parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
};

export const DatePickerPopover: React.FC<DatePickerPopoverProps> = ({
  value,
  onChange,
  placeholder = 'e.g. 28-Sep-2026',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active viewing month and year in calendar
  const initialDate = parseDisplayToDate(value) || new Date();
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  // Keep calendar view in sync when value changes externally
  useEffect(() => {
    const d = parseDisplayToDate(value);
    if (d) {
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  // Click outside listener to dismiss popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Month navigation
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  // Day selection
  const handleSelectDay = (day: number) => {
    const selectedDate = new Date(viewYear, viewMonth, day);
    onChange(formatDateToDisplay(selectedDate));
    setIsOpen(false);
  };

  // Quick Today button
  const handleSelectToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onChange(formatDateToDisplay(today));
    setIsOpen(false);
  };

  // Calendar math
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
  const selectedDateObj = parseDisplayToDate(value);

  const isSelected = (day: number) => {
    if (!selectedDateObj) return false;
    return (
      selectedDateObj.getDate() === day &&
      selectedDateObj.getMonth() === viewMonth &&
      selectedDateObj.getFullYear() === viewYear
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear
    );
  };

  // Generate Year options: +/- 10 years around current year (from 2020 to 2035)
  const currentYear = new Date().getFullYear();
  const yearOptions: number[] = [];
  for (let y = currentYear - 6; y <= currentYear + 10; y++) {
    yearOptions.push(y);
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Input container with direct text edit + calendar trigger */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="depth-input w-full min-h-[44px] pl-3.5 pr-10 py-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-mono"
        />

        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className={`absolute right-1.5 p-2 rounded-md transition-colors ${
            isOpen
              ? 'text-neutral-900 dark:text-neutral-100 bg-neutral-200/80 dark:bg-neutral-800'
              : 'text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800'
          }`}
          title="Open interactive calendar"
        >
          <CalendarIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Modern Popover Calendar Window */}
      {isOpen && (
        <div className="depth-popover absolute top-full left-0 mt-2 z-50 w-72 sm:w-80 rounded-xl p-4 transition-all animate-in fade-in zoom-in-95 duration-150">
          {/* Header: Month & Year Selectors with Prev/Next buttons */}
          <div className="flex items-center justify-between gap-1 pb-3 mb-2 border-b border-neutral-100 dark:border-neutral-800/80">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Month Dropdown */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="bg-neutral-100 dark:bg-neutral-800/90 text-neutral-900 dark:text-neutral-100 text-xs font-semibold rounded-md px-2 py-1 border border-neutral-200/60 dark:border-neutral-700/60 focus:outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              {/* Year Dropdown with Wide Year Range */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="bg-neutral-100 dark:bg-neutral-800/90 text-neutral-900 dark:text-neutral-100 text-xs font-semibold rounded-md px-2 py-1 border border-neutral-200/60 dark:border-neutral-700/60 focus:outline-none cursor-pointer font-mono"
              >
                {yearOptions.map(y => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAYS_OF_WEEK.map(day => (
              <span
                key={day}
                className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 py-1"
              >
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Blank offset days */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-8" />
            ))}

            {/* Days in current month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const selected = isSelected(day);
              const today = isToday(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 w-8 sm:h-9 sm:w-9 mx-auto rounded-lg text-xs font-medium transition-all flex items-center justify-center relative active:scale-95 ${
                    selected
                      ? 'depth-btn-primary font-semibold'
                      : today
                      ? 'border border-neutral-900 dark:border-neutral-200 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {day}
                  {today && !selected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-neutral-900 dark:bg-white" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Footer: Today button & Close */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-800/80">
            <button
              type="button"
              onClick={handleSelectToday}
              className="depth-btn-secondary px-2.5 py-1 rounded text-xs font-medium"
            >
              Select Today
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Dismiss</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
