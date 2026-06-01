import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { GraphQLClient } from '@/lib/api/GraphQLClient';
import { otherQueries } from '@/lib/api/GraphQLQueries-other-queries';
import { useAuthStore } from '@/stores/authStore';
import { logger } from '@/lib/loggerInstance';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  componentStack?: string;
}

/**
 * Global error boundary that catches all unhandled React errors,
 * renders a retry UI, and reports crash details to the backend.
 */
export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const token = useAuthStore.getState().tokens?.accessToken;

    const errorMessage = `Page: ${window.location.href}, Message: ${error.message || ''}`;
    const errorStack = error.stack || '';
    const componentStack = errorInfo.componentStack || '';

    logger.error('[AppErrorBoundary] Unhandled error:', {
      message: errorMessage,
      stack: errorStack,
      componentStack,
    });

    this.setState({ componentStack });

    const endpoint =
      import.meta.env['VITE_API_ENDPOINT'] || 'http://localhost:4000';
    const client = new GraphQLClient(endpoint, token);

    const { query, variables } = otherQueries.sendError({
      error: { message: errorMessage, stack: errorStack },
      errorInfo: { componentStack },
      subType: 'Browser',
      source: 'v2',
    });

    client
      .request(query, variables)
      .catch((err) => {
        logger.error('[AppErrorBoundary] Failed to send error to backend:', err);
      });
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  handleReload = () => {
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      const { error, componentStack } = this.state;

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
            <h2 className="text-xl font-semibold text-destructive">
              Something went wrong
            </h2>
          </div>

          <p className="text-muted-foreground mb-6 text-center max-w-md">
            An unexpected error occurred. You can try again or reload the page.
          </p>

          {error && (
            <details className="mb-6 text-left max-w-lg w-full">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-muted rounded text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all">
                {error.message}
                {error.stack ? `\n\n${error.stack}` : ''}
                {componentStack ? `\n\nComponent stack:${componentStack}` : ''}
              </div>
            </details>
          )}

          <div className="flex gap-3">
            <Button onClick={this.handleRetry} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={this.handleReload} variant="destructive">
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
