import { useMemo } from 'react';

import {
  useBotFormState,
  type BotFormStateContextValue,
} from '@/contexts/bots/form/BotFormProvider';
import { useOptionalGridPageContext } from '@/contexts/bots/grid/GridPageProvider';
import type { GridLeverageState } from '@/types/bots/grid/data';
import type { BotFormData } from '@/types/bots/form';

interface ParsedPair {
  raw: string;
  baseAsset: string;
  quoteAsset: string;
}

const KNOWN_QUOTES = [
  'USDT',
  'USDC',
  'BTC',
  'ETH',
  'BNB',
  'BUSD',
  'USDP',
  'USD',
];

const extractPair = (pairs: BotFormData['pair']): ParsedPair => {
  if (!Array.isArray(pairs) || pairs.length === 0) {
    return { raw: '', baseAsset: '', quoteAsset: '' };
  }

  const raw = pairs[0];
  if (!raw) {
    return { raw: '', baseAsset: '', quoteAsset: '' };
  }

  const sanitized = raw.trim().toUpperCase();
  if (!sanitized) {
    return { raw: '', baseAsset: '', quoteAsset: '' };
  }

  if (sanitized.includes('/')) {
    const [base, quote] = sanitized.split('/');
    return {
      raw: sanitized,
      baseAsset: base || '',
      quoteAsset: quote || '',
    };
  }

  const matchedQuote = KNOWN_QUOTES.find((quote) => sanitized.endsWith(quote));
  if (matchedQuote) {
    const baseAsset = sanitized.slice(
      0,
      sanitized.length - matchedQuote.length
    );
    return {
      raw: sanitized,
      baseAsset,
      quoteAsset: matchedQuote,
    };
  }

  if (sanitized.length > 3) {
    const baseAsset = sanitized.slice(0, -3);
    const quoteAsset = sanitized.slice(-3);
    return {
      raw: sanitized,
      baseAsset,
      quoteAsset,
    };
  }

  return { raw: sanitized, baseAsset: sanitized, quoteAsset: '' };
};

export interface GridFormContext {
  formState: BotFormStateContextValue;
  primaryPair: ParsedPair;
  baseAsset: string;
  quoteAsset: string;
  leverage: GridLeverageState;
}

const DEFAULT_LEVERAGE_STATE: GridLeverageState = {
  brackets: [],
  isLoading: false,
};

export const useGridForm = (): GridFormContext => {
  const formState = useBotFormState();
  const gridPage = useOptionalGridPageContext();

  const primaryPair = useMemo(
    () => extractPair(formState.formData.pair),
    [formState.formData.pair]
  );
  const leverageState = gridPage?.state.leverage ?? DEFAULT_LEVERAGE_STATE;

  return useMemo(
    () => ({
      formState,
      primaryPair,
      baseAsset: primaryPair.baseAsset,
      quoteAsset: primaryPair.quoteAsset,
      leverage: leverageState,
    }),
    [formState, primaryPair, leverageState]
  );
};
