import type { Layout } from 'react-grid-layout';
import { logger } from '../../lib/loggerInstance';
import type { WidgetConfig } from '../../stores/dashboardStore';
import {
  getCurrentBreakpoint,
  getDefaultWidgetSize,
} from '../widgets/DefaultWidgetSizes';
import { getWidgetMetadata, type WidgetType } from '../widgets/dashboard';

/**
 * TidyLayoutEngine - A comprehensive layout optimization system
 *
 * This component handles the intelligent reorganization of dashboard widgets to:
 * 1. Reset all widgets to their default sizes
 * 2. Minimize empty spaces through optimal positioning
 * 3. Expand widgets to fill available space while respecting constraints
 *
 * ALGORITHM OVERVIEW:
 * ==================
 *
 * Phase 1: Reset to Default Sizes
 * - Each widget is reset to its predefined default width and height
 * - This ensures consistent starting point regardless of previous manual resizing
 * - Default sizes are defined in DefaultWidgetSizes.ts
 *
 * Phase 2: Optimal Positioning (Grid Packing)
 * - Widgets are arranged in a left-to-right, top-to-bottom flow
 * - When a widget doesn't fit in the current row, it moves to the next row
 * - This creates the most compact vertical layout possible
 * - Rows are automatically sized based on the tallest widget in each row
 *
 * Phase 3: Space Expansion (Horizontal Optimization)
 * - For each row, calculate remaining horizontal space (12 cols - used cols)
 * - Distribute extra space proportionally among widgets based on their expansion capacity
 * - Expansion capacity = (maxWidth - currentWidth) for each widget
 * - Widgets with higher expansion capacity get more of the extra space
 * - Prevents widgets from exceeding their maximum allowed sizes
 *
 * Phase 4: Vertical Compaction
 * - Remove any unnecessary vertical gaps between rows
 * - Ensure rows are positioned as close together as possible
 * - Maintains proper spacing while maximizing screen real estate usage
 */

export interface TidyLayoutOptions {
  /** Grid system column count (typically 12) */
  gridCols?: number;
  /** Whether to enable horizontal expansion to fill empty spaces */
  enableHorizontalExpansion?: boolean;
  /** Whether to enable vertical compaction */
  enableVerticalCompaction?: boolean;
  /** Minimum gap between rows (in grid units) */
  minRowGap?: number;
  /** Registry type for appropriate widget sizing ('dashboard' | 'trading') */
  registry?: 'dashboard' | 'trading';
  /** Override container width for breakpoint calculation */
  containerWidth?: number;
}

export interface TidyLayoutResult {
  /** Optimized layout array for react-grid-layout */
  layout: Layout[];
  /** Updated widget configurations with new layout data */
  widgets: WidgetConfig[];
  /** Statistics about the optimization */
  stats: {
    totalWidgets: number;
    spaceSavedVertically: number;
    spaceSavedHorizontally: number;
    averageWidgetExpansion: number;
  };
}

/**
 * Main tidy layout engine class
 * Encapsulates all the logic for intelligent widget reorganization
 */
export class TidyLayoutEngine {
  private options: TidyLayoutOptions;

  constructor(options: TidyLayoutOptions = {}) {
    this.options = {
      gridCols: 12,
      enableHorizontalExpansion: true,
      enableVerticalCompaction: true,
      minRowGap: 0,
      registry: 'dashboard',
      ...options,
    };
  }

