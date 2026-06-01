/* eslint-disable @typescript-eslint/no-unused-vars */
import type { ReactNode } from 'react';
import '@tanstack/react-table';

declare module '@tanstack/react-table' {
  // Used by the app's DataTable footer totals renderer.
  // This is a runtime-supported extension (see data-table-footer.tsx).
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
  interface ColumnDefBase<TData extends unknown, TValue = unknown> {
    footerValue?: (value: number) => ReactNode;
  }
}
