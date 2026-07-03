import { router } from 'expo-router';

export type CheckoutMode = 'single' | 'circle' | 'circle_organizer' | 'pay_all';

export type CheckoutTicketSelection = {
  id: string;
  name?: string;
  price?: number;
  quantity: number;
};

export type CheckoutRouteInput = {
  eventId?: string;
  ticketTypeId?: string;
  quantity?: number;
  qty?: number;
  selectedTickets?: CheckoutTicketSelection[];
  selections?: string;
  mode?: CheckoutMode | string;
  donationAmount?: number;
  donationType?: string;
};

const cleanQuantity = (value?: number) => {
  if (!Number.isFinite(value ?? NaN)) return 1;
  return Math.max(1, Math.floor(value as number));
};

const getSelectionQuantity = (selectedTickets?: CheckoutTicketSelection[]) => {
  if (!selectedTickets?.length) return 0;
  return selectedTickets.reduce((sum, ticket) => sum + cleanQuantity(ticket.quantity), 0);
};

export function getCheckoutRoute(input: CheckoutRouteInput) {
  const selectionQuantity = getSelectionQuantity(input.selectedTickets);
  const totalQuantity = cleanQuantity(selectionQuantity || input.quantity || input.qty || 1);
  const selections = input.selections
    ?? (input.selectedTickets?.length ? JSON.stringify(input.selectedTickets) : undefined);

  const params: Record<string, string> = {
    eventId: input.eventId ?? '',
    qty: String(totalQuantity),
    quantity: String(totalQuantity),
  };

  if (input.ticketTypeId) params.ticketTypeId = input.ticketTypeId;
  if (input.mode) params.mode = String(input.mode);
  if (input.donationAmount && input.donationAmount > 0) params.donationAmount = String(input.donationAmount);
  if (input.donationType) params.donationType = String(input.donationType);
  if (selections) params.selections = selections;

  const pathname = totalQuantity >= 2 && input.mode !== 'pay_all' && input.mode !== 'circle_organizer'
    ? '/checkout/choose-payment'
    : '/checkout/single-checkout';

  return { pathname, params } as const;
}

export function routeToCheckout(input: CheckoutRouteInput, replace = false) {
  const route = getCheckoutRoute(input);
  if (replace) router.replace(route as never);
  else router.push(route as never);
}
