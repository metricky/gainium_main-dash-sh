import { useCallback } from 'react';

import TradingViewChart from '@/components/widgets/shared/TradingViewChart/TradingViewChart';

import { useTradingTerminal } from '../context';

export function ChartPanel() {
  const { symbol, interval, setInterval } = useTradingTerminal();

  const handleIntervalChange = useCallback(
    (nextInterval: string) => {
      if (!nextInterval || nextInterval === interval) return;
      setInterval(nextInterval);
    },
    [interval, setInterval]
  );

  return (
    <div className="h-full min-h-[260px]">
      <TradingViewChart
        symbol={symbol}
        interval={interval}
        onIntervalChange={handleIntervalChange}
      />
    </div>
  );
}
