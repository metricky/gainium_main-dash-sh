import { useCallback, useEffect, useRef, useState } from 'react';

interface UseResponsiveTextOptions {
  /**
   * The original text to display
   */
  text: string;
  /**
   * Maximum width in pixels (optional)
   */
  maxWidth?: number;
  /**
   * Minimum characters to always show before truncating
   */
  minChars?: number;
  /**
   * Suffix to add when text is truncated
   */
  suffix?: string;
  /**
   * Update interval in milliseconds for resize detection
   */
  updateInterval?: number;
}

/**
 * Hook to handle responsive text truncation based on available space
 */
export const useResponsiveText = ({
  text,
  maxWidth,
  minChars = 8,
  suffix = '...',
}: UseResponsiveTextOptions) => {
  const [displayText, setDisplayText] = useState(text);
  const [isTruncated, setIsTruncated] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const measureText = useCallback(
    (targetText: string, containerWidth: number): boolean => {
      if (!measureRef.current) return false;

      measureRef.current.textContent = targetText;
      const textWidth = measureRef.current.offsetWidth;
      return textWidth <= containerWidth;
    },
    []
  );

  const truncateText = useCallback(
    (availableWidth: number): string => {
      if (!measureRef.current) return text;

      // If max width is specified, use the smaller of the two
      const targetWidth = maxWidth
        ? Math.min(availableWidth, maxWidth)
        : availableWidth;

      // Check if full text fits
      if (measureText(text, targetWidth)) {
        setIsTruncated(false);
        return text;
      }

      // Binary search for the longest text that fits
      let left = minChars;
      let right = text.length - suffix.length;
      let bestFit = text.substring(0, minChars) + suffix;

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const candidate = text.substring(0, mid) + suffix;

        if (measureText(candidate, targetWidth)) {
          bestFit = candidate;
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }

      setIsTruncated(bestFit !== text);
      return bestFit;
    },
    [text, maxWidth, minChars, suffix, measureText]
  );

  const updateDisplayText = useCallback(() => {
    if (!elementRef.current) return;

    const containerWidth = elementRef.current.offsetWidth;
    if (containerWidth > 0) {
      const newDisplayText = truncateText(containerWidth);
      setDisplayText(newDisplayText);
    }
  }, [truncateText]);

  // Create measure element and setup ResizeObserver
  useEffect(() => {
    if (!elementRef.current) return;

    // Create measurement element
    const measureElement = document.createElement('span');
    measureElement.style.cssText = `
      position: absolute;
      visibility: hidden;
      height: auto;
      width: auto;
      white-space: nowrap;
      font-family: inherit;
      font-size: inherit;
      font-weight: inherit;
      letter-spacing: inherit;
      line-height: inherit;
    `;

    // Copy computed styles from the target element
    const computedStyle = window.getComputedStyle(elementRef.current);
    measureElement.style.fontFamily = computedStyle.fontFamily;
    measureElement.style.fontSize = computedStyle.fontSize;
    measureElement.style.fontWeight = computedStyle.fontWeight;
    measureElement.style.letterSpacing = computedStyle.letterSpacing;
    measureElement.style.lineHeight = computedStyle.lineHeight;

    document.body.appendChild(measureElement);
    measureRef.current = measureElement;

    // Setup ResizeObserver for efficient resize detection
    if (window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(() => {
        updateDisplayText();
      });
      resizeObserverRef.current.observe(elementRef.current);
    } else {
      // Fallback for browsers without ResizeObserver
      const handleResize = () => updateDisplayText();
      window.addEventListener('resize', handleResize);

      // Initial update
      updateDisplayText();

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }

    // Initial update
    updateDisplayText();

    // Cleanup
    return () => {
      if (measureRef.current) {
        document.body.removeChild(measureRef.current);
        measureRef.current = null;
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, [text, updateDisplayText]);

  // Update when text changes
  useEffect(() => {
    updateDisplayText();
  }, [text, updateDisplayText]);

  return {
    displayText,
    isTruncated,
    elementRef,
    originalText: text,
  };
};

/**
 * Simple hook for basic text truncation without measurement
 */
export const useTruncateText = (
  text: string,
  maxLength: number,
  suffix = '...'
) => {
  const truncatedText =
    text.length > maxLength
      ? text.substring(0, maxLength - suffix.length) + suffix
      : text;

  return {
    displayText: truncatedText,
    isTruncated: text.length > maxLength,
    originalText: text,
  };
};
