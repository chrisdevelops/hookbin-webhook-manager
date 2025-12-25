import { useState, useEffect, useRef } from "react";

/**
 * A hook that delays showing a loading state to prevent UI flashing
 * for very quick operations.
 *
 * @param isLoading - The actual loading state
 * @param delay - Minimum time before showing loading state (default: 150ms)
 * @returns The delayed loading state
 */
export function useDelayedLoading(
  isLoading: boolean,
  delay: number = 150
): boolean {
  const [showLoading, setShowLoading] = useState(false);
  const showTimerRef = useRef<number | undefined>(undefined);
  const hideTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Clear any pending hide timer when effect runs
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = undefined;
    }

    if (isLoading) {
      // Start a timer to show loading after the delay
      showTimerRef.current = window.setTimeout(() => {
        setShowLoading(true);
      }, delay);
    } else {
      // Clear any pending show timer
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = undefined;
      }
      // Schedule hiding for next tick to avoid synchronous setState in effect
      hideTimerRef.current = window.setTimeout(() => {
        setShowLoading(false);
      }, 0);
    }

    return () => {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [isLoading, delay]);

  return showLoading;
}
