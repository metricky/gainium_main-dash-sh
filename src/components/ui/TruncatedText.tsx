/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

interface TruncatedTextProps {
  /**
   * The text content to display
   */
  text: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Maximum width (can be any CSS width value: px, rem, %, etc.)
   */
  maxWidth?: string;
  /**
   * Title tooltip (defaults to original text)
   */
  title?: string;
  /**
   * HTML element type to render
   */
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  /**
   * Number of lines to show before truncating (for multi-line truncation)
   */
  lines?: 1 | 2 | 3;
  /**
   * Additional props to pass to the element
   */
  [key: string]: any;
}

/**
 * Component that truncates text with CSS ellipsis
 * Supports both single-line (default) and multi-line truncation
 */
export const TruncatedText: React.FC<TruncatedTextProps> = ({
  text,
  className = '',
  maxWidth,
  title,
  as: Element = 'span',
  lines = 1,
  ...props
}) => {
  const getTruncationStyles = () => {
    const baseStyles: React.CSSProperties = {
      ...(maxWidth && { maxWidth }),
    };

    if (lines === 1) {
      // Single line truncation
      return {
        ...baseStyles,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
      };
    } else {
      // Multi-line truncation
      return {
        ...baseStyles,
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical' as const,
        WebkitLineClamp: lines,
        lineClamp: lines,
      };
    }
  };

  return (
    <Element
      className={className}
      style={getTruncationStyles()}
      title={title || text}
      {...props}
    >
      {text}
    </Element>
  );
};

export default TruncatedText;
