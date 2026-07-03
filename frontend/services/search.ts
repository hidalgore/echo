import { MOCK_EVENTS } from './mock';
import { apiRequest } from './apiClient';
import { CONFIG } from '../constants/config';
import { Event, SearchFilters, SearchResponse, SearchResultItem, SearchSuggestion } from '../types';
import { formatDate, formatPrice, formatTime } from '../utils/format';

export interface SearchRequest {
  query: string;
  filters?: SearchFilters;
}

const DEFAULT_SUGGESTIONS: SearchSuggestion[] = [
  { id: 'sg_weekend', label: 'Plan my weekend', query: 'plan my weekend with events near Seattle', icon: 'sparkles-outline', type: 'preset' },
  { id: 'sg_ticket', label: 'Use my ticket', query: 'how do I use my ECHO ticket at the door', icon: 'ticket-outline', type: 'preset' },
  { id: 'sg_access', label: 'Fix an access issue', query: 'fix my ticket access issue', icon: 'construct-outline', type: 'preset' },
  { id: 'sg_circle', label: 'Manage ECHO Circle', query: 'help me manage my ECHO Circle', icon: 'people-circle-outline', type: 'preset' },
];

const HELP_LIBRARY: SearchResultItem[] = [
  {
    id: 'help_ticket_use',
    type: 'help',
    title: 'Use your ECHO ticket at the door',
    subtitle: 'Wallet-first entry with NFC and QR fallback',
    body: 'Open Wallet, select the active ticket, hold near the reader for NFC entry, and use QR only as a fallback when needed.',
    icon: 'ticket-outline',
    route: '/(tabs)/wallet',
    ctaLabel: 'Open Wallet',
  },
  {
    id: 'help_transfer',
    type: 'help',
    title: 'How do transfers work?',
    subtitle: 'Transfer rules, timing, and refund ownership',
    body: 'Transfers move control to the current ticket holder. Refund eligibility follows the ticket after transfer.',
    icon: 'swap-horizontal-outline',
    route: '/(tabs)/wallet',
    ctaLabel: 'View My Tickets',
  },
  {
    id: 'help_circle',
    type: 'help',
    title: 'Manage ECHO Circle',
    subtitle: 'Group-pay guidance with no guesswork',
    body: 'ECHO Circle shows who paid, who is waiting, what happens when time runs out, and how the organizer can invite or replace members.',
    icon: 'people-outline',
    route: '/(tabs)/profile',
    ctaLabel: 'See Circle',
  },
  {
    id: 'help_age_verification',
    type: 'help',
    title: 'Age verification for 18+/21+ events',
    subtitle: 'Trust-first access before payment',
    body: 'For age-restricted events, ECHO verifies eligibility before checkout. If verification fails, checkout is blocked and no payment is taken.',
    icon: 'shield-checkmark-outline',
    route: '/age-verification',
    ctaLabel: 'Verify Age',
  },
  {
    id: 'help_wallet_offline',
    type: 'help',
    title: 'Offline-ready Wallet entry',
    subtitle: 'Designed for crowded doors and weak service',
    body: 'Supported tickets can still present secure access credentials from Wallet when service is limited. QR fallback stays secondary.',
    icon: 'wifi-outline',
    route: '/(tabs)/wallet',
    ctaLabel: 'Open Wallet',
  },
];

const SUPPORT_LIBRARY: SearchResultItem[] = [
  {
    id: 'support_chat',
    type: 'support',
    title: 'Escalate to ECHO Support',
    subtitle: 'AI first, human support when needed',
    body: 'If ECHO AI cannot resolve the issue, users can escalate with ticket, event, payment, and access context already attached.',
    icon: 'chatbubble-ellipses-outline',
    ctaLabel: 'Open Support',
  },
  {
    id: 'support_refund',
    type: 'support',
    title: 'Refund policy and eligibility',
    subtitle: 'Policy guidance by ticket state',
    body: 'Refunds depend on the host policy and the current ticket holder. Transferred tickets follow the latest owner.',
    icon: 'receipt-outline',
    ctaLabel: 'Review Policy',
  },
  {
    id: 'support_accessibility',
    type: 'support',
    title: 'Accessibility support',
    subtitle: 'Entry assistance and venue accommodations',
    body: 'Find venue accessibility details or request support before arrival for a smoother check-in experience.',
    icon: 'accessibility-outline',
    ctaLabel: 'Get Help',
  },
];

function tokenize(text: string) {
  return text.toLowerCase().split(/[^a-z0-9+]+/).filter(Boolean);
}

