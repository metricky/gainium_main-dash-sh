/* eslint-disable @typescript-eslint/no-explicit-any */
import { useResponsiveText, useTruncateText } from '@/hooks/useResponsiveText';
import React from 'react';

interface ResponsiveTextProps {
  /**
   * The text content to display
   */
  text: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Maximum width in pixels (optional)
   */
  maxWidth?: number;
  /**
   * Minimum characters to show before truncating
   */
  minChars?: number;
  /**
   * Truncation suffix (default: '...')
   */
  suffix?: string;
  /**
   * Title tooltip (defaults to original text when truncated)
   */
  title?: string;
  /**
   * Use simple truncation instead of dynamic measurement
   */
  useSimpleTruncation?: boolean;
  /**
   * Max length for simple truncation
   */
  maxLength?: number;
  /**
   * HTML element type to render
   */
  as?: keyof React.JSX.IntrinsicElements;
  /**
   * Additional props to pass to the element
   */
  [key: string]: any;
}

/**
 * Component that automatically truncates text based on available space
 */
export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  text,
  className = '',
  maxWidth,
  minChars = 8,
  suffix = '...',
  title,
  useSimpleTruncation = false,
  maxLength = 20,
  as: Element = 'span',
  ...props
}) => {
  const simpleResult = useTruncateText(text, maxLength, suffix);
  const responsiveResult = useResponsiveText({
    text,
    ...(maxWidth !== undefined && { maxWidth }),
    minChars,
    suffix,
  });

  const result = useSimpleTruncation ? simpleResult : responsiveResult;
  const { displayText, isTruncated, originalText } = result;

  // Use elementRef only for responsive text
  const elementRef = useSimpleTruncation
    ? undefined
    : responsiveResult.elementRef;

  // Create the element props with proper typing
  const elementProps = {
    className,
    title: title || (isTruncated ? originalText : undefined),
    ...props,
  } as React.HTMLAttributes<HTMLElement>;

  // Add ref if not using simple truncation
  if (!useSimpleTruncation && elementRef) {
    (elementProps as any).ref = elementRef;
  }

  return React.createElement(Element, elementProps, displayText);
};

export default ResponsiveText;
