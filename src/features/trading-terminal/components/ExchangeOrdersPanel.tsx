import { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { type SortingState } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table/data-table';
import EmptyState from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTradingPairsFromContext } from '@/contexts/ExchangeDataContext';
import { useTransformedExchanges } from '@/hooks/useTransformedExchanges';
import { useImportMutations } from '@/hooks/useImportMutations';
import {
  useExchangeOrders,
  useExchangePositions,
} from '@/hooks/useExchangeOrdersPositions';
import type { Order, Position } from '@/types/bots/trading';
import {
  addSymbolToOrders,
  addSymbolToPositions,
  buildOrderColumns,
  buildPositionColumns,
  type RowOrder,
  type RowPosition,
} from './exchangeOrderColumns';

type ShownTab = 'orders' | 'positions';

type ConfirmKind =
  | 'cancelOrder'
  | 'cancelPosition'
  | 'cancelDeal'
  | 'importOrder'
  | 'importPosition';

// Verbatim legacy confirm copy (newlines render as two visual lines).
const CONFIRM_MESSAGES: Record<ConfirmKind, string> = {
  cancelOrder: 'Are you sure you want to cancel order?',
  cancelPosition: 'Are you sure you want to cancel the position?',
  importOrder:
    'Are you sure you want to import the order?\nIt will cancel the order on the exchange and open smart terminal bot',
  importPosition: 'Are you sure you want to import position?',
  cancelDeal:
    'Are you sure you want to cancel the order?\nIt will cancel the deal created by source bot',
};

// Map an enriched order row to the looser `Order` the mutation hook expects,
// carrying `dealId` through (trading.ts `Order` lacks it; the handler reads it
// off the extra field).
function toOrder(row: RowOrder): Order & { dealId?: string } {
  return {
    orderId: row.orderId,
    symbol: row.symbol,
    side: row.side,
    type: row.type,
    status: row.status,
    price: row.price,
    quantity: row.quantity,
    baseAssetName: row.baseAssetName ?? '',
    quoteAssetName: row.quoteAssetName ?? '',
    exchangeUUID: row.exchangeUUID,
    ...(row.exchangeName !== undefined ? { exchangeName: row.exchangeName } : {}),
    exchange: row.exchange,
    ...(row.botId !== undefined ? { botId: row.botId } : {}),
    ...(row.botType !== undefined ? { botType: row.botType } : {}),
    ...(row.botName !== undefined ? { botName: row.botName } : {}),
    ...(row.dealId !== undefined ? { dealId: row.dealId } : {}),
  };
}

function toPosition(row: RowPosition): Position {
  return {
    positionId: row.positionId,
    symbol: row.symbol,
    side: row.side,
    leverage: row.leverage,
    marginType: row.marginType,
    price: row.price,
    quantity: row.quantity,
    baseAssetName: row.baseAssetName ?? '',
    quoteAssetName: row.quoteAssetName ?? '',
    exchangeUUID: row.exchangeUUID,
    ...(row.exchangeName !== undefined ? { exchangeName: row.exchangeName } : {}),
    exchange: row.exchange,
    ...(row.botId !== undefined ? { botId: row.botId } : {}),
    ...(row.botType !== undefined ? { botType: row.botType } : {}),
    ...(row.botName !== undefined ? { botName: row.botName } : {}),
  };
}

const ORDERS_DEFAULT_SORT: SortingState = [{ id: 'created', desc: true }];
const POSITIONS_DEFAULT_SORT: SortingState = [{ id: 'created', desc: true }];

/**
 * Trading Terminal "Exchange" tab: raw open exchange orders & positions with
 * per-row Cancel / Import actions. Ported from the legacy `TradingPositions`.
 * Only the active sub-tab is fetched; every successful action and the refresh
 * button refetch the active sub-tab.
 */
