/**
 * useDebounce Hook
 *
 * A custom hook that debounces a value, delaying updates until after
 * a specified delay period has passed without the value changing.
 *
 * Useful for:
 * - Search input optimization
 * - API call rate limiting
 * - Real-time validation
 * - Performance optimization
 */

import { useState, useEffect } from 'react';

/**
 * Debounce a value by delaying updates until after the specified delay
 *
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if the value changes before the delay completes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Advanced debounce hook with additional options
 *
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @param options - Additional options
 * @returns Object with debounced value and utility functions
 */
export function useAdvancedDebounce<T>(
  value: T,
  delay: number,
  options: {
    leading?: boolean; // Execute immediately on first call
    trailing?: boolean; // Execute after delay (default: true)
    maxWait?: number; // Maximum time to wait before executing
  } = {}
) {
  const { leading = false, trailing = true, maxWait } = options;

  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let maxTimeoutId: NodeJS.Timeout | undefined;

    const updateValue = () => {
      setDebouncedValue(value);
      setIsDebouncing(false);
    };

    // Leading edge execution
    if (leading && !isDebouncing) {
      updateValue();
      setIsDebouncing(true);
      return;
    }

    setIsDebouncing(true);

    // Trailing edge execution
    if (trailing) {
      timeoutId = setTimeout(updateValue, delay);
    }

    // Maximum wait execution
    if (maxWait && maxWait > delay) {
      maxTimeoutId = setTimeout(updateValue, maxWait);
    }

    return () => {
      clearTimeout(timeoutId);
      if (maxTimeoutId) {
        clearTimeout(maxTimeoutId);
      }
    };
  }, [value, delay, leading, trailing, maxWait, isDebouncing]);

  const cancel = () => {
    setIsDebouncing(false);
  };

  const flush = () => {
    setDebouncedValue(value);
    setIsDebouncing(false);
  };

  return {
    debouncedValue,
    isDebouncing,
    cancel,
    flush,
  };
}
