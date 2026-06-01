import React from 'react';
import ExchangeErrorBoundary, { type Props } from './ExchangeErrorBoundary';

/**
 * Higher-order component to wrap components with exchange error boundary
 */
export function withExchangeErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ExchangeErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ExchangeErrorBoundary>
  );

  WrappedComponent.displayName = `withExchangeErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
