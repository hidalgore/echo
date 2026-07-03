/**
 * ECHO — Picked for You types (v59.4)
 * ════════════════════════════════════
 * Locked recommendation vocabulary. User-facing labels live in
 * services/pickedForYouScoring.ts (REASON_LABELS). Internal signal
 * names never surface in UI copy.
 */

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
  eventId: string;
  score: number;
  reasons: PickedForYouReason[];
  primaryReasonLabel: string;
};

/** Raw behavioral signals recorded per user. MVP: mock, in-memory. */
export type InterestSignal =
  | { kind: 'ticket_purchase'; eventId: string; category: string; hostId: string }
  | { kind: 'saved_event'; eventId: string; category: string; hostId: string }
  | { kind: 'opened_event_detail'; eventId: string; category: string; hostId: string }
  | { kind: 'shared_event'; eventId: string; category: string; hostId: string }
  | { kind: 'long_dwell_event_detail'; eventId: string; category: string }
  | { kind: 'long_pause_event_card'; eventId: string; category: string }
  | { kind: 'repeated_category_view'; category: string }
  | { kind: 'repeated_host_view'; hostId: string }
  | { kind: 'search_query_match'; query: string; category: string }
  | { kind: 'quick_scroll_past'; eventId: string }
  | { kind: 'hide_not_interested'; eventId: string };

export type WebMockEvent = {
  id: string;
  title: string;
  date: string;        // ISO date
  time: string;        // display time
  venue: string;
  city: string;
  price: string;       // display price (mock)
  ageRequirement: '21+' | 'All ages' | 'Family-friendly';
  category:
    | 'Music' | 'Nightlife' | 'Community' | 'Nonprofit'
    | 'Food' | 'Tech' | 'Art' | 'Family';
  host: string;
  hostId: string;
  verified: boolean;          // Verified Host / Verified Venue indicator
  donationAvailable?: boolean;
  isWeekend?: boolean;
  trendingNearby?: boolean;
  primaryReason?: PickedForYouReason;
};
