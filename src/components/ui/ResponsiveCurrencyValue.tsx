import { cn } from '@/lib/utils';
import React from 'react';
import { ResponsiveValue } from './ResponsiveValue';

export interface FontStep {
  sizeClass: string;
  px: number;
}

export interface ResponsiveCurrencyValueProps {
  value: number;
  /** Show +/- sign prefix. Default: true */
  showSign?: boolean;
  /** Extra className on the span */
  className?: string;
  /** Override the descending font-size ladder. Largest first. */
  fontSteps?: FontStep[];
  /** Override color class (e.g. fixed 'text-foreground' for hero values) */
  colorClassOverride?: string;
  /** Text alignment of the rendered value. Default: 'right'. */
  align?: 'left' | 'right' | 'center';
}

/**
 * Formats a currency value in full form, e.g. +$1,514.88
 */
function formatFull(value: number, showSign: boolean): string {
  const abs = Math.abs(value);
  const sign = showSign
    ? value > 0
      ? '+'
      : value < 0
        ? '-'
        : ''
    : value < 0
      ? '-'
      : '';
  return `${sign}${new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs)}`;
}

/**
 * Formats a currency value in compact form, e.g. +$1.5K, -$3.2M
 */
function formatCompact(value: number, showSign: boolean): string {
  const abs = Math.abs(value);
  const sign = showSign
    ? value > 0
      ? '+'
      : value < 0
        ? '-'
        : ''
    : value < 0
      ? '-'
      : '';

  if (abs >= 1_000_000_000)
    return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  // Small numbers: no abbreviation needed
  return formatFull(value, showSign);
}

function colorClass(value: number): string {
  if (value > 0) return 'text-profit';
  if (value < 0) return 'text-loss';
  return 'text-foreground';
}

// Font sizes tried in descending order (prefer largest that fits)
const FONT_STEPS: readonly FontStep[] = [
  { sizeClass: 'text-2xl', px: 24 },
  { sizeClass: 'text-xl', px: 20 },
  { sizeClass: 'text-lg', px: 18 },
  { sizeClass: 'text-base', px: 16 },
  { sizeClass: 'text-sm', px: 14 },
];

// Average character width as a fraction of font-size for typical UI fonts.
// Digits & currency chars are slightly narrower than full em — 0.62 is a good fit.
const CHAR_WIDTH_RATIO = 0.62;

function estimateWidth(text: string, fontPx: number): number {
  return text.length * fontPx * CHAR_WIDTH_RATIO;
}

/**
 * Selects the best (font size, format) combination for the given value and
 * available container width.
 *
 * Strategy:
 *   1. Try full format from largest → smallest font until it fits.
 *   2. If no full-format size fits, try compact format from largest → smallest.
 *   3. Last resort: smallest font, compact.
 */
function selectPresentation(
  value: number,
  showSign: boolean,
  containerWidth: number,
  steps: readonly FontStep[]
): { sizeClass: string; text: string } {
  // Container not yet measured — show full at the smallest size, no flash
  if (containerWidth === 0) {
    return {
      sizeClass: steps[steps.length - 1]?.sizeClass ?? 'text-base',
      text: formatFull(value, showSign),
    };
  }

  const fullText = formatFull(value, showSign);
  const compactText = formatCompact(value, showSign);

  // 1. Try full format
  for (const { sizeClass, px } of steps) {
    if (estimateWidth(fullText, px) <= containerWidth) {
      return { sizeClass, text: fullText };
    }
  }

  // 2. Try compact format
  for (const { sizeClass, px } of steps) {
    if (estimateWidth(compactText, px) <= containerWidth) {
      return { sizeClass, text: compactText };
    }
  }

  // 3. Absolute fallback
  return {
    sizeClass: steps[steps.length - 1]?.sizeClass ?? 'text-sm',
    text: compactText,
  };
}

/**
 * ResponsiveCurrencyValue
 *
 * Observes its own container width and automatically picks the best combination
 * of font size and number format (full vs. abbreviated K/M/B) so the value
 * always fits cleanly without overflow and is shown as large as possible.
 *
 * Usage:
 * ```tsx
 * <ResponsiveCurrencyValue value={1514.88} showSign />
 * ```
 */
export const ResponsiveCurrencyValue: React.FC<
  ResponsiveCurrencyValueProps
> = ({
  value,
  showSign = true,
  className,
  fontSteps = FONT_STEPS,
  colorClassOverride,
  align = 'right',
}) => {
  const alignClass =
    align === 'left'
      ? 'text-left'
      : align === 'center'
        ? 'text-center'
        : 'text-right';
  return (
    <ResponsiveValue className={alignClass}>
      {(width) => {
        const { sizeClass, text } = selectPresentation(
          value,
          showSign,
          width,
          fontSteps
        );
        return (
          <span
            className={cn(
              'font-bold',
              colorClassOverride ?? colorClass(value),
              sizeClass,
              className
            )}
          >
            {text}
          </span>
        );
      }}
    </ResponsiveValue>
  );
};

export default ResponsiveCurrencyValue;
