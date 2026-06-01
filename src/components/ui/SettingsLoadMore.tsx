import { Button } from '@/components/ui/button';
import { type SettingsNavId } from '@/hooks/bots/useSettingsNavigation';
import { ChevronDown, ChevronUp } from 'lucide-react';
import React from 'react';
import MasonryLayout from './MasonryLayout';

interface SettingsLoadMoreProps {
  /**
   * Navigation ID for this collapsible section.
   * Use a value from SETTINGS_NAV_IDS for type safety.
   */
  id: SettingsNavId | string;
  title?: string;
  children: React.ReactNode;
  autoExpand?: boolean;
}

export const SettingsLoadMore: React.FC<SettingsLoadMoreProps> = ({
  id,
  title = 'More Settings',
  children,
  autoExpand = false,
}) => {
  const [internalIsExpanded, setInternalIsExpanded] = React.useState(false);

  // Auto-expand if parent indicates enabled content exists
  const isExpanded = autoExpand || internalIsExpanded;

  const handleToggle = React.useCallback(() => {
    setInternalIsExpanded((prev) => !prev);
  }, []);

  const hasItems = React.Children.toArray(children).some(
    (child) => child !== null && child !== undefined
  );

  return (
    <>
      {hasItems && (
        <>
          <Button
            type="button"
            variant="subtle"
            onClick={handleToggle}
            className="flex w-full items-center justify-between p-4 text-sm font-medium hover:bg-muted/50"
            aria-expanded={isExpanded}
            aria-controls={`settings-load-more-${id}`}
            data-settings-nav-id={id}
            tabIndex={-1}
          >
            <span>{title}</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {/* Render all items when expanded */}
          {isExpanded && (
            <div id={`settings-load-more-${id}`} className="pt-3">
              <MasonryLayout
                gap={16}
                containerBreakpoints={{
                  default: 1,
                  640: 2,
                  1024: 3,
                }}
              >
                {children}
              </MasonryLayout>
            </div>
          )}
        </>
      )}
    </>
  );
};
