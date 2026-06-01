declare module '@/utils/tradingView/customIndicators.js' {
  // TradingView passes a PineJS/Std bundle object
  export const custom_indicators_getter: (
    PineJS: unknown,
    cb?: (value: number, id: string) => void
  ) => Promise<readonly unknown[]>;
}
