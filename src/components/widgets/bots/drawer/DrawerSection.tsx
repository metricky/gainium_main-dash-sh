import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '../../../ui/card';
import { WidgetWrapper } from '../../WidgetWrapper';

export interface DrawerSectionProps {
  widgetId: string;
  widgetType: string;
  title?: string;
  icon?: LucideIcon;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  // Drawer widgets render in a vertical list (not a grid) and are not resizable.
  // These props are accepted for API compatibility but are not used by the wrapper.
  minSize?: { w: number; h: number };
  maxSize?: { w: number; h: number };
  hasOptions?: boolean;
}

/**
 * DrawerSection - Standardized wrapper for bot drawer sections
 *
 * Provides consistent styling and structure for all drawer widgets:
 * - Uses Card with position={1} for consistent inner container styling
 * - No custom padding, borders, or background colors
 * - Unified header behavior (disabled by default)
 * - Consistent collapsible behavior (disabled by default)
 */
export const DrawerSection: React.FC<DrawerSectionProps> = ({
  widgetId,
  widgetType,
  title,
  icon: Icon,
  headerActions,
  children,
  minSize: _minSize = { w: 6, h: 6 },
  maxSize: _maxSize = { w: 12, h: 12 },
  hasOptions = false,
}) => {
  const wrapperProps = {
    metadata: {
      id: widgetId,
      type: widgetType,
      title: title || 'Section',
      header: false, // Remove header section for unified drawer appearance
      hasOptions,
    },
    isEditable: false,
    isCollapsible: false, // Remove fold/unfold functionality for unified drawer appearance
    noPadding: true, // Remove widget wrapper padding for drawer widgets
  };

  return (
    <WidgetWrapper {...wrapperProps}>
      <Card position={2}>
        {(title || Icon) && (
          <div className="flex items-center justify-between gap-sm mb-4 min-h-7">
            <div className="flex items-center gap-xs">
              {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
              {title && (
                <h3 className="text-sm font-semibold text-foreground">
                  {title}
                </h3>
              )}
            </div>
            {headerActions && (
              <div className="flex items-center gap-xs">{headerActions}</div>
            )}
          </div>
        )}
        {children}
      </Card>
    </WidgetWrapper>
  );
};

export default DrawerSection;
