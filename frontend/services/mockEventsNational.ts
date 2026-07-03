/**
 * ECHO Mock Events — National Coverage + Nonprofit Mix
 * ═════════════════════════════════════════════════════
 * 30 multi-city events across major US markets + 10 nonprofit-hosted events
 * (5 with active donation campaigns, 5 without — gala/auction style)
 *
 * Cities covered: NYC, LA, Chicago, Austin, Miami, Nashville, Denver,
 * Portland, Boston, Atlanta, New Orleans, Las Vegas, Philadelphia,
 * Minneapolis, San Francisco, San Diego.
 */

import type { Event, TicketType } from '../types';
import type { NonprofitDonationCampaign } from '../types/nonprofitDonation';

// ── Helpers ──────────────────────────────────────────────────
const getDate = (daysFromNow: number, hour = 19, minute = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const endDate = (daysFromNow: number, hour: number, durationHours = 4): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour + durationHours, 0, 0, 0);
  return d.toISOString();
};

const tix = (configs: Array<{ name: string; price: number; avail: number }>, base: string): TicketType[] =>
  configs.map((c, i) => ({ id: `${base}_t${i + 1}`, name: c.name, price: c.price, available: c.avail }));

const img = (seed: string) => `https://picsum.photos/seed/${seed}/800/500`;

// ── Donation Campaigns ──────────────────────────────────────
const FOOD_BANK_CAMPAIGN: NonprofitDonationCampaign = {
  id: 'camp_food_001',
  nonprofitName: 'City Harvest Food Bank',
  causeTitle: 'End Hunger This Winter',
  causeDescription: 'Every $10 provides 25 meals to families experiencing food insecurity across our community.',
  goalAmount: 50000,
  raisedAmount: 32450,
  donorCount: 847,
  suggestedAmounts: [10, 25, 50, 100],
  impactLabels: [
    { amount: 10, label: '25 meals to a family' },
    { amount: 50, label: 'A week of groceries' },
    { amount: 100, label: 'A family of 4 fed for 2 weeks' },
  ],
  publicPageEnabled: true,
  allowPublicNameOptIn: true,
  closesAtEventCloseout: true,
  status: 'active',
};

const ANIMAL_RESCUE_CAMPAIGN: NonprofitDonationCampaign = {
  id: 'camp_animal_001',
  nonprofitName: 'Paws Forward Animal Rescue',
  causeTitle: 'Save 100 Shelter Animals',
  causeDescription: 'Funds vaccinations, spay/neuter, and adoption placements for at-risk dogs and cats.',
  goalAmount: 25000,
  raisedAmount: 18900,
  donorCount: 412,
  suggestedAmounts: [15, 30, 75, 150],
  impactLabels: [
    { amount: 30, label: 'Full vaccination for one animal' },
    { amount: 150, label: 'Spay/neuter + full medical' },
  ],
  publicPageEnabled: true,
  allowPublicNameOptIn: true,
  closesAtEventCloseout: true,
  status: 'active',
};

const EDUCATION_CAMPAIGN: NonprofitDonationCampaign = {
  id: 'camp_edu_001',
  nonprofitName: 'Books For Every Child',
  causeTitle: 'Literacy For All',
  causeDescription: 'Provide free books and reading tutors to underserved K-8 students in Title I schools.',
  goalAmount: 40000,
  raisedAmount: 12500,
  donorCount: 234,
  suggestedAmounts: [20, 50, 100, 250],
  impactLabels: [
    { amount: 20, label: '4 books to a child' },
    { amount: 250, label: 'Year-long literacy tutor for one student' },
  ],
  publicPageEnabled: true,
  allowPublicNameOptIn: true,
  closesAtEventCloseout: true,
  status: 'active',
};

const ENVIRONMENT_CAMPAIGN: NonprofitDonationCampaign = {
  id: 'camp_env_001',
  nonprofitName: 'Clean Coast Coalition',
  causeTitle: 'Restore Our Waterways',
  causeDescription: 'Beach and waterway cleanups, plus advocacy for plastic-free legislation along the Atlantic seaboard.',
  goalAmount: 30000,
  raisedAmount: 21800,
  donorCount: 567,
  suggestedAmounts: [10, 25, 75, 200],
  impactLabels: [
    { amount: 25, label: '100 lbs of ocean plastic removed' },
    { amount: 200, label: 'Sponsor a full cleanup event' },
  ],
  publicPageEnabled: true,
  allowPublicNameOptIn: true,
  closesAtEventCloseout: true,
  status: 'active',
};

