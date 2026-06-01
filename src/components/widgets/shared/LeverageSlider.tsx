import { AlertTriangle } from 'lucide-react';
import React from 'react';

import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Slider } from '../../ui/slider';

interface LeverageSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

const LeverageSlider: React.FC<LeverageSliderProps> = ({
  value,
  onChange,
  min = 1,
  max = 125,
  step = 1,
  className = '',
  disabled = false,
}) => {
  // Preset leverage values from old dashboard
  const presetValues = [1, 2, 3, 5, 25, 50, 75, 100, 125];

  const handlePresetClick = (presetValue: number) => {
    if (disabled) {
      return;
    }

    onChange(presetValue);
  };

  const handleSliderChange = (nextValue: number) => {
    if (disabled) {
      return;
    }

    onChange(nextValue);
  };

  const formatLeverage = (val: number) => `${val}x`;

  return (
    <div className={`space-y-md ${className}`}>
      {/* Current Value Display */}
      <div className="flex items-center justify-center">
        <div className="text-2xl font-bold text-primary">
          {formatLeverage(value)}
        </div>
      </div>

      {/* Slider */}
      <div className="px-2">
        <Slider
          value={value}
          onChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          className="w-full"
          disabled={disabled}
        />
      </div>

      {/* Min/Max Labels */}
      <div className="flex justify-between text-xs text-muted-foreground px-2">
        <span>{formatLeverage(min)}</span>
        <span>{formatLeverage(max)}</span>
      </div>

      {/* Preset Buttons */}
      <div className="space-y-xs">
        <Label className="text-xs text-muted-foreground">Quick Select</Label>
        <div className="grid grid-cols-3 gap-xs">
          {presetValues.map((preset) => (
            <Button
              key={preset}
              variant={value === preset ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetClick(preset)}
              className={`text-xs h-8 ${
                value === preset
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  : 'hover:bg-primary/10 hover:border-primary/30'
              }`}
              disabled={disabled}
            >
              {formatLeverage(preset)}
            </Button>
          ))}
        </div>
      </div>

      {/* Risk Warning */}
      {value > 10 && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-sm">
          <div className="flex items-start gap-xs">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 text-warning"
              aria-hidden="true"
            />
            <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
              <p className="font-semibold uppercase tracking-wide text-warning">
                High leverage warning
              </p>
              <p>
                {formatLeverage(value)} leverage significantly increases risk. A
                1% price movement will result in a {value}% change to your
                position.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeverageSlider;
