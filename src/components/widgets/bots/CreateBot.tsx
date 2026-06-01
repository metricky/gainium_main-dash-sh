import React from 'react';

import BotFormWidget, {
  type BotFormWidgetProps,
} from '@/features/bots/widgets/BotForm/BotFormWidget';

export type { BotFormWidgetProps as CreateBotProps } from '@/features/bots/widgets/BotForm/BotFormWidget';

const CreateBot: React.FC<BotFormWidgetProps> = (props) => {
  return <BotFormWidget {...props} mode="create" variant="widget" />;
};

export default CreateBot;