function scoreMatch(haystack: string, terms: string[]) {
  let score = 0;
  const lower = haystack.toLowerCase();
  for (const term of terms) {
    if (lower.includes(term)) score += 2;
    if (lower.startsWith(term)) score += 1;
  }
  return score;
}

function matchesFilters(event: Event, filters?: SearchFilters) {
  if (!filters) return true;
  if (filters.price === 'free' && !event.ticket_types.every((t) => t.price === 0)) return false;
  if (filters.price === 'paid' && event.ticket_types.every((t) => t.price === 0)) return false;
  if (filters.categories?.length && !filters.categories.includes(event.category)) return false;
  if (filters.age === '18' && (event.age_restriction || 0) < 18) return false;
  if (filters.age === '21' && (event.age_restriction || 0) < 21) return false;
  return true;
}

function eventToResult(event: Event): SearchResultItem {
  const lowestPrice = Math.min(...(event.ticket_types || [{ price: 0 }]).map((ticket) => ticket.price ?? 0));
  return {
    id: `event_${event.id}`,
    type: 'event',
    title: event.title,
    subtitle: `${formatDate(event.start_time)} · ${formatTime(event.start_time)} · ${event.venue_name}`,
    body: lowestPrice === 0 ? 'Free entry' : `From ${formatPrice(lowestPrice)}`,
    icon: 'sparkles-outline',
    route: `/event/${event.id}`,
    event_id: event.id,
    ctaLabel: 'View Event',
    metadata: {
      category: event.category,
      host: event.host_name || '',
      age: event.age_restriction ?? '',
    },
  };
}

function searchMockEvents(query: string, filters?: SearchFilters): SearchResultItem[] {
  const terms = tokenize(query);
  const ranked = MOCK_EVENTS
    .filter((event) => matchesFilters(event, filters))
    .map((event) => {
      const haystack = [
        event.title,
        event.description,
        event.category,
        event.venue_name,
        event.venue_address,
        event.host_name || '',
        event.ticket_types.map((t) => t.name).join(' '),
      ].join(' ');
      return { event, score: scoreMatch(haystack, terms) };
    })
    .filter((entry) => entry.score > 0 || !query.trim())
    .sort((a, b) => b.score - a.score)
    .map((entry) => eventToResult(entry.event));

  return ranked;
}

function searchLibrary(items: SearchResultItem[], query: string): SearchResultItem[] {
  const terms = tokenize(query);
  return items
    .map((item) => {
      const haystack = [item.title, item.subtitle || '', item.body || ''].join(' ');
      return { item, score: scoreMatch(haystack, terms) };
    })
    .filter((entry) => entry.score > 0 || !query.trim())
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}


export type PickedForYouReason =
  | 'similar_to_viewed'
  | 'category_interest'
  | 'near_user_area'
  | 'weekend_match'
  | 'similar_to_saved'
  | 'host_interest'
  | 'price_match'
  | 'group_friendly'
  | 'donation_available'
  | 'trending_nearby';

export type PickedForYouEvent = {
  event: Event;
  score: number;
  reasons: PickedForYouReason[];
  primaryReasonLabel: string;
  explanation: string;
};

const REASON_LABELS: Record<PickedForYouReason, string> = {
  similar_to_viewed: 'Similar to events you viewed',
  category_interest: 'Matches your music interest',
  near_user_area: 'Popular near you',
  weekend_match: 'Weekend match',
  similar_to_saved: 'Similar to saved events',
  host_interest: 'From a host you viewed',
  price_match: 'Matches your price style',
  group_friendly: 'Good for groups',
  donation_available: 'Donation available',
  trending_nearby: 'Trending nearby',
};

const REASON_EXPLANATIONS: Record<PickedForYouReason, string> = {
  similar_to_viewed: 'similar event styles you have recently explored',
  category_interest: 'live music and entertainment-style events',
  near_user_area: 'nearby events with strong local interest',
  weekend_match: 'weekend timing and evening-friendly plans',
  similar_to_saved: 'events similar to items you saved or revisited',
  host_interest: 'hosts you have viewed or followed before',
  price_match: 'the price range you usually engage with',
  group_friendly: 'events that work well for ECHO Circle or group planning',
  donation_available: 'events that include nonprofit donation opportunities',
  trending_nearby: 'fresh events gaining traction near your area',
};

function getLowestPrice(event: Event) {
  return Math.min(...(event.ticket_types || [{ price: 0 }]).map((ticket) => ticket.price ?? 0));
}