export function ExchangeOrdersPanel() {
  const [shownTab, setShownTab] = useState<ShownTab>('orders');
  const [exchangeUUID, setExchangeUUID] = useState<string>('all');
  const [ordersSorting, setOrdersSorting] =
    useState<SortingState>(ORDERS_DEFAULT_SORT);
  const [positionsSorting, setPositionsSorting] = useState<SortingState>(
    POSITIONS_DEFAULT_SORT
  );
  const [confirm, setConfirm] = useState<{
    kind: ConfirmKind;
    run: () => void;
  } | null>(null);

  const { exchanges } = useTransformedExchanges();
  const { pairsByExchange } = useTradingPairsFromContext();

  const ordersQ = useExchangeOrders(exchangeUUID, shownTab === 'orders');
  const positionsQ = useExchangePositions(
    exchangeUUID,
    shownTab === 'positions'
  );

  const refetchActive = () =>
    shownTab === 'orders' ? ordersQ.refetch() : positionsQ.refetch();

  const {
    handleImportOrder,
    handleImportPosition,
    handleCancelOrder,
    handleCancelPosition,
  } = useImportMutations({ onSuccess: refetchActive });

  const orderColumns = useMemo(
    () =>
      buildOrderColumns({
        onCancel: (row) =>
          setConfirm({
            kind: row.botId && row.dealId ? 'cancelDeal' : 'cancelOrder',
            run: () => handleCancelOrder(toOrder(row)),
          }),
        onImport: (row) =>
          setConfirm({
            kind: 'importOrder',
            run: () => handleImportOrder(toOrder(row)),
          }),
      }),
    [handleCancelOrder, handleImportOrder]
  );

  const positionColumns = useMemo(
    () =>
      buildPositionColumns({
        onCancel: (row) =>
          setConfirm({
            kind: 'cancelPosition',
            run: () => handleCancelPosition(toPosition(row)),
          }),
        onImport: (row) =>
          setConfirm({
            kind: 'importPosition',
            run: () => handleImportPosition(toPosition(row)),
          }),
      }),
    [handleCancelPosition, handleImportPosition]
  );

  const orderRows = useMemo(
    () => addSymbolToOrders(ordersQ.orders, pairsByExchange),
    [ordersQ.orders, pairsByExchange]
  );
  const positionRows = useMemo(
    () => addSymbolToPositions(positionsQ.positions, pairsByExchange),
    [positionsQ.positions, pairsByExchange]
  );

  // Defensive select value: fall back to 'all' when the stored id isn't loaded.
  const selectValue = exchanges.find((e) => e.id === exchangeUUID)
    ? exchangeUUID
    : 'all';

  const activeLoading =
    shownTab === 'orders' ? ordersQ.isLoading : positionsQ.isLoading;
  const activeError = shownTab === 'orders' ? ordersQ.error : positionsQ.error;
  const activeHasData =
    shownTab === 'orders' ? orderRows.length > 0 : positionRows.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-sm px-md py-sm">
        <Tabs value={shownTab} onValueChange={(v) => setShownTab(v as ShownTab)}>
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="positions">Positions</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-xs">
          <Select value={selectValue} onValueChange={setExchangeUUID}>
            <SelectTrigger className="h-8 w-40">
              <SelectValue placeholder="All Exchanges" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Exchanges</SelectItem>
              <SelectSeparator />
              {exchanges
                .filter((e) => e.id !== 'ALL')
                .map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={refetchActive}
            title="Refresh data"
            aria-label="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeLoading && !activeHasData ? (
          <div className="flex flex-col gap-sm px-md py-sm">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : activeError ? (
          <div className="px-md py-sm text-sm text-destructive">
            Failed to load {shownTab}.
          </div>
        ) : shownTab === 'orders' ? (
          <DataTable<RowOrder, unknown>
            tableId="terminal-raw-orders"
            columns={orderColumns}
            data={orderRows}
            getRowId={(r) =>
              r.exchange + r.symbol + new Date(r.created).getTime()
            }
            sorting={ordersSorting}
            onSortingChange={setOrdersSorting}
            enableGlobalFilter
            enableColumnFilters
            enableSorting
            enableColumnVisibility
            enableQuickFilterBar
            quickFilterBarStorageKey="terminal-raw-orders-filters"
            defaultPinnedColumns={{ left: [], right: ['actions'] }}
            className="flex-1"
            emptyContent={
              <EmptyState size="page" title="No active orders" />
            }
          />
        ) : (
          <DataTable<RowPosition, unknown>
            tableId="terminal-positions"
            columns={positionColumns}
            data={positionRows}
            getRowId={(r) => r.positionId}
            sorting={positionsSorting}
            onSortingChange={setPositionsSorting}
            enableGlobalFilter
            enableColumnFilters
            enableSorting
            enableColumnVisibility
            enableQuickFilterBar
            quickFilterBarStorageKey="terminal-positions-filters"
            defaultPinnedColumns={{ left: [], right: ['actions'] }}
            className="flex-1"
            emptyContent={
              <EmptyState size="page" title="No active positions" />
            }
          />
        )}
      </div>

      <Dialog
        open={!!confirm}
        onOpenChange={(o) => {
          if (!o) setConfirm(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm the action</DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {confirm ? CONFIRM_MESSAGES[confirm.kind] : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant={
                confirm?.kind.startsWith('cancel') ? 'destructive' : 'default'
              }
              onClick={() => {
                confirm?.run();
                setConfirm(null);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ExchangeOrdersPanel;
