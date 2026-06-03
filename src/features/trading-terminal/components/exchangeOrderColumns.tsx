import { type ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, MoreHorizontal, Upload, X } from 'lucide-react';

import CoinPair from '@/components/widgets/shared/CoinPair';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { math } from '@/lib/utils/math';
import { isCoinmExchange } from '@/utils/exchangeUtils';
import {
  BotMarginTypeEnum,
  BotTypesEnum,
  type GeneralOpenOrder,
  type GeneralOpenPosition,
} from '@/types';
import type { TradingPair } from '@/hooks/useTradingPairs';

export type Precision = { base: number; quote: number; price: number };

export type RowOrder = GeneralOpenOrder & {
  symbolFull?: TradingPair | undefined;
  precision: Precision;
};

export type RowPosition = GeneralOpenPosition & {
  symbolFull?: TradingPair | undefined;
  displayQuantity: string;
  precision: Precision;
};

/**
 * Legacy `botUtils.getPrecision(symbol)` shape. The legacy `getAssetPrecision`
 * algorithm is verbatim-ported in `math.getPrecisionFromDecimalString`, so we
 * derive base/quote precision from the pair's step / min-amount strings and
 * take price precision straight from `priceAssetPrecision`. Falls back to 8
 * when the pair metadata isn't loaded (same as legacy).
 */
export function getPrecision(symbolFull?: TradingPair): Precision {
  if (!symbolFull) {
    return { base: 8, quote: 8, price: 8 };
  }
  return {
    base: math.getPrecisionFromDecimalString(
      `${symbolFull.baseAsset.step}`,
      symbolFull.exchange
    ),
    quote: math.getPrecisionFromDecimalString(
      `${symbolFull.quoteAsset.minAmount}`,
      symbolFull.exchange
    ),
    price: symbolFull.priceAssetPrecision ?? 8,
  };
}

/** Enrich raw orders with the matching pair metadata + derived precision. */
export function addSymbolToOrders(
  orders: GeneralOpenOrder[],
  pairsByExchange: Record<string, TradingPair[]>
): RowOrder[] {
  return orders
    .map((o) => ({
      ...o,
      symbolFull: (pairsByExchange[o.exchange] ?? []).find(
        (s) =>
          s.exchange === o.exchange &&
          s.baseAsset.name === o.baseAssetName &&
          s.quoteAsset.name === o.quoteAssetName
      ),
    }))
    .map((o) => ({ ...o, precision: getPrecision(o.symbolFull) }));
}

/** Enrich raw positions with pair metadata, derived precision + displayQuantity. */
export function addSymbolToPositions(
  positions: GeneralOpenPosition[],
  pairsByExchange: Record<string, TradingPair[]>
): RowPosition[] {
  return positions
    .map((p) => ({
      ...p,
      symbolFull: (pairsByExchange[p.exchange] ?? []).find(
        (s) =>
          s.exchange === p.exchange &&
          s.baseAsset.name === p.baseAssetName &&
          s.quoteAsset.name === p.quoteAssetName
      ),
      displayQuantity: `${Math.abs(+p.quantity)}`,
    }))
    .map((p) => ({ ...p, precision: getPrecision(p.symbolFull) }));
}

// Shared bot-route mapping for the "Source" column (legacy A.§4.8).
function botRoute(botType?: string): string {
  switch (botType) {
    case BotTypesEnum.hedgeCombo:
      return 'hedge/combo';
    case BotTypesEnum.hedgeDca:
      return 'hedge/dca';
    case BotTypesEnum.dca:
      return 'bot';
    case BotTypesEnum.grid:
      return 'grid';
    case BotTypesEnum.combo:
      return 'combo';
    default:
      return 'terminal';
  }
}

function SourceCell({
  botId,
  botType,
  botName,
}: {
  botId?: string;
  botType?: string;
  botName?: string;
}) {
  if (!botId) {
    return <>Not linked to Gainium</>;
  }
  const route = botRoute(botType);
  return (
    <Link
      to={`/${route}/${botType !== 'terminal' ? botId : ''}`}
      onClick={(e) => e.stopPropagation()}
      className="text-primary hover:underline"
    >
      {botType !== 'terminal'
        ? `${botType}: ${botName ? botName : botId}`
        : 'Terminal'}
    </Link>
  );
}

// The legacy disabled rule (both Cancel + Import, both tabs): enabled ONLY
// when there's no source bot and both asset names resolved.
function rowEnabled(row: {
  botId?: string;
  baseAssetName?: string;
  quoteAssetName?: string;
}): boolean {
  return !row.botId && !!row.quoteAssetName && !!row.baseAssetName;
}

