import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

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
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.href = window.location.origin + window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-paper text-ink font-sans flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md p-8 bg-card border border-rule space-y-6">
            <div className="w-16 h-16 mx-auto pen-circle text-marker flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="font-display font-bold uppercase text-2xl text-ink tracking-wide">Something went wrong</h2>
              <p className="text-sm text-pencil">
                The app hit an unexpected error, usually from outdated or corrupted saved schedule data.
              </p>
            </div>
            {this.state.error && (
              <pre className="text-left bg-paper border border-rule p-4 rounded-none text-xs font-data text-marker overflow-auto max-h-40">
                {this.state.error.message}
              </pre>
            )}
            <div className="pt-2">
              <button
                onClick={this.handleReset}
                className="w-full py-3 px-6 rounded-none bg-marker hover:bg-marker/90 active:bg-marker/80 text-paper font-bold text-sm uppercase tracking-[0.12em] font-data transition-colors"
              >
                Clear data and restart
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}