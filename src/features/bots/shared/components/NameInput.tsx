import React from 'react';

import { FieldVariableBinding } from '@/components/ui/field-variable-binding';
import { Input } from '@/components/ui/input';
import SettingsRow from '@/components/widgets/shared/SettingsRow';
import { useBotFormState } from '@/contexts/bots/form/BotFormProvider';

export const NameInput: React.FC = () => {
  const { formData, updateFormData, isFieldLocked } = useBotFormState();

  return (
    <SettingsRow
      name="Bot Name"
      tooltip="Name for your bot configuration"
      alerts={useBotFormState().alerts?.name ?? []}
      navId="name"
    >
      <div className="space-y-xs">
        <FieldVariableBinding
          path="name"
          varType="text"
          tooltip="Bind bot name"
          variant="inline"
          disabled={Boolean(isFieldLocked?.('name'))}
          onVariableSelected={(variable) => {
            if (variable?.value === undefined || variable.value === null) {
              return;
            }
            const nextValue =
              typeof variable.value === 'string'
                ? variable.value
                : String(variable.value);
            updateFormData('name', nextValue);
          }}
          onVariableResolved={(variable) => {
            if (
              !variable ||
              variable.value === undefined ||
              variable.value === null
            ) {
              return;
            }
            const nextValue =
              typeof variable.value === 'string'
                ? variable.value
                : String(variable.value);
            if (nextValue !== formData.name) {
              updateFormData('name', nextValue);
            }
          }}
        >
          <Input
            id="grid-bot-name"
            value={formData.name}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              updateFormData('name', event.target.value)
            }
            placeholder="Enter a descriptive bot name"
            className={
              (useBotFormState().alerts?.name ?? []).some(
                (a) => a.variant === 'error'
              )
                ? 'border-destructive'
                : ''
            }
            disabled={Boolean(isFieldLocked?.('name'))}
          />
        </FieldVariableBinding>
        {/* Name errors are surfaced via SettingsRow alerts (validator-driven) */}
      </div>
    </SettingsRow>
  );
};