  /**
   * Main entry point for layout optimization
   * Performs all phases of the tidy up process
   */
  public tidyLayout(widgets: WidgetConfig[]): TidyLayoutResult {
    logger.info('Starting tidy layout process', {
      widgetCount: widgets.length,
      options: this.options,
    });

    if (widgets.length === 0) {
      return {
        layout: [],
        widgets: [],
        stats: {
          totalWidgets: 0,
          spaceSavedVertically: 0,
          spaceSavedHorizontally: 0,
          averageWidgetExpansion: 0,
        },
      };
    }

    // Phase 1: Reset to default sizes
    const resizedWidgets = this.resetToDefaultSizes(widgets);
    logger.debug('Phase 1 complete: Reset to default sizes');

    // Phase 2: Optimal positioning (grid packing)
    const packedLayout = this.createOptimalPackedLayout(resizedWidgets);
    logger.debug('Phase 2 complete: Optimal positioning');

    // Phase 3: Space expansion (horizontal optimization)
    const expandedLayout = this.options.enableHorizontalExpansion
      ? this.expandHorizontally(packedLayout, resizedWidgets)
      : packedLayout;
    logger.debug('Phase 3 complete: Horizontal expansion');

    // Phase 4: Vertical compaction
    const compactedLayout = this.options.enableVerticalCompaction
      ? this.compactVertically(expandedLayout)
      : expandedLayout;
    logger.debug('Phase 4 complete: Vertical compaction');

    // Update widget configurations with final layout data
    const finalWidgets = this.updateWidgetLayoutData(
      resizedWidgets,
      compactedLayout
    );

    // Calculate optimization statistics
    const stats = this.calculateStats(widgets, finalWidgets, compactedLayout);

    logger.info('Tidy layout process completed', stats);

    return {
      layout: compactedLayout,
      widgets: finalWidgets,
      stats,
    };
  }

  /**
   * PHASE 1: Reset all widgets to their default dimensions
   *
   * Why this is important:
   * - Users may have manually resized widgets over time
   * - Some widgets might be in non-optimal sizes
   * - Creates a clean, consistent starting point for optimization
   * - Ensures predictable behavior regardless of current state
   * - Uses responsive sizing based on current screen width
   */
  private resetToDefaultSizes(widgets: WidgetConfig[]): WidgetConfig[] {
    // Get current breakpoint for responsive sizing
    const containerWidth =
      this.options.containerWidth ||
      (typeof window !== 'undefined' ? window.innerWidth - 64 : 1200); // Account for sidebar
    const currentBreakpoint = getCurrentBreakpoint(containerWidth);

    logger.debug(
      `Resetting widgets to default sizes for breakpoint: ${currentBreakpoint} (container width: ${containerWidth}px)`
    );

    return widgets.map((widget) => {
      // Get the responsive default size for this widget type and current breakpoint
      const defaultSize = getDefaultWidgetSize(widget.type, currentBreakpoint);

      logger.debug(
        `Resetting widget ${widget.id} (${widget.type}) to responsive default size:`,
        {
          breakpoint: currentBreakpoint,
          from: { w: widget.layoutData.w, h: widget.layoutData.h },
          to: { w: defaultSize.w, h: defaultSize.h },
        }
      );

      return {
        ...widget,
        layoutData: {
          ...widget.layoutData,
          w: defaultSize.w,
          h: defaultSize.h,
          // Keep current position for now, will be optimized in next phase
        },
      };
    });
  }

  /**
   * PHASE 2: Create optimal packed layout (minimize empty spaces)
   *
   * Algorithm: Left-to-right, top-to-bottom greedy packing
   * - Start at position (0,0)
   * - For each widget, try to place it at current position
   * - If it doesn't fit in current row, move to next row
   * - Track row height as the maximum height of widgets in that row
   * - This creates the most vertically compact layout possible
   */
  private createOptimalPackedLayout(widgets: WidgetConfig[]): Layout[] {
    const layouts: Layout[] = [];
    let currentX = 0;
    let currentY = 0;
    let rowHeight = 0;

    for (const widget of widgets) {
      const widgetWidth = widget.layoutData.w;
      const widgetHeight = widget.layoutData.h;

      // Check if widget fits in current row
      if (currentX + widgetWidth > (this.options.gridCols ?? 12)) {
        // Move to next row
        currentX = 0;
        currentY += rowHeight + (this.options.minRowGap ?? 0);
        rowHeight = 0;

        logger.debug(`Widget ${widget.id} moved to new row at y=${currentY}`);
      }

      // Place widget at current position
      layouts.push({
        i: widget.id,
        x: currentX,
        y: currentY,
        w: widgetWidth,
        h: widgetHeight,
        moved: false,
        static: false,
      });

      logger.debug(
        `Placed widget ${widget.id} at (${currentX}, ${currentY}) size (${widgetWidth}x${widgetHeight})`
      );

      // Update position for next widget
      currentX += widgetWidth;
      rowHeight = Math.max(rowHeight, widgetHeight);
    }

    return layouts;
  }