function uniqueReasons(reasons: PickedForYouReason[]) {
  return Array.from(new Set(reasons));
}

export function getPickedForYouEvents({ limit = 5 }: { limit?: number } = {}): PickedForYouEvent[] {
  // MVP: deterministic rule-based scoring that simulates ECHO AI taste learning.
  // V2 should replace these seeded behavior signals with real scroll, click, dwell, save, purchase, and hide events.
  const seededInterest = {
    categories: ['music', 'food', 'community', 'comedy'],
    hosts: ['Electric Vibes', 'Abbe Collective', 'Waterfront Social'],
    maxPrice: 90,
  };

  return MOCK_EVENTS
    .filter((event) => event.status === 'on_sale' || event.status === 'live')
    .map((event) => {
      const reasons: PickedForYouReason[] = [];
      let score = 0;
      const price = getLowestPrice(event);
      const starts = new Date(event.start_time);
      const day = starts.getDay();
      const isWeekend = day === 0 || day === 5 || day === 6;

      if (seededInterest.categories.includes(event.category)) {
        score += event.category === 'music' ? 42 : 30;
        reasons.push(event.category === 'music' ? 'category_interest' : 'similar_to_viewed');
      }
      if (event.host_name && seededInterest.hosts.includes(event.host_name)) {
        score += 25;
        reasons.push('host_interest');
      }
      if (price <= seededInterest.maxPrice) {
        score += 16;
        reasons.push('price_match');
      }
      if (isWeekend) {
        score += 18;
        reasons.push('weekend_match');
      }
      if (event.donation_campaign) {
        score += 15;
        reasons.push('donation_available');
      }
      if (event.host_verified) {
        score += 10;
        reasons.push('trending_nearby');
      }
      if ((event.ticket_types || []).some((ticket) => (ticket.available || 0) >= 50)) {
        score += 6;
        reasons.push('group_friendly');
      }
      if (event.venue_address.toLowerCase().includes('seattle')) {
        score += 12;
        reasons.push('near_user_area');
      }

      const cleanReasons = uniqueReasons(reasons.length ? reasons : ['trending_nearby']);
      const primaryReason = cleanReasons[0];
      return {
        event,
        score,
        reasons: cleanReasons,
        primaryReasonLabel: REASON_LABELS[primaryReason],
        explanation: REASON_EXPLANATIONS[primaryReason],
      };
    })
    .filter((pick) => pick.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(a.event.start_time).getTime() - new Date(b.event.start_time).getTime();
    })
    .reduce<PickedForYouEvent[]>((picks, candidate) => {
      // Diversity guardrail: do not let Picked for You become five versions of the same night.
      const sameHostCount = picks.filter((pick) => pick.event.host_name && pick.event.host_name === candidate.event.host_name).length;
      const sameCategoryCount = picks.filter((pick) => pick.event.category === candidate.event.category).length;
      if (sameHostCount >= 2 || sameCategoryCount >= 2) return picks;
      if (picks.length >= limit) return picks;
      return [...picks, candidate];
    }, []);
}

async function fetchRemoteSearch(query: string, filters?: SearchFilters): Promise<SearchResponse> {
  return apiRequest<SearchResponse>('/v1/search', {
    method: 'POST',
    body: JSON.stringify({ query, filters }),
  });
}

export async function searchAll({ query, filters }: SearchRequest): Promise<SearchResponse> {
  const trimmed = query.trim();

  if (!CONFIG.MOCK_MODE) {
    try {
      return await fetchRemoteSearch(trimmed, filters);
    } catch (error) {
      console.warn('Falling back to mock search response:', error);
    }
  }

  const eventResults = searchMockEvents(trimmed, filters);
  const helpResults = searchLibrary(HELP_LIBRARY, trimmed);
  const supportResults = searchLibrary(SUPPORT_LIBRARY, trimmed);

  const results = [...eventResults, ...helpResults, ...supportResults];
  const suggestions =
    trimmed.length < 2
      ? DEFAULT_SUGGESTIONS
      : DEFAULT_SUGGESTIONS.filter((suggestion) =>
          suggestion.label.toLowerCase().includes(trimmed.toLowerCase()) ||
          suggestion.query.toLowerCase().includes(trimmed.toLowerCase())
        );

  return {
    query: trimmed,
    results,
    suggestions: suggestions.length ? suggestions : DEFAULT_SUGGESTIONS,
    counts: {
      all: results.length,
      events: eventResults.length,
      help: helpResults.length,
      support: supportResults.length,
    },
  };
}

export const searchService = {
  searchAll,
  getPickedForYouEvents,
};
