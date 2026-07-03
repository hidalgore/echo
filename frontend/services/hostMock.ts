/**
 * ECHO Host Events — Mock Data
 * Realistic sample content for development and testing.
 * Minimum: 6 host events across all statuses.
 */

import {
  HostEvent,
  EventDraft,
  ExtractionField,
  AISuggestion,
  ProcessingStep,
  QuickEditField,
} from '../types/hostEvents';

// ─── Host Events ─────────────────────────────────────────────────────

export const mockHostEvents: HostEvent[] = [
  // LIVE
  {
    id: 'evt_001',
    title: 'Jazz & Wine Night',
    venue: 'Abbe Winery',
    city: 'Napa Valley',
    date: 'Sat, Jun 14',
    time: '7:00 PM',
    status: 'live',
    ticketsSold: 200,
    checkedIn: 84,
    capacity: 200,
    revenue: 8000,
    healthLabel: 'Near Capacity',
    ageRequirement: '21+',
    isPublic: true,
    escrowPending: 4820,
    doorBreakdown: {
      main: 61,
      vip: 11,
      back: 12,
    },
  },
  // UPCOMING
  {
    id: 'evt_002',
    title: 'Summer Rooftop Party',
    venue: 'Skybar',
    city: 'Los Angeles',
    date: 'Fri, Jun 21',
    time: '8:00 PM',
    status: 'upcoming',
    ticketsSold: 72,
    checkedIn: 0,
    capacity: 150,
    revenue: 3600,
    projectedGuests: 132,
    healthLabel: 'Selling Well',
    ageRequirement: '21+',
    isPublic: true,
    escrowPending: 3600,
  },
  {
    id: 'evt_003',
    title: 'Electronic Nights',
    venue: 'Lotus Club',
    city: 'San Francisco',
    date: 'Sat, Jun 28',
    time: '10:00 PM',
    status: 'upcoming',
    ticketsSold: 23,
    checkedIn: 0,
    capacity: 300,
    revenue: 1150,
    projectedGuests: 85,
    healthLabel: 'Slow Sales',
    ageRequirement: '21+',
    isPublic: true,
  },
  // DRAFT
  {
    id: 'evt_004',
    title: 'Wine & Jazz Afterparty',
    venue: 'Midnight Lounge',
    city: 'Napa Valley',
    date: '',
    time: '',
    status: 'draft',
    ticketsSold: 0,
    checkedIn: 0,
    capacity: 0,
    revenue: 0,
    healthLabel: 'Draft',
    ageRequirement: '21+',
    isPublic: false,
  },
  // PAST
  {
    id: 'evt_005',
    title: "New Year's Eve 2024",
    venue: 'Midnight Lounge',
    city: 'Los Angeles',
    date: 'Tue, Dec 31',
    time: '9:00 PM',
    status: 'past',
    ticketsSold: 328,
    checkedIn: 312,
    capacity: 350,
    revenue: 9820,
    healthLabel: 'Completed',
    ageRequirement: '21+',
    isPublic: true,
  },
  {
    id: 'evt_006',
    title: 'Sunset Sounds',
    venue: 'Oceanview Beach',
    city: 'Malibu',
    date: 'Sat, May 10',
    time: '4:00 PM',
    status: 'past',
    ticketsSold: 180,
    checkedIn: 167,
    capacity: 200,
    revenue: 5400,
    healthLabel: 'Completed',
    ageRequirement: '18+',
    isPublic: true,
  },
];

// ─── Flyer-Scanned Draft ────────────────────────────────────────────

export const mockFlyerDraft: EventDraft = {
  id: 'draft_001',
  flyerImage: 'https://picsum.photos/seed/jazz-wine-trumpet-flyer/900/600',
  title: 'Jazz & Wine Night',
  venue: 'Abbe Winery',
  date: 'Sat, Jun 14',
  startTime: '7:00 PM',
  endTime: '11:00 PM',
  doorsOpenTime: '6:30 PM',
  price: 40,
  capacity: 150,
  ageRequirement: '21+',
  visibility: 'public',
  category: 'Music',
  description: '',
  extractionConfidence: 0.82,
  suggestedDescription:
    'Join us for an evening of live jazz and curated wine tastings at Abbe Winery. Featuring local jazz ensemble The Velvet Keys with a selection of estate wines.',
  suggestedPriceRange: { min: 35, max: 50 },
  suggestedCapacityRange: { min: 120, max: 180 },
};

