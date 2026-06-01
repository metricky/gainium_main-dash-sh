import React from 'react';

import { TakeProfitSettings } from '@/features/bots/bot-types/dca/form/sections';
import type { BotFormTabComponentProps } from '@/features/bots/widgets/BotForm/types';

export const TakeProfitSettingsTab: React.FC<BotFormTabComponentProps> = ({
  currentExchange,
  formData,
  updateFormData,
  errors,
}) => (
  <div className="space-y-md sm:space-y-lg lg:space-y-xl">
    <TakeProfitSettings
      currentExchange={currentExchange}
      formData={formData}
      updateFormData={updateFormData}
      errors={errors}
    />
  </div>
);

export default TakeProfitSettingsTab;
