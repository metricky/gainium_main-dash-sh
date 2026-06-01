import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { navigateToSetting } from '@/hooks/bots/useSettingsNavigation';
import { logger } from '@/lib/loggerInstance';
import { cn } from '@/lib/utils';
import type { BotFormAlert } from '@/types/bots/form';
import React from 'react';
import SettingsAlert from './SettingsAlert';

interface BotFormAlertSummaryProps {
  alerts?: BotFormAlert[];
}

export const BotFormAlertSummary: React.FC<BotFormAlertSummaryProps> = ({
  alerts,
}) => {
  if (!alerts || alerts.length === 0) return null;

  const primary = alerts[0];
  const others = alerts.slice(1);

  return (
    <div className="flex w-full min-w-0 items-center justify-end gap-xs">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn('flex w-full min-w-0 items-center justify-end gap-xs')}
            aria-label={`Show ${alerts.length} alerts`}
            title={primary.title ?? primary.message}
            type="button"
          >
            <SettingsAlert
              variant={primary.variant}
              title={primary.title ?? primary.message}
              description={primary.description}
            />
            {others.length > 0 && (
              <span className="text-muted-foreground">+{others.length}</span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          {alerts.map((a, idx) => (
            <DropdownMenuItem
              key={idx}
              onSelect={() => {
                const navTarget = a.navId;
                logger.debugCategory('SettingsNavigation', 'Alert clicked', {
                  navTarget,
                  alert: a,
                });
                if (navTarget) {
                  setTimeout(() => {
                    navigateToSetting(navTarget);
                  }, 0);
                }
              }}
            >
              <SettingsAlert
                variant={a.variant}
                title={a.title ?? a.message}
                description={a.description}
                className="w-full"
                navId={a.navId}
              />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default BotFormAlertSummary;
