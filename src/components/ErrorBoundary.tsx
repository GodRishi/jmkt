import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Keep internal error message safe without leaking stack trace to user
    console.error('[JMKT Error Boundary caught]', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.removeItem('jmkt_invoice_data_v3');
    } catch {
      // Ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0c0c0e] text-neutral-100 flex items-center justify-center p-4 selection:bg-rose-500 selection:text-white">
          <div className="max-w-md w-full bg-[#18181b] border border-neutral-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-400 mx-auto flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-neutral-900 border border-neutral-700 text-neutral-400">
                JMKT Wholesale Security Shield
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Application Recovered Safely
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                An unexpected rendering glitch was intercepted. Your billing data remains protected in local storage.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full h-11 rounded-xl bg-white text-neutral-900 text-xs font-semibold hover:bg-neutral-200 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="w-full h-10 rounded-xl bg-neutral-900 text-neutral-400 text-xs font-medium hover:text-white hover:bg-neutral-800 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border border-neutral-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Form Cache &amp; Reload</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
