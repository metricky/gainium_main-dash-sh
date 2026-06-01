import { logger } from '@/lib/loggerInstance';
import React, { useCallback, useEffect, useRef } from 'react';
import type { TradingViewChartRef } from './TradingViewChart';

export interface ChartPickerCoordinates {
  time: number; // Unix timestamp in milliseconds
  price: number;
  // Which picker requested these coordinates (e.g., multiTp.*.fixed, multiSl.*.fixed)
  pickerField?: string;
}

export interface TVChartPickerProps {
  chartRef: React.RefObject<TradingViewChartRef | null>;
  onPick: (coordinates: ChartPickerCoordinates) => void;
  isActive: boolean;
  onActiveChange?: (isActive: boolean) => void;
}

/**
 * TVChartPicker - A component that enables chart click coordinate picking
 *
 * This component adds click event handling to a TradingView chart to capture
 * price and time coordinates when the user clicks on the chart.
 */
export const TVChartPicker = ({
  chartRef,
  onPick,
  isActive,
  //onActiveChange,
}: TVChartPickerProps) => {
  const cleanupRef = useRef<(() => void) | null>(null);
  const originalCursorRef = useRef<string>('');
  const widgetRef = useRef<HTMLElement | null>(null);

  const handleChartClick = useCallback(
    (params: { time?: number; price?: number }) => {
      logger.info('[TVChartPicker] handleChartClick called', {
        isActive,
        params,
        hasTime: params.time !== undefined,
        hasPrice: params.price !== undefined,
        priceValue: params.price,
        timeValue: params.time,
      });

      if (!isActive) {
        logger.warn('[TVChartPicker] Click ignored - picker not active');
        return;
      }

      const { time, price } = params;

      // We need at least time to be valid
      if (time !== undefined && Number.isFinite(time)) {
        const coordinates: ChartPickerCoordinates = {
          time: time * 1000, // Convert seconds to milliseconds
          price:
            price !== undefined && Number.isFinite(price) && price > 0
              ? price
              : 0, // Use 0 as placeholder if price not available
        };

        logger.info('[TVChartPicker] Coordinates picked successfully', {
          coordinates,
          originalTime: time,
          originalPrice: price,
          convertedTime: coordinates.time,
          finalPrice: coordinates.price,
          hasValidPrice:
            price !== undefined && Number.isFinite(price) && price > 0,
        });

        onPick(coordinates);

        // Don't automatically deactivate - let the form component handle it
        // This allows the form to process coordinates before they're cleared
      } else {
        logger.warn('[TVChartPicker] Invalid coordinates received', {
          time,
          price,
          timeIsFinite: time !== undefined ? Number.isFinite(time) : null,
          priceIsFinite: price !== undefined ? Number.isFinite(price) : null,
        });
      }
    },
    [isActive, onPick]
  );

  useEffect(() => {
    logger.info('[TVChartPicker] Effect triggered', {
      isActive,
      hasChartRef: !!chartRef.current,
      isChartReady: chartRef.current?.isReady() ?? false,
    });

    // Cleanup previous subscriptions
    if (cleanupRef.current) {
      logger.info('[TVChartPicker] Cleaning up previous subscription');
      cleanupRef.current();
      cleanupRef.current = null;
    }

    if (!isActive) {
      logger.info('[TVChartPicker] Picker not active, skipping setup');
      return;
    }

    if (!chartRef.current?.isReady()) {
      logger.warn('[TVChartPicker] Chart not ready, skipping setup', {
        hasChartRef: !!chartRef.current,
        isReady: chartRef.current?.isReady() ?? false,
      });
      return;
    }

    const coreRef = chartRef.current.getCoreRef();
    if (!coreRef) {
      logger.error('[TVChartPicker] Failed to get core ref from chart');
      return;
    }

    logger.info(
      '[TVChartPicker] Got core ref, attempting to subscribe to clicks',
      {
        hasCoreRef: !!coreRef,
        hasSubscribeClick: typeof coreRef.subscribeClick === 'function',
      }
    );

    // Subscribe to click events
    const unsubscribe = coreRef.subscribeClick(handleChartClick);

    if (unsubscribe) {
      logger.info('[TVChartPicker] Successfully subscribed to chart clicks');
      cleanupRef.current = unsubscribe;
    } else {
      logger.error('[TVChartPicker] subscribeClick returned null/undefined');
    }

    // Store original cursor and set crosshair
    const containerElement = coreRef.getContainerElement();
    logger.info('[TVChartPicker] Attempting to set cursor', {
      hasContainer: !!containerElement,
      isHTMLElement: containerElement instanceof HTMLElement,
    });

    if (containerElement && containerElement instanceof HTMLElement) {
      widgetRef.current = containerElement;
      originalCursorRef.current =
        window.getComputedStyle(containerElement).cursor;
      containerElement.style.cursor = 'crosshair';
      logger.info('[TVChartPicker] Cursor set to crosshair', {
        originalCursor: originalCursorRef.current,
      });
    }

    // Cleanup function
    return () => {
      try {
        logger.info('[TVChartPicker] Cleanup function called');

        if (cleanupRef.current) {
          logger.info('[TVChartPicker] Unsubscribing from chart clicks');
          cleanupRef.current();
          cleanupRef.current = null;
        }

        // Restore original cursor
        if (widgetRef.current && originalCursorRef.current) {
          logger.info('[TVChartPicker] Restoring original cursor', {
            cursor: originalCursorRef.current,
          });
          widgetRef.current.style.cursor = originalCursorRef.current;
        }
        widgetRef.current = null;
        originalCursorRef.current = '';
      } catch {
        // Swallow any errors during cleanup to avoid unhandled exceptions
      }
    };
  }, [isActive, chartRef, handleChartClick]);

  return null; // This is a headless component
};

export default TVChartPicker;
