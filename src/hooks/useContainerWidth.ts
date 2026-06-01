import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Custom hook to observe container width changes using ResizeObserver
 * Returns the current width of the container element
 */
export function useContainerWidth(): [
  React.RefObject<HTMLDivElement | null>,
  number,
] {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const updateWidth = useCallback((entries: ResizeObserverEntry[]) => {
    if (entries[0]) {
      const { width: newWidth } = entries[0].contentRect;
      setWidth(Math.floor(newWidth));
    }
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Set initial width
    setWidth(Math.floor(element.getBoundingClientRect().width));

    // Create ResizeObserver
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateWidth]);

  return [ref, width];
}

export default useContainerWidth;
