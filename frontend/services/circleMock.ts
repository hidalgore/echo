/**
 * ECHO Circle — Mock Data (Elite Spec v1)
 * All 5 canonical states + edge-case mocks.
 */
import type { EchoCircle, CircleMember, MemberSlotStatus } from '../types/circle';

const ORG: CircleMember = {
  id: 'mem_org', slotIndex: 1, name: 'You', avatarUrl: null,
  initials: 'ME', accentColor: '#7B4DFF', status: 'claimed',
  isOrganizer: true, amount: 5000, hasBeenReplaced: false,
};

function slot(i: number, overrides: Partial<CircleMember> = {}): CircleMember {
  return {
    id: `mem_${i}`, slotIndex: i + 1, name: null, avatarUrl: null,
    initials: '', accentColor: '#6B7280', status: 'open',
    isOrganizer: false, amount: 5000, hasBeenReplaced: false,
    ...overrides,
  };
}

const BASE: Omit<EchoCircle, 'status' | 'members' | 'secondsRemaining'> = {
  id: 'circle_001',
  eventId: 'evt_nightfall',
  eventTitle: 'Nightfall Music Festival',
  eventDate: 'Fri, August 9',
  eventTime: '8:00 PM',
  eventVenue: 'Seattle, WA',
  eventStartISO: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  totalTickets: 4,
  pricePerTicket: 5000,
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  organizerId: 'mem_org',
  replacementsUsed: 0,
  maxReplacements: 3,
  inviteLink: 'https://echo.app/c/circle_001?token=tok_abc',
};

// ─── State 1: Created ────────────────────────────────────────────────────
export const MOCK_CIRCLE_CREATED: EchoCircle = {
  ...BASE, status: 'created', secondsRemaining: 3600,
  members: [ORG, slot(2), slot(3), slot(4)],
};

// ─── State 2: Waiting ────────────────────────────────────────────────────
export const MOCK_CIRCLE_WAITING: EchoCircle = {
  ...BASE, status: 'waiting', secondsRemaining: 2280,
  members: [
    ORG,
    slot(2, { name: 'Natasha Kim', initials: 'NK', accentColor: '#E63DAD', status: 'claimed', claimedAt: new Date().toISOString() }),
    slot(3, { name: 'Alex Johnson', initials: 'AJ', accentColor: '#20C7FF', status: 'invited', inviteMethod: 'sms', invitedAt: new Date().toISOString() }),
    slot(4, { name: 'Steve Rogers', initials: 'SR', accentColor: '#F59E0B', status: 'pending', inviteMethod: 'echo_search', invitedAt: new Date().toISOString() }),
  ],
};

// ─── State 3: Action Needed ──────────────────────────────────────────────
export const MOCK_CIRCLE_ACTION_NEEDED: EchoCircle = {
  ...BASE, status: 'action_needed', secondsRemaining: 0,
  members: [
    ORG,
    slot(2, { name: 'Natasha Kim', initials: 'NK', accentColor: '#E63DAD', status: 'claimed' }),
    slot(3, { name: 'Alex Johnson', initials: 'AJ', accentColor: '#20C7FF', status: 'expired' }),
    slot(4, { name: 'Steve Rogers', initials: 'SR', accentColor: '#F59E0B', status: 'expired' }),
  ],
};

// ─── State 4: Complete ───────────────────────────────────────────────────
export const MOCK_CIRCLE_COMPLETE: EchoCircle = {
  ...BASE, status: 'complete', secondsRemaining: 0,
  members: [
    ORG,
    slot(2, { name: 'Natasha Kim', initials: 'NK', accentColor: '#E63DAD', status: 'claimed' }),
    slot(3, { name: 'Alex Johnson', initials: 'AJ', accentColor: '#20C7FF', status: 'claimed' }),
    slot(4, { name: 'Marcus Lee', initials: 'ML', accentColor: '#10B981', status: 'claimed' }),
  ],
};

// ─── State 5: Closed ─────────────────────────────────────────────────────
export const MOCK_CIRCLE_CLOSED: EchoCircle = {
  ...BASE, status: 'closed', secondsRemaining: 0,
  members: [
    ORG,
    slot(2, { name: 'Natasha Kim', initials: 'NK', accentColor: '#E63DAD', status: 'claimed' }),
    slot(3, { name: 'Alex Johnson', initials: 'AJ', accentColor: '#20C7FF', status: 'released' }),
    slot(4, { status: 'released' }),
  ],
};

// ─── All mocks by state ──────────────────────────────────────────────────
export const CIRCLE_MOCKS = {
  created: MOCK_CIRCLE_CREATED,
  waiting: MOCK_CIRCLE_WAITING,
  action_needed: MOCK_CIRCLE_ACTION_NEEDED,
  complete: MOCK_CIRCLE_COMPLETE,
  closed: MOCK_CIRCLE_CLOSED,
} as const;

// ─── Factory: create fresh circle from checkout ──────────────────────────
export function createFreshCircle(opts: {
  circleId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  eventImageUrl?: string;
  eventStartISO?: string;
  totalTickets: number;
  pricePerTicket: number;
}): EchoCircle {
  const slots: CircleMember[] = [];
  for (let i = 1; i < opts.totalTickets; i++) {
    slots.push(slot(i + 1));
  }
  return {
    id: opts.circleId,
    eventId: opts.eventId,
    eventTitle: opts.eventTitle,
    eventDate: opts.eventDate,
    eventTime: opts.eventTime,
    eventVenue: opts.eventVenue,
    eventImageUrl: opts.eventImageUrl,
    eventStartISO: opts.eventStartISO || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'created',
    totalTickets: opts.totalTickets,
    pricePerTicket: opts.pricePerTicket,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    secondsRemaining: 3600,
    members: [
      { ...ORG, amount: opts.pricePerTicket },
      ...slots.map(s => ({ ...s, amount: opts.pricePerTicket })),
    ],
    organizerId: 'mem_org',
    replacementsUsed: 0,
    maxReplacements: 3,
    inviteLink: `https://echo.app/c/${opts.circleId}?token=tok_${Date.now()}`,
  };
}

export const MOCK_ECHO_USERS = [
  { id: 'u1', name: 'Natasha Kim', username: 'natashak', avatarUrl: null },
  { id: 'u2', name: 'Alex Johnson', username: 'alexj', avatarUrl: null },
  { id: 'u3', name: 'Marcus Lee', username: 'marcusl', avatarUrl: null },
  { id: 'u4', name: 'Jordan Park', username: 'jordanp', avatarUrl: null },
  { id: 'u5', name: 'Maya Chen', username: 'mayac', avatarUrl: null },
];
