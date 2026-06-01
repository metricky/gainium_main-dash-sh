/**
 * TradingViewWidgetRenderer - Legacy export for backward compatibility
 *
 * This file now re-exports TradingViewChartCore to eliminate code duplication.
 * Both files were previously identical. TradingViewChartCore is the single source of truth.
 *
 * @deprecated Use TradingViewChartCore directly for new code
 */
export {
  // eslint-disable-next-line react-refresh/only-export-components
  default,
  TradingViewChartCore as TradingViewWidgetRenderer,
} from './TradingViewChartCore';
