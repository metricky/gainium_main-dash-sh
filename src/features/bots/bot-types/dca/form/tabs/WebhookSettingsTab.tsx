import { BotWebhookSettings } from '@/features/bots/bot-types/dca/form/sections';
import type { BotFormTabComponentProps } from '@/features/bots/widgets/BotForm/types';
import React from 'react';

export const WebhookSettingsTab: React.FC<BotFormTabComponentProps> = ({
  formData,
}) => {
  return (
    <div className="space-y-lg sm:space-y-xl lg:space-y-10">
      <BotWebhookSettings formData={formData} />
    </div>
  );
};

export default WebhookSettingsTab;
