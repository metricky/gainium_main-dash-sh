import type { BotWidgetType } from '../../../../components/widgets/bots';
import type { BotWidgetLayoutMap } from '../BotTypeRegistry';

export const COMBO_CREATE_WIDGETS: BotWidgetType[] = [
  'bot-chart',
  'create-bot',
  'backtests',
  'notes',
];

export const COMBO_EDIT_WIDGETS: BotWidgetType[] = [
  'edit-bot-chart',
  'edit-bot',
  'backtests',
  'notes',
];

export const COMBO_CREATE_LAYOUTS: BotWidgetLayoutMap = {
  'bot-chart': {
    mobile: { w: 12, h: 6, x: 0, y: 0 },
    tablet: { w: 8, h: 8, x: 0, y: 0 },
    desktop: { w: 8, h: 8, x: 0, y: 0 },
  },
  'create-bot': {
    mobile: { w: 12, h: 10, x: 0, y: 6 },
    tablet: { w: 4, h: 8, x: 8, y: 0 },
    desktop: { w: 4, h: 8, x: 8, y: 0 },
  },
  backtests: {
    mobile: { w: 12, h: 6, x: 0, y: 16 },
    tablet: { w: 4, h: 8, x: 8, y: 8 },
    desktop: { w: 4, h: 8, x: 8, y: 8 },
  },
  notes: {
    mobile: { w: 12, h: 6, x: 0, y: 22 },
    tablet: { w: 6, h: 6, x: 0, y: 16 },
    desktop: { w: 6, h: 6, x: 0, y: 16 },
  },
};

export const COMBO_EDIT_LAYOUTS: BotWidgetLayoutMap = {
  'edit-bot-chart': {
    mobile: { w: 12, h: 6, x: 0, y: 0 },
    tablet: { w: 8, h: 8, x: 0, y: 0 },
    desktop: { w: 8, h: 8, x: 0, y: 0 },
  },
  'edit-bot': {
    mobile: { w: 12, h: 10, x: 0, y: 6 },
    tablet: { w: 4, h: 8, x: 8, y: 0 },
    desktop: { w: 4, h: 8, x: 8, y: 0 },
  },
  backtests: {
    mobile: { w: 12, h: 6, x: 0, y: 16 },
    tablet: { w: 4, h: 8, x: 8, y: 8 },
    desktop: { w: 4, h: 8, x: 8, y: 8 },
  },
  notes: {
    mobile: { w: 12, h: 6, x: 0, y: 22 },
    tablet: { w: 6, h: 6, x: 0, y: 16 },
    desktop: { w: 6, h: 6, x: 0, y: 16 },
  },
};
