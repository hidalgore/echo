/**
 * Temporary safety redirect for retired /purchase route.
 *
 * ECHO Checkout v2 canonical routes:
 * - /checkout/single-checkout for single-ticket checkout and Pay for All payment confirmation
 * - /checkout/choose-payment for 2+ ticket payment path selection
 */
import { Redirect, useLocalSearchParams } from 'expo-router';
import { getCheckoutRoute } from '../utils/checkoutRouting';

const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
const toNumber = (value: string | undefined, fallback = 1) => {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export default function PurchaseRedirect() {
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const quantity = toNumber(first(params.qty) || first(params.quantity), 1);

  const route = getCheckoutRoute({
    eventId: first(params.eventId),
    ticketTypeId: first(params.ticketTypeId),
    quantity,
    selections: first(params.selections),
    mode: first(params.mode),
  });

  return <Redirect href={route as never} />;
}
