import type { IndicatorConfig } from '@/types/indicators/indicators';
import type { IndicatorParamsState } from '@/types/indicators/indicatorParams';
import type { IndicatorEnum } from '@/types';

type IndicatorParamRecord = IndicatorParamsState;

type CreateIndicatorConfigOptions = Partial<
  Omit<IndicatorConfig, 'uuid' | 'type' | 'params'>
> & {
  uuid?: string;
};

export const sanitizeIndicatorParams = (
  params: IndicatorParamsState
): IndicatorParamRecord => {
  return Object.entries(params).reduce<Record<string, unknown>>(
    (acc, [key, value]) => {
      if (value === undefined || value === null) {
        return acc;
      }

      const k = key as keyof IndicatorParamsState;

      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed.length) {
          return acc;
        }
        acc[k as string] = trimmed;
        return acc;
      }

      acc[k as string] = value;
      return acc;
    },
    {}
  ) as IndicatorParamRecord;
};

export const buildIndicatorConfig = (
  type: IndicatorEnum,
  params: IndicatorParamsState,
  options: CreateIndicatorConfigOptions = {}
): IndicatorConfig => {
  const normalizedParams = sanitizeIndicatorParams(params);

  const config: IndicatorConfig = {
    ...normalizedParams,
    uuid: options.uuid ?? `indicator-${Date.now()}`,
    type,
  };

  if (options.keepConditionBars !== undefined) {
    config.keepConditionBars = options.keepConditionBars;
  }

  if (options.minPercFromLast !== undefined) {
    config.minPercFromLast = options.minPercFromLast;
  }

  if (options.orderSize !== undefined) {
    config.orderSize = options.orderSize;
  }

  return config;
};
