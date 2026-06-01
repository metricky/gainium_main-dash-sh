import { useEffect, useState } from 'react';

/**
 * Helper function to convert OKLCH to hex for backward compatibility
 * This is a simplified conversion - in production you might want a proper color library
 */
function oklchToHex(oklch: string): string {
  // For now, return fallback colors that match the intended design
  // In a real app, you'd use a proper color conversion library
  const oklchFallbacks: Record<string, string> = {
    'oklch(0.705 0.187 47.6)': '#f97316', // orange - chart-1
    'oklch(0.719 0.169 13.44)': '#fb7185', // coral - chart-2
    'oklch(0.623 0.188 259.81)': '#3b82f6', // blue - chart-3
    'oklch(0.627 0.17 149.21)': '#22c55e', // green - chart-4 and success
    'oklch(0.769 0.165 70.07)': '#f59e0b', // yellow - chart-5 and warning
    'oklch(0.577 0.215 27.33)': '#ef4444', // red - loss
    'oklch(0.47 0.1728 27.2)': '#ef4444', // alternate loss format used in CSS
    'oklch(67.862% 0.20948 24.641)': '#ef4444', // dark theme loss format
    'oklch(0.637 0.208 25.33)': '#ef4444', // red - destructive light
    'oklch(0.396 0.133 25.73)': '#dc2626', // red dark - destructive dark
  };

  // Fast path: previously-mapped values keep their exact prior hex.
  if (oklchFallbacks[oklch]) return oklchFallbacks[oklch];

  // Robust path: let the browser convert any CSS color string (oklch/rgb/hsl/hex)
  // to concrete RGB via a 1x1 canvas, instead of guessing.
  try {
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Sentinel so we can detect an invalid color string (fillStyle stays unchanged).
        ctx.fillStyle = '#000000';
        ctx.fillStyle = oklch;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return `#${[r, g, b]
          .map((c) => c.toString(16).padStart(2, '0'))
          .join('')}`;
      }
    }
  } catch {
    // fall through to the default below
  }

  return oklchFallbacks[oklch] || '#22c55e'; // Default to green instead of orange
}

/**
 * Hook to get resolved CSS variable values for charts
 * This ensures we get the actual color values rather than CSS variable references
 */
export function useChartColors() {
  const [colors, setColors] = useState({
    chart1: '#f97316',
    chart2: '#fb7185',
    chart3: '#3b82f6',
    chart4: '#22c55e',
    chart5: '#f59e0b',
    success: '#22c55e',
    warning: '#f59e0b',
    info: '#3b82f6',
    destructive: '#ef4444',
    profit: '#22c55e',
    loss: '#ef4444',
    primary: '#f97316', // Add primary color
  });

  useEffect(() => {
    // Get the computed styles from the root element
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);

    const getValue = (varName: string): string => {
      const value = computedStyle.getPropertyValue(varName).trim();
      if (value.startsWith('oklch')) {
        return oklchToHex(value);
      }
      return value || '#f97316'; // fallback
    };

    const newColors = {
      chart1: getValue('--color-chart-1'),
      chart2: getValue('--color-chart-2'),
      chart3: getValue('--color-chart-3'),
      chart4: getValue('--color-chart-4'),
      chart5: getValue('--color-chart-5'),
      success: getValue('--color-success'),
      warning: getValue('--color-warning'),
      info: getValue('--color-info'),
      destructive: getValue('--color-destructive'),
      profit: getValue('--color-profit'),
      loss: getValue('--color-loss'),
      primary: getValue('--color-primary') || getValue('--color-chart-1'), // Add primary color
    };

    setColors(newColors);
  }, []);

  return colors;
}

/**
 * Hook to get a specific chart color value
 */
export function useChartColor(colorVar: string): string {
  const [color, setColor] = useState('#22c55e'); // Default to green instead of orange

  useEffect(() => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    const colorValue = computedStyle.getPropertyValue(colorVar).trim();

    if (colorValue) {
      if (colorValue.startsWith('oklch')) {
        setColor(oklchToHex(colorValue));
      } else {
        setColor(colorValue);
      }
    }
  }, [colorVar]);

  return color;
}
