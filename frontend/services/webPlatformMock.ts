import { GENERATED_EVENTS } from './mockEvents';
import type { Event } from '../types';

export const getPublicWebEvents = (limit = 8): Event[] => {
  return GENERATED_EVENTS
    .filter((event) => event.status === 'live' || event.status === 'on_sale')
    .filter((event) => event.ticket_types.some((ticket) => ticket.available > 0))
    .slice(0, limit);
};

export const getFeaturedHostEvents = (limit = 4): Event[] => {
  return GENERATED_EVENTS
    .filter((event) => event.host_verified)
    .filter((event) => event.status === 'live' || event.status === 'on_sale')
    .slice(0, limit);
};

export const getWebTicketPriceLabel = (event: Event): string => {
  const prices = event.ticket_types.map((ticket) => ticket.price).filter((price) => Number.isFinite(price));
  if (!prices.length) return 'Price pending';
  const min = Math.min(...prices);
  if (min <= 0) return 'Free';
  return `From $${min}`;
};
