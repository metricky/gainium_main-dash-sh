import { cn } from '@/lib/utils';
import { exampleOrdersStore } from '@/utils/bots/dca/example-orders';
import {
  CheckCircle,
  ChevronDown,
  Clock,
  Copy,
  ShoppingCart,
  Sparkles,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import logger from '../../lib/loggerInstance';
import { formatCurrency } from '../../lib/utils';
import { toast } from '@/lib/toast';
import {
  StrategyEnum,
  type AddFundsSettings,
  type DCAGrid,
  type TransactionChart,
} from '../../types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { ConfirmationDialog } from '../ui/confirmation-dialog';
import { ProgressBar } from '../ui/ProgressBar';
import { useCancelOrder } from '@/hooks/useOrderActions';
import { useOrderStore } from '@/stores/live/orderStore';
import type { ViewOrder } from '@/types/bots';
import type { SmartViewOrder } from '@/hooks/bots/dca/useDealSmartOrders';

type PendingFundsEntry = AddFundsSettings & { id: string };

type OrderRowModel = ViewOrder & { __smart?: boolean };

interface DealOrdersSectionProps {
  dealId: string;
  botId: string;
  botType: 'DCA' | 'Combo' | 'Hedge DCA' | 'Hedge Combo' | 'Grid' | 'Terminal';
  exchange?: string;
  pendingOrders: ViewOrder[];
  completedOrders: ViewOrder[];
  isLoadingOrders: boolean;
  chartOrders?: DCAGrid[];
  chartTransactions?: TransactionChart[];
  /** Projected, not-yet-placed "smart order" ladder levels (parity w/ legacy). */
  smartOrders?: SmartViewOrder[];
  /** Sort direction for the ladder (long = high→low). */
  strategy?: StrategyEnum;
  /**
   * Deal's pending manual "add funds" requests. A pending order whose limit
   * price matches one of these is canceled via `cancelPendingAddFundsDealOrder`
   * (it tears down the pending request + the placed order), mirroring legacy.
   */
  pendingAddFunds?: PendingFundsEntry[];
  /** Deal's pending manual "reduce funds" requests (see `pendingAddFunds`). */
  pendingReduceFunds?: PendingFundsEntry[];
}

// mapOrderName utility now imported from @/utils/mapOrderName

export const DealOrdersSection: React.FC<DealOrdersSectionProps> = ({
  dealId,
  botId,
  botType,
  exchange,
  pendingOrders: _pendingOrders,
  completedOrders: _completedOrders,
  isLoadingOrders: isLoading,
  chartOrders = [],
  chartTransactions = [],
  smartOrders = [],
  strategy = StrategyEnum.long,
  pendingAddFunds = [],
  pendingReduceFunds = [],
}) => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<OrderRowModel | null>(null);
  const {
    cancelTerminalOrder,
    cancelPendingOrder,
    isLoading: isCanceling,
  } = useCancelOrder();

  // Debug logging
  if (import.meta.env.DEV) {
    logger.info('[DealOrdersSection] Initialized with:', {
      dealId,
      botId,
      botType,
      exchange,
    });
  }

  // Get pending and completed orders for this deal
  const pendingOrders = useMemo(() => {
    return _pendingOrders.filter((o) => o.dealId === dealId);
  }, [_pendingOrders, dealId]);

  const completedOrders = useMemo(() => {
    return _completedOrders.filter((o) => o.dealId === dealId);
  }, [_completedOrders, dealId]);

  useEffect(() => {
    return () => {
      exampleOrdersStore.setOrders([]);
      exampleOrdersStore.setTransactions([]);
    };
  }, []);

  useEffect(() => {
    exampleOrdersStore.setOrders(chartOrders);
  }, [chartOrders]);

  useEffect(() => {
    exampleOrdersStore.setTransactions(chartTransactions);
  }, [chartTransactions]);

  // Handle expanding/collapsing order details
  const handleToggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Utility function to copy order ID
  const handleCopyOrderId = async (orderId: string) => {
    try {
      await navigator.clipboard.writeText(orderId);
    } catch (error) {
      console.error('Failed to copy order ID:', error);
    }
  };

  // Legacy parity (main-dash `setCancelOrderOrPendingAddFunds`): a placed order
  // that lines up by limit price with a pending manual add/reduce-funds request
  // must be canceled through the pending-add-funds mutation (which tears down
  // both the request and the placed order); everything else is a plain terminal
  // order cancel.
  const findPendingFundsForOrder = (
    order: OrderRowModel
  ): PendingFundsEntry | null => {
    const matchesPrice = (p: PendingFundsEntry) =>
      p.useLimitPrice && p.limitPrice ? +p.limitPrice === +order.price : false;
    return (
      pendingAddFunds.find(matchesPrice) ??
      pendingReduceFunds.find(matchesPrice) ??
      null
    );
  };

  // Mirrors legacy `shouldHaveCancel`: only real (non-projected) open DCA /
  // add-funds / reduce-funds orders are cancellable. Grid orders use a
  // different cancellation path and are excluded.
  const isOrderCancellable = (order: OrderRowModel): boolean => {
    if (order.__smart) return false;
    if (botType === 'Grid') return false;
    if (order.status !== 'pending' && order.status !== 'partial') return false;
    return order.typeOrder === 'dealRegular' || !!order.reduceFundsId;
  };

  const handleConfirmCancel = async () => {
    const order = cancelTarget;
    setCancelTarget(null);
    if (!order) return;

    const pending = findPendingFundsForOrder(order);
    try {
      if (pending) {
        await cancelPendingOrder({ dealId, botId, orderId: pending.id });
      } else {
        await cancelTerminalOrder({
          dealId,
          botId,
          orderId: order.clientOrderId,
        });
      }
      // The order store only ever merges fetched orders — it never drops one
      // the backend stops returning. Remove it locally so a canceled order
      // disappears immediately instead of lingering (the V2 "still shows" bug).
      useOrderStore.getState().removeOrder(botId, order.clientOrderId, 'new');
      if (expandedOrderId === order.id) {
        setExpandedOrderId(null);
      }
      toast.success('Order canceled');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to cancel order'
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'filled':
        return 'bg-success/10 text-success border-success/20';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'partial':
        return 'bg-info/10 text-info border-info/20';
      case 'new':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3 h-3" />;
      case 'filled':
        return <CheckCircle className="w-3 h-3" />;
      case 'cancelled':
        return <XCircle className="w-3 h-3" />;
      case 'partial':
        return <Clock className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const OrderRow: React.FC<{ order: OrderRowModel }> = ({ order }) => {
    const isBuy = order.type === 'buy';
    const isSmart = !!order.__smart;
    const fillPercentage =
      order.amount > 0 ? (order.filled / order.amount) * 100 : 0;
    const isExpanded = !isSmart && expandedOrderId === order.id;
    const statusKey = isSmart ? 'new' : order.status;
    const statusLabel = isSmart ? 'new' : order.status;

    const handleRowClick = (e: React.MouseEvent) => {
      if (isSmart) {
        return;
      }
      if ((e.target as HTMLElement).closest('button')) {
        return;
      }
      handleToggleExpand(order.id);
    };

    return (
      <div
        className={cn(
          'rounded-lg overflow-hidden transition-colors',
          isSmart ? 'bg-muted/25' : 'bg-muted/40'
        )}
      >
        {/* Order Summary Row */}
        <div
          className={cn(
            'p-md transition-colors',
            isSmart ? 'cursor-default' : 'cursor-pointer hover:bg-muted'
          )}
          onClick={handleRowClick}
        >
          <div className="flex items-center justify-between gap-md">
            {/* Left: Order Type & Status */}
            <div className="flex items-center gap-sm min-w-0 flex-1">
              <div
                className={cn(
                  'p-xs rounded-lg',
                  isSmart
                    ? 'bg-muted text-muted-foreground'
                    : isBuy
                    ? 'bg-success/10 text-success'
                    : 'bg-destructive/10 text-destructive'
                )}
              >
                {isSmart ? (
                  <Sparkles className="w-5 h-5" />
                ) : isBuy ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <span
                  className={cn(
                    'text-sm font-semibold mb-1',
                    isSmart ? 'text-muted-foreground' : 'text-foreground'
                  )}
                >
                  {order.orderType || 'LIMIT'}
                </span>
                <div className="flex items-center gap-xs flex-wrap">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs border px-2 py-0.5',
                      getStatusColor(statusKey)
                    )}
                  >
                    <span className="flex items-center gap-1">
                      {getStatusIcon(statusKey)}
                      {statusLabel}
                    </span>
                  </Badge>
                </div>
              </div>
            </div>

            {/* Center: Price & Amount */}
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium">
                {formatCurrency(order.price)}
              </span>
              <span className="text-xs text-muted-foreground">
                {order.amount.toFixed(6)}
              </span>
            </div>

            {/* Right: Total & Expand */}
            <div className="flex items-center gap-sm">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold">
                  {formatCurrency(order.total)}
                </span>
                {order.status === 'partial' && !isSmart && (
                  <span className="text-xs text-muted-foreground">
                    {fillPercentage.toFixed(0)}% filled
                  </span>
                )}
              </div>
              {!isSmart && (
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-muted-foreground transition-transform',
                    isExpanded && 'rotate-180'
                  )}
                />
              )}
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="px-md pb-md pt-sm bg-background/60">
            <div className="space-y-md">
              {/* Progress Bar for Partial Fills */}
              {order.status === 'partial' && (
                <div className="space-y-xs">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Fill Progress</span>
                    <span className="font-medium">
                      {order.filled.toFixed(6)} / {order.amount.toFixed(6)}
                    </span>
                  </div>
                  <ProgressBar
                    value={fillPercentage}
                    variant={fillPercentage === 100 ? 'success' : 'default'}
                    size="sm"
                  />
                </div>
              )}

              {/* Order Details Grid */}
              <div className="grid grid-cols-2 gap-md">
                <div className="space-y-sm">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Order Price
                    </span>
                    <span className="text-sm font-medium">
                      {formatCurrency(order.price)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Amount
                    </span>
                    <span className="text-sm font-medium">
                      {order.amount.toFixed(6)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Filled
                    </span>
                    <span className="text-sm font-medium">
                      {order.filled.toFixed(6)}
                    </span>
                  </div>
                </div>

                <div className="space-y-sm">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Total Value
                    </span>
                    <span className="text-sm font-medium">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Remaining
                    </span>
                    <span className="text-sm font-medium">
                      {order.remaining.toFixed(6)}
                    </span>
                  </div>
                  {order.executedPrice &&
                    order.executedQuantity &&
                    order.executedQuantity > 0 && (
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">
                          Avg. Executed Price
                        </span>
                        <span className="text-sm font-medium">
                          {formatCurrency(order.executedPrice)}
                        </span>
                      </div>
                    )}
                </div>
              </div>

              {/* Order ID */}
              <div className="flex items-center justify-between pt-sm">
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground mb-1">
                    Order ID
                  </span>
                  <span className="text-xs font-mono text-foreground truncate">
                    {order.id}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyOrderId(order.id)}
                  className="shrink-0"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-md text-xs">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">
                    {new Date(order.createTime).toLocaleString()}
                  </span>
                </div>
                {order.updateTime && (
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Updated</span>
                    <span className="font-medium">
                      {new Date(order.updateTime).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Cancel action — only for cancellable open orders */}
              {isOrderCancellable(order) && (
                <div className="flex justify-end pt-sm">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isCanceling}
                    onClick={() => setCancelTarget(order)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    {isCanceling ? 'Canceling…' : 'Cancel order'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Real orders + projected smart-order levels, sorted as a ladder by price
  // (long: high→low, short: low→high) so the deal reads top-to-bottom.
  const allOrders = useMemo<OrderRowModel[]>(() => {
    const isLong = strategy === StrategyEnum.long;
    return [...pendingOrders, ...completedOrders, ...smartOrders].sort((a, b) =>
      isLong ? b.price - a.price : a.price - b.price
    );
  }, [pendingOrders, completedOrders, smartOrders, strategy]);

  if (isLoading) {
    return (
      <Card className="p-lg">
        <div className="flex items-center gap-xs mb-4">
          <ShoppingCart className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Orders</h3>
        </div>
        <div className="text-center text-muted-foreground py-8">
          Loading orders...
        </div>
      </Card>
    );
  }

  const totalOrders =
    pendingOrders.length + completedOrders.length + smartOrders.length;

  if (totalOrders === 0) {
    return (
      <Card className="p-lg">
        <div className="flex items-center gap-xs mb-4">
          <ShoppingCart className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Orders</h3>
        </div>
        <div className="text-center text-muted-foreground py-8">
          <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No orders found for this deal</p>
        </div>
      </Card>
    );
  }

  // Combine all orders and sort by time (most recent first)

  return (
    <Card className="p-lg">
      <div className="flex items-center justify-between mb-md">
        <div className="flex items-center gap-xs">
          <ShoppingCart className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Orders</h3>
        </div>
        <div className="flex items-center gap-md text-sm">
          <div className="flex items-center gap-xs text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{pendingOrders.length} Pending</span>
          </div>
          <div className="flex items-center gap-xs text-muted-foreground">
            <CheckCircle className="w-4 h-4" />
            <span>{completedOrders.length} Completed</span>
          </div>
          {smartOrders.length > 0 && (
            <div className="flex items-center gap-xs text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              <span>{smartOrders.length} Smart</span>
            </div>
          )}
        </div>
      </div>

      {allOrders.length > 0 ? (
        <div className="space-y-xs">
          {allOrders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No orders available</p>
        </div>
      )}

      <ConfirmationDialog
        open={!!cancelTarget}
        onOpenChange={(isOpen) => !isOpen && setCancelTarget(null)}
        title="Cancel order"
        description={
          cancelTarget
            ? `Cancel this ${
                cancelTarget.type === 'buy' ? 'buy' : 'sell'
              } order for ${cancelTarget.amount.toFixed(6)} @ ${formatCurrency(
                cancelTarget.price
              )}? This action cannot be undone.`
            : ''
        }
        confirmText="Cancel order"
        cancelText="Keep order"
        variant="destructive"
        onConfirm={handleConfirmCancel}
      />
    </Card>
  );
};
