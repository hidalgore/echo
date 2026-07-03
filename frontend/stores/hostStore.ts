import { create } from 'zustand';
import { MOCK_EVENTS } from '../services/mock';
import { mockHostEvents } from '../services/hostMock';
import { isExpired } from '../utils/event';
import type { Event } from '../types';
import type { EventDraft, HostEvent } from '../types/hostEvents';
import { useEventStore } from './eventStore';

export type HostProfile = {
  id: string;
  name: string;
  avatarUrl?: string;
  bio: string;
  rating: number;
  attendeeCount: number;
  isTrusted: boolean;
  isFollowing: boolean;
  website?: string;
  socialLinks?: { platform: SocialPlatform; handle: string; url: string }[];
};

export type SocialPlatform = 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'x' | 'other';

interface HostState {
  hosts: HostProfile[];
  initialized: boolean;
  activeDraft: EventDraft | null;
  drafts: EventDraft[];
  hostEvents: HostEvent[];
  initializeHosts: () => void;
  getHostById: (id: string) => HostProfile | undefined;
  getFollowingHosts: () => Array<HostProfile & { nextEvent?: Event }>;
  getUpcomingEventsForHost: (hostId: string) => Event[];
  getPastEventsForHost: (hostId: string) => Event[];
  toggleFollow: (hostId: string) => void;
  setActiveDraft: (draft: EventDraft | null) => void;
  updateDraftField: <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => void;
  saveDraft: () => EventDraft | null;
  publishDraft: () => Event | null;
}

const hostIdFromName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const getHostIdFromName = (name?: string | null) => (name ? hostIdFromName(name) : 'host-unknown');

const buildHostBio = (name: string, trusted: boolean) =>
  trusted
    ? `${name} curates elevated event experiences with polished execution, verified operations, and community-first energy across every ECHO release.`
    : `${name} brings distinctive local energy to ECHO with a growing track record of memorable events, clear communication, and audience-focused programming.`;

const uniqueHosts = () => {
  const seen = new Map<string, HostProfile>();
  const hostEvents = MOCK_EVENTS.filter((event) => event.host_name);

  hostEvents.forEach((event, index) => {
    const name = event.host_name!;
    const id = hostIdFromName(name);
    if (seen.has(id)) return;
    const trusted = !!event.host_verified;
    const baseRating = trusted ? 4.8 : 4.6;
    seen.set(id, {
      id,
      name,
      avatarUrl: `https://picsum.photos/seed/${id}/120/120`,
      bio: buildHostBio(name, trusted),
      rating: Number((baseRating + ((index % 3) * 0.1)).toFixed(1)),
      attendeeCount: 96 + (index * 17),
      isTrusted: trusted,
      isFollowing: ['electric-vibes', 'night-owl-productions'].includes(id),
      website: trusted ? `https://${id.replace(/-/g, '')}.com` : undefined,
      socialLinks: trusted ? [
        { platform: 'instagram' as const, handle: `@${id.replace(/-/g, '')}`, url: `https://instagram.com/${id.replace(/-/g, '')}` },
        { platform: 'tiktok' as const, handle: `@${id.replace(/-/g, '')}`, url: `https://tiktok.com/@${id.replace(/-/g, '')}` },
        ...(index % 2 === 0 ? [{ platform: 'youtube' as const, handle: name, url: `https://youtube.com/@${id.replace(/-/g, '')}` }] : []),
        ...(index % 3 === 0 ? [{ platform: 'facebook' as const, handle: name, url: `https://facebook.com/${id.replace(/-/g, '')}` }] : []),
      ] : [],
    });
  });

  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
};

const getHostEvents = (hostId: string) =>
  MOCK_EVENTS.filter((event) => getHostIdFromName(event.host_name) === hostId)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

const hasTicketedInventory = (event: Event) => event.ticket_types.some((ticket) => ticket.available > 0 || ticket.price >= 0);

export const useHostStore = create<HostState>((set, get) => ({
  hosts: uniqueHosts(),
  initialized: true,
  activeDraft: null,
  drafts: [],
  hostEvents: mockHostEvents,

  initializeHosts: () => {
    if (!get().initialized) {
      set({ hosts: uniqueHosts(), initialized: true });
    }
  },

  getHostById: (id) => get().hosts.find((host) => host.id === id),

  getFollowingHosts: () =>
    get().hosts
      .filter((host) => host.isFollowing)
      .map((host) => ({
        ...host,
        nextEvent: getHostEvents(host.id).find((event) => !isExpired(event) && hasTicketedInventory(event)),
      }))
      .sort((a, b) => {
        const aTime = a.nextEvent ? new Date(a.nextEvent.start_time).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.nextEvent ? new Date(b.nextEvent.start_time).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime || a.name.localeCompare(b.name);
      }),

  getUpcomingEventsForHost: (hostId) =>
    getHostEvents(hostId).filter((event) => !isExpired(event) && hasTicketedInventory(event)),

  getPastEventsForHost: (hostId) =>
    getHostEvents(hostId).filter((event) => isExpired(event) || event.status === 'ended').reverse(),

  toggleFollow: (hostId) =>
    set((state) => ({
      hosts: state.hosts.map((host) =>
        host.id === hostId ? { ...host, isFollowing: !host.isFollowing } : host
      ),
    })),

  setActiveDraft: (draft) => set({ activeDraft: draft }),

  updateDraftField: (key, value) =>
    set((state) => state.activeDraft ? { activeDraft: { ...state.activeDraft, [key]: value } } : state),

  saveDraft: () => {
    const activeDraft = get().activeDraft;
    if (!activeDraft) return null;
    set((state) => {
      const existing = state.drafts.findIndex((draft) => draft.id === activeDraft.id);
      const drafts = [...state.drafts];
      if (existing >= 0) drafts[existing] = activeDraft;
      else drafts.unshift(activeDraft);
      return { drafts, activeDraft };
    });
    return activeDraft;
  },

  publishDraft: () => {
    const draft = get().activeDraft;
    if (!draft) return null;
    const published = useEventStore.getState().publishHostedEvent({
      title: draft.title,
      description: draft.description || draft.suggestedDescription || 'Published from flyer scan in Host Mode.',
      venueName: draft.venue,
      venueAddress: draft.venue,
      cityDisplay: 'Seattle, WA',
      date: draft.date || new Date().toISOString().slice(0, 10),
      startTime: draft.startTime || '7:00 PM',
      endTime: draft.endTime || '',
      category: draft.category || 'Other',
      imageUrl: draft.flyerImage,
      detailMediaUrl: draft.eventDetailMediaUri || draft.flyerImage,
      detailMediaType: draft.eventDetailMediaType || 'image',
      detailMediaPosterUrl: draft.flyerImage,
      detailMediaDurationSeconds: draft.eventDetailMediaDurationSeconds ?? null,
      ageRestriction: draft.ageRequirement === 'All Ages' ? null : parseInt(draft.ageRequirement, 10),
      ticketTypes: [{
        name: 'General Admission',
        price: draft.price || 0,
        available: draft.capacity || 100,
      }],
      hostName: 'ECHO Host',
      hostVerified: true,
    });
    set((state) => ({
      activeDraft: null,
      drafts: state.drafts.filter((item) => item.id !== draft.id),
    }));
    return published;
  },
}));
