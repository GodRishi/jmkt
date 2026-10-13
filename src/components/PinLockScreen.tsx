import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Delete, ShieldCheck, Sun, Moon } from 'lucide-react';

interface PinLockScreenProps {
  onUnlock: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  onUnlock,
  theme = 'light',
  onToggleTheme,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // Retrieve Master PIN from environment or fallback default '2026'
  const masterPin = 
    (import.meta as any).env?.VITE_APP_PIN || 
    (import.meta as any).env?.NEXT_PUBLIC_APP_PIN || 
    '2026';

  const verifyPin = useCallback((currentPin: string) => {
    if (currentPin === masterPin) {
      // 30-day session persistence
      const sessionData = {
        authenticated: true,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('jmkt_auth_session', JSON.stringify(sessionData));
      onUnlock();
    } else {
      setError('Incorrect Master PIN. Please try again.');
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 500);
    }
  }, [masterPin, onUnlock]);

  const handleKeyPress = (digit: string) => {
    if (pin.length >= 4) return;
    setError(null);
    const nextPin = pin + digit;
    setPin(nextPin);
    if (nextPin.length === 4) {
      setTimeout(() => {
        verifyPin(nextPin);
      }, 100);
    }
  };

  const handleDelete = () => {
    setError(null);
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setError(null);
    setPin('');
  };

  // Keyboard navigation support for desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0c0c0e] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between items-center p-4 sm:p-6 transition-colors duration-200 select-none">
      {/* Top Header / Theme Toggle */}
      <header className="w-full max-w-sm flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs flex items-center justify-center font-mono shadow-sm">
            JMKT
          </div>
          <span className="text-xs font-semibold tracking-tight text-neutral-800 dark:text-neutral-200">
            Jai Maa Kamakhya Traders
          </span>
        </div>

        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className="depth-btn-secondary w-9 h-9 rounded-xl flex items-center justify-center"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-600" />
            )}
          </button>
        )}
      </header>

      {/* Main Lock Card */}
      <main className="w-full max-w-sm flex flex-col items-center my-auto py-4">
        {/* Shield / Lock Icon */}
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-md">
            <Lock className="w-7 h-7" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>

        <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Enter Master PIN
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 mb-6 text-center">
          Authorized Accounts &amp; Billing Access
        </p>

        {/* 4-Digit Indicator Dots */}
        <div className={`flex items-center gap-4 mb-4 ${isShaking ? 'animate-bounce' : ''}`}>
          {[0, 1, 2, 3].map(index => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  isFilled
                    ? 'bg-neutral-900 dark:bg-white scale-110 shadow-sm'
                    : 'border-2 border-neutral-300 dark:border-neutral-700 bg-transparent'
                }`}
              />
            );
          })}
        </div>

        {/* Error message or subtle hint */}
        <div className="h-6 flex items-center justify-center mb-4">
          {error ? (
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
              {error}
            </span>
          ) : (
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
              Session stays active for 30 days
            </span>
          )}
        </div>

        {/* Mobile Tactile Numpad Grid */}
        <div className="w-full max-w-[280px] grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="depth-btn-secondary h-16 rounded-2xl text-xl font-semibold font-mono flex items-center justify-center active:scale-95 transition-transform"
            >
              {num}
            </button>
          ))}

          {/* Bottom row: Clear, 0, Backspace */}
          <button
            type="button"
            onClick={handleClear}
            className="h-16 rounded-2xl text-xs font-semibold text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center justify-center active:scale-95 transition-transform"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="depth-btn-secondary h-16 rounded-2xl text-xl font-semibold font-mono flex items-center justify-center active:scale-95 transition-transform"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-16 rounded-2xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 flex items-center justify-center active:scale-95 transition-transform"
            title="Delete last digit"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="pb-3 text-center text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
        Default PIN: 2026 &bull; Protected wholesale ledger
      </footer>
    </div>
  );
};
