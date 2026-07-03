/**
 * ECHO Circle Recipient Service — v1
 * ═════════════════════════════════
 * Canonical recipient flow:
 * Universal Invite Preview → Age Verification (if required) → Checkout
 * → Ticket Confirmed → Recipient Circle Status / View Ticket.
 *
 * This mock service preserves the production contract for the future backend:
 * - universal invite token
 * - app/non-app web support
 * - age verification before checkout
 * - payment before ticket confirmation
 * - Add to Wallet before optional app download
 */

import { MOCK_EVENTS } from './mock';
import { computeCheckoutFees } from './pricingEngine';
import { CONFIG } from '../constants/config';
import type { Event } from '../types';

export type RecipientInviteStatus =
  | 'active'
  | 'expired'
  | 'circle_full'
  | 'event_sold_out'
  | 'already_claimed'
  | 'declined'
  | 'released';

export type RecipientFlowStep = 'invite' | 'verify' | 'checkout' | 'confirmed' | 'status';

export type RecipientMemberState = 'confirmed' | 'waiting' | 'organizer';

export type RecipientCircleMember = {
  id: string;
  name: string;
  initials: string;
  state: RecipientMemberState;
  isCurrentUser?: boolean;
};

export type CircleRecipientInvite = {
  token: string;
  status: RecipientInviteStatus;
  organizerName: string;
  event: Event;
  ticketTier: {
    id: string;
    name: string;
    price: number;
  };
  circle: {
    id: string;
    totalSlots: number;
    joinedSlots: number;
    secondsRemaining: number;
    members: RecipientCircleMember[];
  };
  ageRequired: number | null;
  universalUrl: string;
};

export type RecipientCheckoutQuote = {
  ticketSubtotal: number;
  echoFee: number;
  processingFee: number;
  totalDueToday: number;
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

export function getCanonicalInviteUrl(token: string) {
  return `https://getechoaccess.com/circle/invite/${encodeURIComponent(token)}`;
}

export function getMockRecipientInvite(token: string): CircleRecipientInvite {
  const normalized = String(token || 'demo').toLowerCase();

  const hasTokenPart = (part: string) => normalized.indexOf(part) >= 0;

  const status: RecipientInviteStatus =
    hasTokenPart('expired') ? 'expired'
    : hasTokenPart('full') ? 'circle_full'
    : hasTokenPart('soldout') ? 'event_sold_out'
    : hasTokenPart('claimed') ? 'already_claimed'
    : hasTokenPart('declined') ? 'declined'
    : hasTokenPart('released') ? 'released'
    : 'active';

  let event = MOCK_EVENTS[0];
  for (let i = 0; i < MOCK_EVENTS.length; i += 1) {
    if (MOCK_EVENTS[i].age_restriction === 21) {
      event = MOCK_EVENTS[i];
      break;
    }
  }

  const ticketTier = event.ticket_types[0] || {
    id: 'ga',
    name: 'General Admission',
    price: 48,
    available: 1,
  };

  const joinedSlots = status === 'circle_full' ? 4 : status === 'active' ? 2 : 3;

  return {
    token,
    status,
    organizerName: 'Alex',
    event,
    ticketTier: {
      id: ticketTier.id,
      name: ticketTier.name,
      price: ticketTier.price,
    },
    circle: {
      id: `circle_${normalized || 'demo'}`,
      totalSlots: 4,
      joinedSlots,
      secondsRemaining: CONFIG.CIRCLE_TIMER_SECONDS, // CIR-01: 1 hour claim window
      members: [
        { id: 'organizer', name: 'Alex', initials: 'A', state: 'organizer' },
        { id: 'maya', name: 'Maya', initials: 'M', state: 'confirmed' },
        { id: 'you', name: 'You', initials: 'Y', state: status === 'active' ? 'waiting' : 'confirmed', isCurrentUser: true },
        { id: 'jordan', name: 'Jordan', initials: 'J', state: 'waiting' },
      ],
    },
    ageRequired: event.age_restriction ?? null,
    universalUrl: getCanonicalInviteUrl(token),
  };
}

export function quoteRecipientCheckout(invite: CircleRecipientInvite): RecipientCheckoutQuote {
  const fees = computeCheckoutFees(invite.ticketTier.price);
  return {
    ticketSubtotal: invite.ticketTier.price,
    echoFee: fees.platformFee,
    processingFee: fees.processingFee,
    totalDueToday: fees.total,
  };
}

export function formatRecipientTimer(totalSeconds: number) {
  const clamped = Math.max(0, totalSeconds);
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;
  const two = (value: number) => (value < 10 ? `0${value}` : String(value));
  return `${two(hours)}:${two(minutes)}:${two(seconds)}`;
}

export function getRecipientEdgeCopy(status: RecipientInviteStatus, organizerName: string) {
  switch (status) {
    case 'expired':
      return {
        icon: 'time-outline' as const,
        title: 'This invite expired.',
        body: 'Your spot is no longer held, and no payment was taken.',
        primary: `Ask ${organizerName} for a New Invite`,
        secondary: 'Browse Events',
      };
    case 'circle_full':
      return {
        icon: 'people-outline' as const,
        title: 'This Circle is full.',
        body: 'This Circle has reached its available spots.',
        primary: 'Buy Your Own Ticket',
        secondary: 'Browse Events',
      };
    case 'event_sold_out':
      return {
        icon: 'alert-circle-outline' as const,
        title: 'This event is sold out.',
        body: 'Your Circle spot is no longer available.',
        primary: 'Browse Events',
        secondary: 'Return Home',
      };
    case 'already_claimed':
      return {
        icon: 'checkmark-circle-outline' as const,
        title: 'Invite already claimed.',
        body: 'This invite link has already been used to secure a ticket.',
        primary: 'View Ticket',
        secondary: 'View Circle Status',
      };
    case 'declined':
      return {
        icon: 'close-circle-outline' as const,
        title: 'Invite declined.',
        body: 'This invite was declined. No payment was taken.',
        primary: 'Browse Events',
        secondary: 'Return Home',
      };
    case 'released':
      return {
        icon: 'remove-circle-outline' as const,
        title: 'Spot released.',
        body: `${organizerName} released unpaid spots back to inventory. No payment was taken.`,
        primary: 'Browse Events',
        secondary: 'Return Home',
      };
    case 'active':
    default:
      return null;
  }
}
