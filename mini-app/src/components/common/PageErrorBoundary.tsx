import React, { Component, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

const ErrorFallback: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="flex items-center justify-center min-h-[60vh] p-6">
    <div className="bg-bg-card rounded-2xl border border-white/5 shadow-card p-6 text-center max-w-sm w-full">
      <div className="w-12 h-12 rounded-full bg-accent-red/10 flex items-center justify-center mx-auto mb-3">
        <AlertTriangle size={24} className="text-accent-red" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">Page Error</h3>
      <p className="text-sm text-text-secondary mb-4">This page encountered an error.</p>
      <div className="flex gap-2 justify-center">
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent-primary text-white rounded-xl text-sm active:scale-95 transition-transform"
        >
          <RefreshCw size={14} />
          Retry
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-bg-secondary text-text-primary rounded-xl text-sm active:scale-95 transition-transform"
        >
          <Home size={14} />
          Home
        </button>
      </div>
    </div>
  </div>
);

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Page error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}
