import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ExchangeIcon from '@/components/widgets/shared/ExchangeIcon';
import SettingsRow from '@/components/widgets/shared/SettingsRow';
import type { BotFormMode, BotFormUpdateValue, Fields } from '@/features/bots';
import type { ExchangeInUser } from '@/types';
import type { BotFormData } from '@/types/bots';
import { getProviderIcon } from '@/utils/exchangeUtils';
import { useCallback, useEffect, useMemo } from 'react';

type ExchangeSelectorProps = {
  isExchangeLocked: boolean;
  currentExchange: ExchangeInUser | null;
  formData: BotFormData;
  updateFormData: (field: Fields, value: BotFormUpdateValue) => void;
  exchangesLoading?: boolean;
  exchangesData: ExchangeInUser[] | undefined;
  tooltip?: string;
  tooltipURL?: string;
  mode: BotFormMode;
};

const ExchangeSelector = ({
  isExchangeLocked,
  currentExchange,
  formData,
  updateFormData,
  exchangesLoading,
  exchangesData,
  tooltip,
  tooltipURL,
  mode,
}: ExchangeSelectorProps) => {
  const exchangeDisplayName = useMemo(
    () =>
      currentExchange?.name || currentExchange?.provider || 'Unknown exchange',
    [currentExchange?.name, currentExchange?.provider]
  );
  const formatUsdAmount = useCallback((value?: number) => {
    if (!value || Number.isNaN(value)) {
      return null;
    }
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: value >= 1000 ? 0 : 2,
    })}`;
  }, []);

  useEffect(() => {
    if (mode !== 'create') {
      return;
    }
    if (isExchangeLocked) {
      return;
    }
    if (formData.exchangeUUID) {
      const isExistExchange = exchangesData?.find(
        (exchange) => exchange.uuid === formData.exchangeUUID
      );
      if (isExistExchange) {
        return;
      }
    }
    if (!exchangesData?.length) {
      return;
    }
    // No (or stale) persisted exchange — pick the most-recently-active one
    // by `lastUpdated`. Falls back to the last entry in the list (most
    // exchange APIs append new accounts), then to the first as a last
    // resort. This avoids the common case where the API returns the
    // user's oldest exchange (e.g. Hyperliquid) first and it gets stuck
    // as the default forever.
    const sortedByRecency = [...exchangesData].sort((a, b) => {
      const aT = typeof a.lastUpdated === 'number' ? a.lastUpdated : -1;
      const bT = typeof b.lastUpdated === 'number' ? b.lastUpdated : -1;
      return bT - aT;
    });
    const fallback =
      sortedByRecency[0]?.lastUpdated !== undefined
        ? sortedByRecency[0]
        : exchangesData[exchangesData.length - 1];
    if (fallback) {
      updateFormData('exchangeUUID', fallback.uuid);
    }
  }, [
    mode,
    isExchangeLocked,
    formData.exchangeUUID,
    exchangesData,
    updateFormData,
  ]);

  return (
    <SettingsRow name="Exchange" tooltip={tooltip} tooltipURL={tooltipURL}>
      <div className="space-y-sm">
        {isExchangeLocked ? (
          <div className="flex items-center gap-xs rounded-lg bg-muted px-3 py-2">
            {!formData.exchangeUUID ? (
              <div className="flex items-center gap-xs">
                <div className="w-5 h-5 bg-muted rounded-sm flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">?</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  No exchange set
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-xs">
                <ExchangeIcon
                  icon={getProviderIcon(currentExchange?.provider ?? '')}
                  size="w-5 h-5"
                />
                <span
                  className="text-sm font-medium truncate"
                  title={exchangeDisplayName}
                >
                  {exchangeDisplayName}
                </span>
              </div>
            )}
          </div>
        ) : (
          <Select
            value={currentExchange?.uuid || ''}
            onValueChange={(value) => updateFormData('exchangeUUID', value)}
            disabled={!!exchangesLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  exchangesLoading ? 'Loading exchanges...' : 'Select exchange'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {exchangesData?.map((exchange) => {
                const balanceValue =
                  typeof exchange.balance === 'number' &&
                  Number.isFinite(exchange.balance)
                    ? exchange.balance
                    : undefined;
                const balanceLabel =
                  typeof balanceValue === 'number'
                    ? formatUsdAmount(balanceValue)
                    : null;
                const providerIcon = getProviderIcon(exchange.provider ?? '');

                return (
                  <SelectItem key={exchange.uuid} value={exchange.uuid}>
                    <div className="flex items-center justify-between gap-sm">
                      <div className="flex items-center gap-xs min-w-0">
                        <ExchangeIcon
                          icon={providerIcon}
                          size="w-5 h-5"
                          className="shrink-0"
                        />
                        <span className="truncate">
                          {exchange.name || exchange.provider}
                        </span>
                      </div>
                      {balanceLabel && (
                        <span className="whitespace-nowrap text-xs text-muted-foreground">
                          {balanceLabel}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
              {!exchangesData?.length && (
                <SelectItem value="__no-exchanges__" disabled>
                  No exchanges available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
      </div>
    </SettingsRow>
  );
};

export default ExchangeSelector;
