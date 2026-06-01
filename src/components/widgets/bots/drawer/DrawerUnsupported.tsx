import type { DrawerBotType } from '@/types/bots/drawer';
import { AlertTriangle } from 'lucide-react';
import React from 'react';
import { DrawerSection } from './DrawerSection';

export interface DrawerUnsupportedProps {
  widgetId: string;
  botId?: string;
  botType?: DrawerBotType;
  message?: string;
}

const DrawerUnsupported: React.FC<DrawerUnsupportedProps> = ({
  widgetId,
  botType,
  message,
}) => {
  return (
    <DrawerSection
      widgetId={widgetId}
      widgetType="drawer-unsupported"
      title="Data Unavailable"
      icon={AlertTriangle}
      minSize={{ w: 4, h: 3 }}
      maxSize={{ w: 12, h: 6 }}
    >
      <div className="flex flex-col items-start gap-sm">
        <div className="flex items-center gap-xs text-sm font-medium text-muted-foreground">
          <AlertTriangle className="h-4 w-4" />
          <span>Widget unavailable</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {message ??
            `We do not have the required data to render this widget${
              botType ? ` for ${botType.toUpperCase()} bots` : ''
            } yet.`}
        </p>
      </div>
    </DrawerSection>
  );
};

export default DrawerUnsupported;
