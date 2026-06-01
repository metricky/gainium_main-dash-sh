import { useMemo, type ComponentProps } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  RefreshCw,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { GridCurrency, GridOrdersState } from '@/types/bots/grid';

interface OrdersActivityProps {
  orders: GridOrdersState;
  onTabChange: (tab: GridOrdersState['activeTab']) => void;
  formatAmount: (
    value: number,
    options?: { currency?: GridCurrency; maximumFractionDigits?: number }
  ) => string;
  formatDateTime: (value: number | string | Date) => string;
}

const STATUS_VARIANTS: Record<string, ComponentProps<typeof Badge>['variant']> =
  {
    open: 'secondary',
    new: 'secondary',
    filled: 'default',
    partial: 'secondary',
    cancelled: 'outline',
    closing: 'secondary',
    error: 'destructive',
  };

const SIDE_STYLES: Record<string, string> = {
  buy: 'text-emerald-500',
  sell: 'text-rose-500',
};

export const OrdersActivity: React.FC<OrdersActivityProps> = ({
  orders,
  onTabChange,
  formatAmount,
  formatDateTime,
}) => {
  const recentOrders = useMemo(() => orders.rows.slice(0, 12), [orders.rows]);
  const activeTab = orders.activeTab;
  const isLoading = orders.isLoading;
  const hasRows = recentOrders.length > 0;

  return (
    <Card className="space-y-md border-border/60 bg-card/70 p-5">
      <div className="flex items-center justify-between gap-xs">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Orders
          </h3>
          <p className="text-xs text-muted-foreground">
            Latest {activeTab === 'open' ? 'open' : 'completed'} orders
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={activeTab === 'open' ? 'default' : 'outline'}
            onClick={() => onTabChange('open')}
            className="gap-1"
          >
            <Layers className="h-3.5 w-3.5" />
            Open
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'completed' ? 'default' : 'outline'}
            onClick={() => onTabChange('completed')}
            className="gap-1"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Completed
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-xs rounded-md border border-border/60 bg-background/40 px-3 py-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          Loading orders...
        </div>
      )}

      {orders.error && !isLoading && (
        <div className="flex items-center gap-xs rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-4 w-4" />
          {orders.error}
        </div>
      )}

      <div className="rounded-lg border border-border/60 bg-background/50">
        {hasRows ? (
          <ScrollArea className="max-h-[320px]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-background/80 backdrop-blur">
                <tr className="text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Side</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Filled</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const side = order.side?.toLowerCase() ?? 'n/a';
                  const status = order.status?.toLowerCase() ?? 'unknown';

                  const filledPercent =
                    order.quantity > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (order.executedQuantity / order.quantity) * 100
                          )
                        )
                      : 0;

                  return (
                    <tr
                      key={order.id}
                      className="border-t border-border/40 text-sm text-card-foreground transition-colors odd:bg-background/40 even:bg-background/20 hover:bg-muted/30"
                    >
                      <td
                        className={`px-4 py-3 font-medium capitalize ${SIDE_STYLES[side] ?? 'text-card-foreground'}`}
                      >
                        {side}
                      </td>
                      <td className="px-4 py-3">
                        {formatAmount(order.price, {
                          currency: 'quote',
                          maximumFractionDigits: 4,
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-between gap-xs">
                          <span>
                            {formatAmount(order.executedQuantity, {
                              currency: 'base',
                              maximumFractionDigits: 4,
                            })}
                            <span className="text-muted-foreground"> / </span>
                            {formatAmount(order.quantity, {
                              currency: 'base',
                              maximumFractionDigits: 4,
                            })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {filledPercent}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={STATUS_VARIANTS[status] ?? 'outline'}
                          className="capitalize"
                        >
                          {status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDateTime(order.time)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center gap-xs px-6 py-10 text-center text-sm text-muted-foreground">
            <Layers className="h-6 w-6" />
            No {activeTab === 'open' ? 'open' : 'completed'} orders yet.
          </div>
        )}
      </div>
    </Card>
  );
};

export default OrdersActivity;
