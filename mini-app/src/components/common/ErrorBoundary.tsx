import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { t } from '@/hooks/useLocale';
import { errorBoundaryStrings } from '@/utils/translations';
import type { Locale } from '@/utils/categories';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const locale = (localStorage.getItem('miyzapis_locale') || 'uk') as Locale;
      const s = (key: string) => t(errorBoundaryStrings, key, locale);
      return (
        <div className="flex items-center justify-center min-h-screen bg-bg-primary p-6">
          <div className="bg-bg-card rounded-2xl border border-white/5 shadow-card p-6 text-center max-w-sm w-full">
            <div className="w-14 h-14 rounded-full bg-accent-red/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-accent-red" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              {s('title')}
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              {s('message')}
            </p>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-primary text-white rounded-xl font-medium text-sm active:scale-95 transition-transform"
            >
              <RefreshCw size={16} />
              {s('tryAgain')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
