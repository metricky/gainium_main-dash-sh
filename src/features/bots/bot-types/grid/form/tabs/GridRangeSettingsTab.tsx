import { GridRangeSettings } from '@/features/bots/bot-types/grid/form/sections';
import type { BotFormTabComponentProps } from '@/features/bots/widgets/BotForm/types';

export const GridRangeSettingsTab: React.FC<BotFormTabComponentProps> = () => (
  <div className="space-y-md sm:space-y-lg lg:space-y-xl">
    <GridRangeSettings />
  </div>
);

export default GridRangeSettingsTab;
