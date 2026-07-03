import { create } from 'zustand';
import { Event } from '../types';
import type { NonprofitDonationCampaign } from '../types/nonprofitDonation';
import { MOCK_EVENTS } from '../services/mock';
import { getStartingPrice, isExpired, isHappeningNow, sortByRelevance, sortByStartAsc, startsWithinHours } from '../utils/event';
import { useTicketStore } from './ticketStore';
import { loadHostedEvents, saveHostedEvents } from '../services/eventRepository';
import { ensureEventRuntime } from '../services/doorModeService';
import { isEventDetailVideoDurationAllowed } from '../constants/eventMedia';

interface PublishHostedEventInput {
  title: string;
  description: string;
  venueName: string;
  venueAddress: string;
  cityDisplay: string;
  date: string;
  startTime: string;
  endTime: string;
  category: string;
  imageUrl?: string;
  detailMediaUrl?: string;
  detailMediaType?: 'image' | 'video' | null;
  detailMediaPosterUrl?: string;
  detailMediaDurationSeconds?: number | null;
  ageRestriction?: number | null;
  allowRefunds?: boolean;
  allowTransfers?: boolean;
  ticketTypes: Array<{ name: string; price: number; available: number }>;
  hostName?: string;
  hostVerified?: boolean;
  donationCampaign?: NonprofitDonationCampaign | null;
}

interface EventState {
  events: Event[];
  trending: Event[];
  happeningNow: Event[];
  upcoming: Event[];
  searchResults: Event[];
  savedIds: Set<string>;
  isLoading: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  fetchEvents: () => Promise<void>;
  fetchTrending: () => Promise<void>;
  searchEvents: (query: string) => void;
  getEventById: (id: string) => Event | undefined;
  getSavedEvents: () => Event[];
  isSaved: (id: string) => boolean;
  canSaveEvent: (id: string) => boolean;
  toggleSaved: (id: string) => void;
  publishHostedEvent: (input: PublishHostedEventInput) => Event;
}

