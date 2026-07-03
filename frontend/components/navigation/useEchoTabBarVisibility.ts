import { useCallback, useEffect, useRef } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, useWindowDimensions } from 'react-native';
import { useUIStore } from '../../stores/uiStore';

/**
 * ECHO bottom tab bar scroll-hide behavior:
 * ─ Hides after downward travel passes 10% of screen height (Q3 = 3B).
 * ─ Re-shows on scroll stop via 150ms idle timer (Q4 = 4A).
 * ─ Always visible when scrollY < 12 (top of list).
 * ─ Provides reset() for callers to restore visibility on unmount.
 *
 * Mirrors useEchoHeaderVisibility's API shape for symmetry.
 */
export function useEchoTabBarVisibility() {
  const { height } = useWindowDimensions();
  const setTabBarVisible = useUIStore((s) => s.setTabBarVisible);
  const lastY = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const downwardThreshold = Math.max(64, height * 0.10);

  const clearIdleTimer = () => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
  };

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = Math.max(0, event.nativeEvent.contentOffset.y);
      const delta = y - lastY.current;
      const isMoving = Math.abs(delta) > 1;
      lastY.current = y;

      // At top of list, always visible — no need to schedule a re-show.
      if (y < 12) {
        clearIdleTimer();
        setTabBarVisible(true);
        return;
      }

      // Beyond threshold + actively scrolling → hide.
      if (y >= downwardThreshold && isMoving) {
        setTabBarVisible(false);
      }

      // Re-show on idle (150ms after last scroll event, in any direction).
      clearIdleTimer();
      idleTimer.current = setTimeout(() => {
        setTabBarVisible(true);
        idleTimer.current = null;
      }, 150);
    },
    [downwardThreshold, setTabBarVisible],
  );

  const reset = useCallback(() => {
    clearIdleTimer();
    lastY.current = 0;
    setTabBarVisible(true);
  }, [setTabBarVisible]);

  // Force visible on unmount so other tabs don't inherit a hidden bar.
  useEffect(() => {
    return () => {
      clearIdleTimer();
      setTabBarVisible(true);
    };
  }, [setTabBarVisible]);

  return { onScroll, reset };
}
