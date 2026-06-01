import { GridStopLossSettings } from '@/features/bots/bot-types/grid/form/sections';
import type { BotFormTabComponentProps } from '@/features/bots/widgets/BotForm/types';

export const GridStopLossSettingsTab: React.FC<
  BotFormTabComponentProps
> = () => (
  <div className="space-y-md sm:space-y-lg lg:space-y-xl">
    <GridStopLossSettings />
  </div>
);

export default GridStopLossSettingsTab;
