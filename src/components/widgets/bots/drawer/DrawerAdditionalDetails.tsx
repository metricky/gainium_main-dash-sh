import type { DrawerBot } from '@/types/bots/drawer';
import { Settings } from 'lucide-react';
import React from 'react';
/* import { useDcaBots } from '../../../../hooks/useDcaBots'; */
import { DrawerSection } from './DrawerSection';

export interface DrawerAdditionalDetailsProps {
  widgetId: string;
  botId?: string;
  botSnapshot?: DrawerBot;
}

export const DrawerAdditionalDetails: React.FC<
  DrawerAdditionalDetailsProps
> = ({
  widgetId,
  //botId,
  botSnapshot,
}) => {
  // Get bot data (exclude terminal deals)
  /* const { bots, isLoading } = useDcaBots({
    terminal: false,
    paperContext: false,
    all: true,
  }); */
  /* const bot = bots.find((b) => b._id === botId); */
  const bot = /*  bot ?? */ botSnapshot;

  /* if (isLoading) {
    return (
      <DrawerSection
        widgetId={widgetId}
        widgetType="drawer-additional-details"
        title="Additional Details"
        icon={Settings}
        minSize={{ w: 4, h: 3 }}
        maxSize={{ w: 12, h: 6 }}
      >
        <div className="text-center text-muted-foreground py-4">
          Loading additional details...
        </div>
      </DrawerSection>
    );
  } */

  if (!bot) {
    return (
      <DrawerSection
        widgetId={widgetId}
        widgetType="drawer-additional-details"
        title="Additional Details"
        icon={Settings}
        minSize={{ w: 4, h: 3 }}
        maxSize={{ w: 12, h: 6 }}
      >
        <div className="text-center text-muted-foreground">
          No additional details available
        </div>
      </DrawerSection>
    );
  }

  // Extract additional details from resolved bot data
  const botIdDisplay = bot?._id ?? botSnapshot?.id ?? 'N/A';
  const exchangeUUID =
    (bot as { exchangeUUID?: string; exchange?: string } | undefined)
      ?.exchangeUUID ??
    botSnapshot?.exchangeUUID ??
    (bot as { exchange?: string } | undefined)?.exchange ??
    botSnapshot?.exchange ??
    'N/A';
  const symbolCandidates =
    (bot as { symbols?: string[] } | undefined)?.symbols ??
    botSnapshot?.symbol ??
    [];
  const allSymbols =
    Array.isArray(symbolCandidates) && symbolCandidates.length > 1
      ? symbolCandidates
      : [];

  return (
    <DrawerSection
      widgetId={widgetId}
      widgetType="drawer-additional-details"
      title="Additional Details"
      icon={Settings}
      minSize={{ w: 4, h: 3 }}
      maxSize={{ w: 12, h: 6 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Bot ID</span>
          <span className="font-mono text-xs">{botIdDisplay}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Exchange UUID</span>
          <span className="font-mono text-xs">{exchangeUUID}</span>
        </div>

        {allSymbols.length > 0 && (
          <div className="flex items-center justify-between md:col-span-2">
            <span className="text-xs text-muted-foreground">All Symbols</span>
            <span className="font-mono text-xs">{allSymbols.join(', ')}</span>
          </div>
        )}
      </div>
    </DrawerSection>
  );
};
