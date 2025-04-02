'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log the error to console
    console.error('Error caught by error boundary:', error, errorInfo);

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRefresh = (): void => {
    // For client-side components, we can reset the error state
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleFullRefresh = (): void => {
    // Full page refresh
    window.location.reload();
  };

  public render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, componentName } = this.props;

    if (hasError) {
      // If a custom fallback is provided, use it
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="border border-red-500/20 bg-red-950/20 rounded-md p-4 my-4 text-white">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-300">
                {componentName ? `Error in ${componentName}` : 'Component Error'}
              </h3>

              <div className="mt-2 text-sm text-red-200/80">
                <p>{error?.message || 'An unexpected error occurred'}</p>

                {process.env.NODE_ENV === 'development' && error?.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-red-300/70">
                      Error details
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto p-2 bg-black/20 rounded text-red-200/70">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>

              <div className="mt-4 flex space-x-3">
                <button
                  onClick={this.handleRefresh}
                  className="flex items-center text-xs px-2 py-1 rounded-sm bg-red-500/20 hover:bg-red-500/30 text-red-200 transition-colors"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Try Again
                </button>

                <button
                  onClick={this.handleFullRefresh}
                  className="text-xs px-2 py-1 rounded-sm bg-red-500/10 hover:bg-red-500/20 text-red-200/70 transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default GlobalErrorBoundary;
