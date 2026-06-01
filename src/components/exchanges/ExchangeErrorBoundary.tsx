/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { logger } from '@/lib/loggerInstance';

export interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error | undefined;
  errorInfo?: ErrorInfo | undefined;
}

/**
 * Error boundary specifically for exchange-related components
 * Provides graceful error handling and recovery options
 */
export class ExchangeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    logger.error('Exchange Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Report to error tracking service if available
    if (typeof window !== 'undefined' && (window as any).reportError) {
      (window as any).reportError(error, {
        context: 'ExchangeErrorBoundary',
        componentStack: errorInfo.componentStack,
      });
    }
  }

  handleRetry = () => {
    // Reset error state to retry rendering
    this.setState({ hasError: false });
  };

  handleReload = () => {
    // Reload the page as a last resort
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      const { fallbackTitle = 'Exchange System Error', fallbackMessage } =
        this.props;
      const { error } = this.state;

      return (
        <div className="flex flex-col items-center justify-center p-xl bg-background border border-destructive/20 rounded-lg">
          <div className="flex items-center gap-sm mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
            <h2 className="text-xl font-semibold text-destructive">
              {fallbackTitle}
            </h2>
          </div>

          <div className="text-center mb-6 max-w-md">
            <p className="text-muted-foreground mb-2">
              {fallbackMessage ||
                'An unexpected error occurred while loading the exchange management system.'}
            </p>

            {error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Technical Details
                </summary>
                <div className="mt-2 p-sm bg-muted rounded text-xs font-mono text-muted-foreground">
                  <div className="mb-2">
                    <strong>Error:</strong> {error.message}
                  </div>
                  {error.stack && (
                    <div className="whitespace-pre-wrap break-all">
                      <strong>Stack:</strong> {error.stack.slice(0, 500)}
                      {error.stack.length > 500 && '...'}
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>

          <div className="flex gap-sm">
            <Button onClick={this.handleRetry} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={this.handleReload} variant="destructive">
              Reload Page
            </Button>
          </div>

          <div className="mt-6 text-xs text-muted-foreground text-center">
            <p>If this problem persists, please contact support.</p>
            <p className="mt-1">Error ID: {Date.now().toString(36)}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ExchangeErrorBoundary;