const normalizeISODate = (date: string) => {
  const trimmed = (date || '').trim();
  if (!trimmed) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (us) {
    let year = Number(us[3]);
    if (year < 100) year += 2000;
    return `${year}-${String(Number(us[1])).padStart(2, '0')}-${String(Number(us[2])).padStart(2, '0')}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return '';
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
};

const parseTimeParts = (time: string) => {
  const trimmed = (time || '').trim();
  if (!trimmed) return { hours: 20, minutes: 0 };

  const twelveHour = trimmed.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (twelveHour) {
    let hours = parseInt(twelveHour[1], 10);
    const minutes = parseInt(twelveHour[2], 10);
    const period = twelveHour[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return { hours, minutes };
  }

  const twentyFourHour = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHour) {
    const hours = Math.min(Math.max(parseInt(twentyFourHour[1], 10), 0), 23);
    const minutes = Math.min(Math.max(parseInt(twentyFourHour[2], 10), 0), 59);
    return { hours, minutes };
  }

  return { hours: 20, minutes: 0 };
};

const parseDateTime = (date: string, time: string) => {
  const isoDate = normalizeISODate(date);
  if (!isoDate) return new Date().toISOString();

  const base = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) return new Date().toISOString();

  const { hours, minutes } = parseTimeParts(time);
  base.setHours(hours, minutes, 0, 0);
  return base.toISOString();
};

const getDefaultEndTime = (startIso: string) => {
  const end = new Date(startIso);
  if (Number.isNaN(end.getTime())) {
    return new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
  }
  end.setHours(end.getHours() + 4);
  return end.toISOString();
};

const deriveCollections = (events: Event[]) => {
  const activeEvents = sortByStartAsc(events.filter((event) => !isExpired(event)));
  const happeningNow = activeEvents.filter((event) => isHappeningNow(event) || startsWithinHours(event, 2));
  const trending = sortByRelevance(activeEvents).slice(0, 6);
  return { upcoming: activeEvents, happeningNow, trending };
};

const mergeEvents = (hosted: Event[]) => [...hosted, ...MOCK_EVENTS.filter((seed) => !hosted.some((h) => h.id === seed.id))];

export const useEventStore = create<EventState>((set, get) => ({
  events: MOCK_EVENTS,
  trending: deriveCollections(MOCK_EVENTS).trending,
  happeningNow: deriveCollections(MOCK_EVENTS).happeningNow,
  upcoming: deriveCollections(MOCK_EVENTS).upcoming,
  searchResults: [],
  savedIds: new Set(['evt_003', 'evt_005']),
  isLoading: false,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const hosted = await loadHostedEvents();
    const events = mergeEvents(hosted);
    const collections = deriveCollections(events);
    set({ events, ...collections, hydrated: true });
  },

  fetchEvents: async () => {
    set({ isLoading: true });
    if (!get().hydrated) await get().hydrate();
    await new Promise((r) => setTimeout(r, 120));
    const events = get().events;
    const collections = deriveCollections(events);
    set({ events, ...collections, isLoading: false });
  },

  fetchTrending: async () => {
    if (!get().hydrated) await get().hydrate();
    await new Promise((r) => setTimeout(r, 100));
    const collections = deriveCollections(get().events);
    set({ ...collections });
  },

  searchEvents: (query) => {
    const q = query.trim().toLowerCase();
    if (!q) { set({ searchResults: [] }); return; }
    const results = sortByRelevance(get().events.filter((event) => {
      const haystack = [event.title, event.description, event.venue_name, event.venue_address, event.category, event.host_name || '', event.age_restriction ? `${event.age_restriction}+` : '', event.ticket_types.map((ticket) => ticket.name).join(' ')].join(' ').toLowerCase();
      return haystack.includes(q);
    }));
    set({ searchResults: results });
  },

  getEventById: (id) => get().events.find((event) => event.id === id) || MOCK_EVENTS.find((event) => event.id === id),

  publishHostedEvent: (input) => {
    const startTime = parseDateTime(input.date, input.startTime);
    const endTime = input.endTime ? parseDateTime(input.date, input.endTime) : getDefaultEndTime(startTime);
    const detailVideoAllowed = input.detailMediaType === 'video' && isEventDetailVideoDurationAllowed(input.detailMediaDurationSeconds);
    const resolvedDetailMediaType = detailVideoAllowed ? 'video' : 'image';
    const resolvedDetailMediaUrl = input.detailMediaType === 'video'
      ? (detailVideoAllowed ? (input.detailMediaUrl || input.imageUrl) : input.imageUrl)
      : (input.detailMediaUrl || input.imageUrl);
    const newEvent: Event = {
      id: `evt_host_${Date.now()}`,
      title: input.title,
      description: input.description,
      venue_id: input.venueName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, ''),
      venue_name: input.venueName,
      venue_address: input.venueAddress || `${input.venueName}, ${input.cityDisplay}`,
      start_time: startTime,
      end_time: endTime,
      category: input.category.toLowerCase(),
      image_url: input.imageUrl,
      detail_media_url: resolvedDetailMediaUrl,
      detail_media_type: resolvedDetailMediaType,
      detail_media_poster_url: input.detailMediaPosterUrl || input.imageUrl,
      detail_media_duration_seconds: detailVideoAllowed ? input.detailMediaDurationSeconds ?? null : null,
      ticket_types: input.ticketTypes.map((ticket, index) => ({ id: `tkt_host_${Date.now()}_${index + 1}`, name: ticket.name, price: ticket.price, available: ticket.available })),
      status: 'on_sale',
      age_restriction: input.ageRestriction ?? null,
      allow_refunds: input.allowRefunds ?? false,
      allow_transfers: input.allowTransfers ?? false,
      host_name: input.hostName,
      host_verified: input.hostVerified ?? true,
      donation_campaign: input.donationCampaign ?? null,
      is_featured: false,
    };
    const hostedEvents = get().events.filter((event) => String(event.id).startsWith('evt_host_'));
    const nextHosted = [newEvent, ...hostedEvents];
    const events = mergeEvents(nextHosted);
    const collections = deriveCollections(events);
    set({ events, ...collections });
    void saveHostedEvents(nextHosted);
    void ensureEventRuntime({ eventId: newEvent.id, sold: 0, checkedIn: 0, revenue: 0, status: 'published' });
    return newEvent;
  },

  getSavedEvents: () => sortByStartAsc(get().events.filter((event) => get().savedIds.has(event.id) && !isExpired(event))),
  isSaved: (id) => get().savedIds.has(id),
  canSaveEvent: (id) => {
    const event = get().getEventById(id);
    if (!event || isExpired(event)) return false;
    const { hasPurchasedEvent } = useTicketStore.getState();
    return !hasPurchasedEvent(id);
  },
  toggleSaved: (id) => {
    const { canSaveEvent, savedIds } = get();
    if (!canSaveEvent(id) && !savedIds.has(id)) return;
    const next = new Set(savedIds);
    const wasAdd = !next.has(id);
    if (next.has(id)) next.delete(id); else next.add(id);
    set({ savedIds: next });
    // Pulse the wallet tab icon on bookmark adds only (v59.3 — Q5/Q6 lock).
    if (wasAdd) {
      // Lazy import to keep stores decoupled.
      const { useUIStore } = require('./uiStore');
      useUIStore.getState().triggerBookmarkPulse();
    }
  },
}));

void useEventStore.getState().hydrate();

export const getPriceLabel = (event: Event) => {
  const start = getStartingPrice(event);
  return start === 0 ? 'Free' : `$${start}`;
};
