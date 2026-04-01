'use client';

import { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Something went wrong</h2>
          <p className="text-[var(--text-secondary)] mb-6">An unexpected error occurred.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-accent text-[var(--text-on-accent)] rounded-xl font-semibold"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
