/**
 * ECHO — Web mock event catalog (v59.4)
 * ══════════════════════════════════════
 * Additive mock data for the website sections. Does NOT replace any
 * existing repo mock data. Categories per spec: Music, Nightlife,
 * Community, Nonprofit, Food, Tech, Art, Family, 21+ mix.
 */
import type { InterestSignal, WebMockEvent } from '../types/pickedForYou';

export const WEB_MOCK_EVENTS: WebMockEvent[] = [
  {
    id: 'evt_rnb_dinner', title: 'R&B Dinner Party',
    date: '2026-06-20', time: '8:00 PM',
    venue: 'The Listening Room', city: 'Seattle',
    price: 'From $65', ageRequirement: '21+', category: 'Music',
    host: 'Night Owl Collective', hostId: 'host_nightowl', verified: true,
    isWeekend: true, trendingNearby: true, primaryReason: 'category_interest',
  },
  {
    id: 'evt_midnight_masq', title: 'Midnight Masquerade',
    date: '2026-06-20', time: '10:00 PM',
    venue: 'Emerald Ballroom', city: 'Seattle',
    price: 'From $60', ageRequirement: '21+', category: 'Nightlife',
    host: 'Emerald Nights', hostId: 'host_emerald', verified: true,
    isWeekend: true, primaryReason: 'similar_to_saved',
  },
  {
    id: 'evt_sunset_rooftop', title: 'Sunset Rooftop Sessions',
    date: '2026-06-21', time: '5:00 PM',
    venue: 'Rooftop @ Thompson', city: 'Seattle',
    price: 'From $45', ageRequirement: '21+', category: 'Music',
    host: 'Electric Vibe', hostId: 'host_electric', verified: true,
    isWeekend: true, trendingNearby: true, primaryReason: 'trending_nearby',
  },
  {
    id: 'evt_food_wine', title: 'Food & Wine Festival',
    date: '2026-06-25', time: '12:00 PM',
    venue: 'Pier 62', city: 'Seattle',
    price: 'From $35', ageRequirement: '21+', category: 'Food',
    host: 'Sound Table Co.', hostId: 'host_soundtable', verified: true,
    primaryReason: 'similar_to_viewed',
  },
  {
    id: 'evt_scholarship_gala', title: 'Youth Scholarship Gala',
    date: '2026-06-27', time: '6:00 PM',
    venue: 'Foundry Hall', city: 'Seattle',
    price: 'From $25', ageRequirement: 'All ages', category: 'Nonprofit',
    host: 'Golden Futures Foundation', hostId: 'host_golden', verified: true,
    donationAvailable: true, isWeekend: true, primaryReason: 'donation_available',
  },
  {
    id: 'evt_neighborhood_market', title: 'Neighborhood Makers Market',
    date: '2026-06-21', time: '10:00 AM',
    venue: 'Cal Anderson Park', city: 'Seattle',
    price: 'Free', ageRequirement: 'Family-friendly', category: 'Community',
    host: 'Capitol Hill Collective', hostId: 'host_caphill', verified: false,
    isWeekend: true, primaryReason: 'near_user_area',
  },
  {
    id: 'evt_builders_night', title: 'Builders Night: Edge AI',
    date: '2026-06-24', time: '6:30 PM',
    venue: 'Fremont Foundry', city: 'Seattle',
    price: 'From $15', ageRequirement: 'All ages', category: 'Tech',
    host: 'PNW Builders', hostId: 'host_pnwbuilders', verified: true,
    primaryReason: 'host_interest',
  },
  {
    id: 'evt_gallery_walk', title: 'First Light Gallery Walk',
    date: '2026-06-26', time: '7:00 PM',
    venue: 'Pioneer Square Galleries', city: 'Seattle',
    price: 'Free', ageRequirement: 'All ages', category: 'Art',
    host: 'Pioneer Arts League', hostId: 'host_pioneer', verified: true,
    primaryReason: 'weekend_match',
  },
  {
    id: 'evt_family_matinee', title: 'Summer Matinee in the Park',
    date: '2026-06-21', time: '2:00 PM',
    venue: 'Gas Works Park', city: 'Seattle',
    price: 'Free', ageRequirement: 'Family-friendly', category: 'Family',
    host: 'City Parks Live', hostId: 'host_cityparks', verified: false,
    isWeekend: true, primaryReason: 'group_friendly',
  },
];

/** Demo signal history powering the website's Picked for You rail. */
export const WEB_MOCK_SIGNALS: InterestSignal[] = [
  { kind: 'ticket_purchase', eventId: 'evt_prev_soul_night', category: 'Music', hostId: 'host_nightowl' },
  { kind: 'saved_event', eventId: 'evt_midnight_masq', category: 'Nightlife', hostId: 'host_emerald' },
  { kind: 'opened_event_detail', eventId: 'evt_food_wine', category: 'Food', hostId: 'host_soundtable' },
  { kind: 'repeated_host_view', hostId: 'host_pnwbuilders' },
  { kind: 'repeated_category_view', category: 'Music' },
  { kind: 'search_query_match', query: 'rooftop', category: 'Music' },
];