const MENTAL_HEALTH_CAMPAIGN: NonprofitDonationCampaign = {
  id: 'camp_mh_001',
  nonprofitName: 'Mind Matters Foundation',
  causeTitle: 'Free Crisis Counseling',
  causeDescription: 'Subsidize teletherapy sessions for uninsured young adults navigating mental health crises.',
  goalAmount: 60000,
  raisedAmount: 47200,
  donorCount: 1108,
  suggestedAmounts: [25, 50, 100, 250],
  impactLabels: [
    { amount: 50, label: 'One therapy session' },
    { amount: 250, label: 'A month of weekly sessions' },
  ],
  publicPageEnabled: true,
  allowPublicNameOptIn: true,
  closesAtEventCloseout: true,
  status: 'active',
};

// ── 30 Multi-City Events ────────────────────────────────────
const NATIONAL_EVENTS: Event[] = [
  // NEW YORK CITY
  { id: 'nat_001', title: 'Brooklyn Rooftop Sessions', description: 'Sunset DJs over the Manhattan skyline.', venue_name: 'The Crown', venue_address: '85 Flatbush Ave Ext, Brooklyn, NY', start_time: getDate(7, 20), end_time: endDate(7, 20, 5), category: 'music', image_url: img('brooklyn-roof'), ticket_types: tix([{ name: 'GA', price: 35, avail: 200 }, { name: 'VIP', price: 95, avail: 50 }], 'nat_001'), status: 'on_sale', age_restriction: 21, host_name: 'Crown Rooftop', host_verified: true, allow_refunds: false, allow_transfers: true },
  { id: 'nat_002', title: 'Comedy Cellar Showcase', description: 'A surprise lineup of NYC\'s top stand-ups in the legendary basement room.', venue_name: 'Comedy Cellar', venue_address: '117 MacDougal St, New York, NY', start_time: getDate(4, 21), end_time: endDate(4, 21, 2), category: 'comedy', image_url: img('comedy-cellar'), ticket_types: tix([{ name: 'GA', price: 28, avail: 90 }], 'nat_002'), status: 'on_sale', age_restriction: 21, host_name: 'Comedy Cellar', host_verified: true, allow_refunds: true, allow_transfers: true },
  { id: 'nat_003', title: 'MoMA After Hours', description: 'Members-only late-night gallery walk with live string quartet.', venue_name: 'Museum of Modern Art', venue_address: '11 W 53rd St, New York, NY', start_time: getDate(12, 19), end_time: endDate(12, 19, 3), category: 'art', image_url: img('moma-afterhours'), ticket_types: tix([{ name: 'Member', price: 0, avail: 300 }, { name: 'Guest', price: 25, avail: 150 }], 'nat_003'), status: 'on_sale', age_restriction: null, host_name: 'MoMA Events', host_verified: true, allow_refunds: true, allow_transfers: true },

  // LOS ANGELES
  { id: 'nat_004', title: 'Echo Park Synthwave Night', description: 'Five hours of retrowave, neon visuals, and arcade games.', venue_name: 'The Echo', venue_address: '1822 Sunset Blvd, Los Angeles, CA', start_time: getDate(9, 21), end_time: endDate(9, 21, 5), category: 'music', image_url: img('synthwave-la'), ticket_types: tix([{ name: 'GA', price: 30, avail: 280 }], 'nat_004'), status: 'on_sale', age_restriction: 21, host_name: 'Echo LA', host_verified: true, allow_refunds: false, allow_transfers: true },
  { id: 'nat_005', title: 'Venice Beach Volleyball Open', description: 'Watch pro players battle on the sand. Free beer for spectators in shaded VIP.', venue_name: 'Venice Beach Courts', venue_address: '1800 Ocean Front Walk, Venice, CA', start_time: getDate(14, 11), end_time: endDate(14, 11, 7), category: 'sports', image_url: img('venice-volleyball'), ticket_types: tix([{ name: 'GA', price: 0, avail: 500 }, { name: 'Shade VIP', price: 60, avail: 100 }], 'nat_005'), status: 'on_sale', age_restriction: null, host_name: 'Venice Pro Tour', host_verified: true, allow_refunds: true, allow_transfers: true },
  { id: 'nat_006', title: 'Smorgasburg LA Food Festival', description: 'Over 80 vendors. Korean fried chicken to mochi waffles. Pay-per-bite.', venue_name: 'ROW DTLA', venue_address: '777 S Alameda St, Los Angeles, CA', start_time: getDate(11, 11), end_time: endDate(11, 11, 6), category: 'food', image_url: img('smorgasburg'), ticket_types: tix([{ name: 'Entry', price: 5, avail: 2000 }], 'nat_006'), status: 'on_sale', age_restriction: null, host_name: 'Smorgasburg', host_verified: true, allow_refunds: true, allow_transfers: true },

  // CHICAGO
  { id: 'nat_007', title: 'Lincoln Hall: Indie Showcase', description: 'Four breakout bands. Bar is open.', venue_name: 'Lincoln Hall', venue_address: '2424 N Lincoln Ave, Chicago, IL', start_time: getDate(5, 20), end_time: endDate(5, 20, 4), category: 'music', image_url: img('lincoln-hall'), ticket_types: tix([{ name: 'GA', price: 22, avail: 500 }, { name: 'Balcony', price: 35, avail: 80 }], 'nat_007'), status: 'on_sale', age_restriction: 18, host_name: 'Lincoln Hall', host_verified: true, allow_refunds: false, allow_transfers: true },
  { id: 'nat_008', title: 'Chicago Deep Dish Crawl', description: 'Three stops, three pies, one self-guided afternoon. Includes drink pairings.', venue_name: 'Lou Malnati\'s (start)', venue_address: '439 N Wells St, Chicago, IL', start_time: getDate(16, 14), end_time: endDate(16, 14, 4), category: 'food', image_url: img('deep-dish'), ticket_types: tix([{ name: 'Crawler', price: 55, avail: 80 }], 'nat_008'), status: 'on_sale', age_restriction: 21, host_name: 'Chi Food Tours', host_verified: true, allow_refunds: false, allow_transfers: true },

  // AUSTIN
  { id: 'nat_009', title: 'Stubb\'s Backyard BBQ + Live Music', description: 'Texas brisket and three local acts on the iconic outdoor stage.', venue_name: 'Stubb\'s Bar-B-Q', venue_address: '801 Red River St, Austin, TX', start_time: getDate(3, 18), end_time: endDate(3, 18, 5), category: 'music', image_url: img('stubbs'), ticket_types: tix([{ name: 'GA', price: 35, avail: 600 }], 'nat_009'), status: 'on_sale', age_restriction: null, host_name: 'Stubb\'s Austin', host_verified: true, allow_refunds: false, allow_transfers: true },
  { id: 'nat_010', title: 'SXSW Late-Night Tech Mixer', description: 'Founders, devs, and investors over mezcal cocktails.', venue_name: 'The Driskill Bar', venue_address: '604 Brazos St, Austin, TX', start_time: getDate(22, 20), end_time: endDate(22, 20, 4), category: 'tech', image_url: img('sxsw-mixer'), ticket_types: tix([{ name: 'GA', price: 45, avail: 200 }], 'nat_010'), status: 'on_sale', age_restriction: 21, host_name: 'Austin Tech Collective', host_verified: true, allow_refunds: false, allow_transfers: true },

  // MIAMI
  { id: 'nat_011', title: 'Wynwood Walls Block Party', description: 'Street artists, DJ Khaled b2b surprise guest, food trucks.', venue_name: 'Wynwood Walls', venue_address: '266 NW 26th St, Miami, FL', start_time: getDate(8, 21), end_time: endDate(8, 21, 6), category: 'music', image_url: img('wynwood'), ticket_types: tix([{ name: 'GA', price: 50, avail: 1500 }, { name: 'VIP Cabana', price: 250, avail: 40 }], 'nat_011'), status: 'on_sale', age_restriction: 21, host_name: 'Wynwood Live', host_verified: true, allow_refunds: false, allow_transfers: true },
  { id: 'nat_012', title: 'South Beach Yoga Sunrise', description: 'Vinyasa flow at 7am on the sand. Mats provided.', venue_name: 'South Beach (5th St)', venue_address: '500 Ocean Dr, Miami Beach, FL', start_time: getDate(2, 7), end_time: endDate(2, 7, 2), category: 'wellness', image_url: img('sb-yoga'), ticket_types: tix([{ name: 'Free RSVP', price: 0, avail: 80 }, { name: 'Smoothie Bundle', price: 12, avail: 80 }], 'nat_012'), status: 'on_sale', age_restriction: null, host_name: 'SoBe Wellness', host_verified: true, allow_refunds: true, allow_transfers: true },

  // NASHVILLE
  { id: 'nat_013', title: 'Bluebird Café: Songwriters Round', description: 'Four songwriters in the round. Intimate. Iconic.', venue_name: 'The Bluebird Café', venue_address: '4104 Hillsboro Pike, Nashville, TN', start_time: getDate(10, 19), end_time: endDate(10, 19, 3), category: 'music', image_url: img('bluebird'), ticket_types: tix([{ name: 'Reservation', price: 25, avail: 100 }], 'nat_013'), status: 'on_sale', age_restriction: 18, host_name: 'Bluebird Café', host_verified: true, allow_refunds: false, allow_transfers: true },
  { id: 'nat_014', title: 'Broadway Honky-Tonk Crawl', description: 'Six bars, six bands, one Stetson. Group of 15 max.', venue_name: 'Tootsie\'s (start)', venue_address: '422 Broadway, Nashville, TN', start_time: getDate(6, 19), end_time: endDate(6, 19, 5), category: 'music', image_url: img('broadway-nash'), ticket_types: tix([{ name: 'Crawler', price: 35, avail: 90 }], 'nat_014'), status: 'on_sale', age_restriction: 21, host_name: 'Nash Crawls', host_verified: true, allow_refunds: false, allow_transfers: true },

  // DENVER
  { id: 'nat_015', title: 'Red Rocks Sunrise Hike + Yoga', description: 'Guided hike to the amphitheater followed by a flow class at sunrise.', venue_name: 'Red Rocks Amphitheatre', venue_address: '18300 W Alameda Pkwy, Morrison, CO', start_time: getDate(13, 6), end_time: endDate(13, 6, 3), category: 'wellness', image_url: img('redrocks'), ticket_types: tix([{ name: 'Guided Hike', price: 30, avail: 60 }], 'nat_015'), status: 'on_sale', age_restriction: null, host_name: 'Mile High Wellness', host_verified: true, allow_refunds: true, allow_transfers: true },
  { id: 'nat_016', title: 'Larimer Lounge: Punk Night', description: 'Three local punk bands. PBR specials all night.', venue_name: 'Larimer Lounge', venue_address: '2721 Larimer St, Denver, CO', start_time: getDate(15, 21), end_time: endDate(15, 21, 4), category: 'music', image_url: img('larimer'), ticket_types: tix([{ name: 'GA', price: 18, avail: 250 }], 'nat_016'), status: 'on_sale', age_restriction: 21, host_name: 'Larimer Lounge', host_verified: true, allow_refunds: false, allow_transfers: true },

  // PORTLAND
  { id: 'nat_017', title: 'Powell\'s Books: Author Night', description: 'Bestselling fiction author reads and signs new release.', venue_name: 'Powell\'s City of Books', venue_address: '1005 W Burnside St, Portland, OR', start_time: getDate(17, 19), end_time: endDate(17, 19, 2), category: 'art', image_url: img('powells'), ticket_types: tix([{ name: 'Free RSVP', price: 0, avail: 200 }], 'nat_017'), status: 'on_sale', age_restriction: null, host_name: 'Powell\'s Events', host_verified: true, allow_refunds: true, allow_transfers: true },
  { id: 'nat_018', title: 'Doug Fir Lounge: Indie Folk Trio', description: 'Three rising songwriters in a candlelit basement venue.', venue_name: 'Doug Fir Lounge', venue_address: '830 E Burnside St, Portland, OR', start_time: getDate(19, 20), end_time: endDate(19, 20, 4), category: 'music', image_url: img('dougfir'), ticket_types: tix([{ name: 'GA', price: 24, avail: 280 }], 'nat_018'), status: 'on_sale', age_restriction: 21, host_name: 'Doug Fir', host_verified: true, allow_refunds: false, allow_transfers: true },

  // BOSTON
  { id: 'nat_019', title: 'Fenway Bleacher Bar Trivia', description: 'Sports trivia under the actual Green Monster. Prizes from the Sox shop.', venue_name: 'Bleacher Bar', venue_address: '82A Lansdowne St, Boston, MA', start_time: getDate(4, 19), end_time: endDate(4, 19, 3), category: 'sports', image_url: img('bleacher-bar'), ticket_types: tix([{ name: 'Team of 4', price: 40, avail: 60 }], 'nat_019'), status: 'on_sale', age_restriction: 21, host_name: 'Bleacher Bar', host_verified: true, allow_refunds: false, allow_transfers: true },

  // ATLANTA
  { id: 'nat_020', title: 'Ponce City Market Rooftop', description: 'Skyline views, mini golf, and a four-DJ rotation.', venue_name: 'Ponce City Market Roof', venue_address: '675 Ponce de Leon Ave NE, Atlanta, GA', start_time: getDate(21, 19), end_time: endDate(21, 19, 5), category: 'nightlife', image_url: img('ponce'), ticket_types: tix([{ name: 'GA', price: 28, avail: 400 }], 'nat_020'), status: 'on_sale', age_restriction: 21, host_name: 'Ponce Roof', host_verified: true, allow_refunds: false, allow_transfers: true },

  // NEW ORLEANS
  { id: 'nat_021', title: 'Tipitina\'s Brass Brunch', description: 'Live brass band, bottomless mimosas, beignets on the house.', venue_name: 'Tipitina\'s', venue_address: '501 Napoleon Ave, New Orleans, LA', start_time: getDate(25, 11), end_time: endDate(25, 11, 4), category: 'music', image_url: img('tipitinas'), ticket_types: tix([{ name: 'GA', price: 45, avail: 300 }], 'nat_021'), status: 'on_sale', age_restriction: 21, host_name: 'Tipitina\'s', host_verified: true, allow_refunds: false, allow_transfers: true },

  // LAS VEGAS
  { id: 'nat_022', title: 'Omnia Vegas: International DJ Night', description: 'Surprise headliner. Bottle service available.', venue_name: 'Omnia Nightclub', venue_address: '3570 Las Vegas Blvd S, Las Vegas, NV', start_time: getDate(8, 22), end_time: endDate(8, 22, 5), category: 'nightlife', image_url: img('omnia'), ticket_types: tix([{ name: 'GA', price: 65, avail: 1200 }, { name: 'Booth (4)', price: 800, avail: 30 }], 'nat_022'), status: 'on_sale', age_restriction: 21, host_name: 'Omnia Vegas', host_verified: true, allow_refunds: false, allow_transfers: true },

  // PHILADELPHIA
  { id: 'nat_023', title: 'Reading Terminal Cheesesteak Showdown', description: 'Six legendary shops battle for the crown. You vote.', venue_name: 'Reading Terminal Market', venue_address: '51 N 12th St, Philadelphia, PA', start_time: getDate(14, 13), end_time: endDate(14, 13, 4), category: 'food', image_url: img('cheesesteak'), ticket_types: tix([{ name: 'Voter Pass', price: 38, avail: 250 }], 'nat_023'), status: 'on_sale', age_restriction: null, host_name: 'Reading Market', host_verified: true, allow_refunds: true, allow_transfers: true },

  // MINNEAPOLIS
  { id: 'nat_024', title: 'First Avenue: Prince Tribute', description: 'A full night honoring Prince at the venue he made famous.', venue_name: 'First Avenue', venue_address: '701 N 1st Ave, Minneapolis, MN', start_time: getDate(18, 20), end_time: endDate(18, 20, 5), category: 'music', image_url: img('first-ave'), ticket_types: tix([{ name: 'GA', price: 32, avail: 1500 }, { name: 'Mezzanine', price: 55, avail: 200 }], 'nat_024'), status: 'on_sale', age_restriction: 18, host_name: 'First Avenue', host_verified: true, allow_refunds: false, allow_transfers: true },

  // SAN FRANCISCO
  { id: 'nat_025', title: 'Mission District Taco Tour', description: 'Five legendary taquerias in three hours. Salsa flight at every stop.', venue_name: 'La Taqueria (start)', venue_address: '2889 Mission St, San Francisco, CA', start_time: getDate(7, 12), end_time: endDate(7, 12, 4), category: 'food', image_url: img('mission-tacos'), ticket_types: tix([{ name: 'Crawler', price: 65, avail: 60 }], 'nat_025'), status: 'on_sale', age_restriction: null, host_name: 'SF Food Tours', host_verified: true, allow_refunds: true, allow_transfers: true },
  { id: 'nat_026', title: 'The Independent: Synth Pop Showcase', description: 'Four electronic artists in SF\'s most intimate club room.', venue_name: 'The Independent', venue_address: '628 Divisadero St, San Francisco, CA', start_time: getDate(11, 21), end_time: endDate(11, 21, 4), category: 'music', image_url: img('the-independent'), ticket_types: tix([{ name: 'GA', price: 30, avail: 500 }], 'nat_026'), status: 'on_sale', age_restriction: 21, host_name: 'The Independent', host_verified: true, allow_refunds: false, allow_transfers: true },

  // SAN DIEGO
  { id: 'nat_027', title: 'La Jolla Cove Sunset Sailing', description: 'Catamaran cruise with appetizers and wine pairings.', venue_name: 'La Jolla Cove Marina', venue_address: '1492 N Harbor Dr, San Diego, CA', start_time: getDate(20, 17), end_time: endDate(20, 17, 3), category: 'wellness', image_url: img('la-jolla'), ticket_types: tix([{ name: 'Adult', price: 95, avail: 40 }], 'nat_027'), status: 'on_sale', age_restriction: 21, host_name: 'SoCal Sail Co.', host_verified: true, allow_refunds: true, allow_transfers: true },

  // DETROIT
  { id: 'nat_028', title: 'Motown Museum: After Dark', description: 'Late-night tour of Hitsville USA with a live cover band.', venue_name: 'Motown Museum', venue_address: '2648 W Grand Blvd, Detroit, MI', start_time: getDate(23, 19), end_time: endDate(23, 19, 3), category: 'art', image_url: img('motown'), ticket_types: tix([{ name: 'GA', price: 40, avail: 120 }], 'nat_028'), status: 'on_sale', age_restriction: null, host_name: 'Motown Museum', host_verified: true, allow_refunds: true, allow_transfers: true },

  // SEATTLE (just 2 — keep mostly out-of-Seattle to balance)
  { id: 'nat_029', title: 'Pike Place Late Breakfast Crawl', description: 'Five stalls. Crab eggs benedict. Real maple bacon.', venue_name: 'Pike Place Market', venue_address: '85 Pike St, Seattle, WA', start_time: getDate(9, 9), end_time: endDate(9, 9, 3), category: 'food', image_url: img('pike-place'), ticket_types: tix([{ name: 'Crawler', price: 48, avail: 70 }], 'nat_029'), status: 'on_sale', age_restriction: null, host_name: 'Pike Place Tours', host_verified: true, allow_refunds: true, allow_transfers: true },
  { id: 'nat_030', title: 'Capitol Hill Drag Brunch', description: 'Live performers, mimosas, full breakfast plate included.', venue_name: 'R Place', venue_address: '619 E Pine St, Seattle, WA', start_time: getDate(16, 12), end_time: endDate(16, 12, 3), category: 'nightlife', image_url: img('drag-brunch'), ticket_types: tix([{ name: 'GA', price: 38, avail: 120 }], 'nat_030'), status: 'on_sale', age_restriction: 21, host_name: 'R Place', host_verified: true, allow_refunds: false, allow_transfers: true },
];

