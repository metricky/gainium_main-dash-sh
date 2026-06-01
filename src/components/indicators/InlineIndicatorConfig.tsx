import React from 'react';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InfoIcon, Tooltip } from '@/components/ui/tooltip';
import { FieldVariableBinding } from '@/components/ui/field-variable-binding';
import type { VarBindingPath } from '@/hooks/bots/global-variables/useBotVarBinding';
import type {
  IndicatorDefinition,
  IndicatorFieldDefinition,
  IndicatorFieldOption,
} from '@/types/indicators/indicatorTypes';
import type {
  IndicatorParamPrimitive,
  IndicatorParamsState,
} from '@/types/indicators/indicatorParams';
import type { VarToSearchType } from '@/types';

interface InlineIndicatorConfigProps {
  definition: IndicatorDefinition;
  params: IndicatorParamsState;
  onChange: (params: IndicatorParamsState) => void;
  className?: string;
  // When provided, numeric fields marked `allowVariables` can be bound to
  // a global variable via `indicators.{indicatorUuid}.{fieldKey}`. Without
  // a uuid (e.g. configuring a freshly-added indicator that hasn't been
  // assigned an id yet) the binding UI is suppressed.
  indicatorUuid?: string;
}

// Global variables are typed `int` | `float` | `text`. We infer numeric
// fields' variable type from the step: a sub-1 step means decimals are
// expected (float), otherwise integers. Matches the convention used in
// the legacy frontend where `varType` was hand-picked per field.
const inferNumericVarType = (
  field: IndicatorFieldDefinition
): VarToSearchType => {
  if (typeof field.step === 'number' && field.step < 1) {
    return 'float';
  }
  return 'int';
};

const shouldHideField = (
  field: IndicatorFieldDefinition,
  params: IndicatorParamsState | null
): boolean => {
  if (!params) {
    return false;
  }
  if (!field.hiddenWhen) {
    return false;
  }
  return field.hiddenWhen.some(
    ({ field: key, equals }) =>
      typeof params[key] === 'undefined' || params[key] === equals
  );
};

export const InlineIndicatorConfig: React.FC<InlineIndicatorConfigProps> = ({
  definition,
  params,
  onChange,
  className,
  indicatorUuid,
}) => {
  const updateParam = (key: string, value: IndicatorParamPrimitive) => {
    onChange({ ...params, [key]: value });
  };

  const renderField = (field: IndicatorFieldDefinition) => {
    const value = params[field.key] ?? field.defaultValue;

    if (shouldHideField(field, params)) {
      return null;
    }

    switch (field.type) {
      case 'number': {
        const numberInput = (
          <NumberInput
            id={field.key}
            value={
              typeof value === 'string' ? value : (value?.toString() ?? '')
            }
            onChange={(newValue) =>
              updateParam(
                field.key,
                typeof newValue === 'string' ? newValue : newValue.toString()
              )
            }
            {...(field.min !== undefined && { min: field.min })}
            {...(field.max !== undefined && { max: field.max })}
            {...(field.step !== undefined && { step: field.step })}
          />
        );
        const canBind = Boolean(field.allowVariables && indicatorUuid);
        const bindingPath = canBind
          ? (`indicators.${indicatorUuid}.${field.key}` as VarBindingPath)
          : null;
        return (
          <div key={field.key} className="space-y-xs">
            <div className="flex items-center gap-1">
              <Label htmlFor={field.key}>{field.label}</Label>
              {field.tooltip ? (
                <Tooltip tooltip={field.tooltip} tooltipURL={field.tooltipURL} side="top">
                  <InfoIcon />
                </Tooltip>
              ) : null}
            </div>
            {bindingPath ? (
              <FieldVariableBinding
                path={bindingPath}
                varType={inferNumericVarType(field)}
                variant="inline"
              >
                {numberInput}
              </FieldVariableBinding>
            ) : (
              numberInput
            )}
            {field.description && (
              <p className="text-xs text-muted-foreground">
                {field.description}
              </p>
            )}
          </div>
        );
      }

      case 'select': {
        if (field.multiple) {
          const raw = Array.isArray(value)
            ? value
            : Array.isArray(field.defaultValue)
              ? field.defaultValue
              : [];
          const selectedValues = raw.map(Number);
          return (
            <div key={field.key} className="space-y-xs">
              <div className="flex items-center gap-1">
                <Label htmlFor={field.key}>{field.label}</Label>
                {field.tooltip ? (
                  <Tooltip tooltip={field.tooltip} tooltipURL={field.tooltipURL} side="top">
                    <InfoIcon />
                  </Tooltip>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {field.options?.map((option: IndicatorFieldOption) => {
                  const numVal = Number(option.value);
                  const checked = selectedValues.includes(numVal);
                  return (
                    <div
                      key={String(option.value)}
                      className="flex items-center gap-1.5"
                    >
                      <Checkbox
                        id={`${field.key}-${option.value}`}
                        checked={checked}
                        onCheckedChange={(c) => {
                          const next = c
                            ? [...selectedValues, numVal].sort(
                                (a, b) => a - b
                              )
                            : selectedValues.filter((v) => v !== numVal);
                          updateParam(field.key, next);
                        }}
                      />
                      <Label
                        htmlFor={`${field.key}-${option.value}`}
                        className="text-sm"
                      >
                        {option.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        return (
          <div key={field.key} className="space-y-xs">
            <div className="flex items-center gap-1">
              <Label htmlFor={field.key}>{field.label}</Label>
              {field.tooltip ? (
                <Tooltip tooltip={field.tooltip} tooltipURL={field.tooltipURL} side="top">
                  <InfoIcon />
                </Tooltip>
              ) : null}
            </div>
            <Select
              value={value?.toString() ?? ''}
              onValueChange={(newValue) => updateParam(field.key, newValue)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={`Select ${field.label.toLowerCase()}`}
                />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: IndicatorFieldOption) => (
                  <SelectItem
                    key={option.value.toString()}
                    value={option.value.toString()}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.description && (
              <p className="text-xs text-muted-foreground">
                {field.description}
              </p>
            )}
          </div>
        );
      }

      case 'boolean':
        return (
          <div key={field.key} className="space-y-xs">
            <div className="flex items-center space-x-xs">
              <Switch
                id={field.key}
                checked={Boolean(value)}
                onCheckedChange={(checked) => updateParam(field.key, checked)}
              />
              <Label htmlFor={field.key}>{field.label}</Label>
              {field.tooltip ? (
                <Tooltip tooltip={field.tooltip} tooltipURL={field.tooltipURL} side="top">
                  <InfoIcon />
                </Tooltip>
              ) : null}
            </div>
            {field.description && (
              <p className="text-xs text-muted-foreground">
                {field.description}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (!definition.fields || definition.fields.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="space-y-md">
        <div className="text-sm font-medium text-muted-foreground">
          {definition.label} Configuration
        </div>
        {definition.fields.length > 0 ? (
          <div className="grid gap-md md:grid-cols-2 lg:grid-cols-3">
            {definition.fields.map((field) => renderField(field))}
          </div>
        ) : null}
      </div>
    </div>
  );
};
