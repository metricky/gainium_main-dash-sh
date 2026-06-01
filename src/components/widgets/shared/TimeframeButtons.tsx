import { logger } from '@/lib/loggerInstance';
import React from 'react';

interface TimeframeOption {
  value: string;
  label: string;
}

export interface TimeframeButtonsProps {
  /** Array of timeframe options to display */
  options: TimeframeOption[];
  /** Currently selected timeframe value */
  selectedTimeframe: string;
  /** Callback when a timeframe button is clicked */
  onTimeframeChange: (value: string) => void;
  /** Optional CSS classes */
  className?: string;
  /** Widget ID for logging purposes */
  widgetId?: string;
}

/**
 * TimeframeButtons - A reusable component for timeframe selection buttons
 *
 * Uses the same styling as the Profit widget for consistency across the app.
 *
 * @example
 * <TimeframeButtons
 *   options={[
 *     { value: '30', label: '30D' },
 *     { value: '60', label: '60D' },
 *     { value: '90', label: '90D' }
 *   ]}
 *   selectedTimeframe={timeFilter}
 *   onTimeframeChange={(value) => setTimeFilter(value)}
 *   widgetId={widgetId}
 * />
 */
export const TimeframeButtons: React.FC<TimeframeButtonsProps> = ({
  options,
  selectedTimeframe,
  onTimeframeChange,
  className = '',
  widgetId,
}) => {
  const handleTimeframeClick = (value: string) => {
    if (widgetId) {
      logger.debug('TimeframeButtons: Button clicked', {
        widgetId,
        newTimeframe: value,
        currentTimeframe: selectedTimeframe,
      });
    }
    onTimeframeChange(value);
  };

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => handleTimeframeClick(option.value)}
          className={`px-3 py-1 text-xs rounded ${
            option.value === selectedTimeframe
              ? 'bg-muted text-foreground border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default TimeframeButtons;
