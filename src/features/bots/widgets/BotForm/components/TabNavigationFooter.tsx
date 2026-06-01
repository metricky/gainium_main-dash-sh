import React from 'react';

import { Button } from '@/components/ui/button';
import type { BotFormTabId } from '@/contexts/bots/form/BotFormProvider';
import type { BotFormTabDescriptor } from '@/features/bots/widgets/BotForm/types';

interface TabNavigationFooterProps {
  descriptor: BotFormTabDescriptor;
  activeTab: BotFormTabId;
  onTabChange: (tabId: BotFormTabId) => void;
  descriptors: BotFormTabDescriptor[];
}

export const TabNavigationFooter: React.FC<TabNavigationFooterProps> = ({
  descriptor,
  activeTab,
  onTabChange,
  descriptors,
}) => {
  const Icon = descriptor.icon;
  const navigation = descriptor.navigation;

  const previousTarget = navigation?.previous;
  const nextTarget = navigation?.next;

  const resolveLabel = (tabId: BotFormTabId) =>
    descriptors.find((entry) => entry.id === tabId)?.label ?? tabId;

  const currentLabel = navigation?.currentLabel ?? descriptor.label;

  return (
    <div className="flex justify-between items-center pt-6 border-t border-border">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onTabChange(descriptor.id)}
        disabled={activeTab === descriptor.id}
        className="flex items-center gap-xs"
      >
        <Icon className="w-4 h-4" />
        {currentLabel}
      </Button>

      {(previousTarget || nextTarget) && (
        <div className="flex gap-xs">
          {previousTarget && (
            <Button
              type="button"
              variant={previousTarget.variant ?? 'outline'}
              size="sm"
              onClick={() => onTabChange(previousTarget.id)}
              disabled={
                previousTarget.id === descriptor.id &&
                activeTab === descriptor.id
              }
            >
              {previousTarget.label ?? 'Previous'}
            </Button>
          )}

          {nextTarget && (
            <Button
              type="button"
              variant={nextTarget.variant ?? 'default'}
              size="sm"
              onClick={() => onTabChange(nextTarget.id)}
            >
              {nextTarget.label ?? `Next: ${resolveLabel(nextTarget.id)}`}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default TabNavigationFooter;