  /**
   * PHASE 3: Horizontal expansion to fill empty spaces
   *
   * For each row:
   * 1. Calculate remaining horizontal space (gridCols - usedCols)
   * 2. Determine expansion capacity for each widget (maxWidth - currentWidth)
   * 3. Distribute extra space proportionally based on expansion capacity
   * 4. Ensure no widget exceeds its maximum allowed size
   *
   * This maximizes screen real estate usage while respecting widget constraints
   */
  private expandHorizontally(
    layouts: Layout[],
    widgets: WidgetConfig[]
  ): Layout[] {
    if (layouts.length === 0) return layouts;

    // Group widgets by row (same Y coordinate)
    const rowGroups = this.groupLayoutsByRow(layouts);
    const expandedLayouts: Layout[] = [];

    for (const [rowY, rowLayouts] of rowGroups.entries()) {
      const totalUsedWidth = rowLayouts.reduce(
        (sum, layout) => sum + layout.w,
        0
      );
      const remainingWidth = (this.options.gridCols ?? 12) - totalUsedWidth;

      logger.debug(
        `Row ${rowY}: used=${totalUsedWidth}, remaining=${remainingWidth}`
      );

      if (remainingWidth > 0) {
        // Calculate expansion capacity for each widget in this row
        const expansionInfo = rowLayouts.map((layout) => {
          const widget = widgets.find((w) => w.id === layout.i);
          const widgetType = widget?.type || '';
          const maxSize = this.getMaxSize(widgetType);
          const maxExpansion = Math.max(0, maxSize.w - layout.w);

          return {
            layout,
            maxExpansion,
            widgetType,
          };
        });

        const totalExpansionCapacity = expansionInfo.reduce(
          (sum, info) => sum + info.maxExpansion,
          0
        );

        // Distribute remaining width proportionally
        let currentX = 0;
        let remainingWidthToDistribute = Math.min(
          remainingWidth,
          totalExpansionCapacity
        );

        expansionInfo.forEach((info, index) => {
          let extraWidth = 0;

          if (totalExpansionCapacity > 0 && remainingWidthToDistribute > 0) {
            // Calculate proportional expansion
            const proportion = info.maxExpansion / totalExpansionCapacity;
            extraWidth = Math.min(
              Math.floor(remainingWidth * proportion),
              info.maxExpansion,
              remainingWidthToDistribute
            );

            // Handle remainder for last widget in row
            if (index === expansionInfo.length - 1) {
              const usedWidth = expansionInfo
                .slice(0, -1)
                .reduce((sum, prevInfo) => {
                  const prevProportion =
                    prevInfo.maxExpansion / totalExpansionCapacity;
                  return (
                    sum +
                    Math.min(
                      Math.floor(remainingWidth * prevProportion),
                      prevInfo.maxExpansion
                    )
                  );
                }, 0);

              extraWidth = Math.min(
                remainingWidth - usedWidth,
                info.maxExpansion,
                remainingWidthToDistribute
              );
            }

            remainingWidthToDistribute -= extraWidth;
          }

          const expandedLayout = {
            ...info.layout,
            x: currentX,
            w: info.layout.w + extraWidth,
          };

          expandedLayouts.push(expandedLayout);
          currentX += expandedLayout.w;

          if (extraWidth > 0) {
            logger.debug(
              `Expanded widget ${info.layout.i} by ${extraWidth} units`
            );
          }
        });
      } else {
        // No expansion needed, just update X positions for proper alignment
        let currentX = 0;
        rowLayouts.forEach((layout) => {
          expandedLayouts.push({
            ...layout,
            x: currentX,
          });
          currentX += layout.w;
        });
      }
    }

    return expandedLayouts;
  }

