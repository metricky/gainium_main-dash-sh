export const BACKTEST_DB_UPDATED_EVENT = 'gainium.backtest-db-updated';
export const CANDLES_DB_UPDATED_EVENT = 'gainium.candles-db-updated';

const dispatchCustomEvent = (eventName: string) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(eventName));
};

export const dispatchBacktestDbEvent = () => {
  dispatchCustomEvent(BACKTEST_DB_UPDATED_EVENT);
};

export const dispatchCandlesDbEvent = () => {
  dispatchCustomEvent(CANDLES_DB_UPDATED_EVENT);
};