// ── 10 Nonprofit-Hosted Events (5 with donations, 5 without) ──
const NONPROFIT_EVENTS: Event[] = [
  // === WITH DONATION CAMPAIGNS (5) ===
  {
    id: 'np_001',
    title: 'Harvest Gala: A Night for Hunger Relief',
    description: 'Three-course dinner, live auction, and keynote from chef Daniel Boulud. Every ticket and donation feeds families in need.',
    venue_name: 'The Plaza Hotel',
    venue_address: '768 5th Ave, New York, NY',
    start_time: getDate(28, 19),
    end_time: endDate(28, 19, 4),
    category: 'food',
    image_url: img('harvest-gala'),
    ticket_types: tix([{ name: 'Individual', price: 250, avail: 200 }, { name: 'Table of 10', price: 2200, avail: 20 }], 'np_001'),
    status: 'on_sale',
    age_restriction: 21,
    host_name: 'City Harvest Food Bank',
    host_verified: true,
    allow_refunds: false,
    allow_transfers: true,
    donation_campaign: FOOD_BANK_CAMPAIGN,
    // Host override: gala stays "Building Energy" — strict elegance, never "Peak Crowd"
    social_energy_override: {
      state: 'building_energy',
      pulse: null,
      gravity: ['community_favorite', 'returning_attendees'],
      framing: 'far_future',
      intensity: 0.4,
    },
  },
  {
    id: 'np_002',
    title: 'Pups & Pints: Adoption Mixer',
    description: 'Beer, food trucks, and 30+ rescue dogs looking for forever homes. All proceeds support vaccinations and adoption placements.',
    venue_name: 'Other Half Brewing',
    venue_address: '195 Centre St, Brooklyn, NY',
    start_time: getDate(11, 14),
    end_time: endDate(11, 14, 4),
    category: 'wellness',
    image_url: img('pups-pints'),
    ticket_types: tix([{ name: 'GA (incl. drink)', price: 35, avail: 300 }], 'np_002'),
    status: 'on_sale',
    age_restriction: 21,
    host_name: 'Paws Forward Animal Rescue',
    host_verified: true,
    allow_refunds: true,
    allow_transfers: true,
    donation_campaign: ANIMAL_RESCUE_CAMPAIGN,
  },
  {
    id: 'np_003',
    title: 'Read Across America: Author Festival',
    description: 'A dozen children\'s book authors read live to kids; parents bid in a silent auction. Every book sold goes to a Title I classroom.',
    venue_name: 'The Smithsonian Castle',
    venue_address: '1000 Jefferson Dr SW, Washington, DC',
    start_time: getDate(34, 11),
    end_time: endDate(34, 11, 5),
    category: 'art',
    image_url: img('read-america'),
    ticket_types: tix([{ name: 'Family (up to 4)', price: 45, avail: 150 }, { name: 'Adult', price: 20, avail: 200 }], 'np_003'),
    status: 'on_sale',
    age_restriction: null,
    host_name: 'Books For Every Child',
    host_verified: true,
    allow_refunds: true,
    allow_transfers: true,
    donation_campaign: EDUCATION_CAMPAIGN,
  },
  {
    id: 'np_004',
    title: 'Coastal Cleanup + Concert',
    description: 'Morning beach cleanup, afternoon live music on the sand. Bring gloves, leave with cleaner shores.',
    venue_name: 'Coney Island Beach',
    venue_address: '1208 Surf Ave, Brooklyn, NY',
    start_time: getDate(19, 9),
    end_time: endDate(19, 9, 7),
    category: 'music',
    image_url: img('coastal-cleanup'),
    ticket_types: tix([{ name: 'Free RSVP', price: 0, avail: 800 }, { name: 'Concert + Lunch', price: 25, avail: 300 }], 'np_004'),
    status: 'on_sale',
    age_restriction: null,
    host_name: 'Clean Coast Coalition',
    host_verified: true,
    allow_refunds: true,
    allow_transfers: true,
    donation_campaign: ENVIRONMENT_CAMPAIGN,
  },
  {
    id: 'np_005',
    title: 'Mind Matters: Wellness Festival',
    description: 'Free therapy consults, sound baths, breathwork sessions, and panels on mental health access for young adults.',
    venue_name: 'The Wiltern',
    venue_address: '3790 Wilshire Blvd, Los Angeles, CA',
    start_time: getDate(31, 11),
    end_time: endDate(31, 11, 8),
    category: 'wellness',
    image_url: img('mind-matters'),
    ticket_types: tix([{ name: 'GA', price: 0, avail: 1200 }, { name: 'Sponsor', price: 100, avail: 80 }], 'np_005'),
    status: 'on_sale',
    age_restriction: 18,
    host_name: 'Mind Matters Foundation',
    host_verified: true,
    allow_refunds: true,
    allow_transfers: true,
    donation_campaign: MENTAL_HEALTH_CAMPAIGN,
  },

  // === NONPROFIT-HOSTED, NO DONATION CAMPAIGN (5) ===
  // Ticket revenue IS the fundraiser; no extra donation overlay.
  {
    id: 'np_006',
    title: 'Habitat for Humanity: 5K Build & Run',
    description: 'Run a 5K, then help frame a house. All proceeds build affordable homes.',
    venue_name: 'Grant Park',
    venue_address: '337 E Randolph St, Chicago, IL',
    start_time: getDate(15, 8),
    end_time: endDate(15, 8, 4),
    category: 'sports',
    image_url: img('habitat-run'),
    ticket_types: tix([{ name: 'Runner', price: 45, avail: 800 }, { name: 'Cheer Squad', price: 15, avail: 200 }], 'np_006'),
    status: 'on_sale',
    age_restriction: null,
    host_name: 'Habitat for Humanity Chicago',
    host_verified: true,
    allow_refunds: true,
    allow_transfers: true,
  },
  {
    id: 'np_007',
    title: 'Big Brothers Big Sisters Charity Gala',
    description: 'Black-tie dinner, live music, and silent auction. Proceeds match mentors with at-risk youth.',
    venue_name: 'The Fairmont Olympic',
    venue_address: '411 University St, Seattle, WA',
    start_time: getDate(40, 19),
    end_time: endDate(40, 19, 4),
    category: 'food',
    image_url: img('bbbs-gala'),
    ticket_types: tix([{ name: 'Individual', price: 350, avail: 250 }, { name: 'Patron Pair', price: 750, avail: 50 }], 'np_007'),
    status: 'on_sale',
    age_restriction: 21,
    host_name: 'Big Brothers Big Sisters Puget Sound',
    host_verified: true,
    allow_refunds: false,
    allow_transfers: true,
  },
  {
    id: 'np_008',
    title: 'Make-A-Wish Comedy Night',
    description: 'Six top stand-ups donate their sets. 100% of ticket sales fund wishes for children with critical illness.',
    venue_name: 'The Improv',
    venue_address: '8162 Melrose Ave, Los Angeles, CA',
    start_time: getDate(13, 20),
    end_time: endDate(13, 20, 3),
    category: 'comedy',
    image_url: img('makeawish'),
    ticket_types: tix([{ name: 'GA', price: 50, avail: 400 }, { name: 'VIP Meet & Greet', price: 150, avail: 40 }], 'np_008'),
    status: 'on_sale',
    age_restriction: 18,
    host_name: 'Make-A-Wish Foundation',
    host_verified: true,
    allow_refunds: false,
    allow_transfers: true,
  },
  {
    id: 'np_009',
    title: 'Veterans Day Memorial Concert',
    description: 'Symphony performance honoring service members. Tickets fund veteran transition programs.',
    venue_name: 'The Kennedy Center',
    venue_address: '2700 F St NW, Washington, DC',
    start_time: getDate(45, 19),
    end_time: endDate(45, 19, 3),
    category: 'music',
    image_url: img('veterans-concert'),
    ticket_types: tix([{ name: 'Orchestra', price: 85, avail: 400 }, { name: 'Mezzanine', price: 55, avail: 600 }, { name: 'Balcony', price: 35, avail: 800 }], 'np_009'),
    status: 'on_sale',
    age_restriction: null,
    host_name: 'Wounded Warrior Project',
    host_verified: true,
    allow_refunds: true,
    allow_transfers: true,
  },
  {
    id: 'np_010',
    title: 'St. Jude Walk/Run for Hope',
    description: 'Family-friendly 5K through downtown. Every dollar goes to childhood cancer research.',
    venue_name: 'Beale Street',
    venue_address: '203 Beale St, Memphis, TN',
    start_time: getDate(38, 8),
    end_time: endDate(38, 8, 3),
    category: 'sports',
    image_url: img('stjude'),
    ticket_types: tix([{ name: 'Walker', price: 30, avail: 2000 }, { name: 'Team Captain', price: 60, avail: 200 }], 'np_010'),
    status: 'on_sale',
    age_restriction: null,
    host_name: 'St. Jude Children\'s Research Hospital',
    host_verified: true,
    allow_refunds: true,
    allow_transfers: true,
  },
];

// ── Export combined: 40 events total ────────────────────────
export const EXTRA_EVENTS: Event[] = [...NATIONAL_EVENTS, ...NONPROFIT_EVENTS];