  /**
   * PHASE 4: Vertical compaction to remove unnecessary gaps
   *
   * Ensures that rows are positioned as close together as possible
   * while maintaining the minimum required gap between rows
   */
  private compactVertically(layouts: Layout[]): Layout[] {
    if (layouts.length === 0) return layouts;

    const rowGroups = this.groupLayoutsByRow(layouts);
    const sortedRows = Array.from(rowGroups.entries()).sort(
      ([a], [b]) => a - b
    );

    const compactedLayouts: Layout[] = [];
    let currentY = 0;

    for (const [_originalY, rowLayouts] of sortedRows) {
      const rowHeight = Math.max(...rowLayouts.map((layout) => layout.h));

      // Update all layouts in this row to the new Y position
      for (const layout of rowLayouts) {
        compactedLayouts.push({
          ...layout,
          y: currentY,
        });
      }

      // Move to next row position
      currentY += rowHeight + (this.options.minRowGap ?? 0);
    }

    return compactedLayouts;
  }

  /**
   * Helper method to group layouts by their Y coordinate (row)
   */
  private groupLayoutsByRow(layouts: Layout[]): Map<number, Layout[]> {
    const rowGroups = new Map<number, Layout[]>();

    for (const layout of layouts) {
      if (!rowGroups.has(layout.y)) {
        rowGroups.set(layout.y, []);
      }
      rowGroups.get(layout.y)?.push(layout);
    }

    return rowGroups;
  }

  /**
   * Get maximum allowed size for a widget type
   */
  private getMaxSize(type: string): { w: number; h: number } {
    try {
      return (
        getWidgetMetadata(type as WidgetType).maxSize ?? { w: 12, h: 8 }
      );
    } catch {
      // Fallback for unknown widget types
      logger.warn(`Unknown widget type: ${type}. Using fallback max size.`);
      return { w: 12, h: 8 };
    }
  }

  /**
   * Update widget configurations with final layout data
   */
  private updateWidgetLayoutData(
    widgets: WidgetConfig[],
    layouts: Layout[]
  ): WidgetConfig[] {
    return widgets.map((widget) => {
      const layoutItem = layouts.find((item) => item.i === widget.id);
      if (layoutItem) {
        return {
          ...widget,
          layoutData: { ...layoutItem },
        };
      }
      return widget;
    });
  }

  /**
   * Calculate optimization statistics for reporting
   */
  private calculateStats(
    originalWidgets: WidgetConfig[],
    finalWidgets: WidgetConfig[],
    finalLayout: Layout[]
  ) {
    const originalMaxY = Math.max(
      ...originalWidgets.map((w) => w.layoutData.y + w.layoutData.h),
      0
    );
    const finalMaxY = Math.max(...finalLayout.map((l) => l.y + l.h), 0);

    const spaceSavedVertically = Math.max(0, originalMaxY - finalMaxY);

    const totalExpansion = finalWidgets.reduce((sum, widget, index) => {
      const originalWidget = originalWidgets[index];
      const expansion = widget.layoutData.w - originalWidget.layoutData.w;
      return sum + Math.max(0, expansion);
    }, 0);

    const averageWidgetExpansion =
      finalWidgets.length > 0 ? totalExpansion / finalWidgets.length : 0;

    return {
      totalWidgets: finalWidgets.length,
      spaceSavedVertically,
      spaceSavedHorizontally: totalExpansion,
      averageWidgetExpansion,
    };
  }
}

/**
 * Convenience function to create and use the tidy layout engine
 *
 * @param widgets - Array of widget configurations to optimize
 * @param options - Optional configuration for the optimization process
 * @returns Optimized layout result with statistics
 */
export function tidyLayout(
  widgets: WidgetConfig[],
  options?: TidyLayoutOptions
): TidyLayoutResult {
  const engine = new TidyLayoutEngine(options);
  return engine.tidyLayout(widgets);
}

/**
 * USAGE EXAMPLES:
 * ===============
 *
 * Basic usage:
 * ```typescript
 * const result = tidyLayout(currentWidgets);
 * // Apply result.layout and result.widgets to your store
 * ```
 *
 * With custom options:
 * ```typescript
 * const result = tidyLayout(currentWidgets, {
 *   gridCols: 12,
 *   enableHorizontalExpansion: true,
 *   enableVerticalCompaction: true,
 *   minRowGap: 1
 * });
 * ```
 *
 * Disable certain optimizations:
 * ```typescript
 * const result = tidyLayout(currentWidgets, {
 *   enableHorizontalExpansion: false, // Only pack and compact
 *   enableVerticalCompaction: true
 * });
 * ```
 */