// Low-confidence draft for error screen demo
export const mockLowConfidenceDraft: EventDraft = {
  id: 'draft_002',
  flyerImage: 'https://picsum.photos/seed/blurry-flyer-review/900/600',
  title: 'Jazz & Wine Night',
  venue: '',
  date: '',
  startTime: '',
  price: 0,
  capacity: 0,
  ageRequirement: 'All Ages',
  visibility: 'public',
  extractionConfidence: 0.45,
  extractionIssues: ['venue_unclear', 'date_missing', 'time_missing'],
};

// ─── Extraction Fields (for error screen) ────────────────────────────

export const mockExtractionFields: ExtractionField[] = [
  { label: 'Event Name', value: 'Jazz & Wine Night', status: 'detected', confidence: 0.95 },
  { label: 'Venue', value: 'Possibly Abbe Winery', status: 'uncertain', confidence: 0.55 },
  { label: 'Date', value: null, status: 'missing' },
  { label: 'Time', value: null, status: 'missing' },
  { label: 'Price', value: '$40', status: 'detected', confidence: 0.88 },
  { label: 'Age Requirement', value: '21+', status: 'detected', confidence: 0.92 },
];

// ─── Processing Steps ────────────────────────────────────────────────

export const mockProcessingSteps: ProcessingStep[] = [
  { id: 'step_1', label: 'Reading flyer', status: 'complete' },
  { id: 'step_2', label: 'Detecting title', status: 'complete' },
  { id: 'step_3', label: 'Identifying date & time', status: 'active' },
  { id: 'step_4', label: 'Detecting venue', status: 'pending' },
  { id: 'step_5', label: 'Extracting pricing', status: 'pending' },
  { id: 'step_6', label: 'Checking age requirement', status: 'pending' },
];

// ─── AI Suggestions ──────────────────────────────────────────────────

export const mockAISuggestions: AISuggestion[] = [
  {
    id: 'sug_1',
    type: 'description',
    title: 'Improve Description',
    suggestedValue:
      'Join us for an evening of live jazz and curated wine tastings at Abbe Winery. Featuring local jazz ensemble The Velvet Keys with a selection of estate wines.',
    accepted: false,
  },
  {
    id: 'sug_2',
    type: 'price',
    title: 'Suggested Ticket Price',
    subtitle: 'Events like this typically charge $35–$50.',
    currentValue: '$40',
    suggestedValue: '$40',
    accepted: false,
  },
  {
    id: 'sug_3',
    type: 'capacity',
    title: 'Recommended Capacity',
    subtitle: 'Similar events average 120–180 guests.',
    currentValue: '150',
    suggestedValue: '150',
    accepted: false,
  },
  {
    id: 'sug_4',
    type: 'category',
    title: 'Event Category',
    subtitle: 'Based on the flyer content.',
    suggestedValue: 'Music',
    accepted: false,
  },
];

// ─── Quick Edit Field Definitions ────────────────────────────────────

export const quickEditFields: QuickEditField[] = [
  { key: 'title', label: 'Event Name', type: 'text', required: true, placeholder: 'Event title' },
  { key: 'venue', label: 'Venue', type: 'text', required: true, placeholder: 'Venue name' },
  { key: 'date', label: 'Date', type: 'date', required: true, placeholder: 'Select date' },
  { key: 'startTime', label: 'Start Time', type: 'time', required: true, placeholder: 'Start time' },
  { key: 'doorsOpenTime', label: 'Doors Open', type: 'time', required: false, placeholder: 'Doors open time' },
  { key: 'price', label: 'Ticket Price', type: 'currency', required: true, placeholder: '$0' },
  { key: 'capacity', label: 'Capacity', type: 'number', required: true, placeholder: '0' },
  {
    key: 'ageRequirement',
    label: 'Age Requirement',
    type: 'select',
    required: true,
    options: ['All Ages', '18+', '21+'],
  },
  {
    key: 'visibility',
    label: 'Visibility',
    type: 'select',
    required: true,
    options: ['public', 'private', 'invite_only'],
  },
  {
    key: 'category',
    label: 'Category',
    type: 'select',
    required: false,
    options: ['Music', 'Nightlife', 'Culture', 'Food & Drink', 'Tech', 'Sports', 'Comedy', 'Art', 'Other'],
  },
  { key: 'description', label: 'Description', type: 'multiline', required: false, placeholder: 'Describe your event' },
];

// ─── Escrow Summary ──────────────────────────────────────────────────

export const mockEscrowSummary = {
  totalPending: 4820,
  nextPayoutDate: 'Jun 15',
  eventsInEscrow: 1,
};
