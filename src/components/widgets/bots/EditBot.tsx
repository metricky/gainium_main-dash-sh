import React from 'react';

import BotFormWidget, {
  type BotFormWidgetProps,
} from '@/features/bots/widgets/BotForm/BotFormWidget';

export type { BotFormWidgetProps as EditBotProps } from '@/features/bots/widgets/BotForm/BotFormWidget';

const EditBot: React.FC<BotFormWidgetProps> = (props) => {
  return <BotFormWidget {...props} mode="edit" variant="widget" />;
};

export default EditBot;
