import { AlertTriangle, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { useMemo, type ComponentType } from 'react';

import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { GridCurrency, GridTransactionsState } from '@/types/bots/grid';

interface TransactionsPanelProps {
  transactions: GridTransactionsState;
  currency: GridCurrency;
  formatAmount: (
    value: number,
    options?: { currency?: GridCurrency; maximumFractionDigits?: number }
  ) => string;
  formatDateTime: (value: number | string | Date) => string;
}

const SIDE_META: Record<
  string,
  { icon: ComponentType<{ className?: string }>; tone: string; label: string }
> = {
  buy: { icon: ArrowDownCircle, tone: 'text-sky-500', label: 'Buy' },
  sell: { icon: ArrowUpCircle, tone: 'text-warning', label: 'Sell' },
};

export const TransactionsPanel: React.FC<TransactionsPanelProps> = ({
  transactions,
  currency,
  formatAmount,
  formatDateTime,
}) => {
  const recentTransactions = useMemo(
    () => transactions.rows.slice(0, 15),
    [transactions.rows]
  );
  const hasRows = recentTransactions.length > 0;

  return (
    <Card className="space-y-md border-border/60 bg-card/70 p-5">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recent Transactions
        </h3>
        <p className="text-xs text-muted-foreground">
          Closed orders and bot profit contributions
        </p>
      </div>

      {transactions.error && (
        <div className="flex items-center gap-xs rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="h-4 w-4" />
          {transactions.error}
        </div>
      )}

      <div className="rounded-lg border border-border/60 bg-background/50">
        {hasRows ? (
          <ScrollArea className="max-h-[360px]">
            <ul className="divide-y divide-border/40 text-sm">
              {recentTransactions.map((transaction) => {
                const sideKey = transaction.side?.toLowerCase();
                const meta = SIDE_META[sideKey ?? ''] ?? SIDE_META['buy'];
                const Icon = meta.icon;

                return (
                  <li
                    key={transaction.id}
                    className="flex flex-col gap-xs px-4 py-3 odd:bg-background/40 even:bg-background/20"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex items-center gap-xs font-medium ${meta.tone}`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="capitalize">{meta.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(transaction.time)}
                      </span>
                    </div>
                    <div className="grid gap-xs sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">
                          Price
                        </p>
                        <p className="text-sm font-medium text-card-foreground">
                          {formatAmount(transaction.price, {
                            currency: 'quote',
                            maximumFractionDigits: 4,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">
                          Amount
                        </p>
                        <p className="text-sm font-medium text-card-foreground">
                          {formatAmount(transaction.amountBase, {
                            currency: 'base',
                            maximumFractionDigits: 4,
                          })}
                          <span className="text-muted-foreground"> · </span>
                          {formatAmount(transaction.amountQuote, {
                            currency: 'quote',
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-xs sm:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">
                          Profit (Base)
                        </p>
                        <p className="text-sm font-medium text-emerald-500">
                          {formatAmount(transaction.profitBase, {
                            currency: 'base',
                            maximumFractionDigits: 4,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">
                          Profit (Quote)
                        </p>
                        <p className="text-sm font-medium text-emerald-500">
                          {formatAmount(transaction.profitQuote, {
                            currency: 'quote',
                            maximumFractionDigits: 4,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">
                          Profit ({currency.toUpperCase()})
                        </p>
                        <p className="text-sm font-medium text-emerald-500">
                          {formatAmount(transaction.profitUsd ?? 0, {
                            currency,
                            maximumFractionDigits: currency === 'usd' ? 2 : 4,
                          })}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center gap-xs px-6 py-10 text-center text-sm text-muted-foreground">
            No executed transactions yet.
          </div>
        )}
      </div>
    </Card>
  );
};

export default TransactionsPanel;
