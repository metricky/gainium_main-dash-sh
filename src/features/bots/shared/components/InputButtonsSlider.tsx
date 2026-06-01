import { FieldVariableBinding } from '@/components/ui/field-variable-binding';
import { NumberInput } from '@/components/ui/number-input';
import { Slider } from '@/components/ui/slider';
import { TerminalButtonStack } from '@/components/ui/terminal-button-stack';
import type { VarBindingPath } from '@/hooks/bots/global-variables/useBotVarBinding';
import { cn } from '@/lib/utils';
import type { VarToSearchType } from '@/types';
import type { GlobalVariable } from '@/types/globalVariables';
import type { ReactNode } from 'react';

type PresetButton = {
  label: string;
  value: number;
};

type InputButtonsSliderProps = {
  // Input props
  value: string | number;
  onChange: (value: number | string) => void;
  min: number;
  max: number;
  step: number;
  precision: number;
  placeholder?: string;
  disabled?: boolean;
  endAdornment?: ReactNode;
  className?: string;

  // Slider props
  showSlider?: boolean;
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
  sliderValue?: number;
  onSliderChange?: (value: number) => void;

  // Preset buttons
  presetButtons?: PresetButton[];
  baseValue?: number; // For relative presets

  // Variable binding (optional)
  varBindingPath?: VarBindingPath;
  varType?: VarToSearchType;
  varTooltip?: string;
  onVariableSelected?: (variable: GlobalVariable) => void;
  onVariableResolved?: (variable: GlobalVariable | null) => void;
  isVariableBound?: boolean;

  // Validation
  isInvalid?: boolean;
};

export const InputButtonsSlider = ({
  value,
  onChange,
  min,
  max,
  step,
  precision,
  placeholder,
  disabled,
  endAdornment,
  className,
  showSlider = true,
  sliderMin,
  sliderMax,
  sliderStep,
  sliderValue,
  onSliderChange,
  presetButtons,
  baseValue = 0,
  varBindingPath,
  varType = 'float',
  varTooltip,
  onVariableSelected,
  onVariableResolved,
  isVariableBound = false,
  isInvalid = false,
}: InputButtonsSliderProps) => {
  const inputElement = (
    <NumberInput
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      step={step}
      precision={precision}
      className={cn('w-full', isInvalid && 'border-destructive')}
      placeholder={placeholder}
      showControls={false}
      disabled={disabled || isVariableBound}
      endAdornment={endAdornment}
    />
  );

  const wrappedInput = varBindingPath ? (
    <FieldVariableBinding
      path={varBindingPath}
      varType={varType}
      tooltip={varTooltip}
      variant="inline"
      className="flex-1"
      onVariableSelected={onVariableSelected}
      onVariableResolved={onVariableResolved}
    >
      {inputElement}
    </FieldVariableBinding>
  ) : (
    <div className="flex-1">{inputElement}</div>
  );

  const showButtons =
    presetButtons && presetButtons.length > 0 && !isVariableBound;

  return (
    <div className={cn('space-y-sm', className)}>
      <div className="flex gap-xs">
        {wrappedInput}
        {showButtons && (
          <div className="flex-1 min-w-0">
            <div className="overflow-x-auto">
              <TerminalButtonStack
                value=""
                onValueChange={(selectedValue) => {
                  const preset = presetButtons.find(
                    (p) => p.label === selectedValue
                  );
                  if (preset) {
                    const newValue = baseValue + preset.value;
                    onChange(newValue);
                  }
                }}
                options={presetButtons.map((p) => ({
                  value: p.label,
                  label: p.label,
                  buttonClassName: 'min-w-[60px] flex-none h-9 px-3 text-sm',
                }))}
                className="flex-nowrap whitespace-nowrap"
              />
            </div>
          </div>
        )}
      </div>
      {showSlider && !isVariableBound && (
        <Slider
          value={
            sliderValue ??
            (typeof value === 'number' ? value : parseFloat(value as string))
          }
          onChange={onSliderChange ?? onChange}
          min={sliderMin ?? min}
          max={sliderMax ?? max}
          step={sliderStep ?? step}
        />
      )}
    </div>
  );
};
