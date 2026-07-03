/**
 * ECHO Onboarding — Mock Data
 * ═══════════════════════════
 * Static, dependency-free content for onboarding screens. No real counts,
 * no attendance-suggesting language (Social Energy doctrine). Calm reason
 * labels only (spec §4 / §23).
 */

export type DiscoverPreviewCard = {
  id: string;
  title: string;
  meta: string;
  reason: string;
};

/** Max 3-5 preview cards (spec §9.4). Labeled rectangles in the UI. */
export const DISCOVER_PREVIEW_CARDS: DiscoverPreviewCard[] = [
  { id: 'p1', title: 'Rooftop Live Session', meta: 'Fri \u00b7 Downtown', reason: 'Weekend match' },
  { id: 'p2', title: 'Late Night Warehouse', meta: 'Sat \u00b7 Eastside', reason: 'Popular near you' },
  { id: 'p3', title: 'Community Food Market', meta: 'Sun \u00b7 Riverside', reason: 'Donation available' },
];

export const INTEREST_OPTIONS: string[] = [
  'Live music',
  'Nightlife',
  'Food & culture',
  'Premium lounges',
  'Community events',
  'Family-friendly',
  'Social mixers',
  'Tech & creative',
  'Giving back',
  'VIP experiences',
];

export const GROUP_STYLE_OPTIONS: string[] = [
  'Solo',
  'With a friend',
  'With a group',
  'Date night',
  'Family',
  'Depends on the event',
];

export const BUDGET_OPTIONS: string[] = [
  'Free',
  'Budget-friendly',
  'Mid-range',
  'Premium',
  'No preference',
];

/** Demo pass — clearly NOT a real ticket. */
export const DEMO_PASS = {
  holderName: 'Guest',
  accessId: 'ECHO\u2011DEMO\u20110000',
  label: 'Demo ECHO Pass',
} as const;

/**
 * Personalize beat — interest chips with icons (2-col grid, matches the
 * onboarding reference). "Nearby Events" is handled separately as a full-width
 * location opt-in row.
 */
export type InterestChip = { id: string; label: string; icon: string };

export const INTEREST_CHIPS: InterestChip[] = [
  { id: 'nightlife', label: 'Nightlife', icon: 'wine-outline' },
  { id: 'live_music', label: 'Live Music', icon: 'musical-notes-outline' },
  { id: 'sports', label: 'Sports', icon: 'basketball-outline' },
  { id: 'food_drinks', label: 'Food & Drinks', icon: 'restaurant-outline' },
  { id: 'culture', label: 'Culture', icon: 'business-outline' },
  { id: 'art', label: 'Art', icon: 'color-palette-outline' },
];

/** Circle beat — demo "spots claimed" state. Illustrative only, not a real Circle. */
export type CircleDemoMember = { id: string; initials: string; claimed: boolean };

export const CIRCLE_DEMO = {
  total: 4,
  members: [
    { id: 'm1', initials: 'A', claimed: true },
    { id: 'm2', initials: 'J', claimed: true },
    { id: 'm3', initials: 'M', claimed: true },
    { id: 'm4', initials: '', claimed: false },
  ] as CircleDemoMember[],
};
