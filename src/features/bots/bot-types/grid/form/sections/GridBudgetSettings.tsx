import React from 'react';

import { Label } from '@/components/ui/label';
import { MasonryLayout } from '@/components/ui/MasonryLayout';
import { NumberInput } from '@/components/ui/number-input';
import { Switch } from '@/components/ui/switch';
import { InfoIcon, Tooltip } from '@/components/ui/tooltip';
import SettingsRow, {
  SettingsRowSurface,
} from '@/components/widgets/shared/SettingsRow';
import { useBotFormSelector } from '@/contexts/bots/form/BotFormProvider';
import { unitAdornment } from '@/features/bots/shared/utils/unit-adornment';
import { useGridForm } from '@/hooks/bots/grid/useGridForm';
import type { BotFormAlert } from '@/types/bots/form';

export const GridBudgetSettings: React.FC = () => {
  const {
    formState: { updateFormData, errors },
    quoteAsset,
  } = useGridForm();
  const budget = useBotFormSelector('budget');
  const useOrderInAdvance = useBotFormSelector('useOrderInAdvance');
  const ordersInAdvance = useBotFormSelector('ordersInAdvance');
  const handleBudgetChange = (value: number | string) => {
    updateFormData(
      'budget',
      typeof value === 'string' ? value : value.toString()
    );
  };

  const handleActiveOrdersChange = (value: number | string) => {
    if (value === '') {
      updateFormData('ordersInAdvance', 0);
      return;
    }

    const parsed = typeof value === 'string' ? Number(value) : value;
    updateFormData(
      'ordersInAdvance',
      Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0
    );
  };

  const quoteAdornmentLabel = quoteAsset ?? 'quote';

  // Grid form populates `errors` (the legacy bag) instead of the
  // newer `alerts` map. Adapt locally to the SettingsRow alert chip
  // shape — same pattern as DCA rows that don't yet have validator
  // support for alerts (see BotControllerSettings).
  const budgetAlerts: BotFormAlert[] = errors['budget']
    ? [{ variant: 'error', message: errors['budget'], navId: 'budget' }]
    : [];
  const ordersInAdvanceAlerts: BotFormAlert[] = errors['ordersInAdvance']
    ? [
        {
          variant: 'error',
          message: errors['ordersInAdvance'],
          navId: 'ordersInAdvance',
        },
      ]
    : [];

  return (
    <MasonryLayout
      gap={16}
      containerBreakpoints={{
        default: 1,
        640: 2,
        1024: 3,
      }}
    >
      <SettingsRow
        name={`Investment (${quoteAsset || 'quote'})`}
        tooltip="Define the total capital allocation the bot can utilize. The allocated funds determine how many buy and sell levels can be filled at once."
        tooltipURL="/help/budget-grid"
        navId="budget"
        alerts={budgetAlerts}
      >
        <div className="space-y-xs">
          <NumberInput
            id="grid-budget"
            value={budget ?? ''}
            onChange={handleBudgetChange}
            placeholder="Enter total investment"
            showControls={false}
            endAdornment={unitAdornment(quoteAdornmentLabel, {
              size: 'sm',
              className: 'whitespace-nowrap',
            })}
          />
        </div>
      </SettingsRow>

      <SettingsRow
        name="Smart orders"
        tooltip="Keep a subset of orders live on the exchange while staging the rest for faster execution."
        tooltipURL="/help/smart-orders"
        alerts={ordersInAdvanceAlerts}
        trailing={
          <Switch
            id="grid-use-smart-orders"
            checked={useOrderInAdvance ?? false}
            onCheckedChange={(checked) =>
              updateFormData('useOrderInAdvance', checked)
            }
          />
        }
        className="space-y-sm!"
        contentClassName="space-y-sm"
      >
        {useOrderInAdvance ? (
          <SettingsRowSurface tone="faint" spacing="sm" className="space-y-xs">
            <div className="flex items-center gap-xs">
              <Label htmlFor="grid-active-orders">Active orders</Label>
              <Tooltip tooltip="Choose how many buy and sell orders should remain on the book simultaneously.">
                <InfoIcon />
              </Tooltip>
            </div>
            <NumberInput
              id="grid-active-orders"
              value={ordersInAdvance?.toString() ?? ''}
              onChange={handleActiveOrdersChange}
              inputMode="numeric"
              placeholder="Number of orders to keep active"
              min={0}
              step={1}
              precision={0}
              showControls={false}
            />
          </SettingsRowSurface>
        ) : null}
      </SettingsRow>
    </MasonryLayout>
  );
};
