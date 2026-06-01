import { useEffect, useRef } from 'react';
import { logger } from '../lib/loggerInstance';
import { useTradingViewStore } from '../stores/tradingViewStore';

export const useTradingViewAutoSave = (
  widget: unknown | null,
  isReady: boolean = false,
  symbol?: string,
  resolution?: string
) => {
  const { autoSaveEnabled } = useTradingViewStore();
  const hasLoadedInitialLayout = useRef(false);

  // Native TradingView auto-save/load functionality
  useEffect(() => {
    if (!widget || !isReady || !autoSaveEnabled) {
      return;
    }

    // TradingView handles auto-save/load natively
    // No custom implementation needed
    if (!hasLoadedInitialLayout.current) {
      hasLoadedInitialLayout.current = true;
      logger.info('✅ TradingView native auto-save/load enabled');
    }
  }, [widget, isReady, autoSaveEnabled, symbol, resolution]);

  return {
    // TradingView handles everything natively
    // No custom functionality needed
  };
};
