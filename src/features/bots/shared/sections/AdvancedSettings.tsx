import SettingsGroup from '@/components/widgets/shared/SettingsGroup';
import {
  useBotFormSelector,
  type BotFormUpdateValue,
  type Fields,
} from '@/contexts/bots/form/BotFormProvider';
import { BotTypesEnum } from '@/types';
import type { BotFormData } from '@/types/bots/form';
import React, { useMemo } from 'react';

interface AdvancedSettingsProps {
  formData: BotFormData;
  updateFormData: (field: Fields, value: BotFormUpdateValue) => void;
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  formData,
  updateFormData,
}) => {
  const useOrderInAdvance = useBotFormSelector('useOrderInAdvance');
  const useSmartOrders = useBotFormSelector('useSmartOrders');
  const isEnabled = useMemo(
    () =>
      formData.type === BotTypesEnum.grid ? useOrderInAdvance : useSmartOrders,
    [formData.type, useOrderInAdvance, useSmartOrders]
  );
  return (
    <SettingsGroup
      title="More Settings"
      isEnabled={isEnabled}
      onToggle={(enabled) => updateFormData('useSmartOrders', enabled)}
      tooltipText="Advanced features for experienced traders"
      id="use-smart-orders"
    >
      <div className="space-y-md">
        {/* Advanced settings content will go here */}
      </div>
    </SettingsGroup>
  );
};
