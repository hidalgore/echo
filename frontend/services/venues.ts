export type VenueSuggestion = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  displayCity: string;
  category?: string;
};

export const SEEDED_VENUES: VenueSuggestion[] = [
  { id: 'ven_seed_001', name: 'Nova Rooftop', address: '123 Pike St, Seattle, WA', city: 'Seattle', state: 'WA', displayCity: 'Seattle, WA', category: 'Nightlife' },
  { id: 'ven_seed_002', name: 'Abbe Winery', address: '4226 S 32nd St, Tacoma, WA', city: 'Tacoma', state: 'WA', displayCity: 'Tacoma, WA', category: 'Food & Drink' },
  { id: 'ven_seed_003', name: 'The Crocodile', address: '2505 1st Ave, Seattle, WA', city: 'Seattle', state: 'WA', displayCity: 'Seattle, WA', category: 'Music' },
  { id: 'ven_seed_004', name: 'WAMU Theater', address: '800 Occidental Ave S, Seattle, WA', city: 'Seattle', state: 'WA', displayCity: 'Seattle, WA', category: 'Music' },
  { id: 'ven_seed_005', name: 'Climate Pledge Arena', address: '334 1st Ave N, Seattle, WA', city: 'Seattle', state: 'WA', displayCity: 'Seattle, WA', category: 'Sports' },
  { id: 'ven_seed_006', name: 'Museum of Pop Culture', address: '325 5th Ave N, Seattle, WA', city: 'Seattle', state: 'WA', displayCity: 'Seattle, WA', category: 'Arts & Culture' },
  { id: 'ven_seed_007', name: 'The Showbox', address: '1426 1st Ave, Seattle, WA', city: 'Seattle', state: 'WA', displayCity: 'Seattle, WA', category: 'Music' },
  { id: 'ven_seed_008', name: 'Paramount Theatre', address: '911 Pine St, Seattle, WA', city: 'Seattle', state: 'WA', displayCity: 'Seattle, WA', category: 'Arts & Culture' },
  { id: 'ven_seed_009', name: 'Pier 62', address: '1951 Alaskan Way, Seattle, WA', city: 'Seattle', state: 'WA', displayCity: 'Seattle, WA', category: 'Community' },
  { id: 'ven_seed_010', name: 'The Ruins', address: '570 Roy St, Seattle, WA', city: 'Seattle', state: 'WA', displayCity: 'Seattle, WA', category: 'Private' },
  { id: 'ven_seed_011', name: 'Meydenbauer Center', address: '11100 NE 6th St, Bellevue, WA', city: 'Bellevue', state: 'WA', displayCity: 'Bellevue, WA', category: 'Networking' },
  { id: 'ven_seed_012', name: 'Tacoma Armory', address: '1001 S Yakima Ave, Tacoma, WA', city: 'Tacoma', state: 'WA', displayCity: 'Tacoma, WA', category: 'Community' },
];

const scoreVenue = (venue: VenueSuggestion, query: string, preferredCity?: string) => {
  const haystack = [venue.name, venue.address, venue.city, venue.state, venue.category || ''].join(' ').toLowerCase();
  let score = 0;
  if (venue.name.toLowerCase().startsWith(query)) score += 5;
  if (venue.name.toLowerCase().includes(query)) score += 3;
  if (haystack.includes(query)) score += 1;
  if (preferredCity && venue.displayCity.toLowerCase() === preferredCity.toLowerCase()) score += 2;
  return score;
};

export const searchVenueSuggestions = (query: string, preferredCity?: string) => {
  const normalized = query.trim().toLowerCase();
  const base = normalized
    ? SEEDED_VENUES.filter((venue) => [venue.name, venue.address, venue.city, venue.state, venue.category || '']
        .join(' ')
        .toLowerCase()
        .includes(normalized))
    : SEEDED_VENUES;

  return [...base]
    .sort((a, b) => scoreVenue(b, normalized, preferredCity) - scoreVenue(a, normalized, preferredCity))
    .slice(0, 6);
};