export interface OrderColumnActions {
  onCancel: (row: RowOrder) => void;
  onImport: (row: RowOrder) => void;
}

export interface PositionColumnActions {
  onCancel: (row: RowPosition) => void;
  onImport: (row: RowPosition) => void;
}

export function buildOrderColumns(
  actions: OrderColumnActions
): ColumnDef<RowOrder>[] {
  return [
    {
      id: 'symbol',
      accessorFn: (r) => r.symbol ?? '',
      header: 'Pair',
      meta: {
        filterType: 'array',
        getFilterValue: (row: unknown) => [(row as RowOrder).symbol],
      },
      cell: ({ row }) => {
        const b = row.original;
        return (
          <div className="flex items-center gap-xs">
            <CoinPair
              baseAsset={b.baseAssetName}
              quoteAsset={b.quoteAssetName}
              pair={b.symbol}
              iconSize="sm"
              showText={false}
            />
            <span>{b.symbol}</span>
          </div>
        );
      },
    },
    {
      id: 'exchange',
      accessorFn: (r) => (r.exchangeName ? r.exchangeName : r.exchange),
      header: 'Exchange',
      meta: { filterType: 'string' },
      cell: ({ row }) =>
        row.original.exchangeName ? row.original.exchangeName : row.original.exchange,
    },
    {
      id: 'status',
      accessorFn: (r) => r.status,
      header: 'Status',
      meta: { filterType: 'string' },
      cell: ({ row }) => row.original.status,
    },
    {
      id: 'price',
      accessorFn: (r) => +r.price,
      header: 'Price',
      meta: { filterType: 'number' },
      cell: ({ row }) => {
        const b = row.original;
        return `${math.round(+b.price, b.precision.price)} ${b.quoteAssetName}`;
      },
    },
    {
      id: 'quantity',
      accessorFn: (r) => +r.quantity,
      header: 'Qty',
      meta: { filterType: 'number' },
      cell: ({ row }) => {
        const b = row.original;
        const isBybit = b.exchange.toLowerCase().indexOf('bybit') !== -1;
        const contLabel = isBybit ? 'USD' : 'Cont';
        if (b.status === 'NEW') {
          return isCoinmExchange(b.exchange)
            ? `${b.quantity} ${contLabel} / ${math.round(
                (+b.quantity * (b.symbolFull?.quoteAsset.minAmount ?? 1)) /
                  +b.price,
                b.precision.base
              )} ${b.baseAssetName}`
            : `${math.round(+b.quantity * +b.price, b.precision.quote)} ${
                b.quoteAssetName
              } / ${b.quantity} ${b.baseAssetName}`;
        }
        return isCoinmExchange(b.exchange) ? (
          <>
            {b.quantity}
            {isBybit ? ' USD' : ' Cont'} /
            {math.round(
              (+b.executedQty * (b.symbolFull?.quoteAsset.minAmount ?? 1)) /
                +b.price,
              b.precision.base
            )}{' '}
            {b.baseAssetName}
            <br />
            {b.quantity}
            {isBybit ? ' USD' : ' Cont'} /
            {math.round(
              (+b.quantity * (b.symbolFull?.quoteAsset.minAmount ?? 1)) /
                +b.price,
              b.precision.base
            )}{' '}
            {b.baseAssetName}
          </>
        ) : (
          <>
            {math.round(+b.executedQty * +b.price, b.precision.quote)}{' '}
            {b.quoteAssetName} /{b.executedQty} {b.baseAssetName}
            <br />
            {math.round(+b.quantity * +b.price, b.precision.base)}{' '}
            {b.quoteAssetName} /{b.quantity} {b.baseAssetName}
          </>
        );
      },
    },
    {
      id: 'side',
      accessorFn: (r) => r.side,
      header: 'Side',
      meta: { filterType: 'string' },
      cell: ({ row }) => {
        const b = row.original;
        return (
          <span className="inline-flex items-center gap-xs">
            {b.side === 'BUY' ? (
              <ChevronDown className="w-4 h-4 text-success" />
            ) : (
              <ChevronUp className="w-4 h-4 text-destructive" />
            )}
            {b.side}
          </span>
        );
      },
    },
    {
      id: 'type',
      accessorFn: (r) => r.type,
      header: 'Type',
      meta: { filterType: 'string' },
      cell: ({ row }) => row.original.type,
    },
    {
      id: 'botName',
      accessorFn: (r) => r.botName || '',
      header: 'Source',
      meta: { filterType: 'string' },
      cell: ({ row }) => {
        const b = row.original;
        return (
          <SourceCell
            {...(b.botId !== undefined ? { botId: b.botId } : {})}
            {...(b.botType !== undefined ? { botType: b.botType } : {})}
            {...(b.botName !== undefined ? { botName: b.botName } : {})}
          />
        );
      },
    },
    {
      id: 'created',
      accessorFn: (r) => new Date(r.created),
      header: 'Creation date',
      meta: { filterType: 'date' },
      cell: ({ row }) => new Date(row.original.created).toLocaleString(),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      enableColumnFilter: false,
      size: 30,
      cell: ({ row }) => {
        const b = row.original;
        const enabled = rowEnabled(b);
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                disabled={!enabled}
                className="text-destructive"
                onClick={() => actions.onCancel(b)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!enabled}
                onClick={() => actions.onImport(b)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

export function buildPositionColumns(
  actions: PositionColumnActions
): ColumnDef<RowPosition>[] {
  return [
    {
      id: 'symbol',
      accessorFn: (r) => r.symbol ?? '',
      header: 'Pair',
      meta: {
        filterType: 'array',
        getFilterValue: (row: unknown) => [(row as RowPosition).symbol],
      },
      cell: ({ row }) => {
        const b = row.original;
        return (
          <div className="flex items-center gap-xs">
            <CoinPair
              baseAsset={b.baseAssetName}
              quoteAsset={b.quoteAssetName}
              pair={b.symbol}
              iconSize="sm"
              showText={false}
            />
            <span>{b.symbol}</span>
          </div>
        );
      },
    },
    {
      id: 'exchange',
      accessorFn: (r) => (r.exchangeName ? r.exchangeName : r.exchange),
      header: 'Exchange',
      meta: { filterType: 'string' },
      cell: ({ row }) =>
        row.original.exchangeName ? row.original.exchangeName : row.original.exchange,
    },
    {
      id: 'price',
      accessorFn: (r) => +r.price,
      header: 'Price',
      meta: { filterType: 'number' },
      cell: ({ row }) => {
        const b = row.original;
        return `${math.round(+b.price, b.precision.price)} ${b.quoteAssetName}`;
      },
    },
    {
      id: 'quantity',
      accessorFn: (r) => +r.quantity,
      header: 'Qty',
      meta: { filterType: 'number' },
      cell: ({ row }) => {
        const b = row.original;
        const isBybit = b.exchange.toLowerCase().indexOf('bybit') !== -1;
        return isCoinmExchange(b.exchange)
          ? `${b.displayQuantity} ${isBybit ? 'USD' : 'Cont'} / ${math.round(
              (+b.displayQuantity * (b.symbolFull?.quoteAsset.minAmount ?? 1)) /
                +b.price,
              b.precision.base
            )} ${b.baseAssetName}`
          : `${math.round(
              +b.displayQuantity * +b.price,
              b.precision.quote
            )} ${b.quoteAssetName} / ${math.round(
              +b.displayQuantity,
              b.precision.base
            )} ${b.baseAssetName}`;
      },
    },
    {
      id: 'side',
      accessorFn: (r) => r.side,
      header: 'Side',
      meta: { filterType: 'string' },
      cell: ({ row }) => row.original.side.toUpperCase(),
    },
    {
      id: 'leverage',
      accessorFn: (r) => r.leverage,
      header: 'Leverage',
      meta: { filterType: 'string' },
      cell: ({ row }) => {
        const b = row.original;
        return `${
          b.marginType === BotMarginTypeEnum.isolated ? 'Isolated' : 'Cross'
        } x${b.leverage}`;
      },
    },
    {
      id: 'botName',
      accessorFn: (r) => r.botName || '',
      header: 'Source',
      meta: { filterType: 'string' },
      cell: ({ row }) => {
        const b = row.original;
        return (
          <SourceCell
            {...(b.botId !== undefined ? { botId: b.botId } : {})}
            {...(b.botType !== undefined ? { botType: b.botType } : {})}
            {...(b.botName !== undefined ? { botName: b.botName } : {})}
          />
        );
      },
    },
    {
      id: 'created',
      accessorFn: (r) => new Date(r.created),
      header: 'Creation date',
      meta: { filterType: 'date' },
      cell: ({ row }) => new Date(row.original.created).toLocaleString(),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      enableColumnFilter: false,
      size: 30,
      cell: ({ row }) => {
        const b = row.original;
        const enabled = rowEnabled(b);
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                disabled={!enabled}
                className="text-destructive"
                onClick={() => actions.onCancel(b)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!enabled}
                onClick={() => actions.onImport(b)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
