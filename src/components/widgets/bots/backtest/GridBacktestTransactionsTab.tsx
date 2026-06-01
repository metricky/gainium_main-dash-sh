import { DataTable } from '@/components/ui/data-table/data-table';
import type {
  GRIDBacktestingResultHistory,
  PreparedTransaction,
} from '@/types';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

interface GridBacktestTransactionsTabProps {
  backtest: GRIDBacktestingResultHistory;
}

const formatUsd = (value: number | undefined | null) => {
  if (value === undefined || value === null) return '-';
  return `$${value.toFixed(2)}`;
};

export function GridBacktestTransactionsTab({
  backtest,
}: GridBacktestTransactionsTabProps) {
  const columns = useMemo<ColumnDef<PreparedTransaction>[]>(
    () => [
      {
        accessorKey: 'index',
        header: '#',
        cell: ({ row }) => <div className="text-sm">{row.original.index}</div>,
      },
      {
        accessorKey: 'updateTime',
        header: 'Time',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {row.original.updateTime
              ? new Date(row.original.updateTime).toLocaleString()
              : '-'}
          </div>
        ),
      },
      {
        accessorKey: 'side',
        header: 'Side',
        cell: ({ row }) => (
          <div className="text-sm">{String(row.original.side ?? '-')}</div>
        ),
      },
      {
        accessorKey: 'priceBuy',
        header: 'Buy price',
        cell: ({ row }) => (
          <div className="text-sm tabular-nums">
            {row.original.priceBuy || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'priceSell',
        header: 'Sell price',
        cell: ({ row }) => (
          <div className="text-sm tabular-nums">
            {row.original.priceSell || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'amountQuoteBuy',
        header: 'Quote buy',
        cell: ({ row }) => (
          <div className="text-sm tabular-nums">
            {row.original.amountQuoteBuy || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'amountQuoteSell',
        header: 'Quote sell',
        cell: ({ row }) => (
          <div className="text-sm tabular-nums">
            {row.original.amountQuoteSell || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'profitUsd',
        header: 'P&L (USD)',
        cell: ({ row }) => {
          const value = row.original.profitUsd;
          return <div className="text-sm tabular-nums">{formatUsd(value)}</div>;
        },
      },
      {
        id: 'profitPerc',
        header: 'P&L %',
        cell: (/* { row } */) => {
          // PreparedTransaction doesn’t include a percent; show nothing.
          // Keep the column so layout matches other tables.
          return <span className="text-muted-foreground">-</span>;
        },
      },
    ],
    []
  );

  const rows = backtest.transaction ?? [];

  return (
    <div className="h-full w-full p-0">
      <DataTable
        tableId={`grid-backtest-transactions-${backtest._id}`}
        columns={columns}
        data={rows}
        enableGlobalFilter={true}
        enableSorting={true}
        enableColumnVisibility={true}
        showPagination={true}
        initialPageSize={10}
        emptyMessage="No transactions"
        className="h-full"
      />
    </div>
  );
}
