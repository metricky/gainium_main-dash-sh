import { BotTypesEnum, type Bot, type DCABot, type ComboBot } from '@/types';
import type { DrawerBot } from '@/types/bots/drawer';
import { ProfitLossPercChip } from '@/components/ui/chip/ProfitLossPercChip';
import CoinIcon from '@/components/widgets/shared/CoinIcon';
import { Wallet } from 'lucide-react';
import React, { useMemo } from 'react';
import { otherQueries } from '@/lib/api/GraphQLQueries-other-queries';
import { useGraphQL } from '@/hooks/useGraphQL';
import { getLocalPrices } from '@/helper/price';
import { findUSDRate } from '@/lib/utils/unrealizedPnL';
import { DrawerSection } from './DrawerSection';

export interface DrawerBalanceInfoProps {
  widgetId: string;
  botId?: string;
  bot?: DrawerBot;
}

/** Mirrors legacy BalanceType from portfolio/types.ts */
interface BalanceRow {
  name: string;
  free: number;
  locked: number;
  required: number;
  /** How much of the total balance (free + locked) is required, as a percentage */
  requiredRatio: number;
}

interface RawBalance {
  asset: string;
  free: string;
  locked: string;
  exchange: string;
  exchangeUUID: string;
  exchangeName: string;
}

/** Get decimal precision based on USD-equivalent price (legacy getPrecisionBySymbol + 4) */
const getPrecision = (usdPrice: number): number => {
  if (usdPrice === 0) return 8;
  const mag = Math.floor(Math.log10(Math.abs(usdPrice)));
  return Math.max(0, -mag + 1) + 4;
};

const formatBalance = (value: number, precision: number): string =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  });

/** Extract { baseAsset, quoteAsset } regardless of bot type */
const extractAssets = (
  bot: Bot | DCABot | ComboBot
): { baseAsset?: string; quoteAsset?: string } => {
  const sym = (bot as Bot).symbol;
  // Grid bot: symbol is a plain object
  if (sym && !Array.isArray(sym)) {
    return {
      baseAsset: (sym as { baseAsset: string }).baseAsset,
      quoteAsset: (sym as { quoteAsset: string }).quoteAsset,
    };
  }
  // DCA / Combo bot: symbol is an array of { key, value: { baseAsset, quoteAsset } }
  if (Array.isArray(sym) && sym.length > 0) {
    const first = (
      sym as Array<{
        key: string;
        value: { baseAsset: string; quoteAsset: string };
      }>
    )[0];
    return {
      baseAsset: first?.value?.baseAsset,
      quoteAsset: first?.value?.quoteAsset,
    };
  }
  return {};
};

/** Extract required base/quote amounts regardless of bot type */
const extractRequired = (
  bot: Bot | DCABot | ComboBot,
  isGrid: boolean
): { requiredBase: number; requiredQuote: number } => {
  if (isGrid) {
    const assets = (bot as Bot).assets;
    return {
      requiredBase:
        (assets?.required as { base: number; quote: number })?.base ?? 0,
      requiredQuote:
        (assets?.required as { base: number; quote: number })?.quote ?? 0,
    };
  }
  // DCA / Combo: use usage.max which aggregates across all pairs
  const usage = (bot as DCABot | ComboBot).usage;
  return {
    requiredBase: usage?.max?.base ?? 0,
    requiredQuote: usage?.max?.quote ?? 0,
  };
};

const DRAWER_SECTION_PROPS = {
  widgetType: 'drawer-balance-info' as const,
  title: 'Balances',
  icon: Wallet,
  minSize: { w: 4, h: 4 },
  maxSize: { w: 12, h: 8 },
};

