import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Delete, ShieldCheck, Sun, Moon, AlertTriangle, Loader2 } from 'lucide-react';

interface PinLockScreenProps {
  onUnlock: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds
const PIN_SECURITY_KEY = 'jmkt_pin_sec_v1';

function getPinSecurityState(): { attempts: number; lockoutUntil: number | null } {
  try {
    const raw = localStorage.getItem(PIN_SECURITY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        attempts: Number(parsed.attempts) || 0,
        lockoutUntil: parsed.lockoutUntil ? Number(parsed.lockoutUntil) : null,
      };
    }
  } catch {
    // Ignore storage parse issues
  }
  return { attempts: 0, lockoutUntil: null };
}

function savePinSecurityState(state: { attempts: number; lockoutUntil: number | null }) {
  try {
    localStorage.setItem(PIN_SECURITY_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage write issues
  }
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  onUnlock,
  theme = 'light',
  onToggleTheme,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [securityState, setSecurityState] = useState(getPinSecurityState);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(() => {
    const init = getPinSecurityState();
    if (init.lockoutUntil && init.lockoutUntil > Date.now()) {
      return Math.ceil((init.lockoutUntil - Date.now()) / 1000);
    }
    return 0;
  });

  // Live countdown timer for DDoS / brute-force lockout
  useEffect(() => {
    if (!securityState.lockoutUntil) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (securityState.lockoutUntil && securityState.lockoutUntil > now) {
        setLockoutRemaining(Math.ceil((securityState.lockoutUntil - now) / 1000));
      } else {
        setLockoutRemaining(0);
        const resetState = { attempts: 0, lockoutUntil: null };
        savePinSecurityState(resetState);
        setSecurityState(resetState);
        setError(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [securityState.lockoutUntil]);

  const verifyPin = useCallback(async (currentPin: string) => {
    if (lockoutRemaining > 0 || isVerifying) return;
    setIsVerifying(true);

    try {
      const response = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: currentPin }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Clear security lockout upon successful authorized entry
        const clearState = { attempts: 0, lockoutUntil: null };
        savePinSecurityState(clearState);
        setSecurityState(clearState);

        // 30-day session persistence with verified token
        const sessionData = {
          authenticated: true,
          token: data.token,
          expiresAt: data.expiresAt || (Date.now() + 30 * 24 * 60 * 60 * 1000),
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem('jmkt_auth_session', JSON.stringify(sessionData));
        onUnlock();
      } else {
        setIsShaking(true);

        if (response.status === 429) {
          const waitSecs = data.retryAfter || 30;
          const lockoutUntil = Date.now() + waitSecs * 1000;
          const lockState = { attempts: MAX_FAILED_ATTEMPTS, lockoutUntil };
          savePinSecurityState(lockState);
          setSecurityState(lockState);
          setLockoutRemaining(waitSecs);
          setError(data.error || `Keypad locked for ${waitSecs}s.`);
        } else {
          const nextAttempts = securityState.attempts + 1;
          if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
            const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
            const lockState = { attempts: nextAttempts, lockoutUntil };
            savePinSecurityState(lockState);
            setSecurityState(lockState);
            setLockoutRemaining(30);
            setError('Security lockout active: 5 failed attempts (30s).');
          } else {
            const state = { attempts: nextAttempts, lockoutUntil: null };
            savePinSecurityState(state);
            setSecurityState(state);
            const remaining = MAX_FAILED_ATTEMPTS - nextAttempts;
            setError(data.error || `Incorrect Master PIN (${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} left)`);
          }
        }

        setTimeout(() => {
          setIsShaking(false);
          setPin('');
        }, 500);
      }
    } catch {
      setError('Authentication server unavailable. Please try again.');
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 500);
    } finally {
      setIsVerifying(false);
    }
  }, [onUnlock, lockoutRemaining, isVerifying, securityState.attempts]);

  const handleKeyPress = useCallback((digit: string) => {
    if (lockoutRemaining > 0 || isVerifying) return;
    if (pin.length >= 4) return;
    setError(null);
    const nextPin = pin + digit;
    setPin(nextPin);
    if (nextPin.length === 4) {
      setTimeout(() => {
        verifyPin(nextPin);
      }, 100);
    }
  }, [lockoutRemaining, isVerifying, pin, verifyPin]);

  const handleDelete = useCallback(() => {
    if (lockoutRemaining > 0 || isVerifying) return;
    setError(null);
    setPin(prev => prev.slice(0, -1));
  }, [lockoutRemaining, isVerifying]);

  const handleClear = useCallback(() => {
    if (lockoutRemaining > 0 || isVerifying) return;
    setError(null);
    setPin('');
  }, [lockoutRemaining, isVerifying]);

  // Keyboard navigation support for desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lockoutRemaining > 0 || isVerifying) return;
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
  }, [lockoutRemaining, isVerifying, handleKeyPress, handleDelete, handleClear]);

  const isLockedOut = lockoutRemaining > 0;

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
          <div className={`w-16 h-16 rounded-2xl ${isLockedOut ? 'bg-rose-600 dark:bg-rose-500' : 'bg-neutral-900 dark:bg-white'} text-white dark:text-neutral-900 flex items-center justify-center shadow-md transition-colors duration-300`}>
            {isVerifying ? (
              <Loader2 className="w-7 h-7 text-white animate-spin" />
            ) : isLockedOut ? (
              <AlertTriangle className="w-7 h-7 text-white" />
            ) : (
              <Lock className="w-7 h-7" />
            )}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${isLockedOut ? 'bg-rose-700' : 'bg-emerald-500'} text-white flex items-center justify-center shadow-xs transition-colors duration-300`}>
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>

        <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          {isLockedOut ? 'Access Temporarily Locked' : 'Enter Master PIN'}
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 mb-6 text-center">
          {isLockedOut ? 'Anti-brute-force lockout active (30s cooldown)' : 'Authorized Accounts & Billing Access'}
        </p>

        {/* 4-Digit Indicator Dots */}
        <div className={`flex items-center gap-4 mb-4 ${isShaking ? 'animate-bounce' : ''}`}>
          {[0, 1, 2, 3].map(index => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  isLockedOut
                    ? 'border-2 border-rose-300 dark:border-rose-900/60 bg-rose-100 dark:bg-rose-950/40'
                    : isFilled
                      ? 'bg-neutral-900 dark:bg-white scale-110 shadow-sm'
                      : 'border-2 border-neutral-300 dark:border-neutral-700 bg-transparent'
                }`}
              />
            );
          })}
        </div>

        {/* Error message or subtle hint */}
        <div className="min-h-6 flex items-center justify-center mb-4 text-center px-2">
          {isVerifying ? (
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> Verifying credentials...
            </span>
          ) : isLockedOut ? (
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 animate-pulse">
              Locked for security. Retry in {lockoutRemaining}s
            </span>
          ) : error ? (
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
        <div className={`w-full max-w-[280px] grid grid-cols-3 gap-3 ${isLockedOut || isVerifying ? 'opacity-40 pointer-events-none' : ''}`}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              disabled={isLockedOut || isVerifying}
              onClick={() => handleKeyPress(num)}
              className="depth-btn-secondary h-16 rounded-2xl text-xl font-semibold font-mono flex items-center justify-center active:scale-95 transition-transform disabled:cursor-not-allowed"
            >
              {num}
            </button>
          ))}

          {/* Bottom row: Clear, 0, Backspace */}
          <button
            type="button"
            disabled={isLockedOut || isVerifying}
            onClick={handleClear}
            className="h-16 rounded-2xl text-xs font-semibold text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center justify-center active:scale-95 transition-transform disabled:cursor-not-allowed"
          >
            Clear
          </button>

          <button
            type="button"
            disabled={isLockedOut || isVerifying}
            onClick={() => handleKeyPress('0')}
            className="depth-btn-secondary h-16 rounded-2xl text-xl font-semibold font-mono flex items-center justify-center active:scale-95 transition-transform disabled:cursor-not-allowed"
          >
            0
          </button>

          <button
            type="button"
            disabled={isLockedOut || isVerifying}
            onClick={handleDelete}
            className="h-16 rounded-2xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 flex items-center justify-center active:scale-95 transition-transform disabled:cursor-not-allowed"
            title="Delete last digit"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="pb-3 text-center text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
        Protected Wholesale Ledger &bull; Encrypted Session
      </footer>
    </div>
  );
};
