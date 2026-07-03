/**
 * Stripe payment collection seam — NATIVE variant (Phase 3 / W5).
 *
 * The only file that imports @stripe/stripe-react-native (a native-build
 * dependency — bundled into the owed native build alongside expo-secure-store
 * and the Sentry RN slot). Collection is PaymentMethod-token based: the SDK
 * mints a pm_ token from the CardField and POST /v1/payments/confirm charges
 * it server-side (the locked S-05 shape). Apple Pay / Google Pay tokens ride
 * the same seam once the operator provisions merchant identifiers (flagged).
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { CardField, StripeProvider, createPaymentMethod } from '@stripe/stripe-react-native';

import { CONFIG } from '../../constants/config';

export type CollectCardResult =
  | { ok: true; token: string }
  | { ok: false; message: string };

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  // No key (mock builds, missing env): render the app untouched — checkout
  // then fails visibly at pay time via collectCardPaymentToken.
  if (!CONFIG.STRIPE_PUBLISHABLE_KEY) return <>{children}</>;
  return (
    <StripeProvider publishableKey={CONFIG.STRIPE_PUBLISHABLE_KEY}>
      {children as React.ReactElement}
    </StripeProvider>
  );
}

export function CardPaymentField({ onComplete }: { onComplete: (complete: boolean) => void }) {
  return (
    <CardField
      postalCodeEnabled={false}
      style={styles.field}
      cardStyle={{
        backgroundColor: '#1A1D23',
        textColor: '#F7F8FA',
        placeholderColor: '#6B7280',
        borderRadius: 12,
      }}
      onCardChange={(details) => onComplete(details.complete)}
    />
  );
}

export async function collectCardPaymentToken(): Promise<CollectCardResult> {
  if (!CONFIG.STRIPE_PUBLISHABLE_KEY) {
    return { ok: false, message: 'Payments are not configured for this build.' };
  }
  const { paymentMethod, error } = await createPaymentMethod({ paymentMethodType: 'Card' });
  if (error || !paymentMethod) {
    return {
      ok: false,
      message: error?.localizedMessage || error?.message || 'Could not read your card details.',
    };
  }
  return { ok: true, token: paymentMethod.id };
}

const styles = StyleSheet.create({
  field: { width: '100%', height: 50 },
});
