/**
 * LaunchSourceResolver — classifies why the user arrived (spec §6.1).
 * Reads the initial deep link via expo-linking and maps it to an
 * OnboardingLaunchSource, then records it on the store. Effectful only —
 * renders nothing. Phase 1: classification is complete; only organic/unknown
 * destinations are live (decision 4A).
 */
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { trackOnboarding } from '../../services/onboarding/onboardingAnalytics';
import type { OnboardingLaunchSource } from '../../services/onboarding/onboardingTypes';

export function classifyUrl(url: string | null): OnboardingLaunchSource {
  if (!url) return 'organic_app_store';
  let path = '';
  let query: Record<string, any> = {};
  try {
    const parsed = Linking.parse(url);
    path = (parsed.path ?? '').toLowerCase();
    query = parsed.queryParams ?? {};
  } catch {
    return 'unknown';
  }

  if ('nfc' in query || path.includes('nfc')) return 'nfc_tap';
  if ('qr' in query || path.includes('qr')) return 'qr_scan';
  if (path.startsWith('c/') || path.includes('circle')) return 'echo_circle_invite';
  if (path.startsWith('i/') || path.includes('invite')) return 'event_invite_link';
  if (path.includes('checkout')) return 'web_checkout_redirect';
  if (path.includes('purchase') || path.includes('ticket')) return 'ticket_purchase_return';
  if (path.includes('wallet') || path.includes('pass')) return 'wallet_pass_link';
  if (path.includes('host') || 'ref' in query) return 'host_referral';
  return 'organic_app_store';
}

export function LaunchSourceResolver() {
  const url = Linking.useURL();
  const setLaunchSource = useOnboardingStore((s) => s.setLaunchSource);

  useEffect(() => {
    let active = true;
    const resolve = async () => {
      // useURL fires on warm links; cold start may need getInitialURL.
      const initial = url ?? (await Linking.getInitialURL());
      if (!active) return;
      const source = classifyUrl(initial);
      setLaunchSource(source);
      if (source === 'event_invite_link') trackOnboarding('invite_detected', { launchSource: source });
      if (source === 'echo_circle_invite') trackOnboarding('circle_invite_detected', { launchSource: source });
    };
    void resolve();
    return () => {
      active = false;
    };
  }, [url]);

  return null;
}
