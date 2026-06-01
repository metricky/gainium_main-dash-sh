import React from 'react';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WidgetWrapper, type WidgetMenuActions } from '../WidgetWrapper';
import { getCompatibilityDefaultSize } from '../DefaultWidgetSizes';

export interface BotSettingsProps {
  widgetId: string;
  isEditable?: boolean;
  onRemove?: () => void;
  onSettings?: () => void;
  onCollapse?: (widgetId: string, collapsed: boolean) => void;
  onTabMove?: (
    fromTabId: string,
    toWidgetId: string,
    toTabIndex: number
  ) => void;
  menuActions?: WidgetMenuActions;
}

const BotSettings: React.FC<BotSettingsProps> = ({
  widgetId,
  isEditable = false,
  onRemove,
  onSettings,
  onCollapse,
  onTabMove,
  menuActions,
}) => {
  const wrapperProps = {
    metadata: {
      id: widgetId,
      type: 'bot-settings',
      title: 'Bot Settings',
      defaultSize: getCompatibilityDefaultSize('bot-settings'),
      minSize: { w: 6, h: 6 },
      maxSize: { w: 10, h: 10 },
      hasOptions: true,
      value: {
        primary: 'DCA Bot #1',
        secondary: 'Active',
      },
    },
    isEditable,
    ...(onRemove && { onRemove }),
    ...(onSettings && { onSettings }),
    ...(onCollapse && { onCollapse }),
    ...(onTabMove && { onTabMove }),
    ...(menuActions && { menuActions }),
  };

  return (
    <WidgetWrapper {...wrapperProps}>
      <div className="flex flex-col h-full space-y-md">
        {/* Bot Selection */}
        <motion.div
          className="bg-inner-container rounded-lg p-md"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h4 className="font-semibold mb-2">Bot Selection</h4>
          {/* TODO: wire up bot list/selection state — currently mock options */}
          <Select defaultValue="dca-1">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dca-1">DCA Bot #1</SelectItem>
              <SelectItem value="dca-2">DCA Bot #2</SelectItem>
              <SelectItem value="grid-1">Grid Bot #1</SelectItem>
              <SelectItem value="grid-2">Grid Bot #2</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Quick Settings */}
        <motion.div
          className="bg-inner-container rounded-lg p-md flex-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h4 className="font-semibold mb-3">Quick Settings</h4>
          <div className="space-y-sm">
            {/* Status Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-profit transition-colors">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
              </button>
            </div>

            {/* Take Profit */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Take Profit</span>
              <div className="flex items-center space-x-xs">
                <input
                  type="number"
                  className="w-16 px-2 py-1 text-xs border rounded"
                  defaultValue="5"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>

            {/* Stop Loss */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Stop Loss</span>
              <div className="flex items-center space-x-xs">
                <input
                  type="number"
                  className="w-16 px-2 py-1 text-xs border rounded"
                  defaultValue="10"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>

            {/* Max Active Deals */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Max Active Deals</span>
              <input
                type="number"
                className="w-16 px-2 py-1 text-xs border rounded"
                defaultValue="3"
              />
            </div>

            {/* Base Order Size */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Base Order Size</span>
              <div className="flex items-center space-x-xs">
                <input
                  type="number"
                  className="w-20 px-2 py-1 text-xs border rounded"
                  defaultValue="100"
                />
                <span className="text-xs text-muted-foreground">USDT</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-xs mt-4">
            <button className="flex-1 px-3 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              Save Changes
            </button>
            <button className="flex-1 px-3 py-2 text-xs border border-border rounded-lg hover:bg-muted/50 transition-colors">
              Reset
            </button>
          </div>
        </motion.div>
      </div>
    </WidgetWrapper>
  );
};

export default BotSettings;
