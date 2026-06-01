import { Button } from '@/components/ui/button';

import { useTradingTerminal } from '../context';

const QUICK_INTERVALS: Array<{ label: string; value: string }> = [
  { label: '1m', value: '1' },
  { label: '15m', value: '15' },
  { label: '1h', value: '60' },
  { label: '4h', value: '240' },
  { label: '1d', value: '1D' },
];

export function ChartIntervalActions() {
  const { interval, setInterval } = useTradingTerminal();

  return (
    <div className="flex items-center gap-xs">
      {QUICK_INTERVALS.map(({ label, value }) => {
        const isActive = interval === value;
        return (
          <Button
            key={value}
            type="button"
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            className={isActive ? 'bg-primary text-primary-foreground' : ''}
            onClick={() => {
              if (isActive) return;
              setInterval(value);
            }}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
