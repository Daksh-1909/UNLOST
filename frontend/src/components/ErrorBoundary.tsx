import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

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
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-5">
          <div className="p-4 rounded-2xl bg-danger/10 text-danger border border-danger/20 shadow-lg">
            <AlertTriangle className="h-12 w-12" />
          </div>
          <div className="space-y-2 max-w-md">
            <h2 className="text-2xl font-bold font-heading text-text">Something went wrong</h2>
            <p className="text-sm text-textSecondary leading-relaxed">
              An unexpected error occurred while rendering this view.
            </p>
            {this.state.error?.message && (
              <p className="text-xs font-mono text-danger/80 bg-danger/5 border border-danger/20 p-2.5 rounded-lg mt-2 text-left overflow-auto max-h-24">
                {this.state.error.message}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl shadow-md hover:bg-primary/90 flex items-center gap-2 cursor-pointer transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reload Page</span>
            </button>
            <a
              href="/"
              className="px-4 py-2 bg-surface text-textSecondary hover:text-text border border-white/10 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Return Home</span>
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
