import { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, NativeScrollEvent, NativeSyntheticEvent, useWindowDimensions } from 'react-native';

/**
 * ECHO Mode header behavior:
 * - Fade away after downward travel passes 10% of screen height.
 * - Reappear after upward travel reaches 15% of screen height.
 */
export function useEchoHeaderVisibility() {
  const { height } = useWindowDimensions();
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;
  const lastY = useRef(0);
  const upwardTravel = useRef(0);
  const downwardThreshold = Math.max(48, height * 0.10);
  const upwardThreshold = Math.max(64, height * 0.15);

  const setHeaderVisible = useCallback((next: boolean) => {
    setVisible((current) => {
      if (current === next) return current;
      Animated.timing(opacity, {
        toValue: next ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
      return next;
    });
  }, [opacity]);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = Math.max(0, event.nativeEvent.contentOffset.y);
    const delta = y - lastY.current;

    if (delta > 0) {
      upwardTravel.current = 0;
      if (visible && y >= downwardThreshold) setHeaderVisible(false);
    } else if (delta < 0) {
      upwardTravel.current += Math.abs(delta);
      if (!visible && upwardTravel.current >= upwardThreshold) setHeaderVisible(true);
    }

    if (y <= 12) {
      upwardTravel.current = 0;
      setHeaderVisible(true);
    }
    lastY.current = y;
  }, [downwardThreshold, setHeaderVisible, upwardThreshold, visible]);

  const headerAnimatedStyle = useMemo(() => ({
    opacity,
    transform: [{ translateY: opacity.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }) }],
  }), [opacity]);

  return { visible, onScroll, headerAnimatedStyle };
}
