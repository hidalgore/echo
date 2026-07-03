/**
 * useReduceMotion — subscribes to the OS Reduce Motion setting.
 * Onboarding motion components call this to swap cinematic animation for a
 * static presentation (spec §19/§20). Core flow must work without animation.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (mounted) setReduce(v);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v: boolean) => {
      setReduce(v);
    });
    return () => {
      mounted = false;
      // RN >= 0.65 returns a subscription with remove()
      // @ts-ignore - older typings expose remove via the returned object
      sub?.remove?.();
    };
  }, []);

  return reduce;
}
