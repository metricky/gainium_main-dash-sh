import type { BotWidgetType } from '../../../../components/widgets/bots';
import type { BotWidgetLayoutMap } from '../BotTypeRegistry';

import {
  inheritWidgetList,
  deriveLayoutMap,
} from '@/features/bots/shared/presets/widgetLayoutFactory';
import {
  DCA_CREATE_WIDGETS,
  DCA_EDIT_WIDGETS,
  DCA_CREATE_LAYOUTS,
  DCA_EDIT_LAYOUTS,
} from './dca.presets';

const GRID_PRIMARY_DATA_WIDGET: BotWidgetType = 'grid-bot-data';

export const GRID_CREATE_WIDGETS: BotWidgetType[] =
  inheritWidgetList(DCA_CREATE_WIDGETS);

export const GRID_EDIT_WIDGETS: BotWidgetType[] =
  inheritWidgetList(DCA_EDIT_WIDGETS);

export const GRID_CREATE_LAYOUTS: BotWidgetLayoutMap =
  deriveLayoutMap(DCA_CREATE_LAYOUTS);

export const GRID_EDIT_LAYOUTS: BotWidgetLayoutMap =
  deriveLayoutMap(DCA_EDIT_LAYOUTS);

export { GRID_PRIMARY_DATA_WIDGET };
