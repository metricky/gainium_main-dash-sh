import { NumberInput } from '@/components/ui/number-input';
import { Switch } from '@/components/ui/switch';
import SettingsGroup from '@/components/widgets/shared/SettingsGroup';
import SettingsRow from '@/components/widgets/shared/SettingsRow';
import React from 'react';

// Placeholder props for future automation state wiring

interface HedgeAutomationState {
  enabled?: boolean;
  cooldown?: number | string;
  allocationFilter?: boolean;
  // Add more fields as automation features expand
}

interface HedgeAutomationSectionsProps {
  value?: HedgeAutomationState;
  onChange?: (updates: Partial<HedgeAutomationState>) => void;
  isFieldLocked?: boolean;
}

export const HedgeAutomationSections: React.FC<
  HedgeAutomationSectionsProps
> = ({ value = {}, onChange = () => {}, isFieldLocked = false }) => (
  <SettingsGroup title="Automation Controls" alwaysEnabled>
    <div className="grid grid-cols-1 gap-md @[800px]:grid-cols-2">
      <SettingsRow
        name="Enable automation"
        tooltip="Toggle all automation features for this bot"
      >
        <Switch
          checked={Boolean(value.enabled)}
          onCheckedChange={(enabled) => onChange({ enabled })}
          disabled={isFieldLocked}
        />
      </SettingsRow>
      <SettingsRow
        name="Cooldown (seconds)"
        tooltip="Minimum time between automation triggers"
      >
        <NumberInput
          value={value.cooldown ?? ''}
          onChange={(next) => onChange({ cooldown: next })}
          min={0}
          showControls={false}
          disabled={isFieldLocked}
        />
      </SettingsRow>
      <SettingsRow
        name="Allocation filter"
        tooltip="Enable allocation-based automation filtering"
      >
        <Switch
          checked={Boolean(value.allocationFilter)}
          onCheckedChange={(enabled) => onChange({ allocationFilter: enabled })}
          disabled={isFieldLocked}
        />
      </SettingsRow>
      {/* Add more automation controls here as needed */}
    </div>
  </SettingsGroup>
);

export default HedgeAutomationSections;
