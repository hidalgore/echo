/**
 * Stripe payment collection seam — WEB variant (Phase 3 / W5).
 *
 * @stripe/stripe-react-native is native-only; Metro resolves the .native.tsx
 * sibling on iOS/Android. The web build gets typed stubs that fail VISIBLY at
 * pay time (never a silent mock): live web checkout ships with the deferred
 * web-platform work (v1.1 draft — "Web platform / SEO event pages API").
 * Both variants must export identical signatures — the web file is the one
 * tsc resolves for consumers.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type CollectCardResult =
  | { ok: true; token: string }
  | { ok: false; message: string };

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function CardPaymentField(_props: { onComplete: (complete: boolean) => void }) {
  return (
    <View style={styles.unsupported}>
      <Text style={styles.unsupportedText}>
        Card entry isn't available on web yet — use the ECHO app on iOS or Android to
        complete this reservation.
      </Text>
    </View>
  );
}

export async function collectCardPaymentToken(): Promise<CollectCardResult> {
  return {
    ok: false,
    message: 'Live checkout is not available on web yet. Use the ECHO app on iOS or Android.',
  };
}

const styles = StyleSheet.create({
  unsupported: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  unsupportedText: { color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 19 },
});
