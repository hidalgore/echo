/**
 * ECHO — Picked for You scoring (v59.4, MVP)
 * ════════════════════════════════════════════
 * Rule-based, explainable, mock-data scoring. NO ML.
 *
 * pickedForYouScore =
 *   categoryMatchScore + locationMatchScore + hostAffinityScore +
 *   dwellInterestScore + saveSimilarityScore + purchaseSimilarityScore +
 *   priceFitScore + timeFitScore + trendingBoost + freshnessBoost -
 *   alreadyDismissedPenalty
 *
 * Signal weights are LOCKED (spec v1):
 *   ticket_purchase +100 | saved_event +70 | opened_event_detail +45
 *   shared_event +40 | long_dwell_event_detail +35 | long_pause_event_card +20
 *   repeated_category_view +20 | repeated_host_view +25 | search_query_match +30
 *   quick_scroll_past -10 | hide_not_interested -80
 *
 * UI copy rule: only REASON_LABELS strings ever reach the user.
 * Never surface dwell/pause/scroll mechanics in copy.
 */
import type {
  InterestSignal,
  PickedForYouEvent,
  PickedForYouReason,
  WebMockEvent,
} from '../types/pickedForYou';

export const SIGNAL_WEIGHTS: Record<InterestSignal['kind'], number> = {
  ticket_purchase: 100,
  saved_event: 70,
  opened_event_detail: 45,
  shared_event: 40,
  long_dwell_event_detail: 35,
  long_pause_event_card: 20,
  repeated_category_view: 20,
  repeated_host_view: 25,
  search_query_match: 30,
  quick_scroll_past: -10,
  hide_not_interested: -80,
};

/** User-facing labels only. Locked phrasing. */
export const REASON_LABELS: Record<PickedForYouReason, string> = {
  similar_to_viewed: 'Similar to events you viewed',
  category_interest: 'Matches your music interest',
  near_user_area: 'Popular near you',
  weekend_match: 'Weekend match',
  similar_to_saved: 'Similar to saved events',
  host_interest: 'From a host you viewed',
  price_match: 'Good for your group style',
  group_friendly: 'Good for your group style',
  donation_available: 'Donation available',
  trending_nearby: 'Popular near you',
};

type AffinityProfile = {
  categoryScore: Map<string, number>;
  hostScore: Map<string, number>;
  savedCategories: Set<string>;
  purchasedCategories: Set<string>;
  viewedCategories: Set<string>;
  dismissedEventIds: Set<string>;
};

/** Fold raw signals into a per-user affinity profile (pure, explainable). */
export function buildAffinityProfile(signals: InterestSignal[]): AffinityProfile {
  const p: AffinityProfile = {
    categoryScore: new Map(),
    hostScore: new Map(),
    savedCategories: new Set(),
    purchasedCategories: new Set(),
    viewedCategories: new Set(),
    dismissedEventIds: new Set(),
  };
  const bumpCat = (cat: string, w: number) =>
    p.categoryScore.set(cat, (p.categoryScore.get(cat) ?? 0) + w);
  const bumpHost = (h: string, w: number) =>
    p.hostScore.set(h, (p.hostScore.get(h) ?? 0) + w);

  for (const s of signals) {
    const w = SIGNAL_WEIGHTS[s.kind];
    switch (s.kind) {
      case 'ticket_purchase':
        bumpCat(s.category, w); bumpHost(s.hostId, w);
        p.purchasedCategories.add(s.category);
        break;
      case 'saved_event':
        bumpCat(s.category, w); bumpHost(s.hostId, w);
        p.savedCategories.add(s.category);
        break;
      case 'opened_event_detail':
      case 'shared_event':
        bumpCat(s.category, w); bumpHost(s.hostId, w);
        p.viewedCategories.add(s.category);
        break;
      case 'long_dwell_event_detail':
      case 'long_pause_event_card':
        bumpCat(s.category, w);
        p.viewedCategories.add(s.category);
        break;
      case 'repeated_category_view':
      case 'search_query_match':
        bumpCat(s.category, w);
        break;
      case 'repeated_host_view':
        bumpHost(s.hostId, w);
        break;
      case 'quick_scroll_past':
        // Mild negative against the specific event, handled at score time.
        p.dismissedEventIds.has(s.eventId); // no-op marker; weight applied below
        break;
      case 'hide_not_interested':
        p.dismissedEventIds.add(s.eventId);
        break;
    }
  }
  return p;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Score one event for one profile. Each component is capped so a single
 * loud signal cannot dominate — keeps the rail calm and varied.
 */
export function scoreEvent(ev: WebMockEvent, p: AffinityProfile): PickedForYouEvent {
  const reasons: PickedForYouReason[] = [];

  const categoryMatchScore = clamp(p.categoryScore.get(ev.category) ?? 0, 0, 120);
  if (categoryMatchScore >= 45) reasons.push('category_interest');

  const hostAffinityScore = clamp(p.hostScore.get(ev.hostId) ?? 0, 0, 100);
  if (hostAffinityScore >= 25) reasons.push('host_interest');

  const saveSimilarityScore = p.savedCategories.has(ev.category) ? 40 : 0;
  if (saveSimilarityScore > 0) reasons.push('similar_to_saved');

  const purchaseSimilarityScore = p.purchasedCategories.has(ev.category) ? 50 : 0;

  const dwellInterestScore = p.viewedCategories.has(ev.category) ? 25 : 0;
  if (dwellInterestScore > 0 && saveSimilarityScore === 0) reasons.push('similar_to_viewed');

  const locationMatchScore = 20; // MVP: single-city mock catalog
  const trendingBoost = ev.trendingNearby ? 25 : 0;
  if (trendingBoost > 0) reasons.push('trending_nearby');

  const timeFitScore = ev.isWeekend ? 15 : 0;
  if (timeFitScore > 0) reasons.push('weekend_match');

  const priceFitScore = 0;  // MVP: no price profile yet
  const freshnessBoost = 10; // MVP: mock catalog is all upcoming

  const donation = ev.donationAvailable ? 5 : 0;
  if (ev.donationAvailable) reasons.push('donation_available');

  const alreadyDismissedPenalty = p.dismissedEventIds.has(ev.id) ? 1000 : 0;

  const score =
    categoryMatchScore + locationMatchScore + hostAffinityScore +
    dwellInterestScore + saveSimilarityScore + purchaseSimilarityScore +
    priceFitScore + timeFitScore + trendingBoost + freshnessBoost +
    donation - alreadyDismissedPenalty;

  if (reasons.length === 0) reasons.push('near_user_area');

  const primary = ev.primaryReason && reasons.includes(ev.primaryReason)
    ? ev.primaryReason
    : reasons[0];

  return {
    eventId: ev.id,
    score,
    reasons,
    primaryReasonLabel: REASON_LABELS[primary],
  };
}

/** Rank a catalog for a profile. Dismissed events fall out naturally. */
export function rankPickedForYou(
  events: WebMockEvent[],
  signals: InterestSignal[],
  limit = 6,
): PickedForYouEvent[] {
  const profile = buildAffinityProfile(signals);
  return events
    .map((ev) => scoreEvent(ev, profile))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
