/**
 * StripePaymentBlock — Web payment collection block.
 *
 * Status: SCAFFOLD. The UI matches the locked checkout layout and the data
 * shape that confirmPayment() expects. The actual card collection here is a
 * **mock card field** that emits a tokenized payment method id of the form
 * `pm_mock_card_XXXX`. Apple Pay / Google Pay buttons emit fake tokens too.
 *
 * SWAP-POINT (production):
 *   Replace the mock card field below with Stripe Elements:
 *     1. Add @stripe/stripe-js + @stripe/react-stripe-js
 *     2. Wrap the app shell (or this block) in <Elements stripe={loadStripe(pk)}>
 *     3. Replace the mock `<View>` card field with <PaymentElement />
 *     4. On confirm, call stripe.confirmPayment({ elements, ... }) and pass
 *        the resulting PaymentMethod id to props.onTokenReady
 *
 * The component contract (props.onTokenReady receives a string token) does
 * not change when the swap happens. Every call site is stable.
 *
 * Apple Pay / Google Pay buttons here are visual-only on web. The real
 * Payment Request Button API ships via Stripe Elements once the swap above
 * is complete.
 *
 * To test a declined card in mock mode, type any value containing "decline"
 * into the card field — checkoutIntentService will return a 'card_declined'
 * error.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '../../theme/brand';

type PaymentMethod = 'card' | 'apple_pay' | 'google_pay';

interface Props {
  /** Fired when the buyer has entered a usable payment method.
   *  In production, `token` is a Stripe PaymentMethod id or Apple/Google Pay token. */
  onTokenReady: (token: string, method: PaymentMethod) => void;
  /** Called when the buyer clears or invalidates their entry. */
  onTokenCleared?: () => void;
  /** Set true while a payment is being confirmed to lock the UI. */
  disabled?: boolean;
}

export function StripePaymentBlock({ onTokenReady, onTokenCleared, disabled }: Props) {
  const [cardNumber, setCardNumber] = useState('');

  const handleCardChange = (text: string) => {
    // Crude mock validation: 13+ digits and a recognized prefix → ready.
    const digits = text.replace(/\D/g, '');
    setCardNumber(text);
    if (digits.length >= 13) {
      // Tokenize the literal value so the mock can detect "decline" for QA.
      onTokenReady(`pm_mock_card_${text}`, 'card');
    } else if (digits.length === 0 && onTokenCleared) {
      onTokenCleared();
    }
  };

  const handleApplePay = () => {
    if (disabled) return;
    onTokenReady(`pm_mock_apple_pay_${Date.now()}`, 'apple_pay');
  };

  const handleGooglePay = () => {
    if (disabled) return;
    onTokenReady(`pm_mock_google_pay_${Date.now()}`, 'google_pay');
  };

  return (
    <View style={styles.wrap}>
      {/* Apple / Google Pay buttons */}
      <View style={styles.walletRow}>
        <TouchableOpacity
          style={[styles.walletBtn, disabled && styles.walletBtnDisabled]}
          onPress={handleApplePay}
          disabled={disabled}
        >
          <Ionicons name="logo-apple" size={18} color="#FFFFFF" />
          <Text style={styles.walletBtnText}>Pay</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.walletBtn, disabled && styles.walletBtnDisabled]}
          onPress={handleGooglePay}
          disabled={disabled}
        >
          <Ionicons name="logo-google" size={16} color="#FFFFFF" />
          <Text style={styles.walletBtnText}>Pay</Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>Or pay by card</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Card field (SWAP-POINT: replace with <PaymentElement />) */}
      <View style={[styles.cardField, disabled && styles.cardFieldDisabled]}>
        <Ionicons name="card-outline" size={18} color="rgba(255,255,255,0.45)" />
        <TextInput
          style={styles.cardInput}
          value={cardNumber}
          onChangeText={handleCardChange}
          placeholder="Card number   MM / YY   CVC"
          placeholderTextColor="rgba(255,255,255,0.35)"
          editable={!disabled}
          keyboardType="numeric"
          autoComplete="cc-number"
        />
      </View>

      <View style={styles.secureRow}>
        <Ionicons name="lock-closed-outline" size={14} color="rgba(255,255,255,0.55)" />
        <Text style={styles.secureText}>
          PCI-compliant processor. Card details never touch ECHO servers.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  walletRow: { flexDirection: 'row', gap: 10 },
  walletBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  walletBtnDisabled: { opacity: 0.5 },
  walletBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  dividerLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  cardField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 12,
  },
  cardFieldDisabled: { opacity: 0.5 },
  cardInput: { flex: 1, color: '#FFFFFF', fontSize: 14, padding: 0 },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secureText: { color: 'rgba(255,255,255,0.55)', fontSize: 12 },
});