export const DrawerBalanceInfo: React.FC<DrawerBalanceInfoProps> = ({
  widgetId,
  botId: _botId,
  bot: botProp,
}) => {
  const bot = botProp as unknown as Bot | DCABot | ComboBot | undefined;

  const isGrid = bot?.type === BotTypesEnum.grid;
  const isDca = bot?.type === BotTypesEnum.dca;
  const isCombo = bot?.type === BotTypesEnum.combo;
  const isSupported = isGrid || isDca || isCombo;

  const isClosed = bot?.status === 'closed' || bot?.status === 'archive';
  const exchangeUUID = (bot as Bot | undefined)?.exchangeUUID ?? '';

  // Build the getBalances query
  const { query: balanceQuery, variables: balanceVars } = useMemo(
    () => otherQueries.getBalances({ uuid: exchangeUUID }),
    [exchangeUUID]
  );

  const { data: balanceResult, isLoading } = useGraphQL<RawBalance[]>(
    'getBalances',
    { query: balanceQuery, variables: balanceVars },
    { enabled: isSupported && !isClosed && !!exchangeUUID }
  );

  // Build legacy-style balance rows: TOKEN / AVAILABLE / LOCKED / REQUIRED
  const balanceRows = useMemo((): BalanceRow[] => {
    if (!bot || !isSupported || isClosed) return [];

    const { baseAsset, quoteAsset } = extractAssets(bot as Bot);
    if (!baseAsset || !quoteAsset) return [];

    const { requiredBase, requiredQuote } = extractRequired(bot as Bot, isGrid);

    const requiredMap = new Map<string, number>();
    if (requiredBase > 0) requiredMap.set(baseAsset, requiredBase);
    if (requiredQuote > 0) requiredMap.set(quoteAsset, requiredQuote);

    if (requiredMap.size === 0) return [];

    // Get raw balances from GraphQL response
    const rawBalances: RawBalance[] = (() => {
      if (
        !balanceResult ||
        balanceResult.status !== 'OK' ||
        !balanceResult.data
      )
        return [];
      return Array.isArray(balanceResult.data) ? balanceResult.data : [];
    })();

    if (rawBalances.length === 0) return [];

    const latestPrices = getLocalPrices();
    const rows: BalanceRow[] = [];

    for (const [asset, required] of requiredMap.entries()) {
      const usdRate = findUSDRate(asset, latestPrices, (bot as Bot).exchange);
      const precision = getPrecision(usdRate);

      // Find balance entry; fall back to asset-only match if exchange uuid doesn't match
      const balanceEntry =
        rawBalances.find(
          (b) =>
            b.asset === asset &&
            (b.exchangeUUID === exchangeUUID || !b.exchangeUUID)
        ) ?? rawBalances.find((b) => b.asset === asset);

      if (balanceEntry) {
        const free = parseFloat(balanceEntry.free ?? '0');
        const locked = parseFloat(balanceEntry.locked ?? '0');
        const total = free + locked;

        rows.push({
          name: asset,
          free: +free.toFixed(precision),
          locked: +locked.toFixed(precision),
          required: +required.toFixed(precision),
          requiredRatio:
            total === 0
              ? required === 0
                ? 0
                : Infinity
              : +((required / total) * 100).toFixed(2),
        });
      }
    }

    return rows.sort((a, b) => a.name.localeCompare(b.name));
  }, [bot, isSupported, isClosed, isGrid, exchangeUUID, balanceResult]);

  const sharedProps = {
    widgetId,
    ...DRAWER_SECTION_PROPS,
  };

  if (!bot || !isSupported) {
    return (
      <DrawerSection {...sharedProps}>
        <div className="text-center text-xs text-muted-foreground py-4">
          Balance information not available
        </div>
      </DrawerSection>
    );
  }

  if (isClosed) {
    return (
      <DrawerSection {...sharedProps}>
        <div className="text-center text-xs text-muted-foreground py-4">
          Bot is closed — no live balance data
        </div>
      </DrawerSection>
    );
  }

  return (
    <DrawerSection {...sharedProps}>
      {isLoading ? (
        <div className="text-center text-xs text-muted-foreground py-4">
          Loading balances…
        </div>
      ) : balanceRows.length === 0 ? (
        <div className="text-center text-xs text-muted-foreground py-4">
          No balance data
        </div>
      ) : (
        /* TOKEN | AVAILABLE | LOCKED | REQUIRED */
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-left py-2 px-1 font-semibold text-muted-foreground uppercase tracking-wide">
                  Token
                </th>
                <th className="text-right py-2 px-1 font-semibold text-muted-foreground uppercase tracking-wide">
                  Available
                </th>
                <th className="text-right py-2 px-1 font-semibold text-muted-foreground uppercase tracking-wide">
                  Locked
                </th>
                <th className="text-right py-2 px-1 font-semibold text-muted-foreground uppercase tracking-wide">
                  Required
                </th>
              </tr>
            </thead>
            <tbody>
              {balanceRows.map((row) => (
                <tr key={row.name} className="border-b border-border/20">
                  {/* Token with coin icon */}
                  <td className="py-2 px-1">
                    <div className="flex items-center gap-1.5">
                      <CoinIcon symbol={row.name} size="sm" />
                      <span className="font-medium text-foreground">
                        {row.name}
                      </span>
                    </div>
                  </td>
                  {/* Available */}
                  <td className="py-2 px-1 text-right text-muted-foreground">
                    {formatBalance(row.free, 6)}
                  </td>
                  {/* Locked */}
                  <td className="py-2 px-1 text-right text-muted-foreground">
                    {formatBalance(row.locked, 6)}
                  </td>
                  {/* Required + % chip */}
                  <td className="py-2 px-1 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-muted-foreground">
                        {formatBalance(row.required, 6)}
                      </span>
                      {row.requiredRatio === Infinity ? (
                        <ProfitLossPercChip
                          value={-100}
                          textValue="∞%"
                          size="xs"
                        />
                      ) : row.requiredRatio > 0 ? (
                        <ProfitLossPercChip
                          value={
                            row.requiredRatio > 100
                              ? -row.requiredRatio
                              : row.requiredRatio
                          }
                          showSign={false}
                          size="xs"
                        />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DrawerSection>
  );
};

export default DrawerBalanceInfo;
